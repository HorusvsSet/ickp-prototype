/**
 * 120 Increasingly Cursed Knight Puzzles - Main Game Entry Point
 * Chess-style click-to-move, inventory bar below board
 */

import { Levels, getLevel, getLevelsByChapter, getChapterInfo, TileType, KnightColor, ToolType, Dir } from './levels.js';
import { GameState, SaveManager, KNIGHT_MOVES, canKnightMove } from './engine.js';
import { Renderer, ParticleAnimation, ScreenShakeAnimation } from './renderer.js';

// ============================================================================
// MAIN GAME CLASS
// ============================================================================

class ICKPGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.renderer = new Renderer(this.canvas);
        this.currentLevel = 1;
        this.gameState = null;
        this.completedLevels = new Set();
        this.globalTools = { hammer: 0, arrows: {}, boot: 0, portalGun: 0 };

        // Chess-style selection state
        this.selectedKnight = null;      // Currently selected knight
        this.validDestinations = [];     // Valid move destinations for selected knight
        this.placingTool = null;         // Currently selected tool for placement
        this.hoverTile = null;           // Tile under mouse

        // UI Elements
        this.elements = {
            levelSelect: document.getElementById('levelSelect'),
            moveCounter: document.getElementById('moveCounter'),
            undoBtn: document.getElementById('undoBtn'),
            resetBtn: document.getElementById('resetBtn'),
            waitBtn: document.getElementById('waitBtn'),
            exportBtn: document.getElementById('exportBtn'),
            importBtn: document.getElementById('importBtn'),
            importFile: document.getElementById('importFile'),
            statusMessage: document.getElementById('statusMessage'),
            chapterIndicator: document.getElementById('chapterIndicator'),
            inventoryTools: document.getElementById('inventoryTools'),
            progressStats: document.getElementById('progressStats'),
            levelCompleteModal: document.getElementById('levelCompleteModal'),
            completeMessage: document.getElementById('completeMessage'),
            nextLevelBtn: document.getElementById('nextLevelBtn'),
            modalNextLevelBtn: document.getElementById('modalNextLevelBtn'),
            replayLevelBtn: document.getElementById('replayLevelBtn'),
            importModal: document.getElementById('importModal'),
            confirmImportBtn: document.getElementById('confirmImportBtn'),
            cancelImportBtn: document.getElementById('cancelImportBtn'),
            prevLevelBtn: document.getElementById('prevLevelBtn'),
            devInfiniteMovesBtn: document.getElementById('devInfiniteMovesBtn')
        };

        this.init();
    }

    init() {
        this.setupLevelSelect();
        this.bindUIEvents();
        this.bindCanvasEvents();
        this.bindKeyboardEvents();
        this.loadSave();
        this.resizeCanvas();
        this.startRenderLoop();

        window.addEventListener('resize', () => this.resizeCanvas());
    }

    setupLevelSelect() {
        const select = this.elements.levelSelect;
        select.innerHTML = '';

        for (let ch = 1; ch <= 7; ch++) {
            const chapterInfo = getChapterInfo(ch);
            const optgroup = document.createElement('optgroup');
            optgroup.label = chapterInfo.name;

            const levels = getLevelsByChapter(ch);
            for (const level of levels) {
                const option = document.createElement('option');
                option.value = level.id;
                const completed = this.completedLevels.has(level.id) ? ' ✓' : '';
                option.textContent = `${level.id}. ${level.name} (${level.moves} moves)${completed}`;
                if (level.id === this.currentLevel) option.selected = true;
                optgroup.appendChild(option);
            }
            select.appendChild(optgroup);
        }
    }

    bindUIEvents() {
        // Level select
        this.elements.levelSelect.addEventListener('change', (e) => {
            this.loadLevel(parseInt(e.target.value));
        });

        // Level navigation
        this.elements.prevLevelBtn.addEventListener('click', () => this.prevLevel());
        this.elements.nextLevelBtn.addEventListener('click', () => this.nextLevel());

        // Control buttons
        this.elements.undoBtn.addEventListener('click', () => this.undo());
        this.elements.resetBtn.addEventListener('click', () => this.resetLevel());
        this.elements.waitBtn.addEventListener('click', () => this.wait());

        // Dev buttons
        this.elements.devInfiniteMovesBtn.addEventListener('click', () => this.toggleInfiniteMoves());

        // Save/Load
        this.elements.exportBtn.addEventListener('click', () => this.exportSave());
        this.elements.importBtn.addEventListener('click', () => this.elements.importFile.click());
        this.elements.importFile.addEventListener('change', (e) => this.importSave(e));
        this.elements.confirmImportBtn.addEventListener('click', () => this.confirmImport());
        this.elements.cancelImportBtn.addEventListener('click', () => this.hideImportModal());

        // Modal buttons
        this.elements.replayLevelBtn.addEventListener('click', () => this.replayLevel());
        this.elements.modalNextLevelBtn.addEventListener('click', () => this.nextLevel());
    }

    bindCanvasEvents() {
        this.canvas.addEventListener('mousedown', (e) => this.onCanvasClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.onCanvasMove(e));
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        // Touch support
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.onCanvasClick(e);
        }, { passive: false });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.onCanvasMove(e);
        }, { passive: false });
    }

    bindKeyboardEvents() {
        window.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

            switch (e.key) {
                case 'z':
                case 'Z':
                    if (e.ctrlKey || e.metaKey) return;
                    this.undo();
                    e.preventDefault();
                    break;
                case 'r':
                case 'R':
                    this.resetLevel();
                    break;
                case ' ':
                    this.wait();
                    e.preventDefault();
                    break;
                case 'Escape':
                    this.clearSelection();
                    break;
                case '1': this.selectToolForPlacement('hammer'); break;
                case '2': this.selectToolForPlacement('arrow_up'); break;
                case '3': this.selectToolForPlacement('arrow_right'); break;
                case '4': this.selectToolForPlacement('arrow_down'); break;
                case '5': this.selectToolForPlacement('arrow_left'); break;
                case '6': this.useBootOnSelectedKnight('up'); break; // Simplified - could add direction selector
            }
        });
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        const width = container.clientWidth;
        // Calculate available height: viewport - header - inventory - status
        const headerHeight = 60;
        const inventoryHeight = 90;
        const statusHeight = 36;
        const height = Math.max(300, window.innerHeight - headerHeight - inventoryHeight - statusHeight - 20);
        this.canvas.width = width;
        this.canvas.height = height;
        this.renderer.resize(width, height);
    }

    // ================================================================
    // LEVEL MANAGEMENT
    // ================================================================

    loadLevel(levelId) {
        const levelData = getLevel(levelId);
        if (!levelData) {
            console.error(`Level ${levelId} not found`);
            return;
        }

        this.currentLevel = levelId;
        this.clearSelection();

        // Apply global tools if chapter 7+
        let tools = { ...levelData.tools };
        if (levelData.globalTools && this.globalTools) {
            tools.hammer = Math.max(tools.hammer, this.globalTools.hammer || 0);
            tools.arrows = { ...tools.arrows, ...this.globalTools.arrows };
            tools.boot = Math.max(tools.boot, this.globalTools.boot || 0);
            tools.portalGun = Math.max(tools.portalGun, this.globalTools.portalGun || 0);
        }

        const mergedLevelData = { ...levelData, tools };
        this.gameState = new GameState(mergedLevelData);

        // Set up renderer callbacks
        this.renderer.setCallbacks({
            getSelectedKnight: () => this.selectedKnight,
            getValidDestinations: () => this.validDestinations,
            getHoverTile: () => this.hoverTile,
            getPlacingTool: () => this.placingTool,
            getRenderInfo: () => this.renderer.getRenderInfo()
        });

        this.updateUI();
        this.updateLevelSelect();
        this.renderer.animations = [];
    }

    nextLevel() {
        const nextId = this.currentLevel + 1;
        if (getLevel(nextId)) {
            this.loadLevel(nextId);
        }
        this.hideLevelCompleteModal();
    }

    prevLevel() {
        const prevId = this.currentLevel - 1;
        if (getLevel(prevId)) {
            this.loadLevel(prevId);
        }
    }

    toggleInfiniteMoves() {
        if (this.gameState) {
            this.gameState.infiniteMoves = !this.gameState.infiniteMoves;
            this.elements.devInfiniteMovesBtn.classList.toggle('selected', this.gameState.infiniteMoves);
            this.elements.devInfiniteMovesBtn.textContent = this.gameState.infiniteMoves ? '∞✓' : '∞';
            this.showMessage(this.gameState.infiniteMoves ? 'Infinite moves ON' : 'Infinite moves OFF');
        }
    }

    replayLevel() {
        this.loadLevel(this.currentLevel);
        this.hideLevelCompleteModal();
    }

    resetLevel() {
        if (this.gameState) {
            this.gameState.reset();
            this.clearSelection();
            this.updateUI();
        }
    }

    undo() {
        if (this.gameState && this.gameState.undo()) {
            this.clearSelection();
            this.updateUI();
        }
    }

    wait() {
        if (this.gameState) {
            const result = this.gameState.wait();
            if (result.valid) {
                this.clearSelection();
                this.updateUI();
                this.checkGameEnd();
            } else {
                this.showMessage(result.reason);
            }
        }
    }

    clearSelection() {
        this.selectedKnight = null;
        this.validDestinations = [];
        this.placingTool = null;
        this.updateInventorySelection();
    }

    // ================================================================
    // TOOL HANDLING (Inventory Bar)
    // ================================================================

    selectToolForPlacement(tool) {
        // Toggle off if same tool
        if (this.placingTool === tool) {
            this.clearSelection();
            this.showMessage('Click a knight to move');
            return;
        }

        // Check if tool has count > 0
        const count = this.getToolCount(tool);
        if (count <= 0) {
            this.showMessage(`No ${tool} available`);
            return;
        }

        this.clearSelection();
        this.placingTool = tool;
        this.updateInventorySelection();

        const toolNames = {
            hammer: 'Hammer (click: build, right-click: destroy)',
            arrow_up: 'Arrow Up',
            arrow_right: 'Arrow Right',
            arrow_down: 'Arrow Down',
            arrow_left: 'Arrow Left',
            boot: 'Boot (use on knight)'
        };
        this.showMessage(`${toolNames[tool] || tool} - Click on board to place`);
    }

    getToolCount(tool) {
        if (!this.gameState) return 0;
        const tools = this.gameState.tools;
        if (tool === 'hammer') return tools.hammer;
        if (tool === 'boot') return tools.boot;
        if (tool === 'portalGun') return tools.portalGun;
        if (tool.startsWith('arrow_')) {
            const dir = tool.replace('arrow_', '');
            return tools.arrows[dir] || 0;
        }
        return 0;
    }

    useBootOnSelectedKnight(direction) {
        if (!this.gameState || !this.selectedKnight) {
            this.showMessage('Select a knight first');
            return;
        }
        const result = this.gameState.useBoot(this.selectedKnight, direction);
        if (result.valid) {
            this.clearSelection();
            this.updateUI();
            this.checkGameEnd();
        } else {
            this.showMessage(result.reason);
        }
    }

    placeTool(x, y) {
        if (!this.gameState || !this.placingTool) return;

        let result = { valid: false };

        switch (this.placingTool) {
            case 'hammer':
                // Left-click = build, Right-click = destroy
                // We'll use a simple heuristic: if brick/metal -> destroy, else build
                const tile = this.gameState.board[y]?.[x];
                if (tile === TileType.BRICK || tile === TileType.METAL) {
                    result = this.gameState.useHammer(x, y, 'destroy');
                } else {
                    result = this.gameState.useHammer(x, y, 'build');
                }
                break;

            case 'arrow_up':
            case 'arrow_right':
            case 'arrow_down':
            case 'arrow_left':
                const dir = this.placingTool.replace('arrow_', '');
                result = this.gameState.placeArrow(x, y, dir);
                break;

            case 'boot':
                // Boot is used on knight, not placed
                this.showMessage('Boot is used on a knight (press 6)');
                return;
        }

        if (result.valid) {
            this.clearSelection();
            this.updateUI();
            this.showMessage(result.offScreen ? 'Built off-screen!' : 'Tool placed!');
            // Particle effect
            const rect = this.renderer.getTileRect(x, y);
            this.renderer.addAnimation(new ParticleAnimation(
                rect.x + rect.w / 2, rect.y + rect.h / 2,
                '#00d4aa', 12
            ));
        } else {
            this.showMessage(result.reason || 'Cannot place tool there');
        }
    }

    updateInventorySelection() {
        // Update visual selection state
        document.querySelectorAll('.tool-slot').forEach(slot => {
            const tool = slot.dataset.tool;
            const dir = slot.dataset.dir;
            const isSelected = this.placingTool &&
                ((this.placingTool === tool && !dir) ||
                 (this.placingTool === `arrow_${dir}` && tool === 'arrow'));
            slot.classList.toggle('selected', isSelected);
        });
    }

    // ================================================================
    // CHESS-STYLE KNIGHT MOVEMENT
    // ================================================================

    onCanvasClick(e) {
        const pos = this.getCanvasPos(e);
        const tile = this.getTileFromPos(pos.x, pos.y);

        // If placing tool, place it
        if (this.placingTool) {
            this.placeTool(tile.x, tile.y);
            return;
        }

        // Check if clicking on a valid destination
        if (this.selectedKnight) {
            const isValidDest = this.validDestinations.some(d => d.x === tile.x && d.y === tile.y);
            if (isValidDest) {
                const dx = tile.x - this.selectedKnight.x;
                const dy = tile.y - this.selectedKnight.y;
                this.executeKnightMove(this.selectedKnight, dx, dy);
                return;
            }
        }

        // Check if clicking on a knight (select it)
        const knight = this.gameState.knights.find(k =>
            k.x === tile.x && k.y === tile.y && !k.atFlag
        );
        if (knight) {
            this.selectKnight(knight);
        } else {
            // Clicked empty tile - clear selection
            this.clearSelection();
        }
    }

    onCanvasMove(e) {
        const pos = this.getCanvasPos(e);
        this.hoverTile = this.getTileFromPos(pos.x, pos.y);
    }

    getCanvasPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const clientX = e.clientX || (e.touches?.[0]?.clientX || 0);
        const clientY = e.clientY || (e.touches?.[0]?.clientY || 0);
        // Coordinates are in CSS pixels (matching renderer's logical pixels)
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    getTileFromPos(x, y) {
        const info = this.renderer.getRenderInfo();
        const tileSpacing = info.tileSpacing || (info.tileSize + (info.tileGap || 2));
        const tx = Math.floor((x - info.offsetX) / tileSpacing);
        const ty = Math.floor((y - info.offsetY) / tileSpacing);
        return { x: tx, y: ty };
    }

    selectKnight(knight) {
        this.selectedKnight = knight;
        this.placingTool = null;
        this.computeValidDestinations(knight);
        this.updateInventorySelection();
        this.showMessage(`Selected ${knight.color} knight - Click destination to move`);
    }

    computeValidDestinations(knight) {
        this.validDestinations = [];

        if (!this.gameState) return;

        // Check all 8 knight moves
        for (const move of KNIGHT_MOVES) {
            const result = canKnightMove(
                this.gameState.board,
                knight.x,
                knight.y,
                move.dx,
                move.dy,
                this.gameState.knights,
                knight.carriedKnight,
                this.gameState.canCarryKnights,
                this.gameState.voidArrows,
                this.gameState.offBoardTiles
            );
            if (result.valid) {
                const x = knight.x + move.dx;
                const y = knight.y + move.dy;

                // Check if destination is on board or valid void landing
                const inBounds = x >= 0 && x < this.gameState.width && y >= 0 && y < this.gameState.height;

                if (inBounds) {
                    const targetTile = this.gameState.board[y][x];
                    // Can land on normal, cracked, coin, flag, arrow, portal, traffic light (green), button
                    const blockedTiles = [TileType.BRICK, TileType.METAL, TileType.BOMB];
                    if (!blockedTiles.includes(targetTile)) {
                        // Check if another knight is there (can't land unless carrying)
                        const knightAtTarget = this.gameState.knights.find(k => k.x === x && k.y === y);
                        if (!knightAtTarget || knightAtTarget === knight.carriedKnight) {
                            this.validDestinations.push({ x, y, move, ...result });
                        }
                    }
                } else {
                    // Off-board - check for void arrows (already validated by canKnightMove)
                    if (result.voidArrow || result.offBoard) {
                        this.validDestinations.push({ x, y, move, ...result });
                    }
                }
            }
        }
    }

    executeKnightMove(knight, dx, dy) {
        if (!this.gameState) return;

        const result = this.gameState.moveKnight(knight, dx, dy);
        if (result.valid) {
            // Check if chain should end: knight stuck in void, off-board, or out of moves
            const movesExhausted = !this.gameState.infiniteMoves && this.gameState.movesUsed >= this.gameState.maxMoves;
            const knightStuckInVoid = result.stuckInVoid || result.offBoard;

            if (knightStuckInVoid || movesExhausted) {
                // End selection chain
                this.clearSelection();
            } else {
                // Keep knight selected for chaining moves, recompute destinations from new position
                this.validDestinations = [];
                this.computeValidDestinations(knight);
            }
            this.updateUI();
            this.checkGameEnd();

            // Particle effect on landing
            const rect = this.renderer.getTileRect(knight.x, knight.y);
            this.renderer.addAnimation(new ParticleAnimation(
                rect.x + rect.w / 2, rect.y + rect.h / 2,
                '#00ff88', 8
            ));
        } else {
            this.showMessage(result.reason || 'Invalid move');
            this.renderer.addAnimation(new ScreenShakeAnimation(8, 200));
        }
    }

    checkGameEnd() {
        if (!this.gameState) return;

        if (this.gameState.status === 'won') {
            this.onLevelComplete();
        } else if (this.gameState.status === 'lost') {
            this.showMessage(this.gameState.message);
        }
    }

    onLevelComplete() {
        this.completedLevels.add(this.currentLevel);
        this.saveProgress();

        // Save global tools for chapter 7+
        if (this.gameState.globalTools) {
            this.globalTools = {
                hammer: this.gameState.tools.hammer,
                arrows: { ...this.gameState.tools.arrows },
                boot: this.gameState.tools.boot,
                portalGun: this.gameState.tools.portalGun
            };
            SaveManager.setGlobalTools(this.globalTools);
        }

        this.elements.completeMessage.textContent = `Completed in ${this.gameState.movesUsed}/${this.gameState.maxMoves} moves!`;
        this.elements.levelCompleteModal.classList.remove('hidden');
        this.updateLevelSelect();
        this.updateUI();
    }

    // ================================================================
    // SAVE/LOAD SYSTEM
    // ================================================================

    saveProgress() {
        const data = {
            version: '1.0',
            timestamp: Date.now(),
            currentLevel: this.currentLevel,
            completedLevels: Array.from(this.completedLevels),
            globalTools: this.globalTools
        };
        localStorage.setItem('ickp_progress', JSON.stringify(data));
    }

    loadSave() {
        // Load progress
        const progressData = localStorage.getItem('ickp_progress');
        if (progressData) {
            try {
                const data = JSON.parse(progressData);
                this.completedLevels = new Set(data.completedLevels || []);
                this.currentLevel = data.currentLevel || 1;
                this.globalTools = data.globalTools || { hammer: 0, arrows: {}, boot: 0, portalGun: 0 };
            } catch (e) {
                console.error('Failed to load progress:', e);
            }
        }

        // Load global tools
        const globalTools = SaveManager.getGlobalTools();
        if (globalTools) {
            this.globalTools = { ...this.globalTools, ...globalTools };
        }

        // Load first level
        this.loadLevel(this.currentLevel);
    }

    exportSave() {
        const saveData = SaveManager.export();
        if (!saveData) {
            this.showMessage('No save data to export');
            return;
        }

        const blob = new Blob([saveData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ickp_save_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.showMessage('Save exported!');
    }

    importSave(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            this.pendingImport = e.target.result;
            this.showImportModal();
        };
        reader.readAsText(file);
        event.target.value = '';
    }

    showImportModal() {
        this.elements.importModal.classList.remove('hidden');
    }

    hideImportModal() {
        this.elements.importModal.classList.add('hidden');
        this.pendingImport = null;
    }

    confirmImport() {
        if (this.pendingImport && SaveManager.import(this.pendingImport)) {
            this.hideImportModal();
            this.loadSave();
            this.showMessage('Save imported successfully!');
        } else {
            this.showMessage('Invalid save file');
        }
    }

    hideLevelCompleteModal() {
        this.elements.levelCompleteModal.classList.add('hidden');
    }

    // ================================================================
    // UI UPDATES
    // ================================================================

    updateUI() {
        if (!this.gameState) return;

        // Move counter
        if (this.gameState.infiniteMoves) {
            this.elements.moveCounter.textContent = `Moves: ${this.gameState.movesUsed} / ∞`;
            this.elements.moveCounter.classList.remove('warning');
        } else {
            const remaining = this.gameState.maxMoves - this.gameState.movesUsed;
            this.elements.moveCounter.textContent = `Moves: ${this.gameState.movesUsed} / ${this.gameState.maxMoves}`;
            this.elements.moveCounter.classList.toggle('warning', remaining <= 3 && remaining > 0);
        }

        // Buttons
        this.elements.undoBtn.disabled = this.gameState.history.length <= 1;
        this.elements.waitBtn.disabled = !this.gameState.canWait;

        // Dev button state
        this.elements.devInfiniteMovesBtn.classList.toggle('selected', this.gameState.infiniteMoves);
        this.elements.devInfiniteMovesBtn.textContent = this.gameState.infiniteMoves ? '∞✓' : '∞';

        // Status
        this.elements.statusMessage.textContent = this.gameState.message || (this.selectedKnight ? 'Click destination to move' : 'Click a knight to select');

        // Chapter
        const chapterInfo = getChapterInfo(this.gameState.chapter);
        this.elements.chapterIndicator.textContent = chapterInfo.name;

        // Inventory Bar (only tools with count > 0)
        this.renderInventoryBar();

        // Progress stats
        this.renderProgressStats();
    }

    renderInventoryBar() {
        const container = this.elements.inventoryTools;
        const tools = this.gameState.tools;
        container.innerHTML = '';

        // Define all possible tools with their display info
        const toolDefs = [
            { id: 'hammer', icon: '⚒', count: tools.hammer, label: 'Hammer', shortcut: '1' },
            { id: 'arrow_up', icon: '↑', count: tools.arrows.up || 0, label: 'Arrow ↑', shortcut: '2' },
            { id: 'arrow_right', icon: '→', count: tools.arrows.right || 0, label: 'Arrow →', shortcut: '3' },
            { id: 'arrow_down', icon: '↓', count: tools.arrows.down || 0, label: 'Arrow ↓', shortcut: '4' },
            { id: 'arrow_left', icon: '←', count: tools.arrows.left || 0, label: 'Arrow ←', shortcut: '5' },
            { id: 'boot', icon: '👢', count: tools.boot, label: 'Boot', shortcut: '6' }
        ];

        // Add portal gun if available
        if (tools.portalGun > 0) {
            toolDefs.push({ id: 'portalGun', icon: '🔫', count: tools.portalGun, label: 'Portal Gun', shortcut: '' });
        }

        // Only render tools with count > 0
        for (const tool of toolDefs) {
            if (tool.count > 0) {
                const slot = document.createElement('div');
                slot.className = 'tool-slot';
                slot.dataset.tool = tool.id.replace('arrow_', 'arrow'); // Group arrows
                if (tool.id.startsWith('arrow_')) {
                    slot.dataset.dir = tool.id.replace('arrow_', '');
                    slot.dataset.tool = 'arrow';
                }
                slot.innerHTML = `
                    <span class="tool-icon">${tool.icon}</span>
                    <span class="tool-count">${tool.count}</span>
                    <span class="tool-label">${tool.label}${tool.shortcut ? ` [${tool.shortcut}]` : ''}</span>
                `;
                slot.addEventListener('click', () => this.selectToolForPlacement(tool.id));
                container.appendChild(slot);
            }
        }

        this.updateInventorySelection();
    }

    renderProgressStats() {
        const total = Levels.length;
        const completed = this.completedLevels.size;
        this.elements.progressStats.textContent = `${completed}/${total}`;
    }

    updateLevelSelect() {
        const select = this.elements.levelSelect;
        for (const option of select.options) {
            const levelId = parseInt(option.value);
            const completed = this.completedLevels.has(levelId);
            option.textContent = option.textContent.replace(/ ✓$/, '') + (completed ? ' ✓' : '');
            if (levelId === this.currentLevel) option.selected = true;
        }
    }

    showMessage(msg) {
        this.elements.statusMessage.textContent = msg;
        if (this.gameState) this.gameState.message = msg;
    }

    // ================================================================
    // RENDER LOOP
    // ================================================================

    startRenderLoop() {
        const loop = () => {
            this.render();
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }

    render() {
        if (!this.gameState) return;

        // Handle screen shake
        let shakeX = 0, shakeY = 0;
        for (const anim of this.renderer.animations) {
            if (anim instanceof ScreenShakeAnimation) {
                const offset = anim.getOffset();
                shakeX += offset.x;
                shakeY += offset.y;
            }
        }

        this.renderer.render(this.gameState, this.placingTool, this.hoverTile, null);

        // Apply screen shake
        if (shakeX !== 0 || shakeY !== 0) {
            this.canvas.style.transform = `translate(${shakeX}px, ${shakeY}px)`;
        } else {
            this.canvas.style.transform = 'none';
        }
    }
}

// ============================================================================
// INITIALIZE
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    window.game = new ICKPGame();
});

export { ICKPGame };