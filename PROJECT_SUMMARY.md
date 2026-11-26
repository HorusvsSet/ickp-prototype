# ICKP (120 Increasingly Cursed Knight Puzzles) - Project Summary

## Overview
ICKP is a chess-knight puzzle game with **121 levels across 7 chapters**, featuring increasingly complex mechanics. The game uses vanilla JavaScript (ES6 modules) with Canvas 2D rendering, and includes a full-featured level editor.

---

## Project Structure

```
ickp/
├── actual/                    # Main working project
│   ├── index.html             # Main game page
│   ├── editor.html            # Level editor (standalone page)
│   ├── game.js                # Main game entry point
│   ├── engine.js              # Core game logic
│   ├── renderer.js            # Canvas rendering engine
│   ├── levels.js              # All 121 level definitions + constants
│   ├── styles.css             # Shared CSS design system
│   └── start_server_actual.py # Local dev server (port 9999)
├── backup_0/                  # Original backup (contains 120 ICKP v1.1.pdf)
├── backup_1/                  # Intermediate backup
├── backup_2/                  # (Created during development)
├── backup_3/                  # Latest backup before editor overhaul
└── 120 ICKP v1.1.pdf         # Source design document
```

---

## Game Mechanics

### Core Movement
- **Knight moves**: 8 L-shapes (±2,±1)/(±1,±2)
- **Dual-path wall collision**: Knight checks both elbow paths; blocked if either path hits wall
- **Move counter**: Limited moves per level

### Tile Types (from `levels.js` TileType enum)
| ID | Type | Description |
|----|------|-------------|
| 0 | EMPTY | Void/hole - knight falls |
| 1 | NORMAL | Standard walkable tile |
| 2 | BRICK | Destructible by hammer |
| 3 | METAL | Indestructible |
| 4 | CRACKED | Breaks after one landing |
| 5 | COIN | Collectible (must collect all) |
| 6 | FLAG | Goal tile (color-matched) |
| 7-10 | GREEN ARROWS | Push knight 1 space (↑→↓←) |
| 11-14 | BLUE ARROWS | Push knight 2 spaces (↑→↓←), bounce off walls, crack middle tile |
| 15-22 | VOID ARROWS | Off-board continuous push |
| 23 | 4-WAY ARROW | Pushes in all 4 directions |
| 24-29 | PORTALS | Colored portal pairs (red, blue, green, yellow, purple, orange) |
| 30 | BUTTON | Activates targets when stood on |
| 31 | BOMB | Explodes when triggered |
| 32-33 | TRAFFIC LIGHTS | Green=pass, Red=block |
| 34-38 | CHESS PIECES | Pawn, Bishop, Rook, Queen, King |

### Special Mechanics
- **Void system**: EMPTY tiles = off-board void; knights stuck in void can escape via hammer/arrow
- **Arrow mechanics**:
  - Green: 1-space push
  - Blue: 2-space push, mid-tile becomes CRACKED, bounces off walls
  - Void arrows: Continuous push until hitting tile
- **Hammer**: Destroys BRICK, builds NORMAL on EMPTY/void
- **Boot**: Orthogonal 1-space move
- **Portal Gun**: Creates linked portal pairs
- **Global tools** (Ch 7+): Tools persist across levels

### Win Conditions
- All knights reach matching-color flags
- All coins collected (if any)

---

## Chapter Structure (121 Levels)

| Chapter | Name | Levels | Range | Key Mechanics |
|---------|------|--------|-------|---------------|
| 1 | The Basics | 35 | 1-35 | Knight movement, arrows (green/blue), hammer, void, coins, walls |
| 2 | Knights, Plural | 20 | 36-55 | Multiple knights, shared moves, carrying, buttons, bombs |
| 3 | The Knight's Friends | 5 | 56-60 | Portal gun, advanced portals |
| 4 | Advanced Chess | 20 | 61-80 | Chess pieces, traffic lights, boots, conveyors |
| 5 | The Family | 15 | 81-95 | All chess pieces, color-coded flags |
| 6 | Playtesters' Puzzles | 5 | 96-100 | Community submissions |
| 7 | Long Distance | 21 | 101-121 | Portals, tethers, long-distance mechanics |

---

## Technical Architecture

### Module System (ES6)
```javascript
// levels.js exports:
TileType, Dir, KnightColor, ToolType, Chapters, Levels, getLevel, getLevelsByChapter
```

### Core Files

#### `engine.js` - Game Logic
- `GameEngine` class: State management, input handling, move validation
- Knight movement with dual-path collision detection
- Arrow push mechanics (green/blue/void)
- Void traversal and escape logic
- Hammer build/destroy
- Coin collection, flag capture
- Portal teleportation
- Button/bomb logic
- Chess piece movement
- Traffic light toggling
- Tether mechanics (Ch 7)
- 100-state undo history
- Auto-save to localStorage

#### `renderer.js` - Canvas 2D Rendering
- Device pixel ratio support for crisp high-DPI
- Smooth animations: knight moves, arrow pushes, screen shake, particles
- Tile rendering with distinct visual styles per type
- Entity rendering (knights, flags, coins, portals, etc.)
- UI: move counter, tool inventory, status messages

#### `game.js` - Entry Point
- Canvas setup and resize handling
- Level loading (built-in + custom from localStorage)
- Test level support via `?test=1` URL param
- Keyboard/mouse input routing
- Win/lose detection and modal handling

#### `levels.js` - Level Data
- **Constants**: TileType, Dir, KnightColor, ToolType, Chapters
- **121 Level definitions**: Each with board, entities, tools, metadata
- Helper functions: `createBoard`, `setTile`, `getLevel`, `getLevelsByChapter`

---

## Level Editor (`editor.html`)

### Features
- **Chapter-based palette** (right sidebar): 7 chapters with organized tiles/entities/tools
- **Freeform grid drawing** (center): Paint tiles to create any shape
- **Grid**: Max 18×18 (8×8 playable + 5 void border each side), resizable
- **Tools**: Pencil, Eraser, Select/Move
- **Zoom/Pan**: Mouse wheel + Ctrl, Middle-click drag
- **Undo/Redo**: 50-state history
- **Level metadata**: Name, chapter, max moves
- **Import/Export**: JSON file or clipboard
- **Test Play**: Opens level in game via sessionStorage
- **Real-time rendering**: Uses same `drawTile`/`drawEntity` as game

### Palette Organization (CHAPTER_PALETTES)
| Chapter | Contents |
|---------|----------|
| 1 | Normal, Cracked, Void, Knights (6 colors), Flags (6 colors), Coin |
| 2 | Brick, Metal, Green Arrows (4 dirs) |
| 3 | Blue Arrows (4 dirs), 4-Way Arrow |
| 4 | Portals (6 colors), Button, Bomb |
| 5 | Chess pieces (5), Traffic lights (2) |
| 6 | Void Arrows (4 dirs) |
| 7 | Hammer, Boot, Arrows (4 dirs), Portal Gun |

### Data Persistence
- Custom levels saved to `localStorage.ickp_custom_levels`
- Exported as JSON matching `levels.js` format

---

## Visual Design System (styles.css)

### CSS Custom Properties
```css
:root {
  --bg: #0a0a14;
  --panel: #16213e;
  --border: #2a3a5a;
  --accent: #00d4aa;      /* Teal - primary */
  --text: #e8e8f0;
  --text-dim: #8a8ab8;
  --danger: #ff6b6b;
  --warning: #ffd93d;
  --info: #6bcbff;
}
```

### Typography
- **Display**: 'Press Start 2P' (retro pixel font)
- **UI/Code**: 'JetBrains Mono' (monospace)

### Key Components
- `.btn` / `.btn.primary` / `.btn.danger` / `.btn.ghost`
- `.tool-btn` with keyboard hint (`.kbd`)
- `.modal-overlay` / `.modal`
- `.toast` notifications
- `.status-dot` with pulse animation

---

## Development Workflow

### Local Server
```bash
cd actual && python start_server_actual.py
# Serves at http://localhost:9999/
# Game: http://localhost:9999/
# Editor: http://localhost:9999/editor.html
```

### GitHub Pages Deployment
```bash
# Using gh CLI (configured in project)
gh repo create ickp --public --source=. --push
# Enable Pages in repo settings -> Deploy from main branch
```

### Key Commands
- **New level**: Editor → New → Paint → Save → Test Play
- **Edit existing**: Editor → Level dropdown → Modify → Save
- **Export for sharing**: Editor → Export → Copy/Download JSON
- **Import community level**: Editor → Import → Select JSON file

---

## Current State (as of backup_3)

### Completed
- ✅ Full game with 121 levels (Ch 1-7)
- ✅ All mechanics implemented and tested
- ✅ Level editor with chapter palette, freeform drawing
- ✅ Import/Export/Test Play workflow
- ✅ Undo/Redo, Zoom/Pan, Grid resize
- ✅ Real-time rendering matching game visuals
- ✅ localStorage persistence for custom levels
- ✅ Responsive design (desktop + mobile)
- ✅ Dark theme with teal accent

### Editor Specs (Latest Requirements)
- **Board limits**: Max 18×18 grid (8×8 playable + 5 void border)
- **Irregular shapes**: Paint any tile within grid to create custom forms
- **Chapter/Level structure**: Palette organized by chapter, levels have titles
- **Data storage**: All in `levels.js` (ES6 module format)

### Known Issues / TODOs
- [ ] Verify all 121 levels are playable and solvable
- [ ] Chapter 3-7 levels need full implementation (currently only Ch 1 complete)
- [ ] Mobile touch controls for editor (pan/zoom)
- [ ] Level validation (solvability check)
- [ ] Shareable level codes (compressed URL format)

---

## File Sizes (approx)
| File | Size | Lines |
|------|------|-------|
| levels.js | 85 KB | ~2000 |
| engine.js | 60 KB | ~1500 |
| renderer.js | 40 KB | ~1000 |
| game.js | 30 KB | ~800 |
| editor.html | 65 KB | ~1800 |
| index.html | 4 KB | ~100 |
| styles.css | 13 KB | ~500 |

---

## Design Philosophy
> "Mechanics may need deducing. Each puzzle only has one solution. (the order in which things are done may vary but the underlying steps stay the same)"

- **No tutorials**: Players learn by experimentation
- **Single solution**: But move order can vary
- **Increasing complexity**: Each chapter introduces 1-2 new mechanics
- **Cursed interactions**: Mechanics combine in unexpected ways

---

## Credits
- **author**: HorusvsSet
- **ickp idea**: @kookoobananas (Discord), https://koo_koo.itch.io
- **Playtesters**: Abstinent Turtle, Akebia, Askz, DuckRoguer, Moz, Playcebo, tim!!!
- **Extra puzzles**: @squeaky_duck (64 extra puzzles)
- **Discord**: https://discord.gg/9ra2fZFQrG

---

*Last updated: 2026-11-26 (backup_3 created)*