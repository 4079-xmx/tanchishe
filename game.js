const canvas = document.querySelector("#gameCanvas");
const context = canvas.getContext("2d");

const scoreEl = document.querySelector("#score");
const bestScoreEl = document.querySelector("#bestScore");
const statusEl = document.querySelector("#status");
const overlay = document.querySelector("#overlay");
const overlayTitle = document.querySelector("#overlayTitle");
const overlayText = document.querySelector("#overlayText");
const startBtn = document.querySelector("#startBtn");
const pauseBtn = document.querySelector("#pauseBtn");
const restartBtn = document.querySelector("#restartBtn");

const gridSize = 21;
const tickMs = 115;
const bestKey = "snake-best-score";
const canvasPixels = 640;

const directions = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

let snake;
let food;
let direction;
let queuedDirection;
let score;
let bestScore = Number(localStorage.getItem(bestKey) || 0);
let running = false;
let paused = false;
let gameOver = false;
let lastTick = 0;
let animationId = 0;
let touchStart = null;

resizeCanvas();
bestScoreEl.textContent = bestScore;
resetGame();
draw();

function resetGame() {
  const middle = Math.floor(gridSize / 2);
  snake = [
    { x: middle, y: middle },
    { x: middle - 1, y: middle },
    { x: middle - 2, y: middle },
  ];
  direction = directions.right;
  queuedDirection = directions.right;
  score = 0;
  food = createFood();
  running = false;
  paused = false;
  gameOver = false;
  lastTick = 0;
  updateScore();
  updateButtons();
  setMessage("准备开始", "用方向键、WASD、滑动或下方按钮控制方向");
  statusEl.textContent = "按开始进入游戏";
  overlay.classList.remove("hidden");
}

function startGame() {
  if (gameOver) {
    resetGame();
  }
  running = true;
  paused = false;
  gameOver = false;
  overlay.classList.add("hidden");
  statusEl.textContent = "游戏中";
  updateButtons();
  cancelAnimationFrame(animationId);
  animationId = requestAnimationFrame(gameLoop);
}

function togglePause() {
  if (!running || gameOver) {
    return;
  }

  paused = !paused;
  if (paused) {
    setMessage("已暂停", "点继续或按空格键恢复游戏");
    overlay.classList.remove("hidden");
    statusEl.textContent = "已暂停";
  } else {
    overlay.classList.add("hidden");
    statusEl.textContent = "游戏中";
    lastTick = 0;
    animationId = requestAnimationFrame(gameLoop);
  }
  updateButtons();
}

function gameLoop(timestamp) {
  if (!running || paused) {
    return;
  }

  if (!lastTick) {
    lastTick = timestamp;
  }

  if (timestamp - lastTick >= tickMs) {
    step();
    lastTick = timestamp;
  }

  draw();
  animationId = requestAnimationFrame(gameLoop);
}

function step() {
  direction = queuedDirection;
  const head = snake[0];
  const next = {
    x: head.x + direction.x,
    y: head.y + direction.y,
  };
  const willEat = next.x === food.x && next.y === food.y;

  if (isWallHit(next) || isSnakeHit(next, willEat)) {
    endGame();
    return;
  }

  snake.unshift(next);

  if (willEat) {
    score += 10;
    updateScore();

    if (snake.length === gridSize * gridSize) {
      winGame();
      return;
    }

    food = createFood();
  } else {
    snake.pop();
  }
}

function endGame() {
  running = false;
  gameOver = true;
  setMessage("游戏结束", `本局得分 ${score}，点重开再来一局`);
  overlay.classList.remove("hidden");
  statusEl.textContent = "撞到了，游戏结束";
  updateButtons();
}

function winGame() {
  running = false;
  gameOver = true;
  setMessage("你赢了", `满格通关，最终得分 ${score}`);
  overlay.classList.remove("hidden");
  statusEl.textContent = "满格通关";
  updateButtons();
}

function setDirection(nextDirection) {
  if (isOpposite(direction, nextDirection)) {
    return;
  }
  queuedDirection = nextDirection;
}

function isOpposite(current, next) {
  return current.x + next.x === 0 && current.y + next.y === 0;
}

function isWallHit(point) {
  return point.x < 0 || point.x >= gridSize || point.y < 0 || point.y >= gridSize;
}

function isSnakeHit(point, includeTail) {
  const body = includeTail ? snake : snake.slice(0, -1);
  return body.some((segment) => segment.x === point.x && segment.y === point.y);
}

function createFood() {
  const openCells = [];

  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      if (!snake.some((segment) => segment.x === x && segment.y === y)) {
        openCells.push({ x, y });
      }
    }
  }

  return openCells[Math.floor(Math.random() * openCells.length)];
}

function updateScore() {
  scoreEl.textContent = score;
  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem(bestKey, String(bestScore));
    bestScoreEl.textContent = bestScore;
  }
}

function updateButtons() {
  startBtn.textContent = paused ? "继续" : running ? "进行中" : gameOver ? "再来" : "开始";
  startBtn.disabled = running && !paused;
  pauseBtn.textContent = paused ? "继续" : "暂停";
  pauseBtn.disabled = !running || gameOver;
}

function setMessage(title, text) {
  overlayTitle.textContent = title;
  overlayText.textContent = text;
}

function draw() {
  const size = canvas.width;
  const cell = size / gridSize;

  context.clearRect(0, 0, size, size);
  drawBoard(cell);
  drawFood(cell);
  drawSnake(cell);
}

function drawBoard(cell) {
  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      context.fillStyle = (x + y) % 2 === 0 ? "#17351f" : "#1d4026";
      context.fillRect(x * cell, y * cell, cell, cell);
    }
  }

  context.strokeStyle = "rgba(255, 255, 255, 0.08)";
  context.lineWidth = 1;
  for (let line = 1; line < gridSize; line += 1) {
    const offset = Math.round(line * cell) + 0.5;
    context.beginPath();
    context.moveTo(offset, 0);
    context.lineTo(offset, canvas.height);
    context.moveTo(0, offset);
    context.lineTo(canvas.width, offset);
    context.stroke();
  }
}

function drawFood(cell) {
  if (!food) {
    return;
  }

  const centerX = food.x * cell + cell / 2;
  const centerY = food.y * cell + cell / 2;
  const radius = cell * 0.34;

  context.fillStyle = "#ff5a5f";
  context.beginPath();
  context.arc(centerX, centerY, radius, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#ffd166";
  context.beginPath();
  context.arc(centerX - radius * 0.25, centerY - radius * 0.25, radius * 0.28, 0, Math.PI * 2);
  context.fill();
}

function drawSnake(cell) {
  snake.forEach((segment, index) => {
    const inset = Math.max(2, cell * 0.11);
    const x = segment.x * cell + inset;
    const y = segment.y * cell + inset;
    const size = cell - inset * 2;
    const radius = Math.min(10, size * 0.32);

    context.fillStyle = index === 0 ? "#7cf2a0" : "#46d27a";
    roundedRect(x, y, size, size, radius);
    context.fill();

    if (index === 0) {
      drawEyes(segment, cell);
    }
  });
}

function drawEyes(head, cell) {
  const eyeRadius = cell * 0.055;
  const centerX = head.x * cell + cell / 2;
  const centerY = head.y * cell + cell / 2;
  const forwardX = direction.x * cell * 0.18;
  const forwardY = direction.y * cell * 0.18;
  const sideX = direction.y * cell * 0.15;
  const sideY = -direction.x * cell * 0.15;

  context.fillStyle = "#0f172a";
  context.beginPath();
  context.arc(centerX + forwardX + sideX, centerY + forwardY + sideY, eyeRadius, 0, Math.PI * 2);
  context.arc(centerX + forwardX - sideX, centerY + forwardY - sideY, eyeRadius, 0, Math.PI * 2);
  context.fill();
}

function roundedRect(x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}

function handleKeydown(event) {
  const keyMap = {
    ArrowUp: directions.up,
    w: directions.up,
    W: directions.up,
    ArrowDown: directions.down,
    s: directions.down,
    S: directions.down,
    ArrowLeft: directions.left,
    a: directions.left,
    A: directions.left,
    ArrowRight: directions.right,
    d: directions.right,
    D: directions.right,
  };

  if (event.key === " " || event.key === "Enter") {
    event.preventDefault();
    if (!running || gameOver) {
      startGame();
    } else {
      togglePause();
    }
    return;
  }

  const nextDirection = keyMap[event.key];
  if (nextDirection) {
    event.preventDefault();
    setDirection(nextDirection);
    if (!running && !gameOver) {
      startGame();
    }
  }
}

function handleTouchStart(event) {
  const touch = event.changedTouches[0];
  touchStart = { x: touch.clientX, y: touch.clientY };
}

function handleTouchEnd(event) {
  if (!touchStart) {
    return;
  }

  const touch = event.changedTouches[0];
  const deltaX = touch.clientX - touchStart.x;
  const deltaY = touch.clientY - touchStart.y;
  touchStart = null;

  if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < 24) {
    return;
  }

  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    setDirection(deltaX > 0 ? directions.right : directions.left);
  } else {
    setDirection(deltaY > 0 ? directions.down : directions.up);
  }

  if (!running && !gameOver) {
    startGame();
  }
}

function chooseDirection(nextDirection) {
  setDirection(nextDirection);
  if (!running && !gameOver) {
    startGame();
  }
}

startBtn.addEventListener("click", () => {
  if (paused) {
    togglePause();
  } else {
    startGame();
  }
});
pauseBtn.addEventListener("click", togglePause);
restartBtn.addEventListener("click", () => {
  resetGame();
  startGame();
});

document.querySelector("#upBtn").addEventListener("click", () => chooseDirection(directions.up));
document.querySelector("#downBtn").addEventListener("click", () => chooseDirection(directions.down));
document.querySelector("#leftBtn").addEventListener("click", () => chooseDirection(directions.left));
document.querySelector("#rightBtn").addEventListener("click", () => chooseDirection(directions.right));

window.addEventListener("keydown", handleKeydown);
canvas.addEventListener("touchstart", handleTouchStart, { passive: true });
canvas.addEventListener("touchend", handleTouchEnd, { passive: true });

function resizeCanvas() {
  canvas.width = canvasPixels;
  canvas.height = canvasPixels;
}
