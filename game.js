document.addEventListener("DOMContentLoaded", () => {
  const game = {
    // ====================================================================
    // ELEMENTS
    // ====================================================================
    container: document.getElementById("gameContainer"),
    paddleEl: document.getElementById("paddle"),
    gameOverScreen: document.getElementById("gameOverScreen"),
    messageEl: document.getElementById("message"),
    restartButton: document.getElementById("restartButton"),

    // ====================================================================
    // CONFIGURATION
    // ====================================================================
    config: {
      containerWidth: 0,
      containerHeight: 0,
      paddleWidth: 150,
      paddleHeight: 20,
      paddleSpeed: 7,
      ballSize: 20,
      ballSpeed: 4,
      brickRowCount: 16,
      brickColumnCount: 20,
      brickHeight: 15,
      brickPadding: 2,
      brickOffsetTop: 100,
      itemDropChance: 0.15,
      itemSpeed: 3,
      get brickWidth() {
        return (
          (this.containerWidth - this.brickColumnCount * this.brickPadding) /
          this.brickColumnCount
        );
      },
      get brickOffsetLeft() {
        return (
          (this.containerWidth -
            this.brickColumnCount * (this.brickWidth + this.brickPadding)) /
          2
        );
      },
    },

    // ====================================================================
    // GAME STATE
    // ====================================================================
    state: {
      paddleX: 0,
      balls: [],
      bricks: [],
      items: [],
      remainingBricks: 0,
      rightPressed: false,
      leftPressed: false,
      animationFrameId: null,
    },

    // ====================================================================
    // INITIALIZATION
    // ====================================================================
    init() {
      this.config.containerWidth = this.container.clientWidth;
      this.config.containerHeight = this.container.clientHeight;
      this.setupEventListeners();
      this.reset();
      this.gameLoop();
    },

    reset() {
      this.gameOverScreen.style.display = "none";
      document
        .querySelectorAll(".ball, .item, .brick")
        .forEach((el) => el.remove());

      this.state.balls = [];
      this.state.items = [];
      this.state.bricks = [];
      this.state.paddleX =
        (this.config.containerWidth - this.config.paddleWidth) / 2;

      this.createBall(
        this.config.containerWidth / 2,
        this.config.containerHeight / 2,
        this.config.ballSpeed,
        -this.config.ballSpeed
      );
      this.setupBricks();

      if (this.state.animationFrameId) {
        cancelAnimationFrame(this.state.animationFrameId);
      }
    },

    setupEventListeners() {
      document.addEventListener("keydown", (e) => this.handleKeyEvent(e, true));
      document.addEventListener("keyup", (e) => this.handleKeyEvent(e, false));
      this.restartButton.addEventListener("click", () =>
        this.resetAndRestart()
      );
    },

    // ====================================================================
    // GAME OBJECT CREATION
    // ====================================================================
    setupBricks() {
      const c = this.config;
      const s = this.state;
      const middleCol1 = Math.floor((c.brickColumnCount - 1) / 2);
      const middleCol2 = Math.ceil((c.brickColumnCount - 1) / 2);

      s.remainingBricks = 0;
      for (let col = 0; col < c.brickColumnCount; col++) {
        s.bricks[col] = [];
        for (let row = 0; row < c.brickRowCount; row++) {
          if (col === middleCol1 || col === middleCol2) {
            s.bricks[col][row] = { status: 0 };
            continue;
          }
          const brickX =
            col * (c.brickWidth + c.brickPadding) + c.brickOffsetLeft;
          const brickY =
            row * (c.brickHeight + c.brickPadding) + c.brickOffsetTop;
          const brickEl = this.createBrickElement(brickX, brickY);
          s.bricks[col][row] = {
            element: brickEl,
            x: brickX,
            y: brickY,
            status: 1,
          };
          s.remainingBricks++;
        }
      }
    },

    createBrickElement(x, y) {
      const c = this.config;
      const brick = document.createElement("div");
      brick.className = "brick";
      brick.style.width = c.brickWidth + "px";
      brick.style.height = c.brickHeight + "px";
      brick.style.left = x + "px";
      brick.style.top = y + "px";
      this.container.appendChild(brick);
      return brick;
    },

    createBall(x, y, vx, vy) {
      const ballEl = document.createElement("div");
      ballEl.className = "ball";
      this.container.appendChild(ballEl);
      this.state.balls.push({ element: ballEl, x, y, vx, vy });
    },

    createItem(x, y) {
      const itemEl = document.createElement("div");
      itemEl.className = "item";
      itemEl.textContent = "+";
      itemEl.style.left = x + "px";
      itemEl.style.top = y + "px";
      this.container.appendChild(itemEl);
      this.state.items.push({ element: itemEl, x, y });
    },

    // ====================================================================
    // GAME LOOP & UPDATES
    // ====================================================================
    gameLoop() {
      if (this.checkGameState()) {
        return;
      }
      this.updatePaddle();
      this.updateBalls();
      this.updateItems();
      this.handleCollisions();
      this.state.animationFrameId = requestAnimationFrame(() =>
        this.gameLoop()
      );
    },

    updatePaddle() {
      const s = this.state;
      const c = this.config;
      if (s.rightPressed && s.paddleX < c.containerWidth - c.paddleWidth) {
        s.paddleX += c.paddleSpeed;
      }
      if (s.leftPressed && s.paddleX > 0) {
        s.paddleX -= c.paddleSpeed;
      }
      this.paddleEl.style.left = s.paddleX + "px";
    },

    updateBalls() {
      this.state.balls.forEach((ball) => {
        ball.x += ball.vx;
        ball.y += ball.vy;
        ball.element.style.left = ball.x + "px";
        ball.element.style.top = ball.y + "px";
      });
    },

    updateItems() {
      this.state.items.forEach((item) => {
        item.y += this.config.itemSpeed;
        item.element.style.top = item.y + "px";
      });
    },

    // ====================================================================
    // COLLISION HANDLING
    // ====================================================================
    handleCollisions() {
      this.handleBallCollisions();
      this.handleItemCollisions();
    },

    handleBallCollisions() {
      const s = this.state;
      const c = this.config;
      for (let i = s.balls.length - 1; i >= 0; i--) {
        const ball = s.balls[i];
        if (
          ball.x + ball.vx > c.containerWidth - c.ballSize ||
          ball.x + ball.vx < 0
        ) {
          ball.vx = -ball.vx;
        }
        if (ball.y + ball.vy < 0) {
          ball.vy = -ball.vy;
        } else if (ball.y + ball.vy > c.containerHeight - c.ballSize) {
          if (
            ball.x + c.ballSize > s.paddleX &&
            ball.x < s.paddleX + c.paddleWidth &&
            ball.y + c.ballSize > c.containerHeight - c.paddleHeight - 10
          ) {
            ball.vy = -ball.vy;
            let collidePoint = ball.x - (s.paddleX + c.paddleWidth / 2);
            ball.vx = collidePoint * 0.1;
          } else {
            ball.element.remove();
            s.balls.splice(i, 1);
          }
        }
        for (let col = 0; col < c.brickColumnCount; col++) {
          for (let row = 0; row < c.brickRowCount; row++) {
            const brick = s.bricks[col][row];
            if (brick.status === 1) {
              if (
                ball.x < brick.x + c.brickWidth &&
                ball.x + c.ballSize > brick.x &&
                ball.y < brick.y + c.brickHeight &&
                ball.y + c.ballSize > brick.y
              ) {
                ball.vy = -ball.vy;
                brick.status = 0;
                brick.element.style.display = "none";
                s.remainingBricks--;
                if (Math.random() < c.itemDropChance) {
                  this.createItem(
                    brick.x + c.brickWidth / 2,
                    brick.y + c.brickHeight / 2
                  );
                }
              }
            }
          }
        }
      }
    },

    handleItemCollisions() {
      const s = this.state;
      const c = this.config;
      for (let i = s.items.length - 1; i >= 0; i--) {
        const item = s.items[i];
        if (item.y > c.containerHeight) {
          item.element.remove();
          s.items.splice(i, 1);
          continue;
        }
        if (
          item.y + 25 > c.containerHeight - c.paddleHeight - 10 &&
          item.x + 25 > s.paddleX &&
          item.x < s.paddleX + c.paddleWidth
        ) {
          this.createBall(
            s.paddleX + c.paddleWidth / 2,
            c.containerHeight - 50,
            (Math.random() - 0.5) * 8,
            -c.ballSpeed
          );
          item.element.remove();
          s.items.splice(i, 1);
        }
      }
    },

    // ====================================================================
    // GAME STATE MANAGEMENT
    // ====================================================================
    checkGameState() {
      if (this.state.balls.length === 0) {
        this.showEndGameScreen("GAME OVER");
        return true;
      }
      if (this.state.remainingBricks === 0) {
        this.showEndGameScreen("YOU WIN!");
        return true;
      }
      return false;
    },

    showEndGameScreen(message) {
      this.messageEl.textContent = message;
      this.gameOverScreen.style.display = "flex";
      cancelAnimationFrame(this.state.animationFrameId);
    },

    resetAndRestart() {
      window.location.reload();
    },

    handleKeyEvent(e, isPressed) {
      const key = e.key.toLowerCase();
      if (key === "right" || key === "arrowright" || key === "d") {
        this.state.rightPressed = isPressed;
      }
      if (key === "left" || key === "arrowleft" || key === "a") {
        this.state.leftPressed = isPressed;
      }
    },
  };

  game.init();
});
