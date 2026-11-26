/**
 * ICKP Level Definitions
 * Representative levels covering all mechanics from each chapter
 * Format: JSON-compatible JavaScript module
 */

// ============================================================================
// TILE TYPE CONSTANTS
// ============================================================================
export const TileType = {
    EMPTY: 0,
    NORMAL: 1,
    BRICK: 2,
    METAL: 3,
    CRACKED: 4,
    COIN: 5,
    FLAG: 6,
    // Green arrows (1-space push) - direction specific
    ARROW_GREEN_UP: 7,
    ARROW_GREEN_RIGHT: 8,
    ARROW_GREEN_DOWN: 9,
    ARROW_GREEN_LEFT: 10,
    // Blue arrows (2-space push) - direction specific
    ARROW_BLUE_UP: 11,
    ARROW_BLUE_RIGHT: 12,
    ARROW_BLUE_DOWN: 13,
    ARROW_BLUE_LEFT: 14,
    // Void arrows (off-board)
    ARROW_GREEN_VOID_UP: 15,
    ARROW_GREEN_VOID_RIGHT: 16,
    ARROW_GREEN_VOID_DOWN: 17,
    ARROW_GREEN_VOID_LEFT: 18,
    ARROW_BLUE_VOID_UP: 19,
    ARROW_BLUE_VOID_RIGHT: 20,
    ARROW_BLUE_VOID_DOWN: 21,
    ARROW_BLUE_VOID_LEFT: 22,
    // 4-way arrow
    ARROW_4WAY: 23,
    // Portals
    PORTAL_RED: 24,
    PORTAL_BLUE: 25,
    PORTAL_GREEN: 26,
    PORTAL_YELLOW: 27,
    PORTAL_PURPLE: 28,
    PORTAL_ORANGE: 29,
    // Buttons and bombs
    BUTTON: 30,
    BOMB: 31,
    // Traffic lights
    TRAFFIC_LIGHT_GREEN: 32,
    TRAFFIC_LIGHT_RED: 33,
    // Chess pieces
    CHESS_PAWN: 34,
    CHESS_BISHOP: 35,
    CHESS_ROOK: 36,
    CHESS_QUEEN: 37,
    CHESS_KING: 38,
};

// Arrow directions
export const Dir = {
    UP: 0,
    RIGHT: 1,
    DOWN: 2,
    LEFT: 3,
    NONE: -1
};

// Knight colors
export const KnightColor = {
    WHITE: 'white',
    BLACK: 'black',
    RED: 'red',
    BLUE: 'blue',
    GREEN: 'green',
    YELLOW: 'yellow'
};

// Tool types
export const ToolType = {
    HAMMER: 'hammer',
    ARROW_UP: 'arrow_up',
    ARROW_RIGHT: 'arrow_right',
    ARROW_DOWN: 'arrow_down',
    ARROW_LEFT: 'arrow_left',
    BOOT: 'boot'
};

// Chapter definitions
export const Chapters = {
    1: { name: 'Chapter I: The Basics', levels: 35, start: 1, end: 35 },
    2: { name: 'Chapter II: Knights, Plural', levels: 20, start: 36, end: 55 },
    3: { name: 'Chapter III: The Knight\'s Friends', levels: 5, start: 56, end: 60 },
    4: { name: 'Chapter IV: Advanced Chess', levels: 20, start: 61, end: 80 },
    5: { name: 'Chapter V: The Family', levels: 15, start: 81, end: 95 },
    6: { name: 'Chapter VI: Playtesters\' Puzzles', levels: 5, start: 96, end: 100 },
    7: { name: 'Chapter VII: Long Distance', levels: 21, start: 101, end: 121 }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function createBoard(width, height, fill = TileType.NORMAL) {
    return Array(height).fill(null).map(() => Array(width).fill(fill));
}

function setTile(board, x, y, type) {
    if (y >= 0 && y < board.length && x >= 0 && x < board[0].length) {
        board[y][x] = type;
    }
}

function addKnight(board, knights, x, y, color = KnightColor.WHITE, id = null) {
    const knight = { x, y, color, id: id || `knight_${knights.length}`, hasCoin: false, carriedCoin: null };
    knights.push(knight);
    return knight;
}

function addFlag(board, flags, x, y, color = KnightColor.WHITE) {
    setTile(board, x, y, TileType.FLAG);
    flags.push({ x, y, color });
}

// ============================================================================
// LEVEL DEFINITIONS
// Each level: { id, name, moves, chapter, board, knights, flags, coins, tools, portals, tethers, trafficLights, buttons, bombs, chessPieces }
// ============================================================================

export const Levels = [
    // ============================================================
    // CHAPTER I: THE BASICS (Levels 1-35)
    // ============================================================

    // Level 1: Jump - Learn basic knight movement
    {
        id: 1, name: 'Jump', moves: 1, chapter: 1,
        board: (() => { const b = createBoard(5, 5); setTile(b, 4, 1, TileType.FLAG); return b; })(),
        knights: [{ x: 2, y: 0, color: KnightColor.WHITE }],
        flags: [{ x: 4, y: 1, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: {}, boot: 0 }
    },

    // Level 2: Triple Jump - Multiple jumps in sequence
    {
        id: 2, name: 'Triple Jump', moves: 3, chapter: 1,
        board: (() => { const b = createBoard(7, 7); setTile(b, 1, 5, TileType.FLAG); return b; })(),
        knights: [{ x: 3, y: 0, color: KnightColor.WHITE }],
        flags: [{ x: 1, y: 5, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: {}, boot: 0 }
    },

    // Level 3: Arrow - Green arrow (1-space push)
    {
        id: 3, name: 'Arrow', moves: 2, chapter: 1,
        board: (() => {
            const b = createBoard(7, 5);
            setTile(b, 2, 3, TileType.ARROW_GREEN_RIGHT); // Arrow pointing right at (2,3)
            setTile(b, 5, 2, TileType.FLAG); // Flag at (5,2)
            return b;
        })(),
        knights: [{ x: 0, y: 2, color: KnightColor.WHITE }],
        flags: [{ x: 5, y: 2, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: {}, boot: 0 }
    },

    // Level 4: Mischievous Arrow - Arrow pointing wrong way
    {
        id: 4, name: 'Mischievous Arrow', moves: 6, chapter: 1,
        board: (() => {
            const b = createBoard(9, 5);
            setTile(b, 4, 2, TileType.ARROW_GREEN_RIGHT); // Points right
            setTile(b, 1, 2, TileType.ARROW_GREEN_RIGHT); // Points right (back)
            setTile(b, 8, 2, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 0, y: 2, color: KnightColor.WHITE }],
        flags: [{ x: 8, y: 2, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: {}, boot: 0 }
    },

    // Level 5: Chained Arrows - Multiple arrows in sequence
    {
        id: 5, name: 'Chained Arrows', moves: 1, chapter: 1,
        board: (() => {
            const b = createBoard(9, 5);
            setTile(b, 2, 2, TileType.ARROW_GREEN_RIGHT);
            setTile(b, 4, 2, TileType.ARROW_GREEN_RIGHT);
            setTile(b, 6, 2, TileType.ARROW_GREEN_RIGHT);
            setTile(b, 8, 2, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 0, y: 2, color: KnightColor.WHITE }],
        flags: [{ x: 8, y: 2, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: {}, boot: 0 }
    },

    // Level 6: Mischievous Chain - Arrows that fight each other
    {
        id: 6, name: 'Mischievous Chain', moves: 3, chapter: 1,
        board: (() => {
            const b = createBoard(9, 5);
            setTile(b, 2, 2, TileType.ARROW_GREEN_RIGHT);  // Right
            setTile(b, 4, 2, TileType.ARROW_GREEN_RIGHT);  // Right
            setTile(b, 6, 2, TileType.ARROW_GREEN_RIGHT);  // Right (but knight comes from right)
            setTile(b, 8, 2, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 8, y: 2, color: KnightColor.WHITE }],
        flags: [{ x: 0, y: 2, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: {}, boot: 0 }
    },

    // Level 7: Void Arrow - Arrow in the void
    {
        id: 7, name: 'Void Arrow', moves: 1, chapter: 1,
        board: (() => {
            const b = createBoard(5, 5);
            // Arrow at edge pointing outward to void arrow
            setTile(b, 4, 2, TileType.ARROW_GREEN_RIGHT);
            // Void arrow at (6, 2) - off board but conceptually there
            setTile(b, 0, 2, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 2, y: 2, color: KnightColor.WHITE }],
        flags: [{ x: 0, y: 2, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: {}, boot: 0 },
        voidArrows: [{ x: 6, y: 2, dir: Dir.LEFT }] // Void arrow pushing back
    },

    // Level 8: Void Chain - Chain through void
    {
        id: 8, name: 'Void Chain', moves: 2, chapter: 1,
        board: (() => {
            const b = createBoard(5, 5);
            setTile(b, 4, 2, TileType.ARROW_GREEN_RIGHT);
            setTile(b, 0, 2, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 2, y: 2, color: KnightColor.WHITE }],
        flags: [{ x: 0, y: 2, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: {}, boot: 0 },
        voidArrows: [
            { x: 6, y: 2, dir: Dir.LEFT },
            { x: 8, y: 2, dir: Dir.LEFT }
        ]
    },

    // Level 9: Construction - Hammer build tile
    {
        id: 9, name: 'Construction', moves: 2, chapter: 1,
        board: (() => {
            const b = createBoard(7, 5);
            setTile(b, 6, 2, TileType.FLAG);
            // Gap at (3,2) that needs hammer
            return b;
        })(),
        knights: [{ x: 0, y: 2, color: KnightColor.WHITE }],
        flags: [{ x: 6, y: 2, color: KnightColor.WHITE }],
        tools: { hammer: 1, arrows: {}, boot: 0 }
    },

    // Level 10: Distant Construction - Build off-screen
    {
        id: 10, name: 'Distant Construction', moves: 2, chapter: 1,
        board: (() => {
            const b = createBoard(7, 5);
            setTile(b, 6, 2, TileType.FLAG);
            // Need to build at (8,2) off-screen then jump
            return b;
        })(),
        knights: [{ x: 0, y: 2, color: KnightColor.WHITE }],
        flags: [{ x: 6, y: 2, color: KnightColor.WHITE }],
        tools: { hammer: 1, arrows: {}, boot: 0 }
    },

    // Level 11: Obstruction - Brick walls blocking path
    {
        id: 11, name: 'Obstruction', moves: 6, chapter: 1,
        board: (() => {
            const b = createBoard(9, 7);
            // Brick wall in middle with gap
            for (let y = 0; y < 7; y++) setTile(b, 4, y, TileType.BRICK);
            setTile(b, 4, 3, TileType.NORMAL); // Gap
            setTile(b, 8, 3, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 0, y: 3, color: KnightColor.WHITE }],
        flags: [{ x: 8, y: 3, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: {}, boot: 0 }
    },

    // Level 12: Demolition - Hammer destroys brick
    {
        id: 12, name: 'Demolition', moves: 2, chapter: 1,
        board: (() => {
            const b = createBoard(7, 5);
            setTile(b, 3, 2, TileType.BRICK);
            setTile(b, 6, 2, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 0, y: 2, color: KnightColor.WHITE }],
        flags: [{ x: 6, y: 2, color: KnightColor.WHITE }],
        tools: { hammer: 1, arrows: {}, boot: 0 }
    },

    // Level 13: Renovation - Build then demolish
    {
        id: 13, name: 'Renovation', moves: 2, chapter: 1,
        board: (() => {
            const b = createBoard(7, 5);
            setTile(b, 2, 2, TileType.BRICK);
            setTile(b, 6, 2, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 0, y: 2, color: KnightColor.WHITE }],
        flags: [{ x: 6, y: 2, color: KnightColor.WHITE }],
        tools: { hammer: 1, arrows: {}, boot: 0 }
    },

    // Level 14: Cool Blue Arrow - Blue arrow (2-space push)
    {
        id: 14, name: 'Cool Blue Arrow', moves: 2, chapter: 1,
        board: (() => {
            const b = createBoard(9, 5);
            setTile(b, 2, 2, TileType.ARROW_BLUE_RIGHT); // 2-space push
            setTile(b, 8, 2, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 0, y: 2, color: KnightColor.WHITE }],
        flags: [{ x: 8, y: 2, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: {}, boot: 0 }
    },

    // Level 15: Dizzy - Blue arrow bounce off wall
    {
        id: 15, name: 'Dizzy', moves: 1, chapter: 1,
        board: (() => {
            const b = createBoard(7, 5);
            setTile(b, 2, 2, TileType.ARROW_BLUE_RIGHT);
            setTile(b, 6, 2, TileType.BRICK); // Wall to bounce off
            setTile(b, 0, 2, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 4, y: 2, color: KnightColor.WHITE }],
        flags: [{ x: 0, y: 2, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: {}, boot: 0 }
    },

    // Level 16: DIY Arrow - Place your own arrow
    {
        id: 16, name: 'DIY Arrow', moves: 1, chapter: 1,
        board: (() => {
            const b = createBoard(7, 5);
            setTile(b, 6, 2, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 0, y: 2, color: KnightColor.WHITE }],
        flags: [{ x: 6, y: 2, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: { right: 1 }, boot: 0 }
    },

    // Level 17: DIY Chain - Place multiple arrows
    {
        id: 17, name: 'DIY Chain', moves: 1, chapter: 1,
        board: (() => {
            const b = createBoard(9, 5);
            setTile(b, 8, 2, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 0, y: 2, color: KnightColor.WHITE }],
        flags: [{ x: 8, y: 2, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: { right: 2 }, boot: 0 }
    },

    // Level 18: Reinforcement - Metal blocks (indestructible)
    {
        id: 18, name: 'Reinforcement', moves: 2, chapter: 1,
        board: (() => {
            const b = createBoard(7, 5);
            setTile(b, 3, 2, TileType.METAL);
            setTile(b, 6, 2, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 0, y: 2, color: KnightColor.WHITE }],
        flags: [{ x: 6, y: 2, color: KnightColor.WHITE }],
        tools: { hammer: 1, arrows: {}, boot: 0 } // Hammer can't break metal
    },

    // Level 19: Blockade - Metal wall with arrow solution
    {
        id: 19, name: 'Blockade', moves: 2, chapter: 1,
        board: (() => {
            const b = createBoard(9, 5);
            for (let y = 0; y < 5; y++) setTile(b, 4, y, TileType.METAL);
            setTile(b, 8, 2, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 0, y: 2, color: KnightColor.WHITE }],
        flags: [{ x: 8, y: 2, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: { up: 1, right: 1 }, boot: 0 }
    },

    // Level 20: Detour - Cracked tiles
    {
        id: 20, name: 'Detour', moves: 3, chapter: 1,
        board: (() => {
            const b = createBoard(7, 7);
            setTile(b, 3, 3, TileType.CRACKED);
            setTile(b, 3, 5, TileType.CRACKED);
            setTile(b, 6, 3, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 0, y: 3, color: KnightColor.WHITE }],
        flags: [{ x: 6, y: 3, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: {}, boot: 0 }
    },

    // Level 21: Re-entry - Jump out and back in
    {
        id: 21, name: 'Re-entry', moves: 5, chapter: 1,
        board: (() => {
            const b = createBoard(7, 5);
            setTile(b, 6, 2, TileType.FLAG);
            // Void arrow at (8,2) pushing left back to (6,2)
            return b;
        })(),
        knights: [{ x: 0, y: 2, color: KnightColor.WHITE }],
        flags: [{ x: 6, y: 2, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: {}, boot: 0 },
        voidArrows: [{ x: 8, y: 2, dir: Dir.LEFT }]
    },

    // Level 22: Sidequest - Collect coins
    {
        id: 22, name: 'Sidequest', moves: 5, chapter: 1,
        board: (() => {
            const b = createBoard(9, 7);
            setTile(b, 2, 3, TileType.COIN);
            setTile(b, 6, 3, TileType.COIN);
            setTile(b, 8, 3, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 0, y: 3, color: KnightColor.WHITE }],
        flags: [{ x: 8, y: 3, color: KnightColor.WHITE }],
        coins: [{ x: 2, y: 3 }, { x: 6, y: 3 }],
        tools: { hammer: 0, arrows: {}, boot: 0 }
    },

    // Level 23: Heist - Coin behind brick
    {
        id: 23, name: 'Heist', moves: 4, chapter: 1,
        board: (() => {
            const b = createBoard(9, 5);
            setTile(b, 3, 2, TileType.BRICK);
            setTile(b, 4, 2, TileType.COIN);
            setTile(b, 8, 2, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 0, y: 2, color: KnightColor.WHITE }],
        flags: [{ x: 8, y: 2, color: KnightColor.WHITE }],
        coins: [{ x: 4, y: 2 }],
        tools: { hammer: 1, arrows: {}, boot: 0 }
    },

    // Level 24: Jailbreak - Coin in metal cage
    {
        id: 24, name: 'Jailbreak', moves: 2, chapter: 1,
        board: (() => {
            const b = createBoard(9, 5);
            setTile(b, 3, 2, TileType.METAL);
            setTile(b, 4, 2, TileType.COIN);
            setTile(b, 5, 2, TileType.METAL);
            setTile(b, 8, 2, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 0, y: 2, color: KnightColor.WHITE }],
        flags: [{ x: 8, y: 2, color: KnightColor.WHITE }],
        coins: [{ x: 4, y: 2 }],
        tools: { hammer: 0, arrows: { right: 1 }, boot: 0 } // Use arrow to push knight through
    },

    // Level 25: Decay - Multiple cracked tiles
    {
        id: 25, name: 'Decay', moves: 7, chapter: 1,
        board: (() => {
            const b = createBoard(9, 9);
            // Path of cracked tiles
            setTile(b, 2, 4, TileType.CRACKED);
            setTile(b, 4, 4, TileType.CRACKED);
            setTile(b, 6, 4, TileType.CRACKED);
            setTile(b, 8, 4, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 0, y: 4, color: KnightColor.WHITE }],
        flags: [{ x: 8, y: 4, color: KnightColor.WHITE }],
        tools: { hammer: 1, arrows: {}, boot: 0 }
    },

    // Level 26: Irreplaceable - Limited hammer uses
    {
        id: 26, name: 'Irreplaceable', moves: 7, chapter: 1,
        board: (() => {
            const b = createBoard(11, 7);
            setTile(b, 3, 3, TileType.BRICK);
            setTile(b, 7, 3, TileType.BRICK);
            setTile(b, 10, 3, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 0, y: 3, color: KnightColor.WHITE }],
        flags: [{ x: 10, y: 3, color: KnightColor.WHITE }],
        tools: { hammer: 1, arrows: {}, boot: 0 } // Only 1 hammer for 2 bricks - must choose path
    },

    // Level 27: Heist 2 - Coin puzzle
    {
        id: 27, name: 'Heist 2', moves: 4, chapter: 1,
        board: (() => {
            const b = createBoard(9, 7);
            setTile(b, 2, 1, TileType.COIN);
            setTile(b, 2, 5, TileType.COIN);
            setTile(b, 8, 3, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 0, y: 3, color: KnightColor.WHITE }],
        flags: [{ x: 8, y: 3, color: KnightColor.WHITE }],
        coins: [{ x: 2, y: 1 }, { x: 2, y: 5 }],
        tools: { hammer: 0, arrows: { up: 1, down: 1 }, boot: 0 }
    },

    // Level 28: Jailbreak 2
    {
        id: 28, name: 'Jailbreak 2', moves: 2, chapter: 1,
        board: (() => {
            const b = createBoard(9, 5);
            setTile(b, 3, 2, TileType.METAL);
            setTile(b, 4, 2, TileType.COIN);
            setTile(b, 5, 2, TileType.METAL);
            setTile(b, 4, 1, TileType.METAL);
            setTile(b, 4, 3, TileType.METAL);
            setTile(b, 8, 2, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 0, y: 2, color: KnightColor.WHITE }],
        flags: [{ x: 8, y: 2, color: KnightColor.WHITE }],
        coins: [{ x: 4, y: 2 }],
        tools: { hammer: 0, arrows: { up: 1, right: 1 }, boot: 0 }
    },

    // Level 29: Unfinished Business
    {
        id: 29, name: 'Unfinished Business', moves: 7, chapter: 1,
        board: (() => {
            const b = createBoard(11, 7);
            setTile(b, 3, 3, TileType.BRICK);
            setTile(b, 5, 3, TileType.CRACKED);
            setTile(b, 7, 3, TileType.BRICK);
            setTile(b, 10, 3, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 0, y: 3, color: KnightColor.WHITE }],
        flags: [{ x: 10, y: 3, color: KnightColor.WHITE }],
        tools: { hammer: 1, arrows: { right: 1 }, boot: 0 }
    },

    // Level 30: Heist 3
    {
        id: 30, name: 'Heist 3', moves: 5, chapter: 1,
        board: (() => {
            const b = createBoard(11, 7);
            setTile(b, 2, 2, TileType.COIN);
            setTile(b, 2, 4, TileType.COIN);
            setTile(b, 8, 3, TileType.COIN);
            setTile(b, 10, 3, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 0, y: 3, color: KnightColor.WHITE }],
        flags: [{ x: 10, y: 3, color: KnightColor.WHITE }],
        coins: [{ x: 2, y: 2 }, { x: 2, y: 4 }, { x: 8, y: 3 }],
        tools: { hammer: 0, arrows: { up: 1, down: 1, right: 1 }, boot: 0 }
    },

    // Level 31: Jailbreak 3
    {
        id: 31, name: 'Jailbreak 3', moves: 2, chapter: 1,
        board: (() => {
            const b = createBoard(9, 7);
            setTile(b, 3, 2, TileType.METAL);
            setTile(b, 3, 4, TileType.METAL);
            setTile(b, 4, 3, TileType.COIN);
            setTile(b, 5, 3, TileType.METAL);
            setTile(b, 8, 3, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 0, y: 3, color: KnightColor.WHITE }],
        flags: [{ x: 8, y: 3, color: KnightColor.WHITE }],
        coins: [{ x: 4, y: 3 }],
        tools: { hammer: 0, arrows: { right: 1, up: 1 }, boot: 0 }
    },

    // Level 32: Deceit - Red herring arrow
    {
        id: 32, name: 'Deceit', moves: 3, chapter: 1,
        board: (() => {
            const b = createBoard(9, 5);
            setTile(b, 2, 2, TileType.ARROW_GREEN_RIGHT); // Points right (trap)
            setTile(b, 4, 2, TileType.ARROW_GREEN_RIGHT); // Points left (trap)
            setTile(b, 8, 2, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 0, y: 2, color: KnightColor.WHITE }],
        flags: [{ x: 8, y: 2, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: { right: 1 }, boot: 0 }
    },

    // Level 33: Zig zag - L-shape vs Z-shape clarification
    {
        id: 33, name: 'Zig zag', moves: 5, chapter: 1,
        board: (() => {
            const b = createBoard(9, 9);
            setTile(b, 8, 8, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 0, y: 0, color: KnightColor.WHITE }],
        flags: [{ x: 8, y: 8, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: {}, boot: 0 }
    },

    // Level 34: Heist 4
    {
        id: 34, name: 'Heist 4', moves: 5, chapter: 1,
        board: (() => {
            const b = createBoard(11, 9);
            setTile(b, 2, 2, TileType.COIN);
            setTile(b, 2, 6, TileType.COIN);
            setTile(b, 8, 2, TileType.COIN);
            setTile(b, 8, 6, TileType.COIN);
            setTile(b, 10, 4, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 0, y: 4, color: KnightColor.WHITE }],
        flags: [{ x: 10, y: 4, color: KnightColor.WHITE }],
        coins: [{ x: 2, y: 2 }, { x: 2, y: 6 }, { x: 8, y: 2 }, { x: 8, y: 6 }],
        tools: { hammer: 0, arrows: { up: 2, down: 2, right: 2 }, boot: 0 }
    },

    // Level 35: Jailbreak 4
    {
        id: 35, name: 'Jailbreak 4', moves: 4, chapter: 1,
        board: (() => {
            const b = createBoard(11, 7);
            setTile(b, 3, 3, TileType.METAL);
            setTile(b, 4, 3, TileType.COIN);
            setTile(b, 5, 3, TileType.METAL);
            setTile(b, 4, 2, TileType.METAL);
            setTile(b, 4, 4, TileType.METAL);
            setTile(b, 7, 3, TileType.BRICK);
            setTile(b, 10, 3, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 0, y: 3, color: KnightColor.WHITE }],
        flags: [{ x: 10, y: 3, color: KnightColor.WHITE }],
        coins: [{ x: 4, y: 3 }],
        tools: { hammer: 1, arrows: { right: 1 }, boot: 0 }
    },

    // ============================================================
    // CHAPTER II: KNIGHTS, PLURAL (Levels 36-55)
    // ============================================================

    // Level 36: Twins - Two knights, shared moves
    {
        id: 36, name: 'Twins', moves: 4, chapter: 2,
        board: (() => {
            const b = createBoard(7, 5);
            setTile(b, 6, 1, TileType.FLAG);
            setTile(b, 6, 3, TileType.FLAG);
            return b;
        })(),
        knights: [
            { x: 0, y: 1, color: KnightColor.WHITE, id: 'knight_white' },
            { x: 0, y: 3, color: KnightColor.BLACK, id: 'knight_black' }
        ],
        flags: [
            { x: 6, y: 1, color: KnightColor.WHITE },
            { x: 6, y: 3, color: KnightColor.BLACK }
        ],
        tools: { hammer: 0, arrows: {}, boot: 0 },
        sharedMoves: true,
        canCarryKnights: true
    },

    // Level 37: Disambiguation - Color-coded flags
    {
        id: 37, name: 'Disambiguation', moves: 2, chapter: 2,
        board: (() => {
            const b = createBoard(7, 5);
            setTile(b, 6, 1, TileType.FLAG);
            setTile(b, 6, 3, TileType.FLAG);
            return b;
        })(),
        knights: [
            { x: 0, y: 1, color: KnightColor.WHITE, id: 'knight_white' },
            { x: 0, y: 3, color: KnightColor.BLACK, id: 'knight_black' }
        ],
        flags: [
            { x: 6, y: 3, color: KnightColor.WHITE }, // White flag at black knight row
            { x: 6, y: 1, color: KnightColor.BLACK }  // Black flag at white knight row
        ],
        tools: { hammer: 0, arrows: {}, boot: 0 },
        sharedMoves: true
    },

    // Level 38: March - Knights in formation
    {
        id: 38, name: 'March', moves: 4, chapter: 2,
        board: (() => {
            const b = createBoard(9, 7);
            setTile(b, 8, 1, TileType.FLAG);
            setTile(b, 8, 5, TileType.FLAG);
            return b;
        })(),
        knights: [
            { x: 0, y: 1, color: KnightColor.WHITE, id: 'knight_white' },
            { x: 0, y: 5, color: KnightColor.BLACK, id: 'knight_black' }
        ],
        flags: [
            { x: 8, y: 1, color: KnightColor.WHITE },
            { x: 8, y: 5, color: KnightColor.BLACK }
        ],
        tools: { hammer: 0, arrows: { right: 2 }, boot: 0 },
        sharedMoves: true
    },

    // Level 39: Swap - Knights must swap positions
    {
        id: 39, name: 'Swap', moves: 4, chapter: 2,
        board: (() => {
            const b = createBoard(7, 5);
            setTile(b, 6, 1, TileType.FLAG);
            setTile(b, 6, 3, TileType.FLAG);
            return b;
        })(),
        knights: [
            { x: 0, y: 3, color: KnightColor.WHITE, id: 'knight_white' },
            { x: 0, y: 1, color: KnightColor.BLACK, id: 'knight_black' }
        ],
        flags: [
            { x: 6, y: 1, color: KnightColor.WHITE },
            { x: 6, y: 3, color: KnightColor.BLACK }
        ],
        tools: { hammer: 0, arrows: { right: 2 }, boot: 0 },
        sharedMoves: true
    },

    // Level 40: Single-use - One knight carries coin
    {
        id: 40, name: 'Single-use', moves: 4, chapter: 2,
        board: (() => {
            const b = createBoard(9, 5);
            setTile(b, 2, 2, TileType.COIN);
            setTile(b, 8, 2, TileType.FLAG);
            return b;
        })(),
        knights: [
            { x: 0, y: 2, color: KnightColor.WHITE, id: 'knight_white' },
            { x: 0, y: 0, color: KnightColor.BLACK, id: 'knight_black' }
        ],
        flags: [{ x: 8, y: 2, color: KnightColor.WHITE }],
        coins: [{ x: 2, y: 2 }],
        tools: { hammer: 0, arrows: {}, boot: 0 },
        sharedMoves: true,
        maxCoinsPerKnight: 1
    },

    // Level 41: Non-obligatory - Not all knights must reach flag
    {
        id: 41, name: 'Non-obligatory', moves: 1, chapter: 2,
        board: (() => {
            const b = createBoard(5, 5);
            setTile(b, 4, 2, TileType.FLAG);
            return b;
        })(),
        knights: [
            { x: 0, y: 2, color: KnightColor.WHITE, id: 'knight_white' },
            { x: 0, y: 0, color: KnightColor.BLACK, id: 'knight_black' }
        ],
        flags: [{ x: 4, y: 2, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: {}, boot: 0 },
        sharedMoves: true
    },

    // Level 42: Arrow Maze - Complex arrow navigation
    {
        id: 42, name: 'Arrow Maze', moves: 1, chapter: 2,
        board: (() => {
            const b = createBoard(9, 9);
            setTile(b, 2, 2, TileType.ARROW_GREEN_RIGHT);
            setTile(b, 4, 2, TileType.ARROW_GREEN_RIGHT);
            setTile(b, 6, 2, TileType.ARROW_GREEN_RIGHT);
            setTile(b, 6, 4, TileType.ARROW_GREEN_RIGHT);
            setTile(b, 6, 6, TileType.ARROW_GREEN_RIGHT);
            setTile(b, 4, 6, TileType.ARROW_GREEN_RIGHT);
            setTile(b, 2, 6, TileType.ARROW_GREEN_RIGHT);
            setTile(b, 2, 4, TileType.ARROW_GREEN_RIGHT);
            setTile(b, 8, 8, TileType.FLAG);
            return b;
        })(),
        knights: [
            { x: 0, y: 0, color: KnightColor.WHITE, id: 'knight_white' },
            { x: 0, y: 8, color: KnightColor.BLACK, id: 'knight_black' }
        ],
        flags: [{ x: 8, y: 8, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: {}, boot: 0 },
        sharedMoves: true
    },

    // Level 43: Horseback Riding - Knight on knight
    {
        id: 43, name: 'Horseback Riding', moves: 5, chapter: 2,
        board: (() => {
            const b = createBoard(9, 7);
            setTile(b, 4, 3, TileType.BRICK); // Wall to jump over
            setTile(b, 8, 3, TileType.FLAG);
            return b;
        })(),
        knights: [
            { x: 0, y: 3, color: KnightColor.WHITE, id: 'knight_white' },
            { x: 2, y: 3, color: KnightColor.BLACK, id: 'knight_black' }
        ],
        flags: [{ x: 8, y: 3, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: {}, boot: 0 },
        sharedMoves: true,
        canCarryKnights: true
    },

    // Level 44: It's Over, Anakin! - High ground mechanic
    {
        id: 44, name: "It's Over, Anakin!", moves: 6, chapter: 2,
        board: (() => {
            const b = createBoard(11, 7);
            setTile(b, 4, 3, TileType.BRICK);
            setTile(b, 5, 3, TileType.BRICK);
            setTile(b, 6, 3, TileType.BRICK);
            setTile(b, 10, 3, TileType.FLAG);
            return b;
        })(),
        knights: [
            { x: 0, y: 3, color: KnightColor.WHITE, id: 'knight_white' },
            { x: 2, y: 3, color: KnightColor.BLACK, id: 'knight_black' }
        ],
        flags: [{ x: 10, y: 3, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: {}, boot: 0 },
        sharedMoves: true,
        canCarryKnights: true
    },

    // Level 45: Hike - Long journey with multiple knights
    {
        id: 45, name: 'Hike', moves: 12, chapter: 2,
        board: (() => {
            const b = createBoard(13, 9);
            setTile(b, 4, 4, TileType.BRICK);
            setTile(b, 8, 4, TileType.BRICK);
            setTile(b, 12, 4, TileType.FLAG);
            return b;
        })(),
        knights: [
            { x: 0, y: 4, color: KnightColor.WHITE, id: 'knight_white' },
            { x: 2, y: 4, color: KnightColor.BLACK, id: 'knight_black' },
            { x: 0, y: 2, color: KnightColor.RED, id: 'knight_red' }
        ],
        flags: [{ x: 12, y: 4, color: KnightColor.WHITE }],
        tools: { hammer: 2, arrows: { right: 2 }, boot: 0 },
        sharedMoves: true,
        canCarryKnights: true
    },

    // Level 46: Slalom - Weaving between obstacles
    {
        id: 46, name: 'Slalom', moves: 5, chapter: 2,
        board: (() => {
            const b = createBoard(11, 9);
            setTile(b, 3, 2, TileType.BRICK);
            setTile(b, 3, 6, TileType.BRICK);
            setTile(b, 7, 2, TileType.BRICK);
            setTile(b, 7, 6, TileType.BRICK);
            setTile(b, 10, 4, TileType.FLAG);
            return b;
        })(),
        knights: [
            { x: 0, y: 4, color: KnightColor.WHITE, id: 'knight_white' },
            { x: 0, y: 2, color: KnightColor.BLACK, id: 'knight_black' }
        ],
        flags: [{ x: 10, y: 4, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: {}, boot: 0 },
        sharedMoves: true
    },

    // Level 47: Up for Grabs - Multiple coins, one per knight
    {
        id: 47, name: 'Up for Grabs', moves: 7, chapter: 2,
        board: (() => {
            const b = createBoard(11, 7);
            setTile(b, 2, 2, TileType.COIN);
            setTile(b, 2, 5, TileType.COIN);
            setTile(b, 8, 2, TileType.COIN);
            setTile(b, 8, 5, TileType.COIN);
            setTile(b, 10, 3, TileType.FLAG);
            return b;
        })(),
        knights: [
            { x: 0, y: 2, color: KnightColor.WHITE, id: 'knight_white' },
            { x: 0, y: 5, color: KnightColor.BLACK, id: 'knight_black' }
        ],
        flags: [{ x: 10, y: 3, color: KnightColor.WHITE }],
        coins: [
            { x: 2, y: 2 }, { x: 2, y: 5 },
            { x: 8, y: 2 }, { x: 8, y: 5 }
        ],
        tools: { hammer: 0, arrows: { right: 2 }, boot: 0 },
        sharedMoves: true,
        maxCoinsPerKnight: 1
    },

    // Level 48: Sharing is Caring - Knights share coins
    {
        id: 48, name: 'Sharing is Caring', moves: 6, chapter: 2,
        board: (() => {
            const b = createBoard(9, 5);
            setTile(b, 2, 2, TileType.COIN);
            setTile(b, 8, 2, TileType.FLAG);
            return b;
        })(),
        knights: [
            { x: 0, y: 2, color: KnightColor.WHITE, id: 'knight_white' },
            { x: 4, y: 2, color: KnightColor.BLACK, id: 'knight_black' }
        ],
        flags: [{ x: 8, y: 2, color: KnightColor.WHITE }],
        coins: [{ x: 2, y: 2 }],
        tools: { hammer: 0, arrows: {}, boot: 0 },
        sharedMoves: true,
        maxCoinsPerKnight: 1
    },

    // Level 49: Order of Operations - Sequence matters
    {
        id: 49, name: 'Order of Operations', moves: 6, chapter: 2,
        board: (() => {
            const b = createBoard(11, 5);
            setTile(b, 3, 2, TileType.BRICK);
            setTile(b, 7, 2, TileType.COIN);
            setTile(b, 10, 2, TileType.FLAG);
            return b;
        })(),
        knights: [
            { x: 0, y: 2, color: KnightColor.WHITE, id: 'knight_white' },
            { x: 5, y: 2, color: KnightColor.BLACK, id: 'knight_black' }
        ],
        flags: [{ x: 10, y: 2, color: KnightColor.WHITE }],
        coins: [{ x: 7, y: 2 }],
        tools: { hammer: 1, arrows: { right: 1 }, boot: 0 },
        sharedMoves: true
    },

    // Level 50: Wall - Button and bombs
    {
        id: 50, name: 'Wall', moves: 7, chapter: 2,
        board: (() => {
            const b = createBoard(11, 7);
            setTile(b, 5, 3, TileType.BUTTON);
            setTile(b, 4, 3, TileType.BOMB);
            setTile(b, 6, 3, TileType.BOMB);
            setTile(b, 10, 3, TileType.FLAG);
            return b;
        })(),
        knights: [
            { x: 0, y: 3, color: KnightColor.WHITE, id: 'knight_white' },
            { x: 0, y: 1, color: KnightColor.BLACK, id: 'knight_black' }
        ],
        flags: [{ x: 10, y: 3, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: {}, boot: 0 },
        sharedMoves: true,
        buttons: [{ x: 5, y: 3 }],
        bombs: [{ x: 4, y: 3 }, { x: 6, y: 3 }]
    },

    // Level 51: Detonation
    {
        id: 51, name: 'Detonation', moves: 4, chapter: 2,
        board: (() => {
            const b = createBoard(9, 5);
            setTile(b, 3, 2, TileType.BUTTON);
            setTile(b, 2, 2, TileType.BOMB);
            setTile(b, 4, 2, TileType.BOMB);
            setTile(b, 8, 2, TileType.FLAG);
            return b;
        })(),
        knights: [
            { x: 0, y: 2, color: KnightColor.WHITE, id: 'knight_white' },
            { x: 6, y: 2, color: KnightColor.BLACK, id: 'knight_black' }
        ],
        flags: [{ x: 8, y: 2, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: {}, boot: 0 },
        sharedMoves: true,
        buttons: [{ x: 3, y: 2 }],
        bombs: [{ x: 2, y: 2 }, { x: 4, y: 2 }]
    },

    // Level 52: Minefield
    {
        id: 52, name: 'Minefield', moves: 8, chapter: 2,
        board: (() => {
            const b = createBoard(11, 7);
            setTile(b, 5, 3, TileType.BUTTON);
            for (let x = 3; x <= 7; x++) {
                for (let y = 1; y <= 5; y++) {
                    if (x !== 5 || y !== 3) setTile(b, x, y, TileType.BOMB);
                }
            }
            setTile(b, 10, 3, TileType.FLAG);
            return b;
        })(),
        knights: [
            { x: 0, y: 3, color: KnightColor.WHITE, id: 'knight_white' },
            { x: 0, y: 1, color: KnightColor.BLACK, id: 'knight_black' }
        ],
        flags: [{ x: 10, y: 3, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: {}, boot: 0 },
        sharedMoves: true,
        buttons: [{ x: 5, y: 3 }],
        bombs: [
            { x: 3, y: 1 }, { x: 4, y: 1 }, { x: 5, y: 1 }, { x: 6, y: 1 }, { x: 7, y: 1 },
            { x: 3, y: 2 }, { x: 4, y: 2 }, { x: 6, y: 2 }, { x: 7, y: 2 },
            { x: 3, y: 3 }, { x: 4, y: 3 }, { x: 6, y: 3 }, { x: 7, y: 3 },
            { x: 3, y: 4 }, { x: 4, y: 4 }, { x: 6, y: 4 }, { x: 7, y: 4 },
            { x: 3, y: 5 }, { x: 4, y: 5 }, { x: 5, y: 5 }, { x: 6, y: 5 }, { x: 7, y: 5 }
        ]
    },

    // Level 53: Trespassing
    {
        id: 53, name: 'Trespassing', moves: 12, chapter: 2,
        board: (() => {
            const b = createBoard(13, 9);
            setTile(b, 6, 4, TileType.BUTTON);
            setTile(b, 5, 4, TileType.BOMB);
            setTile(b, 7, 4, TileType.BOMB);
            setTile(b, 5, 3, TileType.BOMB);
            setTile(b, 7, 3, TileType.BOMB);
            setTile(b, 5, 5, TileType.BOMB);
            setTile(b, 7, 5, TileType.BOMB);
            setTile(b, 12, 4, TileType.FLAG);
            return b;
        })(),
        knights: [
            { x: 0, y: 4, color: KnightColor.WHITE, id: 'knight_white' },
            { x: 2, y: 4, color: KnightColor.BLACK, id: 'knight_black' },
            { x: 0, y: 2, color: KnightColor.RED, id: 'knight_red' }
        ],
        flags: [{ x: 12, y: 4, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: { right: 2 }, boot: 0 },
        sharedMoves: true,
        buttons: [{ x: 6, y: 4 }],
        bombs: [{ x: 5, y: 4 }, { x: 7, y: 4 }, { x: 5, y: 3 }, { x: 7, y: 3 }, { x: 5, y: 5 }, { x: 7, y: 5 }]
    },

    // Level 54: Minefield 2
    {
        id: 54, name: 'Minefield 2', moves: 8, chapter: 2,
        board: (() => {
            const b = createBoard(11, 7);
            setTile(b, 5, 3, TileType.BUTTON);
            for (let x = 3; x <= 7; x++) {
                for (let y = 1; y <= 5; y++) {
                    if (x !== 5 || y !== 3) setTile(b, x, y, TileType.BOMB);
                }
            }
            setTile(b, 3, 3, TileType.BRICK);
            setTile(b, 7, 3, TileType.BRICK);
            setTile(b, 10, 3, TileType.FLAG);
            return b;
        })(),
        knights: [
            { x: 0, y: 3, color: KnightColor.WHITE, id: 'knight_white' },
            { x: 0, y: 1, color: KnightColor.BLACK, id: 'knight_black' }
        ],
        flags: [{ x: 10, y: 3, color: KnightColor.WHITE }],
        tools: { hammer: 1, arrows: {}, boot: 0 },
        sharedMoves: true,
        buttons: [{ x: 5, y: 3 }],
        bombs: [
            { x: 3, y: 1 }, { x: 4, y: 1 }, { x: 5, y: 1 }, { x: 6, y: 1 }, { x: 7, y: 1 },
            { x: 3, y: 2 }, { x: 4, y: 2 }, { x: 6, y: 2 }, { x: 7, y: 2 },
            { x: 4, y: 3 }, { x: 6, y: 3 },
            { x: 3, y: 4 }, { x: 4, y: 4 }, { x: 6, y: 4 }, { x: 7, y: 4 },
            { x: 3, y: 5 }, { x: 4, y: 5 }, { x: 5, y: 5 }, { x: 6, y: 5 }, { x: 7, y: 5 }
        ]
    },

    // Level 55: Fireworks
    {
        id: 55, name: 'Fireworks', moves: 12, chapter: 2,
        board: (() => {
            const b = createBoard(13, 9);
            setTile(b, 6, 4, TileType.BUTTON);
            for (let dx = -2; dx <= 2; dx++) {
                for (let dy = -2; dy <= 2; dy++) {
                    if (dx !== 0 || dy !== 0) setTile(b, 6 + dx, 4 + dy, TileType.BOMB);
                }
            }
            setTile(b, 12, 4, TileType.FLAG);
            return b;
        })(),
        knights: [
            { x: 0, y: 4, color: KnightColor.WHITE, id: 'knight_white' },
            { x: 2, y: 4, color: KnightColor.BLACK, id: 'knight_black' },
            { x: 0, y: 2, color: KnightColor.RED, id: 'knight_red' }
        ],
        flags: [{ x: 12, y: 4, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: { right: 2 }, boot: 0 },
        sharedMoves: true,
        buttons: [{ x: 6, y: 4 }],
        bombs: [
            { x: 4, y: 2 }, { x: 5, y: 2 }, { x: 6, y: 2 }, { x: 7, y: 2 }, { x: 8, y: 2 },
            { x: 4, y: 3 }, { x: 5, y: 3 }, { x: 7, y: 3 }, { x: 8, y: 3 },
            { x: 4, y: 4 }, { x: 5, y: 4 }, { x: 7, y: 4 }, { x: 8, y: 4 },
            { x: 4, y: 5 }, { x: 5, y: 5 }, { x: 6, y: 5 }, { x: 7, y: 5 }, { x: 8, y: 5 },
            { x: 4, y: 6 }, { x: 5, y: 6 }, { x: 6, y: 6 }, { x: 7, y: 6 }, { x: 8, y: 6 }
        ]
    },

    // ============================================================
    // CHAPTER III: THE KNIGHT'S FRIENDS (Levels 56-60)
    // ============================================================

    // Level 56: FLAG IS YOU - Control the flag
    {
        id: 56, name: 'FLAG IS YOU', moves: 1, chapter: 3,
        board: (() => {
            const b = createBoard(5, 5);
            setTile(b, 2, 0, TileType.FLAG); // Flag starts at top
            return b;
        })(),
        knights: [{ x: 2, y: 4, color: KnightColor.WHITE }], // Knight at bottom
        flags: [{ x: 2, y: 0, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: {}, boot: 0 },
        controlFlag: true // Player controls flag, not knight
    },

    // Level 57: Jargon - Star jump pattern
    {
        id: 57, name: 'Jargon', moves: 2, chapter: 3,
        board: (() => {
            const b = createBoard(7, 7);
            setTile(b, 3, 6, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 3, y: 0, color: KnightColor.WHITE }],
        flags: [{ x: 3, y: 6, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: {}, boot: 0 },
        starJump: true // Knight jumps in star pattern (all 8 directions)
    },

    // Level 58: Horse Sorcery - Star jump with UI
    {
        id: 58, name: 'Horse Sorcery', moves: 5, chapter: 3,
        board: (() => {
            const b = createBoard(9, 9);
            setTile(b, 4, 4, TileType.BRICK);
            setTile(b, 8, 8, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 0, y: 0, color: KnightColor.WHITE }],
        flags: [{ x: 8, y: 8, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: {}, boot: 0 },
        starJump: true
    },

    // Level 59: Yummy Adventure - Drag elements to design puzzle
    {
        id: 59, name: 'Yummy Adventure', moves: 9, chapter: 3,
        board: (() => {
            const b = createBoard(9, 9);
            // Empty board - player places elements from sidebar
            setTile(b, 8, 8, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 0, y: 0, color: KnightColor.WHITE }],
        flags: [{ x: 8, y: 8, color: KnightColor.WHITE }],
        tools: { hammer: 2, arrows: { right: 2, down: 2 }, boot: 0 },
        designMode: true // Player designs the level
    },

    // Level 60: Knight's Knifedrawer - Recursive spatial properties
    {
        id: 60, name: "Knight's Knifedrawer", moves: 1, chapter: 3,
        board: (() => {
            const b = createBoard(5, 5);
            setTile(b, 2, 2, TileType.PORTAL_RED);
            return b;
        })(),
        knights: [{ x: 0, y: 0, color: KnightColor.WHITE }],
        flags: [{ x: 4, y: 4, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: {}, boot: 0 },
        portals: [{ x: 2, y: 2, color: 'red', linkedLevel: 60 }], // Self-referential
        recursive: true
    },

    // ============================================================
    // CHAPTER IV: ADVANCED CHESS (Levels 61-80)
    // ============================================================

    // Level 61: Immovable Object - Boot tool
    {
        id: 61, name: 'Immovable Object', moves: 2, chapter: 4,
        board: (() => {
            const b = createBoard(7, 5);
            setTile(b, 3, 2, TileType.METAL);
            setTile(b, 6, 2, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 0, y: 2, color: KnightColor.WHITE }],
        flags: [{ x: 6, y: 2, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: {}, boot: 1 } // Boot moves 1 orthogonally
    },

    // Level 62: Trample - Boot through cracked
    {
        id: 62, name: 'Trample', moves: 2, chapter: 4,
        board: (() => {
            const b = createBoard(7, 5);
            setTile(b, 3, 2, TileType.CRACKED);
            setTile(b, 6, 2, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 0, y: 2, color: KnightColor.WHITE }],
        flags: [{ x: 6, y: 2, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: {}, boot: 1 }
    },

    // Level 63: Agency - Wait/Null turn
    {
        id: 63, name: 'Agency', moves: 2, chapter: 4,
        board: (() => {
            const b = createBoard(7, 5);
            setTile(b, 2, 2, TileType.ARROW_GREEN_RIGHT);
            setTile(b, 6, 2, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 0, y: 2, color: KnightColor.WHITE }],
        flags: [{ x: 6, y: 2, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: {}, boot: 0 },
        canWait: true // Wait button enabled
    },

    // Level 64: Reuse - 4-way arrow
    {
        id: 64, name: 'Reuse', moves: 4, chapter: 4,
        board: (() => {
            const b = createBoard(9, 5);
            setTile(b, 4, 2, TileType.ARROW_4WAY);
            setTile(b, 8, 2, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 0, y: 2, color: KnightColor.WHITE }],
        flags: [{ x: 8, y: 2, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: {}, boot: 0 }
    },

    // Level 65: Recycle - Reuse 4-way arrow multiple times
    {
        id: 65, name: 'Recycle', moves: 4, chapter: 4,
        board: (() => {
            const b = createBoard(11, 7);
            setTile(b, 5, 3, TileType.ARROW_4WAY);
            setTile(b, 10, 3, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 0, y: 3, color: KnightColor.WHITE }],
        flags: [{ x: 10, y: 3, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: {}, boot: 0 }
    },

    // Level 66: Unsynchronized - Traffic lights
    {
        id: 66, name: 'Unsynchronized', moves: 2, chapter: 4,
        board: (() => {
            const b = createBoard(7, 5);
            setTile(b, 3, 2, TileType.TRAFFIC_LIGHT_GREEN);
            setTile(b, 6, 2, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 0, y: 2, color: KnightColor.WHITE }],
        flags: [{ x: 6, y: 2, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: {}, boot: 0 },
        trafficLights: [{ x: 3, y: 2, initialState: 'green' }]
    },

    // Level 67: Wait - Traffic light timing
    {
        id: 67, name: 'Wait', moves: 2, chapter: 4,
        board: (() => {
            const b = createBoard(7, 5);
            setTile(b, 3, 2, TileType.TRAFFIC_LIGHT_RED);
            setTile(b, 6, 2, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 0, y: 2, color: KnightColor.WHITE }],
        flags: [{ x: 6, y: 2, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: {}, boot: 0 },
        canWait: true,
        trafficLights: [{ x: 3, y: 2, initialState: 'red' }]
    },

    // Level 68: Cycles - Multiple traffic lights
    {
        id: 68, name: 'Cycles', moves: 4, chapter: 4,
        board: (() => {
            const b = createBoard(9, 5);
            setTile(b, 3, 2, TileType.TRAFFIC_LIGHT_GREEN);
            setTile(b, 5, 2, TileType.TRAFFIC_LIGHT_RED);
            setTile(b, 8, 2, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 0, y: 2, color: KnightColor.WHITE }],
        flags: [{ x: 8, y: 2, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: {}, boot: 0 },
        canWait: true,
        trafficLights: [
            { x: 3, y: 2, initialState: 'green' },
            { x: 5, y: 2, initialState: 'red' }
        ]
    },

    // Level 69: Boots - Multiple boots
    {
        id: 69, name: 'Boots', moves: 1, chapter: 4,
        board: (() => {
            const b = createBoard(7, 5);
            setTile(b, 6, 2, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 0, y: 2, color: KnightColor.WHITE }],
        flags: [{ x: 6, y: 2, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: {}, boot: 2 }
    },

    // Level 70: Blink and you'll miss it - 0 moves
    {
        id: 70, name: 'Blink and you\'ll miss it', moves: 0, chapter: 4,
        board: (() => {
            const b = createBoard(5, 5);
            setTile(b, 2, 2, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 2, y: 2, color: KnightColor.WHITE }],
        flags: [{ x: 2, y: 2, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: {}, boot: 0 }
    },

    // Level 71: Multileveled - Verticality
    {
        id: 71, name: 'Multileveled', moves: 2, chapter: 4,
        board: (() => {
            const b = createBoard(7, 7);
            setTile(b, 3, 0, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 3, y: 6, color: KnightColor.WHITE }],
        flags: [{ x: 3, y: 0, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: { up: 1 }, boot: 0 }
    },

    // Level 72: Traffic - Complex traffic lights
    {
        id: 72, name: 'Traffic', moves: 4, chapter: 4,
        board: (() => {
            const b = createBoard(9, 7);
            setTile(b, 3, 3, TileType.TRAFFIC_LIGHT_GREEN);
            setTile(b, 5, 3, TileType.TRAFFIC_LIGHT_RED);
            setTile(b, 7, 3, TileType.TRAFFIC_LIGHT_GREEN);
            setTile(b, 8, 3, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 0, y: 3, color: KnightColor.WHITE }],
        flags: [{ x: 8, y: 3, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: {}, boot: 0 },
        canWait: true,
        trafficLights: [
            { x: 3, y: 3, initialState: 'green' },
            { x: 5, y: 3, initialState: 'red' },
            { x: 7, y: 3, initialState: 'green' }
        ]
    },

    // Level 73: Mind the Gap
    {
        id: 73, name: 'Mind the Gap', moves: 2, chapter: 4,
        board: (() => {
            const b = createBoard(9, 5);
            setTile(b, 4, 2, TileType.TRAFFIC_LIGHT_RED);
            setTile(b, 8, 2, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 0, y: 2, color: KnightColor.WHITE }],
        flags: [{ x: 8, y: 2, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: { right: 1 }, boot: 0 },
        canWait: true,
        trafficLights: [{ x: 4, y: 2, initialState: 'red' }]
    },

    // Level 74: Backboard
    {
        id: 74, name: 'Backboard', moves: 2, chapter: 4,
        board: (() => {
            const b = createBoard(7, 5);
            setTile(b, 3, 2, TileType.METAL);
            setTile(b, 6, 2, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 0, y: 2, color: KnightColor.WHITE }],
        flags: [{ x: 6, y: 2, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: { up: 1, right: 1 }, boot: 1 }
    },

    // Level 75: Tic Tac
    {
        id: 75, name: 'Tic Tac', moves: 3, chapter: 4,
        board: (() => {
            const b = createBoard(7, 7);
            setTile(b, 3, 3, TileType.TRAFFIC_LIGHT_GREEN);
            setTile(b, 3, 0, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 3, y: 6, color: KnightColor.WHITE }],
        flags: [{ x: 3, y: 0, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: {}, boot: 0 },
        canWait: true,
        trafficLights: [{ x: 3, y: 3, initialState: 'green' }]
    },

    // Level 76: Conveyor Belt - 0 moves, arrows do the work
    {
        id: 76, name: 'Conveyor Belt', moves: 0, chapter: 4,
        board: (() => {
            const b = createBoard(9, 5);
            setTile(b, 2, 2, TileType.ARROW_GREEN_RIGHT);
            setTile(b, 4, 2, TileType.ARROW_GREEN_RIGHT);
            setTile(b, 6, 2, TileType.ARROW_GREEN_RIGHT);
            setTile(b, 8, 2, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 0, y: 2, color: KnightColor.WHITE }],
        flags: [{ x: 8, y: 2, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: {}, boot: 0 }
    },

    // Level 77: Factory
    {
        id: 77, name: 'Factory', moves: 4, chapter: 4,
        board: (() => {
            const b = createBoard(11, 7);
            setTile(b, 3, 3, TileType.ARROW_BLUE_RIGHT);
            setTile(b, 5, 3, TileType.TRAFFIC_LIGHT_RED);
            setTile(b, 7, 3, TileType.ARROW_GREEN_RIGHT);
            setTile(b, 10, 3, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 0, y: 3, color: KnightColor.WHITE }],
        flags: [{ x: 10, y: 3, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: {}, boot: 0 },
        canWait: true,
        trafficLights: [{ x: 5, y: 3, initialState: 'red' }]
    },

    // Level 78: Factory 2
    {
        id: 78, name: 'Factory 2', moves: 4, chapter: 4,
        board: (() => {
            const b = createBoard(11, 7);
            setTile(b, 3, 3, TileType.ARROW_BLUE_RIGHT);
            setTile(b, 5, 3, TileType.TRAFFIC_LIGHT_RED);
            setTile(b, 7, 3, TileType.ARROW_BLUE_RIGHT);
            setTile(b, 10, 3, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 0, y: 3, color: KnightColor.WHITE }],
        flags: [{ x: 10, y: 3, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: {}, boot: 0 },
        canWait: true,
        trafficLights: [{ x: 5, y: 3, initialState: 'red' }]
    },

    // Level 79: Regicide - Complex multi-mechanic
    {
        id: 79, name: 'Regicide', moves: 21, chapter: 4,
        board: (() => {
            const b = createBoard(13, 9);
            setTile(b, 4, 4, TileType.BRICK);
            setTile(b, 6, 4, TileType.TRAFFIC_LIGHT_GREEN);
            setTile(b, 8, 4, TileType.ARROW_BLUE_RIGHT);
            setTile(b, 12, 4, TileType.FLAG);
            return b;
        })(),
        knights: [
            { x: 0, y: 4, color: KnightColor.WHITE, id: 'knight_white' },
            { x: 2, y: 4, color: KnightColor.BLACK, id: 'knight_black' }
        ],
        flags: [{ x: 12, y: 4, color: KnightColor.WHITE }],
        tools: { hammer: 1, arrows: { right: 2 }, boot: 1 },
        sharedMoves: true,
        trafficLights: [{ x: 6, y: 4, initialState: 'green' }]
    },

    // Level 80: Jailbreak 5
    {
        id: 80, name: 'Jailbreak 5', moves: 3, chapter: 4,
        board: (() => {
            const b = createBoard(9, 5);
            setTile(b, 3, 2, TileType.METAL);
            setTile(b, 4, 2, TileType.COIN);
            setTile(b, 5, 2, TileType.METAL);
            setTile(b, 4, 1, TileType.TRAFFIC_LIGHT_RED);
            setTile(b, 4, 3, TileType.TRAFFIC_LIGHT_RED);
            setTile(b, 8, 2, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 0, y: 2, color: KnightColor.WHITE }],
        flags: [{ x: 8, y: 2, color: KnightColor.WHITE }],
        coins: [{ x: 4, y: 2 }],
        tools: { hammer: 0, arrows: { up: 1 }, boot: 0 },
        canWait: true,
        trafficLights: [
            { x: 4, y: 1, initialState: 'red' },
            { x: 4, y: 3, initialState: 'red' }
        ]
    },

    // ============================================================
    // CHAPTER V: THE FAMILY (Levels 81-95)
    // ============================================================

    // Level 81: Pawn - Chess piece moves as knight
    {
        id: 81, name: 'Pawn', moves: 3, chapter: 5,
        board: (() => {
            const b = createBoard(7, 7);
            setTile(b, 3, 6, TileType.CHESS_PAWN);
            setTile(b, 6, 3, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 0, y: 3, color: KnightColor.WHITE }],
        flags: [{ x: 6, y: 3, color: KnightColor.WHITE }],
        chessPieces: [{ x: 3, y: 6, type: TileType.CHESS_PAWN, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: {}, boot: 0 }
    },

    // Level 82: Promotion - Pawn reaches end
    {
        id: 82, name: 'Promotion', moves: 5, chapter: 5,
        board: (() => {
            const b = createBoard(9, 9);
            setTile(b, 4, 8, TileType.CHESS_PAWN);
            setTile(b, 8, 4, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 0, y: 4, color: KnightColor.WHITE }],
        flags: [{ x: 8, y: 4, color: KnightColor.WHITE }],
        chessPieces: [{ x: 4, y: 8, type: TileType.CHESS_PAWN, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: {}, boot: 0 }
    },

    // Level 83: Bishop
    {
        id: 83, name: 'Bishop', moves: 5, chapter: 5,
        board: (() => {
            const b = createBoard(9, 9);
            setTile(b, 4, 0, TileType.CHESS_BISHOP);
            setTile(b, 8, 4, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 0, y: 4, color: KnightColor.WHITE }],
        flags: [{ x: 8, y: 4, color: KnightColor.WHITE }],
        chessPieces: [{ x: 4, y: 0, type: TileType.CHESS_BISHOP, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: {}, boot: 0 }
    },

    // Level 84: Rook
    {
        id: 84, name: 'Rook', moves: 3, chapter: 5,
        board: (() => {
            const b = createBoard(9, 9);
            setTile(b, 4, 4, TileType.CHESS_ROOK);
            setTile(b, 8, 4, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 0, y: 4, color: KnightColor.WHITE }],
        flags: [{ x: 8, y: 4, color: KnightColor.WHITE }],
        chessPieces: [{ x: 4, y: 4, type: TileType.CHESS_ROOK, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: {}, boot: 0 }
    },

    // Level 85: Queen
    {
        id: 85, name: 'Queen', moves: 2, chapter: 5,
        board: (() => {
            const b = createBoard(9, 9);
            setTile(b, 4, 4, TileType.CHESS_QUEEN);
            setTile(b, 8, 4, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 0, y: 4, color: KnightColor.WHITE }],
        flags: [{ x: 8, y: 4, color: KnightColor.WHITE }],
        chessPieces: [{ x: 4, y: 4, type: TileType.CHESS_QUEEN, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: {}, boot: 0 }
    },

    // Level 86: Black Sheep
    {
        id: 86, name: 'Black Sheep', moves: 3, chapter: 5,
        board: (() => {
            const b = createBoard(9, 7);
            setTile(b, 4, 3, TileType.CHESS_KNIGHT); // Black knight piece
            setTile(b, 8, 3, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 0, y: 3, color: KnightColor.WHITE }],
        flags: [{ x: 8, y: 3, color: KnightColor.WHITE }],
        chessPieces: [{ x: 4, y: 3, type: TileType.CHESS_KNIGHT, color: KnightColor.BLACK }],
        tools: { hammer: 0, arrows: {}, boot: 0 }
    },

    // Level 87: Crowd - Many chess pieces
    {
        id: 87, name: 'Crowd', moves: 4, chapter: 5,
        board: (() => {
            const b = createBoard(11, 9);
            setTile(b, 3, 3, TileType.CHESS_PAWN);
            setTile(b, 5, 3, TileType.CHESS_BISHOP);
            setTile(b, 7, 3, TileType.CHESS_ROOK);
            setTile(b, 10, 4, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 0, y: 4, color: KnightColor.WHITE }],
        flags: [{ x: 10, y: 4, color: KnightColor.WHITE }],
        chessPieces: [
            { x: 3, y: 3, type: TileType.CHESS_PAWN, color: KnightColor.WHITE },
            { x: 5, y: 3, type: TileType.CHESS_BISHOP, color: KnightColor.WHITE },
            { x: 7, y: 3, type: TileType.CHESS_ROOK, color: KnightColor.WHITE }
        ],
        tools: { hammer: 0, arrows: { right: 1 }, boot: 0 }
    },

    // Level 88: Dash
    {
        id: 88, name: 'Dash', moves: 2, chapter: 5,
        board: (() => {
            const b = createBoard(7, 5);
            setTile(b, 3, 2, TileType.CHESS_QUEEN);
            setTile(b, 6, 2, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 0, y: 2, color: KnightColor.WHITE }],
        flags: [{ x: 6, y: 2, color: KnightColor.WHITE }],
        chessPieces: [{ x: 3, y: 2, type: TileType.CHESS_QUEEN, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: {}, boot: 0 }
    },

    // Level 89: Convert
    {
        id: 89, name: 'Convert', moves: 2, chapter: 5,
        board: (() => {
            const b = createBoard(9, 5);
            setTile(b, 2, 2, TileType.CHESS_PAWN);
            setTile(b, 8, 2, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 0, y: 2, color: KnightColor.WHITE }],
        flags: [{ x: 8, y: 2, color: KnightColor.WHITE }],
        chessPieces: [{ x: 2, y: 2, type: TileType.CHESS_PAWN, color: KnightColor.BLACK }],
        tools: { hammer: 0, arrows: { right: 1 }, boot: 0 }
    },

    // Level 90: Pawn?
    {
        id: 90, name: 'Pawn?', moves: 3, chapter: 5,
        board: (() => {
            const b = createBoard(9, 7);
            setTile(b, 4, 6, TileType.CHESS_PAWN);
            setTile(b, 8, 3, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 0, y: 3, color: KnightColor.WHITE }],
        flags: [{ x: 8, y: 3, color: KnightColor.WHITE }],
        chessPieces: [{ x: 4, y: 6, type: TileType.CHESS_PAWN, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: {}, boot: 0 }
    },

    // Level 91: Bishop?
    {
        id: 91, name: 'Bishop?', moves: 3, chapter: 5,
        board: (() => {
            const b = createBoard(9, 9);
            setTile(b, 4, 0, TileType.CHESS_BISHOP);
            setTile(b, 8, 4, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 0, y: 4, color: KnightColor.WHITE }],
        flags: [{ x: 8, y: 4, color: KnightColor.WHITE }],
        chessPieces: [{ x: 4, y: 0, type: TileType.CHESS_BISHOP, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: {}, boot: 0 }
    },

    // Level 92: Rook?
    {
        id: 92, name: 'Rook?', moves: 3, chapter: 5,
        board: (() => {
            const b = createBoard(9, 9);
            setTile(b, 4, 4, TileType.CHESS_ROOK);
            setTile(b, 8, 4, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 0, y: 4, color: KnightColor.WHITE }],
        flags: [{ x: 8, y: 4, color: KnightColor.WHITE }],
        chessPieces: [{ x: 4, y: 4, type: TileType.CHESS_ROOK, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: {}, boot: 0 }
    },

    // Level 93: Queen?
    {
        id: 93, name: 'Queen?', moves: 3, chapter: 5,
        board: (() => {
            const b = createBoard(9, 9);
            setTile(b, 4, 4, TileType.CHESS_QUEEN);
            setTile(b, 8, 4, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 0, y: 4, color: KnightColor.WHITE }],
        flags: [{ x: 8, y: 4, color: KnightColor.WHITE }],
        chessPieces: [{ x: 4, y: 4, type: TileType.CHESS_QUEEN, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: {}, boot: 0 }
    },

    // Level 94: Wait...
    {
        id: 94, name: 'Wait...', moves: 5, chapter: 5,
        board: (() => {
            const b = createBoard(11, 7);
            setTile(b, 5, 3, TileType.TRAFFIC_LIGHT_RED);
            setTile(b, 4, 3, TileType.CHESS_QUEEN);
            setTile(b, 10, 3, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 0, y: 3, color: KnightColor.WHITE }],
        flags: [{ x: 10, y: 3, color: KnightColor.WHITE }],
        chessPieces: [{ x: 4, y: 3, type: TileType.CHESS_QUEEN, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: {}, boot: 0 },
        canWait: true,
        trafficLights: [{ x: 5, y: 3, initialState: 'red' }]
    },

    // Level 95: Always Has Been - Chapter twist
    {
        id: 95, name: 'Always Has Been', moves: 5, chapter: 5,
        board: (() => {
            const b = createBoard(11, 7);
            setTile(b, 5, 3, TileType.CHESS_KING);
            setTile(b, 10, 3, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 0, y: 3, color: KnightColor.WHITE }],
        flags: [{ x: 10, y: 3, color: KnightColor.WHITE }],
        chessPieces: [{ x: 5, y: 3, type: TileType.CHESS_KING, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: {}, boot: 0 }
    },

    // ============================================================
    // CHAPTER VI: PLAYTESTERS' PUZZLES (Levels 96-100)
    // ============================================================

    // Level 96: Evil Twin - Must destroy knight if reachable by bomb
    {
        id: 96, name: 'Evil Twin', moves: 5, chapter: 6,
        board: (() => {
            const b = createBoard(9, 5);
            setTile(b, 3, 2, TileType.BUTTON);
            setTile(b, 2, 2, TileType.BOMB);
            setTile(b, 4, 2, TileType.KNIGHT_BLACK); // Enemy knight on bomb
            setTile(b, 8, 2, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 0, y: 2, color: KnightColor.WHITE }],
        flags: [{ x: 8, y: 2, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: {}, boot: 0 },
        buttons: [{ x: 3, y: 2 }],
        bombs: [{ x: 2, y: 2 }],
        enemyKnights: [{ x: 4, y: 2, color: KnightColor.BLACK }],
        mustDestroyEnemy: true
    },

    // Level 97: Heist 5
    {
        id: 97, name: 'Heist 5', moves: 10, chapter: 6,
        board: (() => {
            const b = createBoard(13, 9);
            setTile(b, 3, 2, TileType.COIN);
            setTile(b, 3, 6, TileType.COIN);
            setTile(b, 9, 2, TileType.COIN);
            setTile(b, 9, 6, TileType.COIN);
            setTile(b, 12, 4, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 0, y: 4, color: KnightColor.WHITE }],
        flags: [{ x: 12, y: 4, color: KnightColor.WHITE }],
        coins: [{ x: 3, y: 2 }, { x: 3, y: 6 }, { x: 9, y: 2 }, { x: 9, y: 6 }],
        tools: { hammer: 1, arrows: { right: 2, up: 1, down: 1 }, boot: 0 }
    },

    // Level 98: Jailbreak 6
    {
        id: 98, name: 'Jailbreak 6', moves: 4, chapter: 6,
        board: (() => {
            const b = createBoard(9, 7);
            setTile(b, 3, 3, TileType.METAL);
            setTile(b, 4, 3, TileType.COIN);
            setTile(b, 5, 3, TileType.METAL);
            setTile(b, 4, 2, TileType.METAL);
            setTile(b, 4, 4, TileType.METAL);
            setTile(b, 8, 3, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 0, y: 3, color: KnightColor.WHITE }],
        flags: [{ x: 8, y: 3, color: KnightColor.WHITE }],
        coins: [{ x: 4, y: 3 }],
        tools: { hammer: 0, arrows: { up: 1, right: 1 }, boot: 0 }
    },

    // Level 99: A Crazy Idea - Blue arrow destroys cracked
    {
        id: 99, name: 'A Crazy Idea', moves: 5, chapter: 6,
        board: (() => {
            const b = createBoard(11, 5);
            setTile(b, 3, 2, TileType.ARROW_BLUE_RIGHT);
            setTile(b, 5, 2, TileType.CRACKED);
            setTile(b, 7, 2, TileType.CRACKED);
            setTile(b, 10, 2, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 0, y: 2, color: KnightColor.WHITE }],
        flags: [{ x: 10, y: 2, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: {}, boot: 0 }
    },

    // Level 100: This behavior was undefined
    {
        id: 100, name: 'This behavior was undefined', moves: 2, chapter: 6,
        board: (() => {
            const b = createBoard(7, 5);
            setTile(b, 3, 2, TileType.BRICK);
            setTile(b, 6, 2, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 0, y: 2, color: KnightColor.WHITE }],
        flags: [{ x: 6, y: 2, color: KnightColor.WHITE }],
        tools: { hammer: 1, arrows: { right: 1 }, boot: 0 },
        undefinedBehavior: true // Edge case puzzle
    },

    // ============================================================
    // CHAPTER VII: LONG DISTANCE (Levels 101-120)
    // ============================================================

    // Level 101: Closet - Portals
    {
        id: 101, name: 'Closet', moves: 4, chapter: 7,
        board: (() => {
            const b = createBoard(9, 5);
            setTile(b, 2, 2, TileType.PORTAL_RED);
            setTile(b, 6, 2, TileType.PORTAL_RED);
            setTile(b, 8, 2, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 0, y: 2, color: KnightColor.WHITE }],
        flags: [{ x: 8, y: 2, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: {}, boot: 0 },
        portals: [
            { x: 2, y: 2, color: 'red', linkedPortal: { x: 6, y: 2 } },
            { x: 6, y: 2, color: 'red', linkedPortal: { x: 2, y: 2 } }
        ],
        globalTools: true // Tools persist across levels
    },

    // Level 102: Closet 2
    {
        id: 102, name: 'Closet 2', moves: 1, chapter: 7,
        board: (() => {
            const b = createBoard(7, 5);
            setTile(b, 2, 2, TileType.PORTAL_BLUE);
            setTile(b, 6, 2, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 0, y: 2, color: KnightColor.WHITE }],
        flags: [{ x: 6, y: 2, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: {}, boot: 0 },
        portals: [
            { x: 2, y: 2, color: 'blue', linkedPortal: { x: 4, y: 2, level: 101 } }, // Cross-level portal
            { x: 4, y: 2, color: 'blue', linkedPortal: { x: 2, y: 2, level: 102 } }
        ],
        globalTools: true
    },

    // Level 103: Teleportation
    {
        id: 103, name: 'Teleportation', moves: 2, chapter: 7,
        board: (() => {
            const b = createBoard(9, 5);
            setTile(b, 2, 2, TileType.PORTAL_GREEN);
            setTile(b, 6, 2, TileType.PORTAL_GREEN);
            setTile(b, 8, 2, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 0, y: 2, color: KnightColor.WHITE }],
        flags: [{ x: 8, y: 2, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: {}, boot: 0 },
        portals: [
            { x: 2, y: 2, color: 'green', linkedPortal: { x: 6, y: 2 } },
            { x: 6, y: 2, color: 'green', linkedPortal: { x: 2, y: 2 } }
        ],
        globalTools: true
    },

    // Level 104: Return - Stand on portal to return
    {
        id: 104, name: 'Return', moves: 3, chapter: 7,
        board: (() => {
            const b = createBoard(9, 5);
            setTile(b, 2, 2, TileType.PORTAL_YELLOW);
            setTile(b, 6, 2, TileType.PORTAL_YELLOW);
            setTile(b, 8, 2, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 0, y: 2, color: KnightColor.WHITE }],
        flags: [{ x: 8, y: 2, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: {}, boot: 0 },
        portals: [
            { x: 2, y: 2, color: 'yellow', linkedPortal: { x: 6, y: 2 } },
            { x: 6, y: 2, color: 'yellow', linkedPortal: { x: 2, y: 2 } }
        ],
        globalTools: true,
        portalReturnOnWait: true
    },

    // Level 105: Wormhole
    {
        id: 105, name: 'Wormhole', moves: 3, chapter: 7,
        board: (() => {
            const b = createBoard(11, 7);
            setTile(b, 2, 3, TileType.PORTAL_PURPLE);
            setTile(b, 8, 3, TileType.PORTAL_PURPLE);
            setTile(b, 10, 3, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 0, y: 3, color: KnightColor.WHITE }],
        flags: [{ x: 10, y: 3, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: {}, boot: 0 },
        portals: [
            { x: 2, y: 3, color: 'purple', linkedPortal: { x: 8, y: 3 } },
            { x: 8, y: 3, color: 'purple', linkedPortal: { x: 2, y: 3 } }
        ],
        globalTools: true
    },

    // Level 106: Wormhole 2
    {
        id: 106, name: 'Wormhole 2', moves: 7, chapter: 7,
        board: (() => {
            const b = createBoard(13, 9);
            setTile(b, 2, 4, TileType.PORTAL_ORANGE);
            setTile(b, 10, 4, TileType.PORTAL_ORANGE);
            setTile(b, 12, 4, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 0, y: 4, color: KnightColor.WHITE }],
        flags: [{ x: 12, y: 4, color: KnightColor.WHITE }],
        tools: { hammer: 1, arrows: { right: 1 }, boot: 0 },
        portals: [
            { x: 2, y: 4, color: 'orange', linkedPortal: { x: 10, y: 4 } },
            { x: 10, y: 4, color: 'orange', linkedPortal: { x: 2, y: 4 } }
        ],
        globalTools: true
    },

    // Level 107: Portal Gun - Place portals
    {
        id: 107, name: 'Portal Gun', moves: 4, chapter: 7,
        board: (() => {
            const b = createBoard(11, 7);
            setTile(b, 10, 3, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 0, y: 3, color: KnightColor.WHITE }],
        flags: [{ x: 10, y: 3, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: {}, boot: 0, portalGun: 2 }, // Place 2 portals
        globalTools: true,
        canPlacePortals: true
    },

    // Level 108: Trade
    {
        id: 108, name: 'Trade', moves: 2, chapter: 7,
        board: (() => {
            const b = createBoard(9, 5);
            setTile(b, 2, 2, TileType.PORTAL_RED);
            setTile(b, 6, 2, TileType.PORTAL_RED);
            setTile(b, 8, 2, TileType.FLAG);
            return b;
        })(),
        knights: [
            { x: 0, y: 2, color: KnightColor.WHITE, id: 'knight_white' },
            { x: 4, y: 2, color: KnightColor.BLACK, id: 'knight_black' }
        ],
        flags: [
            { x: 8, y: 2, color: KnightColor.WHITE },
            { x: 8, y: 2, color: KnightColor.BLACK }
        ],
        tools: { hammer: 0, arrows: {}, boot: 0 },
        portals: [
            { x: 2, y: 2, color: 'red', linkedPortal: { x: 6, y: 2 } },
            { x: 6, y: 2, color: 'red', linkedPortal: { x: 2, y: 2 } }
        ],
        sharedMoves: true,
        globalTools: true
    },

    // Level 109: Exchange
    {
        id: 109, name: 'Exchange', moves: 2, chapter: 7,
        board: (() => {
            const b = createBoard(9, 5);
            setTile(b, 2, 2, TileType.PORTAL_BLUE);
            setTile(b, 6, 2, TileType.PORTAL_BLUE);
            setTile(b, 8, 2, TileType.FLAG);
            return b;
        })(),
        knights: [
            { x: 0, y: 2, color: KnightColor.WHITE, id: 'knight_white' },
            { x: 4, y: 2, color: KnightColor.BLACK, id: 'knight_black' }
        ],
        flags: [
            { x: 8, y: 2, color: KnightColor.WHITE },
            { x: 8, y: 2, color: KnightColor.BLACK }
        ],
        tools: { hammer: 0, arrows: {}, boot: 0 },
        portals: [
            { x: 2, y: 2, color: 'blue', linkedPortal: { x: 6, y: 2 } },
            { x: 6, y: 2, color: 'blue', linkedPortal: { x: 2, y: 2 } }
        ],
        sharedMoves: true,
        globalTools: true
    },

    // Level 110: Tether - Two knights connected
    {
        id: 110, name: 'Tether', moves: 1, chapter: 7,
        board: (() => {
            const b = createBoard(7, 5);
            setTile(b, 6, 1, TileType.FLAG);
            setTile(b, 6, 3, TileType.FLAG);
            return b;
        })(),
        knights: [
            { x: 0, y: 1, color: KnightColor.WHITE, id: 'knight_white' },
            { x: 0, y: 3, color: KnightColor.BLACK, id: 'knight_black' }
        ],
        flags: [
            { x: 6, y: 1, color: KnightColor.WHITE },
            { x: 6, y: 3, color: KnightColor.BLACK }
        ],
        tools: { hammer: 0, arrows: {}, boot: 0 },
        tethers: [{ knightA: 'knight_white', knightB: 'knight_black' }],
        sharedMoves: true,
        globalTools: true
    },

    // Level 111: Slack - Tether with slack
    {
        id: 111, name: 'Slack', moves: 1, chapter: 7,
        board: (() => {
            const b = createBoard(9, 5);
            setTile(b, 8, 1, TileType.FLAG);
            setTile(b, 8, 3, TileType.FLAG);
            return b;
        })(),
        knights: [
            { x: 0, y: 1, color: KnightColor.WHITE, id: 'knight_white' },
            { x: 2, y: 3, color: KnightColor.BLACK, id: 'knight_black' }
        ],
        flags: [
            { x: 8, y: 1, color: KnightColor.WHITE },
            { x: 8, y: 3, color: KnightColor.BLACK }
        ],
        tools: { hammer: 0, arrows: {}, boot: 0 },
        tethers: [{ knightA: 'knight_white', knightB: 'knight_black', length: 2 }],
        sharedMoves: true,
        globalTools: true
    },

    // Level 112: Split - Tether breaks on brick
    {
        id: 112, name: 'Split', moves: 2, chapter: 7,
        board: (() => {
            const b = createBoard(9, 5);
            setTile(b, 4, 2, TileType.BRICK);
            setTile(b, 8, 1, TileType.FLAG);
            setTile(b, 8, 3, TileType.FLAG);
            return b;
        })(),
        knights: [
            { x: 0, y: 1, color: KnightColor.WHITE, id: 'knight_white' },
            { x: 0, y: 3, color: KnightColor.BLACK, id: 'knight_black' }
        ],
        flags: [
            { x: 8, y: 1, color: KnightColor.WHITE },
            { x: 8, y: 3, color: KnightColor.BLACK }
        ],
        tools: { hammer: 0, arrows: { right: 1 }, boot: 0 },
        tethers: [{ knightA: 'knight_white', knightB: 'knight_black' }],
        sharedMoves: true,
        globalTools: true
    },

    // Level 113: Snap
    {
        id: 113, name: 'Snap', moves: 3, chapter: 7,
        board: (() => {
            const b = createBoard(11, 7);
            setTile(b, 5, 3, TileType.BRICK);
            setTile(b, 10, 1, TileType.FLAG);
            setTile(b, 10, 5, TileType.FLAG);
            return b;
        })(),
        knights: [
            { x: 0, y: 1, color: KnightColor.WHITE, id: 'knight_white' },
            { x: 0, y: 5, color: KnightColor.BLACK, id: 'knight_black' }
        ],
        flags: [
            { x: 10, y: 1, color: KnightColor.WHITE },
            { x: 10, y: 5, color: KnightColor.BLACK }
        ],
        tools: { hammer: 1, arrows: { right: 1 }, boot: 0 },
        tethers: [{ knightA: 'knight_white', knightB: 'knight_black' }],
        sharedMoves: true,
        globalTools: true
    },

    // Level 114: Overshoot
    {
        id: 114, name: 'Overshoot', moves: 2, chapter: 7,
        board: (() => {
            const b = createBoard(9, 5);
            setTile(b, 8, 2, TileType.FLAG);
            return b;
        })(),
        knights: [
            { x: 0, y: 2, color: KnightColor.WHITE, id: 'knight_white' },
            { x: 2, y: 2, color: KnightColor.BLACK, id: 'knight_black' }
        ],
        flags: [{ x: 8, y: 2, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: { right: 1 }, boot: 0 },
        tethers: [{ knightA: 'knight_white', knightB: 'knight_black' }],
        sharedMoves: true,
        globalTools: true
    },

    // Level 115: Tension
    {
        id: 115, name: 'Tension', moves: 3, chapter: 7,
        board: (() => {
            const b = createBoard(11, 5);
            setTile(b, 5, 2, TileType.BRICK);
            setTile(b, 10, 2, TileType.FLAG);
            return b;
        })(),
        knights: [
            { x: 0, y: 2, color: KnightColor.WHITE, id: 'knight_white' },
            { x: 2, y: 2, color: KnightColor.BLACK, id: 'knight_black' }
        ],
        flags: [{ x: 10, y: 2, color: KnightColor.WHITE }],
        tools: { hammer: 1, arrows: { right: 1 }, boot: 0 },
        tethers: [{ knightA: 'knight_white', knightB: 'knight_black' }],
        sharedMoves: true,
        globalTools: true
    },

    // Level 116: Hold on Tight
    {
        id: 116, name: 'Hold on Tight', moves: 2, chapter: 7,
        board: (() => {
            const b = createBoard(9, 7);
            setTile(b, 8, 1, TileType.FLAG);
            setTile(b, 8, 5, TileType.FLAG);
            return b;
        })(),
        knights: [
            { x: 0, y: 1, color: KnightColor.WHITE, id: 'knight_white' },
            { x: 0, y: 5, color: KnightColor.BLACK, id: 'knight_black' }
        ],
        flags: [
            { x: 8, y: 1, color: KnightColor.WHITE },
            { x: 8, y: 5, color: KnightColor.BLACK }
        ],
        tools: { hammer: 0, arrows: { right: 1, up: 1, down: 1 }, boot: 0 },
        tethers: [{ knightA: 'knight_white', knightB: 'knight_black', length: 4 }],
        sharedMoves: true,
        globalTools: true
    },

    // Level 117: Divide
    {
        id: 117, name: 'Divide', moves: 8, chapter: 7,
        board: (() => {
            const b = createBoard(13, 9);
            setTile(b, 6, 4, TileType.BRICK);
            setTile(b, 12, 2, TileType.FLAG);
            setTile(b, 12, 6, TileType.FLAG);
            return b;
        })(),
        knights: [
            { x: 0, y: 2, color: KnightColor.WHITE, id: 'knight_white' },
            { x: 0, y: 6, color: KnightColor.BLACK, id: 'knight_black' }
        ],
        flags: [
            { x: 12, y: 2, color: KnightColor.WHITE },
            { x: 12, y: 6, color: KnightColor.BLACK }
        ],
        tools: { hammer: 1, arrows: { right: 2 }, boot: 0 },
        tethers: [{ knightA: 'knight_white', knightB: 'knight_black' }],
        sharedMoves: true,
        globalTools: true
    },

    // Level 118: Chain - Multiple tethers
    {
        id: 118, name: 'Chain', moves: 3, chapter: 7,
        board: (() => {
            const b = createBoard(11, 7);
            setTile(b, 10, 1, TileType.FLAG);
            setTile(b, 10, 3, TileType.FLAG);
            setTile(b, 10, 5, TileType.FLAG);
            return b;
        })(),
        knights: [
            { x: 0, y: 1, color: KnightColor.WHITE, id: 'knight_white' },
            { x: 0, y: 3, color: KnightColor.BLACK, id: 'knight_black' },
            { x: 0, y: 5, color: KnightColor.RED, id: 'knight_red' }
        ],
        flags: [
            { x: 10, y: 1, color: KnightColor.WHITE },
            { x: 10, y: 3, color: KnightColor.BLACK },
            { x: 10, y: 5, color: KnightColor.RED }
        ],
        tools: { hammer: 0, arrows: { right: 1 }, boot: 0 },
        tethers: [
            { knightA: 'knight_white', knightB: 'knight_black' },
            { knightA: 'knight_black', knightB: 'knight_red' }
        ],
        sharedMoves: true,
        globalTools: true
    },

    // Level 119: Almost there!
    {
        id: 119, name: 'Almost there!', moves: 11, chapter: 7,
        board: (() => {
            const b = createBoard(13, 9);
            setTile(b, 6, 4, TileType.PORTAL_RED);
            setTile(b, 10, 4, TileType.PORTAL_RED);
            setTile(b, 12, 4, TileType.FLAG);
            return b;
        })(),
        knights: [
            { x: 0, y: 4, color: KnightColor.WHITE, id: 'knight_white' },
            { x: 2, y: 4, color: KnightColor.BLACK, id: 'knight_black' }
        ],
        flags: [{ x: 12, y: 4, color: KnightColor.WHITE }],
        tools: { hammer: 1, arrows: { right: 1 }, boot: 0 },
        portals: [
            { x: 6, y: 4, color: 'red', linkedPortal: { x: 10, y: 4 } },
            { x: 10, y: 4, color: 'red', linkedPortal: { x: 6, y: 4 } }
        ],
        tethers: [{ knightA: 'knight_white', knightB: 'knight_black' }],
        sharedMoves: true,
        globalTools: true
    },

    // Level 120: White - Final level
    {
        id: 120, name: 'White', moves: 2, chapter: 7,
        board: (() => {
            const b = createBoard(7, 7);
            setTile(b, 3, 0, TileType.FLAG);
            return b;
        })(),
        knights: [{ x: 3, y: 6, color: KnightColor.WHITE }],
        flags: [{ x: 3, y: 0, color: KnightColor.WHITE }],
        tools: { hammer: 0, arrows: { up: 1 }, boot: 0 },
        globalTools: true
    },

    // Level 121: Abstract Void - Non-rectangular board with holes (Bonus)
    {
        id: 121, name: 'Abstract Void', moves: 15, chapter: 7,
        board: (() => {
            const b = createBoard(11, 11, TileType.NORMAL);
            // Create a cross shape with void holes
            // Center void hole
            setTile(b, 5, 5, TileType.EMPTY);
            // Four corner void holes
            setTile(b, 2, 2, TileType.EMPTY);
            setTile(b, 8, 2, TileType.EMPTY);
            setTile(b, 2, 8, TileType.EMPTY);
            setTile(b, 8, 8, TileType.EMPTY);
            // Additional void to make it abstract
            setTile(b, 5, 1, TileType.EMPTY);
            setTile(b, 5, 9, TileType.EMPTY);
            setTile(b, 1, 5, TileType.EMPTY);
            setTile(b, 9, 5, TileType.EMPTY);
            // Flag at center-right
            setTile(b, 9, 5, TileType.FLAG); // This will overwrite the void above
            // Actually place flag at a valid spot
            setTile(b, 7, 5, TileType.FLAG);
            // Some cracked tiles for challenge
            setTile(b, 4, 5, TileType.CRACKED);
            setTile(b, 6, 5, TileType.CRACKED);
            setTile(b, 5, 4, TileType.CRACKED);
            setTile(b, 5, 6, TileType.CRACKED);
            // Brick walls
            setTile(b, 3, 5, TileType.BRICK);
            setTile(b, 5, 3, TileType.BRICK);
            return b;
        })(),
        knights: [{ x: 5, y: 0, color: KnightColor.WHITE }],
        flags: [{ x: 7, y: 5, color: KnightColor.WHITE }],
        tools: { hammer: 3, arrows: { down: 1, right: 1 }, boot: 0 },
        globalTools: true
    }
];

// ============================================================================
// LEVEL LOOKUP
// ============================================================================

export function getLevel(id) {
    return Levels.find(l => l.id === id);
}

export function getLevelsByChapter(chapter) {
    return Levels.filter(l => l.chapter === chapter);
}

export function getTotalLevels() {
    return Levels.length;
}

export function getChapterInfo(chapter) {
    return Chapters[chapter];
}