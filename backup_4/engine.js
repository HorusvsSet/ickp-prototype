/**
 * ICKP Game Engine
 * Core mechanics implementation for 120 Increasingly Cursed Knight Puzzles
 */

import { TileType, Dir, KnightColor, ToolType, Chapters } from './levels.js';

// Simple particle animation for effects
class ParticleAnimation {
    constructor(x, y, color, count = 8) {
        this.particles = [];
        this.done = false;
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const speed = 2 + Math.random() * 3;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                decay: 0.02 + Math.random() * 0.02,
                size: 2 + Math.random() * 3,
                color
            });
        }
    }

    update() {
        let alive = 0;
        for (const p of this.particles) {
            if (p.life > 0) {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.1; // gravity
                p.life -= p.decay;
                alive++;
            }
        }
        this.done = alive === 0;
    }

    draw(ctx) {
        for (const p of this.particles) {
            if (p.life > 0) {
                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            }
        }
    }
}

// ============================================================================
// KNIGHT MOVEMENT - L-SHAPE WITH DRAG TRAJECTORY
// ============================================================================

// All 8 knight moves: (dx, dy) - 2 in one direction, 1 in perpendicular
export const KNIGHT_MOVES = [
    { dx: -2, dy: -1 }, { dx: -1, dy: -2 }, { dx: 1, dy: -2 }, { dx: 2, dy: -1 },
    { dx: 2, dy: 1 },   { dx: 1, dy: 2 },   { dx: -1, dy: 2 }, { dx: -2, dy: 1 }
];

// For each knight move, the two possible L-shaped paths (ALL intermediate tiles)
// Path 0: First move 2 in major direction, then 1 in minor
// Path 1: First move 1 in minor direction, then 2 in major
// If ANY tile in a path is BRICK/METAL/BOMB, that path is blocked
// BOTH paths must be blocked to prevent the move
export const KNIGHT_PATHS = KNIGHT_MOVES.map(move => {
    const { dx, dy } = move;
    const orthoFirst = Math.abs(dx) === 2; // True if 2 horizontal, 1 vertical
    const sx = dx > 0 ? 1 : -1;
    const sy = dy > 0 ? 1 : -1;
    const ax = Math.abs(dx);
    const ay = Math.abs(dy);
    if (orthoFirst) {
        // Move is 2 horizontal, 1 vertical (e.g., 2 right, 1 up)
        // Path 0 (horizontal first): (sx,0), (2*sx,0), then (2*sx, sy) -> target
        // Path 1 (vertical first): (0,sy), then (sx,sy), (2*sx,sy) -> target
        return [
            [{ x: sx, y: 0 }, { x: 2*sx, y: 0 }],           // Path 0: all horizontal intermediates
            [{ x: 0, y: sy }, { x: sx, y: sy }]             // Path 1: vertical then horizontal intermediates
        ];
    } else {
        // Move is 1 horizontal, 2 vertical (e.g., 1 right, 2 up)
        // Path 0 (vertical first): (0,sy), (0,2*sy), then (sx,2*sy) -> target
        // Path 1 (horizontal first): (sx,0), then (sx,sy), (sx,2*sy) -> target
        return [
            [{ x: 0, y: sy }, { x: 0, y: 2*sy }],           // Path 0: all vertical intermediates
            [{ x: sx, y: 0 }, { x: sx, y: sy }]             // Path 1: horizontal then vertical intermediates
        ];
    }
});

/**
 * Check if a knight move from (x,y) to (x+dx, y+dy) is valid on the board
 * Considers brick/metal blocking on BOTH possible L-paths
 * @param {boolean} canCarry - whether this knight can carry another knight (chapter 2+)
 * @param {Map} offBoardTiles - optional map of off-board tiles (key: "x,y", value: tileType)
 */
export function canKnightMove(board, x, y, dx, dy, knights = [], carryingKnight = null, canCarry = false, voidArrows = [], offBoardTiles = null) {
    const width = board[0].length;
    const height = board.length;
    const targetX = x + dx;
    const targetY = y + dy;

    // Check if target is within bounds
    const inBounds = targetX >= 0 && targetX < width && targetY >= 0 && targetY < height;

    // Get current tile (works for both on-board and off-board built tiles)
    const isOffBoard = x < 0 || x >= width || y < 0 || y >= height;
    let currentTile;
    if (!isOffBoard) {
        currentTile = board[y][x];
    } else if (offBoardTiles && offBoardTiles.has(`${x},${y}`)) {
        currentTile = offBoardTiles.get(`${x},${y}`);
    } else {
        currentTile = TileType.EMPTY;
    }
    const onVoid = currentTile === TileType.EMPTY;
    // Check for arrow on current tile: void arrows (off-board) OR board arrows (green/blue) OR void arrows on EMPTY tiles OR off-board arrows
    const hasVoidArrowOnCurrent = onVoid && voidArrows.some(va => va.x === x && va.y === y);
    // Regular arrows (7-14) OR void arrows (15-22)
    const isArrowTile = (tile) => (tile >= TileType.ARROW_GREEN_UP && tile <= TileType.ARROW_BLUE_LEFT) ||
                                   (tile >= TileType.ARROW_GREEN_VOID_UP && tile <= TileType.ARROW_BLUE_VOID_LEFT);
    const hasBoardArrowOnCurrent = onVoid && !isOffBoard && isArrowTile(currentTile);
    const hasOffBoardArrowOnCurrent = onVoid && isOffBoard && offBoardTiles && isArrowTile(offBoardTiles.get(`${x},${y}`));
    const hasArrowOnCurrent = hasVoidArrowOnCurrent || hasBoardArrowOnCurrent || hasOffBoardArrowOnCurrent;

    if (onVoid && !hasArrowOnCurrent) {
        // Knight is stuck on void (on-board EMPTY or off-board) - can only move if there's an arrow on current tile
        return { valid: false, reason: 'Knight stuck in void' };
    }

    // Get the two possible paths (all intermediate tiles)
    const moveIndex = KNIGHT_MOVES.findIndex(m => m.dx === dx && m.dy === dy);
    if (moveIndex === -1) return { valid: false, reason: 'Invalid knight move' };

    const paths = KNIGHT_PATHS[moveIndex];

    // Check each path - if ANY tile in path is BRICK/METAL/BOMB, path is blocked
    // At least one path must be completely clear
    let path0Blocked = false, path1Blocked = false;

    // Path 0 - check all intermediate tiles
    for (const step of paths[0]) {
        const px = x + step.x;
        const py = y + step.y;
        let tile;
        if (px >= 0 && px < width && py >= 0 && py < height) {
            tile = board[py][px];
        } else if (offBoardTiles && offBoardTiles.has(`${px},${py}`)) {
            tile = offBoardTiles.get(`${px},${py}`);
        } else {
            tile = TileType.EMPTY; // Off-board is void
        }
        if (tile === TileType.BRICK || tile === TileType.METAL || tile === TileType.BOMB) {
            path0Blocked = true;
            break;
        }
    }

    // Path 1 - check all intermediate tiles
    for (const step of paths[1]) {
        const px = x + step.x;
        const py = y + step.y;
        let tile;
        if (px >= 0 && px < width && py >= 0 && py < height) {
            tile = board[py][px];
        } else if (offBoardTiles && offBoardTiles.has(`${px},${py}`)) {
            tile = offBoardTiles.get(`${px},${py}`);
        } else {
            tile = TileType.EMPTY; // Off-board is void
        }
        if (tile === TileType.BRICK || tile === TileType.METAL || tile === TileType.BOMB) {
            path1Blocked = true;
            break;
        }
    }

    // If both paths blocked, move is illegal
    if (path0Blocked && path1Blocked) {
        return { valid: false, reason: 'Both paths blocked by bricks/metal' };
    }

    // Check target tile
    if (inBounds) {
        const targetTile = board[targetY][targetX];

        // EMPTY tiles are void - allow landing but knight will be stuck
        if (targetTile === TileType.EMPTY) {
            const voidArrow = voidArrows.find(va => va.x === targetX && va.y === targetY);
            if (voidArrow) {
                return { valid: true, voidArrow: true, targetX, targetY };
            }
            // Allow landing on void, but knight will be stuck
            return { valid: true, stuckInVoid: true, targetX, targetY };
        }

        // Can't land on brick, metal, or bomb
        if (targetTile === TileType.BRICK || targetTile === TileType.METAL || targetTile === TileType.BOMB) {
            return { valid: false, reason: 'Target blocked by wall/bomb' };
        }

        // Check for knight at target
        const knightAtTarget = knights.find(k => k.x === targetX && k.y === targetY);
        if (knightAtTarget && knightAtTarget !== carryingKnight) {
            if (canCarry) {
                // Can land on knight - will carry it
                return { valid: true, carryKnight: knightAtTarget, path: path0Blocked ? 1 : 0 };
            }
            return { valid: false, reason: 'Knight occupies target' };
        }
    } else {
        // Moving off-board - check for built tiles in offBoardTiles
        let targetTile = TileType.EMPTY;
        if (offBoardTiles && offBoardTiles.has(`${targetX},${targetY}`)) {
            targetTile = offBoardTiles.get(`${targetX},${targetY}`);
        }
        // Check for void arrow at target
        const voidArrow = voidArrows.find(va => va.x === targetX && va.y === targetY);
        if (voidArrow) {
            return { valid: true, offBoard: true, voidArrow: true, targetX, targetY };
        }
        // Can't land on wall/bomb even off-board
        if (targetTile === TileType.BRICK || targetTile === TileType.METAL || targetTile === TileType.BOMB) {
            return { valid: false, reason: 'Target blocked by wall/bomb' };
        }
        // If target is built tile (not EMPTY), knight can stand and move from there
        if (targetTile !== TileType.EMPTY) {
            return { valid: true, offBoard: true, targetX, targetY };
        }
        // Allow landing in off-board void, knight gets stuck
        return { valid: true, offBoard: true, stuckInVoid: true, targetX, targetY };
    }

    return { valid: true, path: path0Blocked ? 1 : 0 };
}

/**
 * Get the intermediate tiles for a knight move (for visual trajectory)
 */
export function getKnightPath(x, y, dx, dy) {
    const moveIndex = KNIGHT_MOVES.findIndex(m => m.dx === dx && m.dy === dy);
    if (moveIndex === -1) return [];
    const paths = KNIGHT_PATHS[moveIndex];
    // Return the first valid path (prefer path 0)
    return paths[0].map(step => ({ x: x + step.x, y: y + step.y }));
}

// ============================================================================
// GAME STATE CLASS
// ============================================================================

export class GameState {
    constructor(levelData) {
        this.levelId = levelData.id;
        this.levelName = levelData.name;
        this.maxMoves = levelData.moves;
        this.chapter = levelData.chapter;

        // Board state
        this.board = levelData.board.map(row => [...row]);
        this.width = this.board[0].length;
        this.height = this.board.length;

        // Entities
        this.knights = levelData.knights.map(k => ({
            ...k,
            hasCoin: false,
            carriedCoin: null,
            carriedKnight: null,
            onPortal: false,
            elevation: 0 // For knight-on-knight
        }));

        this.flags = [...(levelData.flags || [])];
        this.coins = [...(levelData.coins || [])].map(c => ({ ...c, collected: false }));
        this.chessPieces = [...(levelData.chessPieces || [])].map(p => ({ ...p, captured: false }));

        // Place coins on board
        for (const coin of this.coins) {
            if (coin.x >= 0 && coin.x < this.width && coin.y >= 0 && coin.y < this.height) {
                this.board[coin.y][coin.x] = TileType.COIN;
            }
        }

        // Place chess pieces on board
        for (const piece of this.chessPieces) {
            if (piece.x >= 0 && piece.x < this.width && piece.y >= 0 && piece.y < this.height) {
                this.board[piece.y][piece.x] = piece.type;
            }
        }

        // Tools
        this.tools = {
            hammer: levelData.tools?.hammer || 0,
            arrows: { ...(levelData.tools?.arrows || {}) },
            boot: levelData.tools?.boot || 0,
            portalGun: levelData.tools?.portalGun || 0
        };

        // Special mechanics
        this.sharedMoves = levelData.sharedMoves || false;
        this.canCarryKnights = levelData.canCarryKnights || false;
        this.maxCoinsPerKnight = levelData.maxCoinsPerKnight || 1;
        this.canWait = levelData.canWait || false;
        this.controlFlag = levelData.controlFlag || false;
        this.starJump = levelData.starJump || false;
        this.designMode = levelData.designMode || false;
        this.recursive = levelData.recursive || false;
        this.undefinedBehavior = levelData.undefinedBehavior || false;
        this.mustDestroyEnemy = levelData.mustDestroyEnemy || false;
        this.enemyKnights = [...(levelData.enemyKnights || [])];
        this.globalTools = levelData.globalTools || false;

        // Portals
        this.portals = [...(levelData.portals || [])];

        // Traffic lights
        this.trafficLights = [...(levelData.trafficLights || [])].map(tl => ({
            ...tl,
            state: tl.initialState || 'green', // 'green' or 'red'
            timer: 0
        }));

        // Buttons and bombs
        this.buttons = [...(levelData.buttons || [])];
        this.bombs = [...(levelData.bombs || [])];

        // Tethers
        this.tethers = [...(levelData.tethers || [])].map(t => {
            const knightA = this.knights.find(k => k.id === t.knightA);
            const knightB = this.knights.find(k => k.id === t.knightB);
            // If no length specified, calculate from initial knight positions
            let length = t.length;
            if (length === undefined && knightA && knightB) {
                const dx = Math.abs(knightA.x - knightB.x);
                const dy = Math.abs(knightA.y - knightB.y);
                length = Math.max(dx, dy); // Chebyshev distance
            }
            return {
                ...t,
                knightAId: t.knightA,
                knightBId: t.knightB,
                length: length || 1,
                broken: false
            };
        });

        // Void arrows (off-board)
        this.voidArrows = [...(levelData.voidArrows || [])];

        // Off-board tiles (built by hammer)
        this.offBoardTiles = new Map();

        // Move counter
        this.movesUsed = 0;

        // History for undo
        this.history = [];
        this.maxHistory = 100;

        // Animations
        this.animations = [];

        // Game status
        this.status = 'playing'; // 'playing', 'won', 'lost', 'completed'
        this.message = '';

        // Dev mode
        this.infiniteMoves = false;

        // Selected tool for placement
        this.selectedTool = null;
        this.placingTool = false;

        // Save initial state
        this.saveState();
    }

    addAnimation(animation) {
        this.animations.push(animation);
    }

    // ================================================================
    // STATE MANAGEMENT
    // ================================================================

    saveState() {
        const state = {
            board: this.board.map(row => [...row]),
            knights: this.knights.map(k => ({ ...k })),
            flags: this.flags.map(f => ({ ...f })),
            coins: this.coins.map(c => ({ ...c })),
            chessPieces: this.chessPieces.map(p => ({ ...p })),
            tools: { ...this.tools, arrows: { ...this.tools.arrows } },
            movesUsed: this.movesUsed,
            trafficLights: this.trafficLights.map(tl => ({ ...tl })),
            bombs: this.bombs.map(b => ({ ...b })),
            tethers: this.tethers.map(t => ({ ...t })),
            portals: this.portals.map(p => ({ ...p })),
            offBoardTiles: this.offBoardTiles ? new Map(this.offBoardTiles) : new Map(),
            selectedTool: this.selectedTool,
            message: this.message,
            status: this.status,
            infiniteMoves: this.infiniteMoves
        };
        this.history.push(state);
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
    }

    undo() {
        if (this.history.length <= 1) return false;
        this.history.pop(); // Remove current state
        const prev = this.history[this.history.length - 1];
        this.restoreState(prev);
        return true;
    }

    restoreState(state) {
        this.board = state.board.map(row => [...row]);
        this.knights = state.knights.map(k => ({ ...k }));
        this.flags = state.flags.map(f => ({ ...f }));
        this.coins = state.coins.map(c => ({ ...c }));
        this.chessPieces = state.chessPieces.map(p => ({ ...p }));
        this.tools = { ...state.tools, arrows: { ...state.tools.arrows } };
        this.movesUsed = state.movesUsed;
        this.trafficLights = state.trafficLights.map(tl => ({ ...tl }));
        this.bombs = state.bombs.map(b => ({ ...b }));
        this.tethers = state.tethers.map(t => ({ ...t }));
        this.portals = state.portals.map(p => ({ ...p }));
        this.offBoardTiles = state.offBoardTiles ? new Map(state.offBoardTiles) : new Map();
        this.selectedTool = state.selectedTool;
        this.message = state.message;
        this.status = state.status;
        this.infiniteMoves = state.infiniteMoves || false;
        this.animations = []; // Clear animations on restore
    }

    reset() {
        if (this.history.length > 0) {
            this.restoreState(this.history[0]);
        }
    }

    // ================================================================
    // MOVE VALIDATION & EXECUTION
    // ================================================================

    getActiveKnight() {
        if (this.controlFlag) {
            // Find the flag (controlled entity)
            return this.flags[0]; // Simplified - flag acts as knight
        }
        // Return first knight that can move (or selected)
        return this.knights.find(k => !k.atFlag) || this.knights[0];
    }

    getValidMoves(knight) {
        const moves = [];
        const moveSet = this.starJump ? this.getStarMoves() : KNIGHT_MOVES;

        for (const move of moveSet) {
            const result = canKnightMove(
                this.board,
                knight.x,
                knight.y,
                move.dx,
                move.dy,
                this.knights,
                knight.carriedKnight,
                this.canCarryKnights,
                this.voidArrows,
                this.offBoardTiles
            );
            if (result.valid) {
                moves.push({ ...move, ...result });
            }
        }
        return moves;
    }

    getStarMoves() {
        // Star pattern: all 8 directions, 2 spaces each (like queen but knight-distance)
        const moves = [];
        for (let dir = 0; dir < 8; dir++) {
            const angle = (dir * Math.PI) / 4;
            const dx = Math.round(2 * Math.cos(angle));
            const dy = Math.round(2 * Math.sin(angle));
            if (dx !== 0 || dy !== 0) {
                moves.push({ dx, dy });
            }
        }
        return moves;
    }

    canMoveKnight(knight, dx, dy) {
        // Dev mode: infinite moves
        if (this.infiniteMoves && this.movesUsed >= this.maxMoves) {
            // Allow move but don't increment counter
        } else if (this.movesUsed >= this.maxMoves) {
            return { valid: false, reason: 'No moves left' };
        }
        if (knight.atFlag) return { valid: false, reason: 'Knight at flag' };

        const result = canKnightMove(
            this.board,
            knight.x,
            knight.y,
            dx,
            dy,
            this.knights,
            knight.carriedKnight,
            this.canCarryKnights,
            this.voidArrows,
            this.offBoardTiles
        );
        return result;
    }

    moveKnight(knight, dx, dy) {
        const validation = this.canMoveKnight(knight, dx, dy);
        if (!validation.valid) return validation;

        const oldX = knight.x;
        const oldY = knight.y;
        const newX = knight.x + dx;
        const newY = knight.y + dy;

        // Check for void arrow landing (on EMPTY tile or off-board) BEFORE moving
        if (validation.voidArrow) {
            const voidArrow = this.voidArrows.find(va => va.x === newX && va.y === newY);
            if (voidArrow) {
                // Handle cracked tile departure before void arrow
                if (this.board[oldY] && this.board[oldY][oldX] === TileType.CRACKED) {
                    this.board[oldY][oldX] = TileType.EMPTY;
                }
                // Move knight to void arrow position first, then handle void arrow
                knight.x = newX;
                knight.y = newY;
                return this.handleVoidArrow(knight, voidArrow);
            }
        }

        // Handle off-board void landing (knight moves into off-board void)
        if (validation.offBoard && validation.stuckInVoid) {
            // Handle cracked tile departure
            if (this.board[oldY] && this.board[oldY][oldX] === TileType.CRACKED) {
                this.board[oldY][oldX] = TileType.EMPTY;
            }

            // Update knight position to off-board void
            knight.x = newX;
            knight.y = newY;
            this.message = 'Knight stuck in void! Use hammer to build or arrow to escape.';

            // Increment move counter (unless infinite moves mode)
            if (!this.infiniteMoves) {
                this.movesUsed++;
            }
            this.saveState();
            this.checkWinCondition();
            return { valid: true, stuckInVoid: true, offBoard: true };
        }

        // Handle stuckInVoid - knight lands on on-board void tile and gets stuck
        if (validation.stuckInVoid) {
            // Handle cracked tile departure
            if (this.board[oldY] && this.board[oldY][oldX] === TileType.CRACKED) {
                this.board[oldY][oldX] = TileType.EMPTY;
            }

            // Update knight position to void tile
            knight.x = newX;
            knight.y = newY;
            this.message = 'Knight stuck in void! Use hammer to build or arrow to escape.';

            // Increment move counter (unless infinite moves mode)
            if (!this.infiniteMoves) {
                this.movesUsed++;
            }
            this.saveState();
            this.checkWinCondition();
            return { valid: true, stuckInVoid: true };
        }

        // Handle cracked tile departure - becomes void (EMPTY)
        if (this.board[oldY] && this.board[oldY][oldX] === TileType.CRACKED) {
            this.board[oldY][oldX] = TileType.EMPTY;
        }

        // Handle carrying another knight (landing on knight)
        if (validation.carryKnight) {
            const carried = validation.carryKnight;
            knight.carriedKnight = carried;
            carried.elevation = 1;
            carried.carriedBy = knight.id;
            // The carried knight moves with the carrier
            carried.x = newX;
            carried.y = newY;
        } else if (knight.carriedKnight) {
            // Already carrying - move the carried knight too
            knight.carriedKnight.x = newX;
            knight.carriedKnight.y = newY;
            knight.carriedKnight.elevation = 1;
        }

        // Calculate move delta for tether
        const moveDx = newX - knight.x;
        const moveDy = newY - knight.y;

        // Update knight position
        knight.x = newX;
        knight.y = newY;

        // Check tile interactions
        this.handleTileInteraction(knight, newX, newY);

        // Check tether - move tethered knight in same direction
        this.checkTethers(knight, moveDx, moveDy);

        // Increment move counter (unless infinite moves mode)
        if (!this.infiniteMoves) {
            this.movesUsed++;
        }
        this.saveState();
        this.checkWinCondition();

        return { valid: true };
    }

    handleTileInteraction(knight, x, y) {
        const tile = this.board[y][x];

        // Coin collection - check both board tile and coins array
        if (tile === TileType.COIN) {
            const coin = this.coins.find(c => c.x === x && c.y === y && !c.collected);
            if (coin) {
                if (!knight.hasCoin && (this.maxCoinsPerKnight === 0 || (knight.coinsCollected || 0) < this.maxCoinsPerKnight)) {
                    coin.collected = true;
                    knight.hasCoin = true;
                    knight.carriedCoin = coin;
                    knight.coinsCollected = (knight.coinsCollected || 0) + 1;
                    this.board[y][x] = TileType.NORMAL;
                    this.message = 'Coin collected!';
                    // Particle effect
                    this.addAnimation(new ParticleAnimation(x, y, '#ffd700', 8));
                }
            }
        }

        // Green arrow (1-space push) - use direction from tile
        else if (this.isGreenArrow(tile)) {
            const dir = this.getArrowDirection(tile);
            const isVoid = tile >= TileType.ARROW_GREEN_VOID_UP && tile <= TileType.ARROW_GREEN_VOID_LEFT;
            this.pushKnight(knight, x, y, 1, dir, isVoid);
        }

        // Blue arrow (2-space push) - use direction from tile
        else if (this.isBlueArrow(tile)) {
            const dir = this.getArrowDirection(tile);
            const isVoid = tile >= TileType.ARROW_BLUE_VOID_UP && tile <= TileType.ARROW_BLUE_VOID_LEFT;
            this.pushKnight(knight, x, y, 2, dir, isVoid);
        }

        // 4-way arrow (player chooses direction)
        else if (tile === TileType.ARROW_4WAY) {
            // This will be handled by UI - knight waits for input
            knight.atFourWayArrow = true;
            knight.fourWayPos = { x, y };
        }

        // Flag - general flag (no color) or color-specific flag
        else if (tile === TileType.FLAG) {
            const flag = this.flags.find(f => f.x === x && f.y === y);
            if (flag) {
                // General flag (no color) or matching color flag
                if (!flag.color || flag.color === knight.color) {
                    knight.atFlag = true;
                    this.message = `${knight.color} knight reached the ${flag.color ? flag.color + ' ' : ''}flag!`;
                    this.checkWinCondition();
                } else {
                    this.message = `Wrong color flag! Need ${flag.color} knight.`;
                }
            }
        }

        // Portal
        else if (this.isPortal(tile)) {
            this.handlePortal(knight, x, y, tile);
        }

        // Traffic light
        else if (tile === TileType.TRAFFIC_LIGHT_GREEN || tile === TileType.TRAFFIC_LIGHT_RED) {
            const tl = this.trafficLights.find(t => t.x === x && t.y === y);
            if (tl && tl.state === 'red') {
                // Bounce back to previous position
                const prevX = knight.x - (x - knight.x);
                const prevY = knight.y - (y - knight.y);
                if (prevX >= 0 && prevX < this.width && prevY >= 0 && prevY < this.height) {
                    const prevTile = this.board[prevY][prevX];
                    if (prevTile !== TileType.BRICK && prevTile !== TileType.METAL && prevTile !== TileType.BOMB && prevTile !== TileType.EMPTY) {
                        knight.x = prevX;
                        knight.y = prevY;
                        this.message = 'Red light! Stop!';
                    }
                }
            }
        }

        // Button
        else if (tile === TileType.BUTTON) {
            this.pressButton(x, y);
        }

        // Chess piece (capture)
        else if (this.isChessPiece(tile)) {
            this.captureChessPiece(knight, x, y);
        }

        // Cracked tile - handled on departure (becomes EMPTY/void)
    }

    pushKnight(knight, startX, startY, distance, dir, isVoid) {
        // Convert Dir enum to vector
        const dirVec = this.dirToVec(dir);

        // For void arrows, keep pushing until hitting solid ground
        if (isVoid) {
            this.pushKnightVoidLoop(knight, startX, startY, distance, dir, dirVec);
            return;
        }

        // Normal arrow logic (single push)
        let targetX = startX + dirVec.x * distance;
        let targetY = startY + dirVec.y * distance;

        // Check intermediate tiles for blue arrow (2-space)
        if (distance === 2) {
            const midX = startX + dirVec.x;
            const midY = startY + dirVec.y;
            if (midX >= 0 && midX < this.width && midY >= 0 && midY < this.height) {
                const midTile = this.board[midY][midX];
                if (midTile === TileType.CRACKED) {
                    // Blue arrow destroys cracked tiles
                    this.board[midY][midX] = TileType.EMPTY;
                    this.message = 'Blue arrow shattered cracked tile!';
                    this.addAnimation(new ParticleAnimation(midX, midY, '#8b4513', 6));
                } else if (midTile === TileType.BRICK || midTile === TileType.METAL || midTile === TileType.BOMB) {
                    // Blue arrow bounces off walls (1 space back from start)
                    targetX = startX - dirVec.x;
                    targetY = startY - dirVec.y;
                    this.message = 'Blue arrow bounced off wall!';
                }
            }
        }

        // Check target
        if (targetX < 0 || targetX >= this.width || targetY < 0 || targetY >= this.height) {
            // Arrow into off-board - check for built tiles
            let targetTile = TileType.EMPTY;
            if (this.offBoardTiles && this.offBoardTiles.has(`${targetX},${targetY}`)) {
                targetTile = this.offBoardTiles.get(`${targetX},${targetY}`);
            }
            // Can't push into wall/bomb even off-board
            if (targetTile === TileType.BRICK || targetTile === TileType.METAL || targetTile === TileType.BOMB) {
                if (distance === 2) {
                    // Blue arrow bounces 1 back from start
                    targetX = startX - dirVec.x;
                    targetY = startY - dirVec.y;
                    // Check if bounce position is valid
                    if (targetX < 0 || targetX >= this.width || targetY < 0 || targetY >= this.height) {
                        this.message = 'Blue arrow blocked!';
                        return;
                    }
                    const bounceTile = this.board[targetY][targetX];
                    if (blockedTiles.includes(bounceTile)) {
                        this.message = 'Blue arrow blocked!';
                        return;
                    }
                } else {
                    // Green arrow cancels
                    this.message = 'Arrow blocked by wall/bomb!';
                    return;
                }
            } else if (targetTile !== TileType.EMPTY) {
                // Land on built off-board tile (solid ground)
                knight.x = targetX;
                knight.y = targetY;
                this.handleTileInteraction(knight, targetX, targetY);
                return;
            } else {
                // Arrow into off-board void - knight gets stuck
                knight.x = targetX;
                knight.y = targetY;
                this.message = 'Knight pushed into void!';
                this.saveState();
                this.checkWinCondition();
                return;
            }
        }

        const targetTile = this.board[targetY][targetX];
        // For ALL arrows, allow landing on EMPTY (void) - knight will get stuck there
        // Only BRICK, METAL, BOMB block arrows
        const blockedTiles = [TileType.BRICK, TileType.METAL, TileType.BOMB];

        if (blockedTiles.includes(targetTile)) {
            if (distance === 2) {
                // Blue arrow bounces 1 back from start
                targetX = startX - dirVec.x;
                targetY = startY - dirVec.y;

                // Check if bounce position is valid
                if (targetX < 0 || targetX >= this.width || targetY < 0 || targetY >= this.height) {
                    this.message = 'Blue arrow blocked!';
                    return;
                }
                const bounceTile = this.board[targetY][targetX];
                if (blockedTiles.includes(bounceTile)) {
                    this.message = 'Blue arrow blocked!';
                    return;
                }
            } else {
                // Green arrow cancels
                this.message = 'Arrow blocked by wall/bomb!';
                return;
            }
        }

        // Move knight to target
        knight.x = targetX;
        knight.y = targetY;

        // Recursive arrow handling
        this.handleTileInteraction(knight, targetX, targetY);
    }

    // Void arrows push continuously until hitting solid ground (non-void tile)
    pushKnightVoidLoop(knight, startX, startY, distance, dir, dirVec) {
        let currentX = startX;
        let currentY = startY;
        // Track last solid (non-void) ground position for green arrow wall collisions
        let lastSolidX = startX;
        let lastSolidY = startY;
        // Track visited positions to prevent infinite loops
        const visited = new Set();
        visited.add(`${startX},${startY}`);

        this.message = distance === 2 ? 'Blue void arrow launching!' : 'Green void arrow launching!';

        while (true) {
            // Calculate next position
            let nextX = currentX + dirVec.x * distance;
            let nextY = currentY + dirVec.y * distance;

            // Check intermediate tiles for blue arrow (2-space)
            if (distance === 2) {
                const midX = currentX + dirVec.x;
                const midY = currentY + dirVec.y;
                if (midX >= 0 && midX < this.width && midY >= 0 && midY < this.height) {
                    const midTile = this.board[midY][midX];
                    if (midTile === TileType.CRACKED) {
                        // Blue arrow destroys cracked tiles
                        this.board[midY][midX] = TileType.EMPTY;
                        this.message = 'Blue arrow shattered cracked tile!';
                        this.addAnimation(new ParticleAnimation(midX, midY, '#8b4513', 6));
                    } else if (midTile === TileType.BRICK || midTile === TileType.METAL || midTile === TileType.BOMB) {
                        // Blue arrow bounces off walls - bounce back 1 from current position
                        const bounceX = currentX - dirVec.x;
                        const bounceY = currentY - dirVec.y;
                        if (bounceX < 0 || bounceX >= this.width || bounceY < 0 || bounceY >= this.height) {
                            this.message = 'Blue void arrow blocked!';
                            return;
                        }
                        const bounceTile = this.board[bounceY][bounceX];
                        if (bounceTile === TileType.BRICK || bounceTile === TileType.METAL || bounceTile === TileType.BOMB) {
                            this.message = 'Blue void arrow blocked!';
                            return;
                        }
                        // Move to bounce position and stop
                        knight.x = bounceX;
                        knight.y = bounceY;
                        this.message = 'Blue void arrow bounced off wall!';
                        this.handleTileInteraction(knight, bounceX, bounceY);
                        return;
                    }
                }
            }

            // Check target
            if (nextX < 0 || nextX >= this.width || nextY < 0 || nextY >= this.height) {
                // Pushed off-board - check for built tiles first
                let targetTile = TileType.EMPTY;
                if (this.offBoardTiles && this.offBoardTiles.has(`${nextX},${nextY}`)) {
                    targetTile = this.offBoardTiles.get(`${nextX},${nextY}`);
                }
                // Can't push into wall/bomb even off-board
                if (targetTile === TileType.BRICK || targetTile === TileType.METAL || targetTile === TileType.BOMB) {
                    if (distance === 2) {
                        // Blue arrow bounces 1 back from current position
                        const bounceX = currentX - dirVec.x;
                        const bounceY = currentY - dirVec.y;
                        if (bounceX < 0 || bounceX >= this.width || bounceY < 0 || bounceY >= this.height) {
                            this.message = 'Blue void arrow blocked!';
                            return;
                        }
                        const bounceTile = this.board[bounceY][bounceX];
                        if (blockedTiles.includes(bounceTile)) {
                            this.message = 'Blue void arrow blocked!';
                            return;
                        }
                        // Move to bounce position and stop
                        knight.x = bounceX;
                        knight.y = bounceY;
                        this.message = 'Blue void arrow bounced off wall!';
                        this.handleTileInteraction(knight, bounceX, bounceY);
                        return;
                    } else {
                        // Green void arrow hits a wall
                        const isFirstPush = currentX === startX && currentY === startY;
                        if (isFirstPush) {
                            this.message = 'Void arrow blocked by adjacent wall!';
                            return;
                        }
                        const hasOtherSolidGround = lastSolidX !== startX || lastSolidY !== startY;
                        const stopX = hasOtherSolidGround ? lastSolidX : startX;
                        const stopY = hasOtherSolidGround ? lastSolidY : startY;
                        knight.x = stopX;
                        knight.y = stopY;
                        this.message = 'Void arrow stopped by wall!';
                        if (!hasOtherSolidGround) {
                            return;
                        }
                        this.handleTileInteraction(knight, stopX, stopY);
                        return;
                    }
                } else if (targetTile !== TileType.EMPTY) {
                    // Land on built off-board tile (solid ground) - stop pushing
                    knight.x = nextX;
                    knight.y = nextY;
                    this.handleTileInteraction(knight, nextX, nextY);
                    return;
                }
                // Check for return void arrow (pushes back toward board)
                const voidArrow = this.voidArrows.find(va => va.x === nextX && va.y === nextY);
                if (voidArrow) {
                    // Move knight to off-board position first, then handle void arrow return
                    knight.x = nextX;
                    knight.y = nextY;
                    this.handleVoidArrow(knight, voidArrow);
                    return;
                }
                // No return arrow - knight lands in off-board void
                knight.x = nextX;
                knight.y = nextY;
                this.message = 'Knight pushed into void!';
                this.saveState();
                this.checkWinCondition();
                return;
            }

            const targetTile = this.board[nextY][nextX];
            // Only BRICK, METAL, BOMB block void arrows
            const blockedTiles = [TileType.BRICK, TileType.METAL, TileType.BOMB];

            // Track last solid ground (non-EMPTY, non-blocked)
            if (targetTile !== TileType.EMPTY && !blockedTiles.includes(targetTile)) {
                lastSolidX = nextX;
                lastSolidY = nextY;
            }

            if (blockedTiles.includes(targetTile)) {
                if (distance === 2) {
                    // Blue arrow bounces 1 back from current position
                    const bounceX = currentX - dirVec.x;
                    const bounceY = currentY - dirVec.y;
                    if (bounceX < 0 || bounceX >= this.width || bounceY < 0 || bounceY >= this.height) {
                        this.message = 'Blue void arrow blocked!';
                        return;
                    }
                    const bounceTile = this.board[bounceY][bounceX];
                    if (blockedTiles.includes(bounceTile)) {
                        this.message = 'Blue void arrow blocked!';
                        return;
                    }
                    // Move to bounce position and stop
                    knight.x = bounceX;
                    knight.y = bounceY;
                    this.handleTileInteraction(knight, bounceX, bounceY);
                    return;
                } else {
                    // Green void arrow hits a wall
                    const isFirstPush = currentX === startX && currentY === startY;
                    if (isFirstPush) {
                        // Wall is immediately adjacent - void arrow cannot push, knight stays on arrow
                        this.message = 'Void arrow blocked by adjacent wall!';
                        return;
                    }
                    // Determine stop position: last solid ground found, or if none (only start was solid), the start position
                    const hasOtherSolidGround = lastSolidX !== startX || lastSolidY !== startY;
                    const stopX = hasOtherSolidGround ? lastSolidX : startX;
                    const stopY = hasOtherSolidGround ? lastSolidY : startY;
                    knight.x = stopX;
                    knight.y = stopY;
                    this.message = 'Void arrow stopped by wall!';
                    // Only check for interactions if we stopped on a DIFFERENT tile than the starting arrow
                    // (calling handleTileInteraction on the starting arrow would re-trigger it → infinite loop)
                    if (!hasOtherSolidGround) {
                        // Stopped back on the starting arrow tile - don't re-trigger
                        return;
                    }
                    // Check for interactions on the tile where knight stops
                    this.handleTileInteraction(knight, stopX, stopY);
                    return;
                }
            }

            // Check if target is solid ground (non-void)
            const isVoidTile = targetTile === TileType.EMPTY;

            // Move knight to target
            knight.x = nextX;
            knight.y = nextY;

            // If landed on solid ground (not void), check for interactions and stop
            if (!isVoidTile) {
                this.handleTileInteraction(knight, nextX, nextY);
                return;
            }

            // Landed on void (EMPTY) - continue loop to push further
            currentX = nextX;
            currentY = nextY;
            // Infinite loop protection
            const posKey = `${currentX},${currentY}`;
            if (visited.has(posKey)) {
                this.message = 'Void arrow loop detected - stopping!';
                return;
            }
            visited.add(posKey);
            this.message = 'Void arrow pushing through void...';
        }
    }

    dirToVec(dir) {
        const vecs = {
            [Dir.UP]: { x: 0, y: -1 },
            [Dir.DOWN]: { x: 0, y: 1 },
            [Dir.LEFT]: { x: -1, y: 0 },
            [Dir.RIGHT]: { x: 1, y: 0 }
        };
        return vecs[dir] || { x: 1, y: 0 };
    }

    handleVoidArrow(knight, voidArrow) {
        // Void arrows push in their VISUAL direction (like normal arrows)
        // Continues pushing until hitting solid ground (non-void, non-wall)
        const dirVec = this.dirToVec(voidArrow.dir);
        let currentX = knight.x;
        let currentY = knight.y;
        const visited = new Set();
        visited.add(`${currentX},${currentY}`);

        this.message = 'Void arrow pushing!';

        while (true) {
            // Calculate next position (distance = 1, like green arrow)
            const nextX = currentX + dirVec.x;
            const nextY = currentY + dirVec.y;

            // Check if next position is off-board
            if (nextX < 0 || nextX >= this.width || nextY < 0 || nextY >= this.height) {
                // Check for built tiles off-board first
                let targetTile = TileType.EMPTY;
                if (this.offBoardTiles && this.offBoardTiles.has(`${nextX},${nextY}`)) {
                    targetTile = this.offBoardTiles.get(`${nextX},${nextY}`);
                }
                // Can't push into wall/bomb even off-board
                if (targetTile === TileType.BRICK || targetTile === TileType.METAL || targetTile === TileType.BOMB) {
                    // Hit a wall - stop at current position
                    if (currentX === knight.x && currentY === knight.y) {
                        this.message = 'Void arrow blocked by adjacent wall!';
                        return { valid: true, stuckInVoid: true };
                    }
                    knight.x = currentX;
                    knight.y = currentY;
                    this.message = 'Void arrow stopped by wall!';
                    this.handleTileInteraction(knight, currentX, currentY);
                    return { valid: true, stuckInVoid: true };
                } else if (targetTile !== TileType.EMPTY) {
                    // Land on built off-board tile (solid ground)
                    knight.x = nextX;
                    knight.y = nextY;
                    this.handleTileInteraction(knight, nextX, nextY);
                    return { valid: true };
                }
                // Check for return void arrow at off-board position
                const returnVoidArrow = this.voidArrows.find(va => va.x === nextX && va.y === nextY);
                if (returnVoidArrow) {
                    // Move to off-board position, then handle return arrow recursively
                    knight.x = nextX;
                    knight.y = nextY;
                    return this.handleVoidArrow(knight, returnVoidArrow);
                }
                // No return arrow - knight goes into off-board void
                knight.x = nextX;
                knight.y = nextY;
                this.message = 'Knight pushed into void!';
                this.saveState();
                this.checkWinCondition();
                return { valid: true, offBoard: true };
            }

            const targetTile = this.board[nextY][nextX];
            // BRICK, METAL, BOMB block void arrows
            const blockedTiles = [TileType.BRICK, TileType.METAL, TileType.BOMB];

            if (blockedTiles.includes(targetTile)) {
                // Hit a wall - stop at current position (last valid tile)
                if (currentX === knight.x && currentY === knight.y) {
                    // Wall is immediately adjacent - void arrow cannot push
                    this.message = 'Void arrow blocked by adjacent wall!';
                    return { valid: true, stuckInVoid: true };
                }
                // Stop at last valid position (which is void/EMPTY)
                knight.x = currentX;
                knight.y = currentY;
                this.message = 'Void arrow stopped by wall!';
                this.handleTileInteraction(knight, currentX, currentY);
                return { valid: true, stuckInVoid: true };
            }

            // Move knight to next position
            knight.x = nextX;
            knight.y = nextY;
            currentX = nextX;
            currentY = nextY;

            // If landed on solid ground (not EMPTY), stop and check interactions
            if (targetTile !== TileType.EMPTY) {
                this.handleTileInteraction(knight, currentX, currentY);
                return { valid: true };
            }

            // Landed on void (EMPTY) - continue loop to push further
            // Infinite loop protection
            const posKey = `${currentX},${currentY}`;
            if (visited.has(posKey)) {
                this.message = 'Void arrow loop detected!';
                return { valid: true, stuckInVoid: true };
            }
            visited.add(posKey);
        }
    }

    getDirFromVoidArrow(voidArrow) {
        // Return the direction the void arrow PUSHES (visual direction, like normal arrows)
        return this.dirToVec(voidArrow.dir);
    }

    handlePortal(knight, x, y, portalTile) {
        // Prevent infinite portal loops
        if (knight.justTeleported) return;

        const portalColor = this.getPortalColor(portalTile);
        const entryPortal = this.portals.find(p => p.x === x && p.y === y && p.color === portalColor);
        if (!entryPortal) return;

        // Use linkedPortal if defined, otherwise find any other portal of same color
        let exitPortal = null;
        if (entryPortal.linkedPortal) {
            // Linked portal can be {x, y} for same level or {x, y, level} for cross-level
            const linked = entryPortal.linkedPortal;
            if (linked.level !== undefined) {
                // Cross-level portal - would need level transition logic
                this.message = `Cross-level portal to level ${linked.level} (not yet implemented)`;
                return;
            } else {
                // Same-level linked portal
                exitPortal = this.portals.find(p => p.x === linked.x && p.y === linked.y && p.color === portalColor);
            }
        } else {
            // Fallback: find any other portal of same color
            exitPortal = this.portals.find(p => p.color === portalColor && (p.x !== x || p.y !== y));
        }

        if (exitPortal) {
            // Teleport
            knight.x = exitPortal.x;
            knight.y = exitPortal.y;
            knight.justTeleported = true; // Prevent re-triggering
            this.message = `Teleported via ${portalColor} portal!`;

            // Check exit tile (but skip portal re-trigger)
            const exitTile = this.board[exitPortal.y]?.[exitPortal.x];
            if (exitTile && !this.isPortal(exitTile)) {
                this.handleTileInteraction(knight, exitPortal.x, exitPortal.y);
            } else {
                // Exit is also a portal - just mark as on portal without re-triggering
                knight.onPortal = true;
            }

            // Reset teleport flag after a tick
            setTimeout(() => { knight.justTeleported = false; }, 0);
        }
    }

    getPortalColor(tile) {
        const portalMap = {
            [TileType.PORTAL_RED]: 'red',
            [TileType.PORTAL_BLUE]: 'blue',
            [TileType.PORTAL_GREEN]: 'green',
            [TileType.PORTAL_YELLOW]: 'yellow',
            [TileType.PORTAL_PURPLE]: 'purple',
            [TileType.PORTAL_ORANGE]: 'orange'
        };
        return portalMap[tile] || 'red';
    }

    isPortal(tile) {
        return tile >= TileType.PORTAL_RED && tile <= TileType.PORTAL_ORANGE;
    }

    isChessPiece(tile) {
        return tile >= TileType.CHESS_PAWN && tile <= TileType.CHESS_KING;
    }

    // Get arrow direction from tile type
    getArrowDirection(tile) {
        const dirMap = {
            // Green arrows
            [TileType.ARROW_GREEN]: Dir.RIGHT,
            [TileType.ARROW_GREEN_UP]: Dir.UP,
            [TileType.ARROW_GREEN_RIGHT]: Dir.RIGHT,
            [TileType.ARROW_GREEN_DOWN]: Dir.DOWN,
            [TileType.ARROW_GREEN_LEFT]: Dir.LEFT,
            // Blue arrows
            [TileType.ARROW_BLUE]: Dir.RIGHT,
            [TileType.ARROW_BLUE_UP]: Dir.UP,
            [TileType.ARROW_BLUE_RIGHT]: Dir.RIGHT,
            [TileType.ARROW_BLUE_DOWN]: Dir.DOWN,
            [TileType.ARROW_BLUE_LEFT]: Dir.LEFT,
            // Green void arrows
            [TileType.ARROW_GREEN_VOID]: Dir.RIGHT,
            [TileType.ARROW_GREEN_VOID_UP]: Dir.UP,
            [TileType.ARROW_GREEN_VOID_RIGHT]: Dir.RIGHT,
            [TileType.ARROW_GREEN_VOID_DOWN]: Dir.DOWN,
            [TileType.ARROW_GREEN_VOID_LEFT]: Dir.LEFT,
            // Blue void arrows
            [TileType.ARROW_BLUE_VOID]: Dir.RIGHT,
            [TileType.ARROW_BLUE_VOID_UP]: Dir.UP,
            [TileType.ARROW_BLUE_VOID_RIGHT]: Dir.RIGHT,
            [TileType.ARROW_BLUE_VOID_DOWN]: Dir.DOWN,
            [TileType.ARROW_BLUE_VOID_LEFT]: Dir.LEFT,
        };
        return dirMap[tile] || Dir.RIGHT;
    }

    isGreenArrow(tile) {
        return (tile >= TileType.ARROW_GREEN_UP && tile <= TileType.ARROW_GREEN_LEFT) ||
               (tile >= TileType.ARROW_GREEN_VOID_UP && tile <= TileType.ARROW_GREEN_VOID_LEFT);
    }

    isBlueArrow(tile) {
        return (tile >= TileType.ARROW_BLUE_UP && tile <= TileType.ARROW_BLUE_LEFT) ||
               (tile >= TileType.ARROW_BLUE_VOID_UP && tile <= TileType.ARROW_BLUE_VOID_LEFT);
    }

    pressButton(x, y) {
        // Detonate all bombs
        for (const bomb of this.bombs) {
            if (this.board[bomb.y][bomb.x] === TileType.BOMB) {
                this.board[bomb.y][bomb.x] = TileType.NORMAL;
                // Destroy brick/metal on bomb
                // (In original, bombs are placed ON walls)
            }
        }
        this.message = 'Button pressed! Bombs detonated!';
    }

    captureChessPiece(knight, x, y) {
        const piece = this.chessPieces.find(p => p.x === x && p.y === y && !p.captured);
        if (piece) {
            piece.captured = true;
            this.board[y][x] = TileType.NORMAL;
            this.message = `Captured ${this.getPieceName(piece.type)}!`;
        }
    }

    getPieceName(type) {
        const names = {
            [TileType.CHESS_PAWN]: 'Pawn',
            [TileType.CHESS_BISHOP]: 'Bishop',
            [TileType.CHESS_ROOK]: 'Rook',
            [TileType.CHESS_QUEEN]: 'Queen',
            [TileType.CHESS_KING]: 'King'
        };
        return names[type] || 'Piece';
    }

    checkTethers(knight, moveDx, moveDy) {
        // If no movement, nothing to tether
        if (moveDx === 0 && moveDy === 0) return;

        for (const tether of this.tethers) {
            if (tether.broken) continue;

            const knightA = this.knights.find(k => k.id === tether.knightAId);
            const knightB = this.knights.find(k => k.id === tether.knightBId);
            if (!knightA || !knightB) continue;

            // Determine which knight moved and which is tethered
            const movedKnight = (knight.id === knightA.id) ? knightA :
                               (knight.id === knightB.id) ? knightB : null;
            const tetheredKnight = (movedKnight === knightA) ? knightB : knightA;

            if (!movedKnight || !tetheredKnight) continue;

            // Check if there's a brick between them (breaks tether)
            const dx = Math.abs(knightA.x - knightB.x);
            const dy = Math.abs(knightA.y - knightB.y);
            const steps = Math.max(dx, dy);
            let blockedByBrick = false;
            for (let i = 1; i < steps; i++) {
                const tx = knightA.x + Math.sign(knightB.x - knightA.x) * i;
                const ty = knightA.y + Math.sign(knightB.y - knightA.y) * i;
                if (this.board[ty]?.[tx] === TileType.BRICK) {
                    blockedByBrick = true;
                    break;
                }
            }
            if (blockedByBrick) {
                tether.broken = true;
                this.message = 'Tether snapped by brick!';
                continue;
            }

            // Move tethered knight in the SAME direction
            const newTx = tetheredKnight.x + moveDx;
            const newTy = tetheredKnight.y + moveDy;

            // Validate tethered knight's move using same delta
            const tetheredValidation = this.canMoveKnight(tetheredKnight, moveDx, moveDy);

            if (tetheredValidation.valid) {
                // Handle cracked tile departure for tethered knight
                if (this.board[tetheredKnight.y] && this.board[tetheredKnight.y][tetheredKnight.x] === TileType.CRACKED) {
                    this.board[tetheredKnight.y][tetheredKnight.x] = TileType.EMPTY;
                }

                // Move tethered knight
                tetheredKnight.x = newTx;
                tetheredKnight.y = newTy;

                // Handle tile interactions for tethered knight
                this.handleTileInteraction(tetheredKnight, newTx, newTy);
            } else {
                // Tethered knight can't move - check if brick in the way
                const targetTile = this.board[newTy]?.[newTx];
                if (targetTile === TileType.BRICK) {
                    tether.broken = true;
                    this.message = 'Tether snapped by brick!';
                } else {
                    // Prevent the original move by reverting
                    knight.x -= moveDx;
                    knight.y -= moveDy;
                    this.message = 'Tether pulled tight!';
                }
            }
        }
    }

    // ================================================================
    // TOOL USAGE
    // ================================================================

    useHammer(x, y, action) { // action: 'build' or 'destroy'
        if (this.tools.hammer <= 0) return { valid: false, reason: 'No hammers left' };

        if (action === 'build') {
            // Can build on EMPTY, CRACKED, or off-board
            if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
                const tile = this.board[y][x];
                if (tile === TileType.EMPTY || tile === TileType.CRACKED) {
                    this.board[y][x] = TileType.NORMAL;
                    this.tools.hammer--;
                    this.saveState();
                    this.addAnimation(new ParticleAnimation(x, y, '#8b4513', 8));
                    return { valid: true };
                }
                // Can also build on NORMAL to place arrow later
                if (tile === TileType.NORMAL) {
                    this.tools.hammer--;
                    this.saveState();
                    return { valid: true, message: 'Tile already solid' };
                }
            } else {
                // Off-board build - store in offBoardTiles map
                if (!this.offBoardTiles) this.offBoardTiles = new Map();
                const key = `${x},${y}`;
                if (!this.offBoardTiles.has(key)) {
                    this.offBoardTiles.set(key, TileType.NORMAL);
                    this.tools.hammer--;
                    this.saveState();
                    this.addAnimation(new ParticleAnimation(x, y, '#8b4513', 8));
                    return { valid: true, offScreen: true, built: true };
                }
                return { valid: false, reason: 'Tile already built' };
            }
        } else if (action === 'destroy') {
            if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
                const tile = this.board[y][x];
                if (tile === TileType.BRICK) {
                    this.board[y][x] = TileType.NORMAL;
                    this.tools.hammer--;
                    this.saveState();
                    this.addAnimation(new ParticleAnimation(x, y, '#8b4513', 8));
                    return { valid: true };
                } else if (tile === TileType.METAL) {
                    return { valid: false, reason: 'Cannot destroy metal' };
                } else if (tile === TileType.NORMAL) {
                    // Can't destroy normal floor
                    return { valid: false, reason: 'Cannot destroy floor' };
                }
            }
        }
        return { valid: false, reason: 'Invalid hammer action' };
    }

    placeArrow(x, y, direction) {
        const arrowKey = this.getArrowKey(direction);
        if (this.tools.arrows[arrowKey] <= 0) return { valid: false, reason: 'No arrows left' };

        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            const tile = this.board[y][x];
            if (tile === TileType.EMPTY || tile === TileType.NORMAL || tile === TileType.CRACKED) {
                this.board[y][x] = this.getArrowTileType(direction);
                this.tools.arrows[arrowKey]--;
                this.saveState();
                this.addAnimation(new ParticleAnimation(x, y, '#00ff88', 6));
                return { valid: true };
            }
        } else {
            // Off-board arrow placement - store in offBoardTiles
            if (!this.offBoardTiles) this.offBoardTiles = new Map();
            const key = `${x},${y}`;
            const existingTile = this.offBoardTiles.get(key);
            if (!existingTile || existingTile === TileType.EMPTY || existingTile === TileType.NORMAL) {
                this.offBoardTiles.set(key, this.getArrowTileType(direction));
                this.tools.arrows[arrowKey]--;
                this.saveState();
                this.addAnimation(new ParticleAnimation(x, y, '#00ff88', 6));
                return { valid: true, offScreen: true };
            }
        }
        return { valid: false, reason: 'Cannot place arrow there' };
    }

    getArrowKey(dir) {
        const keys = { up: 'up', right: 'right', down: 'down', left: 'left' };
        return keys[dir] || 'right';
    }

    getArrowTileType(dir) {
        // Return direction-specific green arrow tile type
        const arrowTypes = {
            up: TileType.ARROW_GREEN_UP,
            right: TileType.ARROW_GREEN_RIGHT,
            down: TileType.ARROW_GREEN_DOWN,
            left: TileType.ARROW_GREEN_LEFT
        };
        return arrowTypes[dir] || TileType.ARROW_GREEN_RIGHT;
    }

    useBoot(knight, direction) {
        if (this.tools.boot <= 0) return { valid: false, reason: 'No boots left' };

        const dirs = {
            up: { x: 0, y: -1 },
            down: { x: 0, y: 1 },
            left: { x: -1, y: 0 },
            right: { x: 1, y: 0 }
        };
        const d = dirs[direction];
        if (!d) return { valid: false, reason: 'Invalid direction' };

        const newX = knight.x + d.x;
        const newY = knight.y + d.y;

        // Boot cannot be used mid-air to avoid void
        if (newX < 0 || newX >= this.width || newY < 0 || newY >= this.height) {
            return { valid: false, reason: 'Boot cannot prevent void fall' };
        }

        const tile = this.board[newY][newX];
        if (tile === TileType.BRICK || tile === TileType.METAL || tile === TileType.BOMB) {
            return { valid: false, reason: 'Blocked' };
        }

        knight.x = newX;
        knight.y = newY;
        this.tools.boot--;
        this.movesUsed++; // Boot uses a move
        this.handleTileInteraction(knight, newX, newY);
        this.saveState();
        this.checkWinCondition();
        return { valid: true };
    }

    wait() {
        if (!this.canWait) return { valid: false, reason: 'Cannot wait here' };
        this.movesUsed++;
        this.advanceTrafficLights();
        this.saveState();
        this.checkWinCondition();
        return { valid: true };
    }

    advanceTrafficLights() {
        for (const tl of this.trafficLights) {
            tl.state = tl.state === 'green' ? 'red' : 'green';
            // Update board visual
            this.board[tl.y][tl.x] = tl.state === 'green' ? TileType.TRAFFIC_LIGHT_GREEN : TileType.TRAFFIC_LIGHT_RED;
        }
    }

    // ================================================================
    // WIN/LOSS CONDITIONS
    // ================================================================

    checkWinCondition() {
        // All coins collected?
        const allCoinsCollected = this.coins.every(c => c.collected);
        if (this.coins.length > 0 && !allCoinsCollected) {
            return false;
        }

        // All flags reached by correct knights?
        let allFlagsReached = true;
        for (const flag of this.flags) {
            const knightAtFlag = this.knights.find(k => k.x === flag.x && k.y === flag.y && k.atFlag);
            if (!knightAtFlag) {
                allFlagsReached = false;
                break;
            }
            // Check color match
            if (flag.color && knightAtFlag.color !== flag.color) {
                allFlagsReached = false;
                break;
            }
        }

        if (allFlagsReached) {
            this.status = 'won';
            this.message = 'Level Complete!';
            return true;
        }

        // Check move limit
        if (this.movesUsed >= this.maxMoves) {
            // Check if any knight at flag
            const anyAtFlag = this.knights.some(k => k.atFlag);
            if (!anyAtFlag) {
                this.status = 'lost';
                this.message = 'Out of moves!';
            }
        }

        return false;
    }

    // ================================================================
    // SERIALIZATION
    // ================================================================

    toJSON() {
        return {
            levelId: this.levelId,
            levelName: this.levelName,
            maxMoves: this.maxMoves,
            chapter: this.chapter,
            board: this.board,
            knights: this.knights,
            flags: this.flags,
            coins: this.coins,
            chessPieces: this.chessPieces,
            tools: this.tools,
            movesUsed: this.movesUsed,
            trafficLights: this.trafficLights,
            bombs: this.bombs,
            tethers: this.tethers,
            portals: this.portals,
            voidArrows: this.voidArrows,
            offBoardTiles: this.offBoardTiles ? Array.from(this.offBoardTiles.entries()) : [],
            status: this.status,
            message: this.message,
            sharedMoves: this.sharedMoves,
            canCarryKnights: this.canCarryKnights,
            maxCoinsPerKnight: this.maxCoinsPerKnight,
            canWait: this.canWait,
            controlFlag: this.controlFlag,
            starJump: this.starJump,
            designMode: this.designMode,
            globalTools: this.globalTools,
            infiniteMoves: this.infiniteMoves
        };
    }

    static fromJSON(data) {
        const state = Object.assign(Object.create(GameState.prototype), data);
        // Restore offBoardTiles as Map
        if (data.offBoardTiles) {
            state.offBoardTiles = new Map(data.offBoardTiles);
        } else {
            state.offBoardTiles = new Map();
        }
        return state;
    }
}

// ============================================================================
// SAVE MANAGER
// ============================================================================

export class SaveManager {
    static STORAGE_KEY = 'ickp_save_data';
    static GLOBAL_TOOLS_KEY = 'ickp_global_tools';

    static save(gameState, completedLevels = []) {
        const data = {
            version: '1.0',
            timestamp: Date.now(),
            currentLevel: gameState.levelId,
            completedLevels: completedLevels,
            gameState: gameState.toJSON(),
            globalTools: gameState.globalTools ? {
                hammer: gameState.tools.hammer,
                arrows: gameState.tools.arrows,
                boot: gameState.tools.boot,
                portalGun: gameState.tools.portalGun
            } : null
        };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        return true;
    }

    static load() {
        const data = localStorage.getItem(this.STORAGE_KEY);
        if (!data) return null;
        try {
            return JSON.parse(data);
        } catch (e) {
            console.error('Failed to parse save data:', e);
            return null;
        }
    }

    static export() {
        const data = localStorage.getItem(this.STORAGE_KEY);
        if (!data) return null;
        return data;
    }

    static import(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (data.version && data.gameState) {
                localStorage.setItem(this.STORAGE_KEY, jsonString);
                return true;
            }
            return false;
        } catch (e) {
            console.error('Import failed:', e);
            return false;
        }
    }

    static clear() {
        localStorage.removeItem(this.STORAGE_KEY);
        localStorage.removeItem(this.GLOBAL_TOOLS_KEY);
    }

    static getGlobalTools() {
        const data = localStorage.getItem(this.GLOBAL_TOOLS_KEY);
        return data ? JSON.parse(data) : null;
    }

    static setGlobalTools(tools) {
        localStorage.setItem(this.GLOBAL_TOOLS_KEY, JSON.stringify(tools));
    }
}

// ============================================================================
// INPUT HANDLER
// ============================================================================

export class InputHandler {
    constructor(canvas, gameState, callbacks) {
        this.canvas = canvas;
        this.gameState = gameState;
        this.callbacks = callbacks;
        this.selectedKnight = null;
        this.dragStart = null;
        this.isDragging = false;

        this.bindEvents();
    }

    bindEvents() {
        this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.canvas.addEventListener('click', this.onClick.bind(this));
        this.canvas.addEventListener('contextmenu', e => e.preventDefault());

        // Touch support
        this.canvas.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
        this.canvas.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
        this.canvas.addEventListener('touchend', this.onTouchEnd.bind(this));

        // Keyboard
        window.addEventListener('keydown', this.onKeyDown.bind(this));
    }

    getCanvasPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const clientX = e.clientX || (e.touches?.[0]?.clientX || 0);
        const clientY = e.clientY || (e.touches?.[0]?.clientY || 0);
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    getTileFromPos(x, y) {
        const { tileSize, offsetX, offsetY } = this.callbacks.getRenderInfo();
        const tx = Math.floor((x - offsetX) / tileSize);
        const ty = Math.floor((y - offsetY) / tileSize);
        return { x: tx, y: ty };
    }

    onMouseDown(e) {
        const pos = this.getCanvasPos(e);
        const tile = this.getTileFromPos(pos.x, pos.y);

        // Check if clicking a knight
        const knight = this.gameState.knights.find(k => k.x === tile.x && k.y === tile.y);
        if (knight && !knight.atFlag) {
            this.selectedKnight = knight;
            this.dragStart = { x: tile.x, y: tile.y };
            this.isDragging = true;
        } else if (this.gameState.placingTool) {
            // Place tool
            this.callbacks.onToolPlace(tile.x, tile.y);
        }
    }

    onMouseMove(e) {
        if (!this.isDragging || !this.selectedKnight) return;
        // Visual feedback during drag
        this.callbacks.onDragMove(e);
    }

    onMouseUp(e) {
        if (!this.isDragging || !this.selectedKnight) {
            this.isDragging = false;
            this.selectedKnight = null;
            return;
        }

        const pos = this.getCanvasPos(e);
        const tile = this.getTileFromPos(pos.x, pos.y);
        const dx = tile.x - this.dragStart.x;
        const dy = tile.y - this.dragStart.y;

        // Check if it's a valid knight move
        const isKnightMove = KNIGHT_MOVES.some(m => m.dx === dx && m.dy === dy);

        if (isKnightMove) {
            this.callbacks.onKnightMove(this.selectedKnight, dx, dy);
        }

        this.isDragging = false;
        this.selectedKnight = null;
        this.dragStart = null;
    }

    onClick(e) {
        const pos = this.getCanvasPos(e);
        const tile = this.getTileFromPos(pos.x, pos.y);

        // If placing tool, place it
        if (this.gameState.placingTool) {
            this.callbacks.onToolPlace(tile.x, tile.y);
        }
    }

    // Touch handlers
    onTouchStart(e) {
        e.preventDefault();
        this.onMouseDown(e);
    }

    onTouchMove(e) {
        e.preventDefault();
        this.onMouseMove(e);
    }

    onTouchEnd(e) {
        this.onMouseUp(e);
    }

    onKeyDown(e) {
        // Global shortcuts
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

        switch (e.key) {
            case 'z':
            case 'Z':
                if (e.ctrlKey || e.metaKey) return; // Allow browser undo
                this.callbacks.onUndo();
                e.preventDefault();
                break;
            case 'r':
            case 'R':
                this.callbacks.onReset();
                break;
            case ' ':
                this.callbacks.onWait();
                e.preventDefault();
                break;
            case '1': this.callbacks.onSelectTool('hammer'); break;
            case '2': this.callbacks.onSelectTool('arrow_up'); break;
            case '3': this.callbacks.onSelectTool('arrow_right'); break;
            case '4': this.callbacks.onSelectTool('arrow_down'); break;
            case '5': this.callbacks.onSelectTool('arrow_left'); break;
            case '6': this.callbacks.onSelectTool('boot'); break;
        }
    }
}