/**
 * 游戏配置
 */
const config = {
    rows: 8, // 行数
    cols: 10, // 列数
    tileTypes: ['🍎', '🍌', '🍇', '🍓', '🍉', '🍊', '🍋', '🍒', '🍑', '🍍', '🥝', '🥥'], // 图标类型
    gameTime: 60 // 游戏时间（秒）
};

/**
 * 游戏状态
 */
let state = {
    board: [], // 游戏棋盘二维数组
    selectedTile: null, // 当前选中的格子 { element, row, col, type }
    score: 0,
    timeLeft: config.gameTime,
    timerId: null, // 计时器 ID
    tilesRemaining: 0 // 剩余格子数
};

// DOM 元素引用
const gameBoardElement = document.getElementById('game-board');
const scoreElement = document.getElementById('score');
const timerElement = document.getElementById('timer');
const resetButton = document.getElementById('reset-button');

/**
 * @function shuffleArray
 * @description 随机打乱数组元素 (Fisher-Yates 算法)
 * @param {Array} array - 需要打乱的数组
 * @returns {Array} 打乱后的数组
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // ES6 解构赋值交换元素
    }
    return array;
}

/**
 * @function generateTiles
 * @description 生成成对的格子类型列表
 * @returns {Array} 包含成对格子类型的数组
 */
function generateTiles() {
    const totalTiles = config.rows * config.cols;
    if (totalTiles % 2 !== 0) {
        console.error("棋盘格子总数必须是偶数!");
        return [];
    }
    const neededPairs = totalTiles / 2;
    let tilePool = [];
    // 从可用类型中选择足够的类型来填满棋盘
    for (let i = 0; i < neededPairs; i++) {
        const type = config.tileTypes[i % config.tileTypes.length];
        tilePool.push(type, type); // 添加一对相同的类型
    }
    return shuffleArray(tilePool); // 打乱顺序
}

/**
 * @function createBoard
 * @description 创建游戏棋盘并渲染到 DOM
 */
function createBoard() {
    const tiles = generateTiles();
    state.board = [];
    gameBoardElement.innerHTML = ''; // 清空旧棋盘
    gameBoardElement.style.gridTemplateColumns = `repeat(${config.cols}, auto)`; // 设置 CSS Grid 布局

    let tileIndex = 0;
    for (let r = 0; r < config.rows; r++) {
        const row = [];
        for (let c = 0; c < config.cols; c++) {
            const tileType = tiles[tileIndex++];
            const tileElement = document.createElement('div');
            tileElement.classList.add('tile');
            tileElement.dataset.row = r; // 存储行信息
            tileElement.dataset.col = c; // 存储列信息
            tileElement.dataset.type = tileType; // 存储类型信息
            tileElement.textContent = tileType; // 显示图标

            // 添加点击事件监听器
            tileElement.addEventListener('click', handleTileClick);

            gameBoardElement.appendChild(tileElement);
            row.push({ element: tileElement, type: tileType, row: r, col: c, visible: true });
        }
        state.board.push(row);
    }
    state.tilesRemaining = config.rows * config.cols;
}

/**
 * @function handleTileClick
 * @description 处理格子点击事件
 * @param {Event} event - 点击事件对象
 */
function handleTileClick(event) {
    const clickedElement = event.target;
    // 如果格子已隐藏或已被选中，则不处理
    if (clickedElement.classList.contains('hidden') || clickedElement.classList.contains('selected')) {
        return;
    }

    const row = parseInt(clickedElement.dataset.row);
    const col = parseInt(clickedElement.dataset.col);
    const type = clickedElement.dataset.type;
    const currentTile = { element: clickedElement, row, col, type };

    if (!state.selectedTile) {
        // 第一次点击，选中格子
        clickedElement.classList.add('selected');
        state.selectedTile = currentTile;
    } else {
        // 第二次点击
        if (state.selectedTile.element === clickedElement) {
            // 点击了同一个格子，取消选中
            clickedElement.classList.remove('selected');
            state.selectedTile = null;
        } else {
            // 点击了不同的格子，检查是否匹配
            if (state.selectedTile.type === type) {
                // 类型匹配，检查路径（简化版：仅相邻或相同位置，实际应实现路径查找）
                // TODO: 实现真正的路径检查逻辑 (isPathValid)
                if (isMatchPossible(state.selectedTile, currentTile)) {
                    // 匹配成功，隐藏格子
                    state.selectedTile.element.classList.add('hidden');
                    clickedElement.classList.add('hidden');
                    state.board[state.selectedTile.row][state.selectedTile.col].visible = false;
                    state.board[row][col].visible = false;

                    // 更新分数和剩余格子数
                    state.score += 10;
                    state.tilesRemaining -= 2;
                    updateScore();

                    // 清除选中状态
                    state.selectedTile.element.classList.remove('selected'); // 移除第一个的选中样式
                    state.selectedTile = null;

                    // 检查是否胜利
                    if (state.tilesRemaining === 0) {
                        winGame();
                    }
                } else {
                    // 类型匹配但路径不通，取消选中
                    state.selectedTile.element.classList.remove('selected');
                    state.selectedTile = null;
                    // 可以给用户一些反馈，比如短暂闪烁红色边框
                    flashBorder(clickedElement, 'red');
                    flashBorder(state.selectedTile.element, 'red'); // 应该在 null 之前获取
                }
            } else {
                // 类型不匹配，取消选中第一个，选中当前点击的
                state.selectedTile.element.classList.remove('selected');
                clickedElement.classList.add('selected');
                state.selectedTile = currentTile;
                 // 可以给用户一些反馈
                flashBorder(clickedElement, 'orange');
                flashBorder(state.selectedTile.element, 'orange'); // 应该在 null 之前获取
            }
        }
    }
}

/**
 * @function isMatchPossible
 * @description 检查两个格子是否可以消除（简化版，实际需要路径查找）
 * @param {object} tile1 - 第一个格子信息 { element, row, col, type }
 * @param {object} tile2 - 第二个格子信息 { element, row, col, type }
 * @returns {boolean} 是否可以消除
 */
function isMatchPossible(tile1, tile2) {
    // 在这个简化版本中，我们只允许直接相邻（水平或垂直）的格子消除
    // 或者在同一行/列且中间没有其他格子的情况
    // 这是一个非常基础的检查，真正的连连看需要复杂的路径搜索算法（如 BFS）

    // 暂时返回 true 以便测试基本消除逻辑
    // TODO: 替换为真实的路径检查函数 isPathValid(tile1, tile2)
    console.warn("使用的是简化的匹配逻辑，需要实现完整的路径检查！");
    return true; // 临时允许所有同类型匹配
}

/**
 * @function flashBorder
 * @description 短暂改变格子边框颜色以提供反馈
 * @param {HTMLElement} element - 格子元素
 * @param {string} color - 边框颜色
 */
function flashBorder(element, color) {
    if (!element) return;
    const originalBorder = element.style.borderColor;
    element.style.borderColor = color;
    element.style.boxShadow = `0 0 5px ${color}`; // 添加阴影效果
    setTimeout(() => {
        element.style.borderColor = originalBorder;
        element.style.boxShadow = 'none';
    }, 300); // 持续 300 毫秒
}


/**
 * @function updateScore
 * @description 更新界面上的得分显示
 */
function updateScore() {
    scoreElement.textContent = state.score;
}

/**
 * @function updateTimer
 * @description 更新界面上的时间显示并处理倒计时
 */
function updateTimer() {
    state.timeLeft--;
    timerElement.textContent = state.timeLeft;
    if (state.timeLeft <= 0) {
        loseGame();
    }
}

/**
 * @function startGameTimer
 * @description 启动游戏计时器
 */
function startGameTimer() {
    clearInterval(state.timerId); // 清除可能存在的旧计时器
    state.timeLeft = config.gameTime;
    timerElement.textContent = state.timeLeft;
    state.timerId = setInterval(updateTimer, 1000); // 每秒执行一次
}

/**
 * @function stopGameTimer
 * @description 停止游戏计时器
 */
function stopGameTimer() {
    clearInterval(state.timerId);
}

/**
 * @function winGame
 * @description 游戏胜利处理
 */
function winGame() {
    stopGameTimer();
    alert(`恭喜你！你赢了！得分: ${state.score}`);
    // 可以添加更复杂的胜利界面或逻辑
}

/**
 * @function loseGame
 * @description 游戏失败处理 (时间耗尽)
 */
function loseGame() {
    stopGameTimer();
    alert(`时间到！游戏结束。得分: ${state.score}`);
    // 可以禁用棋盘点击等
    gameBoardElement.style.pointerEvents = 'none'; // 禁用点击
}

/**
 * @function resetGame
 * @description 重置游戏状态并开始新游戏
 */
function resetGame() {
    stopGameTimer();
    state.score = 0;
    state.selectedTile = null;
    updateScore();
    gameBoardElement.style.pointerEvents = 'auto'; // 恢复点击
    createBoard(); // 重新生成棋盘
    startGameTimer(); // 开始计时
}

/**
 * @function initializeGame
 * @description 初始化游戏
 */
function initializeGame() {
    resetButton.addEventListener('click', resetGame);
    resetGame(); // 页面加载时直接开始第一局
}

// --- 游戏启动 ---
initializeGame();

// --- 路径检查 (待实现) ---
/**
 * @function isPathValid
 * @description 检查两个相同类型的格子之间是否存在有效的消除路径 (最多两个拐点)
 * @param {object} tile1 - 第一个格子 { row, col }
 * @param {object} tile2 - 第二个格子 { row, col }
 * @returns {boolean} 是否存在有效路径
 */
function isPathValid(tile1, tile2) {
    // 这是连连看的核心算法，通常使用广度优先搜索 (BFS) 实现
    // 1. 检查是否可以直接相连 (0 拐点)
    // 2. 检查是否可以通过一个拐点相连
    // 3. 检查是否可以通过两个拐点相连

    // TODO: 实现 BFS 路径搜索逻辑
    console.error("isPathValid 函数尚未实现！");
    return false; // 占位符
}