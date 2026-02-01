const BOARD_SIZE = 20;

const TANK_UNITS = {
    'light-tank': { name: 'Light Tank', size: 2, count: 4, color: 'light-tank' },
    'medium-tank': { name: 'Medium Tank', size: 3, count: 2, color: 'medium-tank' },
    'heavy-tank': { name: 'Heavy Tank', size: 4, count: 1, color: 'heavy-tank' },
    'tank-destroyer': { name: 'Tank Destroyer', size: 2, count: 2, color: 'tank-destroyer' },
    'command-tank': { name: 'Command Tank', size: 3, count: 1, color: 'command-tank' }
};

const NATIONS = {
    'US': { name: 'United States', symbol: '★', color: '#002868' },
    'German': { name: 'Germany', symbol: '✠', color: '#000000' },
    'USSR': { name: 'Soviet Union', symbol: '☭', color: '#cc0000' },
    'Britain': { name: 'Britain', symbol: '♔', color: '#012169' },
    'Japan': { name: 'Japan', symbol: '◉', color: '#bc002d' }
};

let gameState = {
    mode: gameMode,
    phase: 'nation-selection',
    currentPlayer: 1,
    selectedNation: null,
    player1Nation: null,
    player2Nation: null,
    orientation: 'horizontal',
    selectedUnit: null,
    player1Board: createEmptyBoard(),
    player2Board: createEmptyBoard(),
    player1Ships: [],
    player2Ships: [],
    player1Hits: new Set(),
    player2Hits: new Set(),
    aiDifficulty: null,
    aiLastHit: null,
    aiTargets: []
};

function createEmptyBoard() {
    return Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
}

function selectNation(nation) {
    gameState.selectedNation = nation;
    if (gameState.currentPlayer === 1) {
        gameState.player1Nation = nation;
    } else {
        gameState.player2Nation = nation;
    }
    
    document.getElementById('nation-selection').style.display = 'none';
    document.getElementById('placement-phase').style.display = 'block';
    
    if (gameState.mode.startsWith('ai-')) {
        gameState.aiDifficulty = gameState.mode.split('-')[1];
        const aiNations = Object.keys(NATIONS).filter(n => n !== nation);
        gameState.player2Nation = aiNations[Math.floor(Math.random() * aiNations.length)];
    }
    
    initPlacementPhase();
}

function initPlacementPhase() {
    const title = document.getElementById('placement-title');
    if (gameState.currentPlayer === 1) {
        title.textContent = `Player 1: Place Your ${NATIONS[gameState.selectedNation].name} Tanks`;
    } else {
        title.textContent = `Player 2: Place Your ${NATIONS[gameState.selectedNation].name} Tanks`;
    }
    
    renderUnitsList();
    renderPlacementBoard();
    
    document.getElementById('rotate-btn').onclick = () => {
        gameState.orientation = gameState.orientation === 'horizontal' ? 'vertical' : 'horizontal';
    };
    
    document.getElementById('random-btn').onclick = randomPlacement;
    document.getElementById('clear-btn').onclick = clearBoard;
    document.getElementById('ready-btn').onclick = confirmPlacement;
    
    document.addEventListener('keydown', handleKeyPress);
}

function handleKeyPress(e) {
    if (e.key === 'r' || e.key === 'R') {
        gameState.orientation = gameState.orientation === 'horizontal' ? 'vertical' : 'horizontal';
    }
}

function renderUnitsList() {
    const unitsList = document.getElementById('units-list');
    unitsList.innerHTML = '';
    
    const currentShips = gameState.currentPlayer === 1 ? gameState.player1Ships : gameState.player2Ships;
    
    Object.entries(TANK_UNITS).forEach(([type, unit]) => {
        const placed = currentShips.filter(s => s.type === type).length;
        
        for (let i = 0; i < unit.count; i++) {
            const unitDiv = document.createElement('div');
            unitDiv.className = 'unit-item' + (i < placed ? ' placed' : '');
            unitDiv.innerHTML = `${unit.name} (${unit.size} squares)`;
            
            if (i >= placed) {
                unitDiv.onclick = () => selectUnit(type);
                if (gameState.selectedUnit === type && i === placed) {
                    unitDiv.classList.add('selected');
                }
            }
            
            unitsList.appendChild(unitDiv);
        }
    });
}

function selectUnit(type) {
    gameState.selectedUnit = type;
    renderUnitsList();
}

function renderPlacementBoard() {
    const board = document.getElementById('placement-board');
    board.innerHTML = '';
    
    const currentBoard = gameState.currentPlayer === 1 ? gameState.player1Board : gameState.player2Board;
    
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            
            if (currentBoard[row][col]) {
                cell.classList.add(currentBoard[row][col].type);
            }
            
            cell.onmouseenter = () => showPlacementPreview(row, col);
            cell.onmouseleave = clearPreview;
            cell.onclick = () => placeTank(row, col);
            
            board.appendChild(cell);
        }
    }
}

function showPlacementPreview(row, col) {
    if (!gameState.selectedUnit) return;
    
    clearPreview();
    
    const size = TANK_UNITS[gameState.selectedUnit].size;
    const cells = [];
    let valid = true;
    
    for (let i = 0; i < size; i++) {
        const r = gameState.orientation === 'horizontal' ? row : row + i;
        const c = gameState.orientation === 'horizontal' ? col + i : col;
        
        if (r >= BOARD_SIZE || c >= BOARD_SIZE) {
            valid = false;
            break;
        }
        
        const currentBoard = gameState.currentPlayer === 1 ? gameState.player1Board : gameState.player2Board;
        if (currentBoard[r][c]) {
            valid = false;
        }
        
        cells.push([r, c]);
    }
    
    cells.forEach(([r, c]) => {
        const cell = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
        if (cell) {
            cell.classList.add(valid ? 'preview' : 'invalid-preview');
        }
    });
}

function clearPreview() {
    document.querySelectorAll('.preview, .invalid-preview').forEach(cell => {
        cell.classList.remove('preview', 'invalid-preview');
    });
}

function placeTank(row, col) {
    if (!gameState.selectedUnit) return;
    
    const size = TANK_UNITS[gameState.selectedUnit].size;
    const positions = [];
    
    for (let i = 0; i < size; i++) {
        const r = gameState.orientation === 'horizontal' ? row : row + i;
        const c = gameState.orientation === 'horizontal' ? col + i : col;
        
        if (r >= BOARD_SIZE || c >= BOARD_SIZE) return;
        
        const currentBoard = gameState.currentPlayer === 1 ? gameState.player1Board : gameState.player2Board;
        if (currentBoard[r][c]) return;
        
        positions.push([r, c]);
    }
    
    const ship = {
        type: gameState.selectedUnit,
        positions: positions,
        hits: new Set()
    };
    
    if (gameState.currentPlayer === 1) {
        gameState.player1Ships.push(ship);
        positions.forEach(([r, c]) => {
            gameState.player1Board[r][c] = ship;
        });
    } else {
        gameState.player2Ships.push(ship);
        positions.forEach(([r, c]) => {
            gameState.player2Board[r][c] = ship;
        });
    }
    
    gameState.selectedUnit = null;
    renderUnitsList();
    renderPlacementBoard();
    checkPlacementComplete();
}

function checkPlacementComplete() {
    const currentShips = gameState.currentPlayer === 1 ? gameState.player1Ships : gameState.player2Ships;
    let totalRequired = 0;
    Object.values(TANK_UNITS).forEach(unit => {
        totalRequired += unit.count;
    });
    
    const readyBtn = document.getElementById('ready-btn');
    if (currentShips.length === totalRequired) {
        readyBtn.disabled = false;
    } else {
        readyBtn.disabled = true;
    }
}

function randomPlacement() {
    clearBoard();
    
    const currentBoard = gameState.currentPlayer === 1 ? gameState.player1Board : gameState.player2Board;
    const ships = gameState.currentPlayer === 1 ? gameState.player1Ships : gameState.player2Ships;
    
    Object.entries(TANK_UNITS).forEach(([type, unit]) => {
        for (let i = 0; i < unit.count; i++) {
            let placed = false;
            let attempts = 0;
            
            while (!placed && attempts < 1000) {
                const row = Math.floor(Math.random() * BOARD_SIZE);
                const col = Math.floor(Math.random() * BOARD_SIZE);
                const orientation = Math.random() < 0.5 ? 'horizontal' : 'vertical';
                
                const positions = [];
                let valid = true;
                
                for (let j = 0; j < unit.size; j++) {
                    const r = orientation === 'horizontal' ? row : row + j;
                    const c = orientation === 'horizontal' ? col + j : col;
                    
                    if (r >= BOARD_SIZE || c >= BOARD_SIZE || currentBoard[r][c]) {
                        valid = false;
                        break;
                    }
                    positions.push([r, c]);
                }
                
                if (valid) {
                    const ship = { type, positions, hits: new Set() };
                    ships.push(ship);
                    positions.forEach(([r, c]) => {
                        currentBoard[r][c] = ship;
                    });
                    placed = true;
                }
                
                attempts++;
            }
        }
    });
    
    renderUnitsList();
    renderPlacementBoard();
    checkPlacementComplete();
}

function clearBoard() {
    if (gameState.currentPlayer === 1) {
        gameState.player1Board = createEmptyBoard();
        gameState.player1Ships = [];
    } else {
        gameState.player2Board = createEmptyBoard();
        gameState.player2Ships = [];
    }
    
    renderUnitsList();
    renderPlacementBoard();
    checkPlacementComplete();
}

function confirmPlacement() {
    if (gameState.mode === '2player' && gameState.currentPlayer === 1) {
        gameState.currentPlayer = 2;
        gameState.selectedNation = null;
        
        document.getElementById('placement-phase').style.display = 'none';
        document.getElementById('nation-selection').style.display = 'block';
        
        alert('Player 2, select your nation!');
    } else {
        if (gameState.mode.startsWith('ai-')) {
            placeAITanks();
        }
        
        startBattle();
    }
}

function placeAITanks() {
    Object.entries(TANK_UNITS).forEach(([type, unit]) => {
        for (let i = 0; i < unit.count; i++) {
            let placed = false;
            let attempts = 0;
            
            while (!placed && attempts < 1000) {
                const row = Math.floor(Math.random() * BOARD_SIZE);
                const col = Math.floor(Math.random() * BOARD_SIZE);
                const orientation = Math.random() < 0.5 ? 'horizontal' : 'vertical';
                
                const positions = [];
                let valid = true;
                
                for (let j = 0; j < unit.size; j++) {
                    const r = orientation === 'horizontal' ? row : row + j;
                    const c = orientation === 'horizontal' ? col + j : col;
                    
                    if (r >= BOARD_SIZE || c >= BOARD_SIZE || gameState.player2Board[r][c]) {
                        valid = false;
                        break;
                    }
                    positions.push([r, c]);
                }
                
                if (valid) {
                    const ship = { type, positions, hits: new Set() };
                    gameState.player2Ships.push(ship);
                    positions.forEach(([r, c]) => {
                        gameState.player2Board[r][c] = ship;
                    });
                    placed = true;
                }
                
                attempts++;
            }
        }
    });
}

function startBattle() {
    document.getElementById('placement-phase').style.display = 'none';
    document.getElementById('battle-phase').style.display = 'block';
    
    gameState.phase = 'battle';
    gameState.currentPlayer = 1;
    
    document.getElementById('player1-name').textContent = username;
    document.getElementById('player1-nation').textContent = NATIONS[gameState.player1Nation].name;
    document.getElementById('player2-name').textContent = gameState.mode.startsWith('ai-') ? 'AI' : 'Player 2';
    document.getElementById('player2-nation').textContent = NATIONS[gameState.player2Nation].name;
    
    renderBattleBoards();
    updateUnitStatus();
    updateTurnIndicator();
}

function renderBattleBoards() {
    renderPlayerBoard();
    renderEnemyBoard();
    // In 2-player local mode we want to hide the opponent's board from the current player.
    // The template uses generic wrappers (no specific ids) so find them via the board elements' parents.
    if (gameState.mode === '2player') {
        const playerBoardEl = document.getElementById('player-board');
        const enemyBoardEl = document.getElementById('enemy-board');
        const playerWrap = playerBoardEl ? playerBoardEl.parentElement : null;
        const enemyWrap = enemyBoardEl ? enemyBoardEl.parentElement : null;

        if (playerWrap && enemyWrap) {
            // Always show the `enemy-board` to the active player. The `renderEnemyBoard`
            // function renders the opponent's board from the attacker's perspective and
            // hides ship placements unless they've been hit. This prevents the next player
            // from seeing the opponent's full ship layout and reduces cheating risk.
            playerWrap.style.display = 'none';
            enemyWrap.style.display = 'block';
        }
    }
}






function renderPlayerBoard() {
    const board = document.getElementById('player-board');
    board.innerHTML = '';
    
    const currentPlayer = gameState.mode.startsWith('ai-') ? 1 : gameState.currentPlayer;
    const opponent = currentPlayer === 1 ? 2 : 1;
    const boardData = currentPlayer === 1 ? gameState.player1Board : gameState.player2Board;
    const hits = opponent === 1 ? gameState.player1Hits : gameState.player2Hits;
    
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            
            if (boardData[row][col]) {
                cell.classList.add(boardData[row][col].type);
            }
            
            const key = `${row},${col}`;
            if (hits.has(key)) {
                cell.classList.add(boardData[row][col] ? 'hit' : 'miss');
            }

            // No click handlers here; attacks are always performed on the visible `enemy-board`.

            board.appendChild(cell);
        }
    }
}

function renderEnemyBoard() {
    const board = document.getElementById('enemy-board');
    board.innerHTML = '';
    
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;

            // Determine defender board (the board being displayed on enemy-board)
            // In AI mode, enemy-board always shows the AI's board (player2Board).
            // In 2-player mode, it shows the defender's board.
            const attacker = gameState.currentPlayer;
            const defender = attacker === 1 ? 2 : 1;
            const defenderBoard = gameState.mode.startsWith('ai-')
                ? gameState.player2Board
                : (defender === 1 ? gameState.player1Board : gameState.player2Board);

            const key = `${row},${col}`;

            // Which hits should be shown on this enemy-board? For AI mode, always show
            // the human player's hits (player1Hits) on the AI's board so the player sees
            // their previous shots even during the AI turn. Otherwise show the current
            // attacker's hits so the visible board matches the active player's perspective.
            const hitsToShow = gameState.mode.startsWith('ai-')
                ? gameState.player1Hits
                : (attacker === 1 ? gameState.player1Hits : gameState.player2Hits);

            if (hitsToShow.has(key)) {
                cell.classList.add(defenderBoard[row][col] ? 'hit' : 'miss');
                if (defenderBoard[row][col]) {
                    cell.classList.add(defenderBoard[row][col].type);
                }
            }

            // Attach click handler only when the human (player 1) is the current player
            // in AI mode, or when the current player is the attacker in 2-player mode.
            const canClick = (gameState.mode.startsWith('ai-') && gameState.currentPlayer === 1)
                || (gameState.mode === '2player');

            if (canClick && !hitsToShow.has(key)) {
                cell.onclick = () => handleAttack(row, col);
                cell.style.cursor = 'crosshair';
            }
            
            board.appendChild(cell);
        }
    }
}
    // Generalized attack handler for both players (and used by AI flow). 
    // Current attacker is `gameState.currentPlayer`; defender is the other player.
    function handleAttack(row, col) {
        const attacker = gameState.currentPlayer; // 1 or 2
        const defender = attacker === 1 ? 2 : 1;

        const attackerHits = attacker === 1 ? gameState.player1Hits : gameState.player2Hits;
        const defenderBoard = defender === 1 ? gameState.player1Board : gameState.player2Board;
        const defenderShips = defender === 1 ? gameState.player1Ships : gameState.player2Ships;

        const key = `${row},${col}`;
        if (attackerHits.has(key)) return;

        attackerHits.add(key);

        const ship = defenderBoard[row][col];
        const hit = !!ship;

        if (hit) {
            ship.hits.add(key);

            if (isShipDestroyed(ship)) {
                if (ship.type === 'command-tank') {
                    endGame(attacker);
                    return;
                }
            }
        }

        if (checkAllShipsDestroyed(defenderShips)) {
            endGame(attacker);
            return;
        }

        // Show shot result
        renderBattleBoards();
        updateUnitStatus();

        if (hit) {
            // Attacker keeps firing until they miss
            gameState.currentPlayer = attacker;
            updateTurnIndicator();
            // Re-render to ensure click handlers remain attached for the active player
            renderBattleBoards();
            updateUnitStatus();
        } else {
            // Miss: switch turn
            gameState.currentPlayer = defender;
            updateTurnIndicator();
            renderBattleBoards();
            updateUnitStatus();

            // If defender is AI, start AI loop
            if (gameState.mode.startsWith('ai-') && defender === 2) {
                setTimeout(() => aiAttackLoop(), 1000);
            }
        }
    }

function aiAttack() {
    // Deprecated: aiAttack is now a wrapper around the async attack loop.
    // Keep as a thin wrapper for compatibility. Start the async loop.
    aiAttackLoop();
}

// small helper to delay between AI shots for nicer UX
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Perform a single AI shot. Returns an object { hit: boolean, ended: boolean }
function aiTakeShot() {
    let row, col, key;

    if (gameState.aiDifficulty === 'normal') {
        [row, col] = aiAttackNormal();
    } else if (gameState.aiDifficulty === 'hard') {
        [row, col] = aiAttackHard();
    } else {
        [row, col] = aiAttackNightmare();
    }

    key = `${row},${col}`;
    gameState.player2Hits.add(key);

    const ship = gameState.player1Board[row][col];
    if (ship) {
        ship.hits.add(key);
        gameState.aiLastHit = [row, col];

        if (isShipDestroyed(ship)) {
            gameState.aiLastHit = null;
            gameState.aiTargets = [];

            if (ship.type === 'command-tank') {
                endGame(2);
                return { hit: true, ended: true };
            }
        } else {
            addAdjacentTargets(row, col);
        }

        if (checkAllShipsDestroyed(gameState.player1Ships)) {
            endGame(2);
            return { hit: true, ended: true };
        }

        return { hit: true, ended: false };
    } else {
        if (gameState.aiTargets.length === 0) {
            gameState.aiLastHit = null;
        }

        return { hit: false, ended: false };
    }
}

// Async loop: AI fires at least once, and keeps firing while it hits.
async function aiAttackLoop() {
    // Ensure AI is marked as current player while it fires
    gameState.currentPlayer = 2;
    updateTurnIndicator();

    // At least one shot
    let result = aiTakeShot();
    renderBattleBoards();
    updateUnitStatus();

    if (result.ended) return;

    // If AI hit, keep firing until it misses
    while (result.hit) {
        // small pause to show the hit
        await delay(600);
        result = aiTakeShot();
        renderBattleBoards();
        updateUnitStatus();

        if (result.ended) return;
    }

    // After AI misses, back to player
    gameState.currentPlayer = 1;
    updateTurnIndicator();
    // Re-render boards so the enemy board's clickable handlers are attached for the player
    renderBattleBoards();
    updateUnitStatus();
}

function aiAttackNormal() {
    let row, col, key;
    do {
        row = Math.floor(Math.random() * BOARD_SIZE);
        col = Math.floor(Math.random() * BOARD_SIZE);
        key = `${row},${col}`;
    } while (gameState.player2Hits.has(key));
    
    return [row, col];
}

function aiAttackHard() {
    if (gameState.aiDirection) {
        // Try next in direction
        const [dr, dc] = gameState.aiDirection;
        const [r, c] = gameState.aiLastHit;
        const next = [r + dr, c + dc];
        if (isValidTarget(next)) return next;
    }
    // Fallback to original logic
    if (gameState.aiTargets.length > 0) {
        return gameState.aiTargets.shift();
    }
    if (gameState.aiLastHit) {
        addDirectionalTargets(gameState.aiLastHit);
        if (gameState.aiTargets.length > 0) {
            return gameState.aiTargets.shift();
        }
    }
    return aiAttackNormal();
}

function aiAttackNightmare() {
    if (gameState.aiTargets.length > 0) {
        return gameState.aiTargets.shift();
    }
    
    if (gameState.aiLastHit) {
        const [r, c] = gameState.aiLastHit;
        addAdjacentTargets(r, c);
        
        if (gameState.aiTargets.length > 0) {
            return gameState.aiTargets.shift();
        }
    }
    
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const key = `${row},${col}`;
            if (!gameState.player2Hits.has(key) && (row + col) % 2 === 0) {
                return [row, col];
            }
        }
    }
    
    return aiAttackNormal();
}

function addAdjacentTargets(row, col) {
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    
    directions.forEach(([dr, dc]) => {
        const r = row + dr;
        const c = col + dc;
        const key = `${r},${c}`;
        
        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && !gameState.player2Hits.has(key)) {
            if (!gameState.aiTargets.some(([tr, tc]) => tr === r && tc === c)) {
                gameState.aiTargets.push([r, c]);
            }
        }
    });
}

function isShipDestroyed(ship) {
    return ship.positions.every(([r, c]) => ship.hits.has(`${r},${c}`));
}

function checkAllShipsDestroyed(ships) {
    return ships.every(ship => isShipDestroyed(ship));
}

function updateUnitStatus() {
    updatePlayerUnitStatus('player1-units', gameState.player1Ships);
    updatePlayerUnitStatus('player2-units', gameState.player2Ships);
}

function updatePlayerUnitStatus(elementId, ships) {
    const container = document.getElementById(elementId);
    container.innerHTML = '';
    
    const unitCounts = {};
    Object.keys(TANK_UNITS).forEach(type => {
        unitCounts[type] = { total: TANK_UNITS[type].count, destroyed: 0 };
    });
    
    ships.forEach(ship => {
        if (isShipDestroyed(ship)) {
            unitCounts[ship.type].destroyed++;
        }
    });
    
    Object.entries(unitCounts).forEach(([type, counts]) => {
        const div = document.createElement('div');
        div.className = 'unit-status-item';
        const alive = counts.total - counts.destroyed;
        div.innerHTML = `
            <span>${TANK_UNITS[type].name}:</span>
            <span class="${alive > 0 ? 'unit-alive' : 'unit-destroyed'}">${alive}/${counts.total}</span>
        `;
        container.appendChild(div);
    });
}

function updateTurnIndicator() {
    const indicator = document.getElementById('turn-indicator');
    if (gameState.currentPlayer === 1) {
        indicator.textContent = 'Your Turn - Fire!';
        indicator.style.color = '#4caf50';
    } else {
        indicator.textContent = gameState.mode.startsWith('ai-') ? 'AI Turn...' : 'Opponent\'s Turn';
        indicator.style.color = '#f44336';
    }
}

async function endGame(winner) {
    const gameOver = document.getElementById('game-over');
    const title = document.getElementById('game-over-title');
    const message = document.getElementById('game-over-message');
    
    if (winner === 1) {
        title.textContent = '🎉 VICTORY! 🎉';
        title.style.color = '#4caf50';
        message.textContent = 'You destroyed the enemy command tank!';
    } else {
        title.textContent = '💥 DEFEAT 💥';
        title.style.color = '#f44336';
        message.textContent = 'Your command tank has been destroyed!';
    }
    
    gameOver.style.display = 'flex';
    
    try {
        await fetch('/api/save_game', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                player1_nation: gameState.player1Nation,
                player2_id: gameState.mode === '2player' ? null : null,
                player2_nation: gameState.player2Nation,
                winner: winner,  // Pass the winner number; let backend decide if it counts
                game_mode: gameState.mode
            })
        });
    } catch (error) {
        console.error('Error saving game:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (gameState.mode.startsWith('ai-')) {
        gameState.aiDifficulty = gameState.mode.split('-')[1];
    }
});
