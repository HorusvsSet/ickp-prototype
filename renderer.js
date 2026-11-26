/**
 * ICKP Renderer
 * Canvas-based rendering with pixel art aesthetics
 */

import { TileType, KnightColor, Dir } from './levels.js';
import { KNIGHT_MOVES, canKnightMove } from './engine.js';

// ============================================================================
// RENDERER CLASS
// ============================================================================

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.tileSize = 48;
        this.tileGap = 2;
        this.offsetX = 0;
        this.offsetY = 0;
        this.scale = 1;

        // Animation state
        this.animations = [];
        this.time = 0;

        // Knight sprites (drawn procedurally)
        this.knightCache = new Map();

        // Colors
        this.colors = {
            bg: '#0a0a14',
            grid: '#1a1a3a',
            normal: '#2d2d4a',
            normalHighlight: '#3d3d5a',
            cracked: '#4a3a3a',
            crackedHighlight: '#5a4a4a',
            brick: '#8b4513',
            brickDark: '#6b3510',
            brickHighlight: '#a0522d',
            metal: '#708090',
            metalDark: '#4a5568',
            metalHighlight: '#8899aa',
            coin: '#ffd700',
            coinGlow: '#fff8a0',
            flag: '#ffd700',
            flagPole: '#8b7355',
            arrowGreen: '#00ff88',
            arrowGreenDim: '#00cc6a',
            arrowBlue: '#0088ff',
            arrowBlueDim: '#006acc',
            arrowRed: '#ff4444',
            portalRed: '#ff3366',
            portalBlue: '#3399ff',
            portalGreen: '#33ff99',
            portalYellow: '#ffff33',
            portalPurple: '#cc33ff',
            portalOrange: '#ff9933',
            button: '#ff4444',
            bomb: '#333333',
            bombFuse: '#ff8800',
            trafficGreen: '#00ff88',
            trafficRed: '#ff4444',
            knightWhite: '#ffffff',
            knightBlack: '#1a1a2e',
            knightRed: '#ff4444',
            knightBlue: '#4488ff',
            knightGreen: '#44ff88',
            knightYellow: '#ffff44',
            knightOutline: '#000000',
            tether: '#ff66aa',
            tetherBroken: '#666666',
            selection: '#00d4aa',
            validMove: '#00ff88',
            invalidMove: '#ff4444',
            pathIndicator: '#00d4aa80',
            text: '#e8e8f0',
            textDim: '#a0a0c0',
            toolPreview: '#ffd93d',
            toolPreviewInvalid: '#ff6b6b'
        };
    }

    resize(width, height) {
        const dpr = window.devicePixelRatio || 1;
        this.cssWidth = width;
        this.cssHeight = height;
        this.canvas.width = width * dpr;
        this.canvas.height = height * dpr;
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';
        this.ctx.scale(dpr, dpr);
        this.dpr = dpr;
    }

    render(gameState, selectedTool = null, hoverTile = null, dragPreview = null) {
        this.time += 16; // ~60fps
        const { board, knights, flags, coins, chessPieces, portals, tethers, trafficLights, voidArrows, offBoardTiles } = gameState;

        // Calculate board pixel dimensions (in CSS/logical pixels)
        const boardWidth = board[0].length;
        const boardHeight = board.length;
        const tilePixelSize = this.tileSize + this.tileGap;
        const totalWidth = boardWidth * tilePixelSize - this.tileGap;
        const totalHeight = boardHeight * tilePixelSize - this.tileGap;

        // Center board in canvas (use CSS dimensions for layout)
        const canvasWidth = this.cssWidth || this.canvas.width;
        const canvasHeight = this.cssHeight || this.canvas.height;
        this.offsetX = (canvasWidth - totalWidth) / 2;
        this.offsetY = (canvasHeight - totalHeight) / 2;

        // Clear (use CSS dimensions since context is scaled)
        this.ctx.fillStyle = this.colors.bg;
        this.ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Draw on-board tiles
        for (let y = 0; y < boardHeight; y++) {
            for (let x = 0; x < boardWidth; x++) {
                this.drawTile(board[y][x], x, y, gameState, hoverTile);
            }
        }

        // Draw off-board tiles (built by hammer or arrows)
        if (offBoardTiles && offBoardTiles.size > 0) {
            for (const [key, tileType] of offBoardTiles) {
                const [x, y] = key.split(',').map(Number);
                this.drawTile(tileType, x, y, gameState, hoverTile);
            }
        }

        // Draw void arrows (can be off-board)
        if (voidArrows && voidArrows.length > 0) {
            this.drawVoidArrows(voidArrows, boardWidth, boardHeight);
        }

        // Draw valid move destinations for selected knight (from callback)
        if (this.callbacks && this.callbacks.getValidDestinations) {
            const destinations = this.callbacks.getValidDestinations();
            if (destinations && destinations.length > 0) {
                this.drawValidDestinations(destinations);
            }
        }

        // Draw tool placement preview
        if (this.callbacks && this.callbacks.getPlacingTool) {
            const placingTool = this.callbacks.getPlacingTool();
            const hover = this.callbacks.getHoverTile?.();
            if (placingTool && hover) {
                this.drawToolPreview(placingTool, hover.x, hover.y, gameState);
            }
        }

        // Draw coins
        for (const coin of coins) {
            if (!coin.collected) {
                this.drawCoin(coin.x, coin.y);
            }
        }

        // Draw flags
        for (const flag of flags) {
            this.drawFlag(flag.x, flag.y, flag.color);
        }

        // Draw chess pieces
        for (const piece of chessPieces) {
            if (!piece.captured) {
                this.drawChessPiece(piece.x, piece.y, piece.type, piece.color);
            }
        }

        // Draw portals
        for (const portal of portals) {
            this.drawPortal(portal.x, portal.y, portal.color);
        }

        // Draw tethers
        for (const tether of tethers) {
            if (!tether.broken) {
                this.drawTether(tether, knights);
            }
        }

        // Draw knights
        for (const knight of knights) {
            this.drawKnight(knight, gameState);
        }

        // Draw animations
        this.drawAnimations();
    }

    drawGrid(width, height) {
        this.ctx.strokeStyle = this.colors.grid;
        this.ctx.lineWidth = 1;

        for (let x = 0; x <= width; x++) {
            const px = this.offsetX + x * (this.tileSize + this.tileGap);
            this.ctx.beginPath();
            this.ctx.moveTo(px, this.offsetY);
            this.ctx.lineTo(px, this.offsetY + height * (this.tileSize + this.tileGap));
            this.ctx.stroke();
        }
        for (let y = 0; y <= height; y++) {
            const py = this.offsetY + y * (this.tileSize + this.tileGap);
            this.ctx.beginPath();
            this.ctx.moveTo(this.offsetX, py);
            this.ctx.lineTo(this.offsetX + width * (this.tileSize + this.tileGap), py);
            this.ctx.stroke();
        }
    }

    drawVoidArrows(voidArrows, boardWidth, boardHeight) {
        for (const va of voidArrows) {
            // Get tile rect - works for off-board coordinates too
            const rect = this.getTileRect(va.x, va.y);

            // Void arrows are green (1-space push back) by default
            // They don't have a type in level data, so default to green
            const isBlue = false; // voidArrows in level data are always green
            const color = isBlue ? this.colors.arrowBlue : this.colors.arrowGreen;
            const dimColor = isBlue ? this.colors.arrowBlueDim : this.colors.arrowGreenDim;

            // Use the direction from the void arrow
            const dir = va.dir || Dir.RIGHT;

            // Draw just the arrow sprite (no background, no label) - same as normal arrows but on void
            this.drawArrowSprite(rect, color, dimColor, dir, isBlue);
        }
    }

    // Draw just the arrow sprite without background (for void arrows)
    drawArrowSprite(rect, color, dimColor, dir, isBlue = false) {
        const cx = rect.x + rect.w / 2;
        const cy = rect.y + rect.h / 2;
        const size = Math.min(rect.w, rect.h) * 0.35;

        // Arrow only - no background
        this.ctx.fillStyle = color;
        this.ctx.beginPath();

        const offsets = this.getArrowOffsets(dir, size);
        this.ctx.moveTo(cx + offsets[0].x, cy + offsets[0].y);
        for (let i = 1; i < offsets.length; i++) {
            this.ctx.lineTo(cx + offsets[i].x, cy + offsets[i].y);
        }
        this.ctx.closePath();
        this.ctx.fill();

        // Blue arrow has double shaft
        if (isBlue) {
            this.ctx.fillStyle = dimColor;
            this.ctx.beginPath();
            this.ctx.moveTo(cx + offsets[0].x * 0.5, cy + offsets[0].y * 0.5);
            for (let i = 1; i < offsets.length; i++) {
                this.ctx.lineTo(cx + offsets[i].x * 0.5, cy + offsets[i].y * 0.5);
            }
            this.ctx.closePath();
            this.ctx.fill();
        }
    }

    getTileRect(x, y) {
        const tx = this.offsetX + x * (this.tileSize + this.tileGap);
        const ty = this.offsetY + y * (this.tileSize + this.tileGap);
        return { x: tx, y: ty, w: this.tileSize, h: this.tileSize };
    }

    drawTile(tileType, x, y, gameState, hoverTile) {
        const rect = this.getTileRect(x, y);
        const isHover = hoverTile && hoverTile.x === x && hoverTile.y === y;
        const time = this.time;

        switch (tileType) {
            case TileType.EMPTY:
                // Draw void - same as background, no grid/pattern
                this.ctx.fillStyle = this.colors.bg;
                this.ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
                break;

            case TileType.NORMAL:
                this.ctx.fillStyle = isHover ? this.colors.normalHighlight : this.colors.normal;
                this.roundRect(rect.x, rect.y, rect.w, rect.h, 4);
                this.ctx.fill();
                // Subtle texture
                this.ctx.fillStyle = '#353555';
                this.ctx.fillRect(rect.x + 4, rect.y + 4, 2, 2);
                this.ctx.fillRect(rect.x + rect.w - 6, rect.y + rect.h - 6, 2, 2);
                break;

            case TileType.CRACKED:
                this.ctx.fillStyle = isHover ? this.colors.crackedHighlight : this.colors.cracked;
                this.roundRect(rect.x, rect.y, rect.w, rect.h, 4);
                this.ctx.fill();
                // Crack lines
                this.ctx.strokeStyle = '#3a2a2a';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(rect.x + 8, rect.y + 4);
                this.ctx.lineTo(rect.x + rect.w - 8, rect.y + rect.h - 4);
                this.ctx.moveTo(rect.x + rect.w - 8, rect.y + 4);
                this.ctx.lineTo(rect.x + 8, rect.y + rect.h - 4);
                this.ctx.stroke();
                break;

            case TileType.BRICK:
                this.ctx.fillStyle = this.colors.brick;
                this.roundRect(rect.x, rect.y, rect.w, rect.h, 4);
                this.ctx.fill();
                // Brick pattern
                this.ctx.fillStyle = this.colors.brickDark;
                for (let row = 0; row < 3; row++) {
                    for (let col = 0; col < 3; col++) {
                        const bx = rect.x + 4 + col * 12 + (row % 2) * 6;
                        const by = rect.y + 4 + row * 12;
                        this.ctx.fillRect(bx, by, 10, 10);
                    }
                }
                // Highlight top/left
                this.ctx.strokeStyle = this.colors.brickHighlight;
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(rect.x + 1, rect.y + 1, rect.w - 2, rect.h - 2);
                break;

            case TileType.METAL:
                this.ctx.fillStyle = this.colors.metal;
                this.roundRect(rect.x, rect.y, rect.w, rect.h, 4);
                this.ctx.fill();
                // Metal plate lines
                this.ctx.strokeStyle = this.colors.metalDark;
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(rect.x + 4, rect.y + 4, rect.w - 8, rect.h - 8);
                // Rivets
                this.ctx.fillStyle = this.colors.metalDark;
                for (const [rx, ry] of [[6, 6], [rect.w - 6, 6], [6, rect.h - 6], [rect.w - 6, rect.h - 6]]) {
                    this.ctx.beginPath();
                    this.ctx.arc(rect.x + rx, rect.y + ry, 2, 0, Math.PI * 2);
                    this.ctx.fill();
                }
                // Highlight
                this.ctx.strokeStyle = this.colors.metalHighlight;
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(rect.x + 1, rect.y + 1, rect.w - 2, rect.h - 2);
                break;

            case TileType.ARROW_GREEN_UP:
            case TileType.ARROW_GREEN_UP:
                this.drawArrowTile(rect, this.colors.arrowGreen, this.colors.arrowGreenDim, Dir.UP);
                break;
            case TileType.ARROW_GREEN_RIGHT:
                this.drawArrowTile(rect, this.colors.arrowGreen, this.colors.arrowGreenDim, Dir.RIGHT);
                break;
            case TileType.ARROW_GREEN_DOWN:
                this.drawArrowTile(rect, this.colors.arrowGreen, this.colors.arrowGreenDim, Dir.DOWN);
                break;
            case TileType.ARROW_GREEN_LEFT:
                this.drawArrowTile(rect, this.colors.arrowGreen, this.colors.arrowGreenDim, Dir.LEFT);
                break;

            // Void arrows (on EMPTY tiles) - draw just the arrow sprite, no background
            case TileType.ARROW_GREEN_VOID_UP:
                this.drawArrowSprite(rect, this.colors.arrowGreen, this.colors.arrowGreenDim, Dir.UP);
                break;
            case TileType.ARROW_GREEN_VOID_RIGHT:
                this.drawArrowSprite(rect, this.colors.arrowGreen, this.colors.arrowGreenDim, Dir.RIGHT);
                break;
            case TileType.ARROW_GREEN_VOID_DOWN:
                this.drawArrowSprite(rect, this.colors.arrowGreen, this.colors.arrowGreenDim, Dir.DOWN);
                break;
            case TileType.ARROW_GREEN_VOID_LEFT:
                this.drawArrowSprite(rect, this.colors.arrowGreen, this.colors.arrowGreenDim, Dir.LEFT);
                break;

            case TileType.ARROW_BLUE_UP:
                this.drawArrowTile(rect, this.colors.arrowBlue, this.colors.arrowBlueDim, Dir.UP, true);
                break;
            case TileType.ARROW_BLUE_RIGHT:
                this.drawArrowTile(rect, this.colors.arrowBlue, this.colors.arrowBlueDim, Dir.RIGHT, true);
                break;
            case TileType.ARROW_BLUE_DOWN:
                this.drawArrowTile(rect, this.colors.arrowBlue, this.colors.arrowBlueDim, Dir.DOWN, true);
                break;
            case TileType.ARROW_BLUE_LEFT:
                this.drawArrowTile(rect, this.colors.arrowBlue, this.colors.arrowBlueDim, Dir.LEFT, true);
                break;

            // Void blue arrows - draw just the arrow sprite, no background
            case TileType.ARROW_BLUE_VOID_UP:
                this.drawArrowSprite(rect, this.colors.arrowBlue, this.colors.arrowBlueDim, Dir.UP, true);
                break;
            case TileType.ARROW_BLUE_VOID_RIGHT:
                this.drawArrowSprite(rect, this.colors.arrowBlue, this.colors.arrowBlueDim, Dir.RIGHT, true);
                break;
            case TileType.ARROW_BLUE_VOID_DOWN:
                this.drawArrowSprite(rect, this.colors.arrowBlue, this.colors.arrowBlueDim, Dir.DOWN, true);
                break;
            case TileType.ARROW_BLUE_VOID_LEFT:
                this.drawArrowSprite(rect, this.colors.arrowBlue, this.colors.arrowBlueDim, Dir.LEFT, true);
                break;

            case TileType.ARROW_4WAY:
                this.draw4WayArrow(rect);
                break;

            case TileType.BUTTON:
                this.drawButton(rect, time);
                break;

            case TileType.BOMB:
                this.drawBomb(rect, time);
                break;

            case TileType.TRAFFIC_LIGHT_GREEN:
            case TileType.TRAFFIC_LIGHT_RED:
                this.drawTrafficLight(rect, tileType === TileType.TRAFFIC_LIGHT_GREEN);
                break;

            default:
                // Portal tiles handled separately
                if (tileType >= TileType.PORTAL_RED && tileType <= TileType.PORTAL_ORANGE) {
                    // Will be drawn in portal pass
                } else {
                    // Unknown tile - draw as normal
                    this.ctx.fillStyle = this.colors.normal;
                    this.roundRect(rect.x, rect.y, rect.w, rect.h, 4);
                    this.ctx.fill();
                }
        }

        // Highlight hover (only if not placing tool)
        const placingTool = this.callbacks?.getPlacingTool?.();
        if (isHover && !placingTool) {
            this.ctx.strokeStyle = this.colors.selection;
            this.ctx.lineWidth = 2;
            this.roundRect(rect.x, rect.y, rect.w, rect.h, 4);
            this.ctx.stroke();
        }
    }

    drawValidDestinations(destinations) {
        for (const dest of destinations) {
            // Skip drawing void destinations - they work functionally but shouldn't be highlighted
            if (dest.stuckInVoid || (dest.offBoard && dest.stuckInVoid)) {
                continue;
            }

            const rect = this.getTileRect(dest.x, dest.y);
            const cx = rect.x + rect.w / 2;
            const cy = rect.y + rect.h / 2;

            // Pulsing highlight
            const pulse = (Math.sin(this.time / 200) + 1) / 2; // 0 to 1
            const alpha = 0.3 + pulse * 0.3; // 0.3 to 0.6

            // Destination circle
            this.ctx.fillStyle = this.hexToRgba(this.colors.validMove, alpha);
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, Math.min(rect.w, rect.h) * 0.38, 0, Math.PI * 2);
            this.ctx.fill();

            // Outer ring
            this.ctx.strokeStyle = this.colors.validMove;
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([8, 4]);
            this.ctx.lineDashOffset = -this.time / 50;
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, Math.min(rect.w, rect.h) * 0.45, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.setLineDash([]);

            // Knight move indicator (small L-shape)
            this.ctx.strokeStyle = this.colors.validMove;
            this.ctx.lineWidth = 1.5;
            this.ctx.globalAlpha = 0.7;
            this.ctx.beginPath();
            this.ctx.moveTo(cx - 8, cy - 8);
            this.ctx.lineTo(cx - 8, cy + 8);
            this.ctx.lineTo(cx + 8, cy + 8);
            this.ctx.stroke();
            this.ctx.globalAlpha = 1;
        }
    }

    drawToolPreview(tool, x, y, gameState) {
        const rect = this.getTileRect(x, y);
        const cx = rect.x + rect.w / 2;
        const cy = rect.y + rect.h / 2;

        // Check if valid placement
        let valid = false;
        if (tool === 'hammer') {
            const tile = gameState.board[y]?.[x];
            valid = tile === TileType.EMPTY || tile === TileType.NORMAL || tile === TileType.BRICK || tile === TileType.METAL || tile === TileType.CRACKED;
        } else if (tool.startsWith('arrow_')) {
            const tile = gameState.board[y]?.[x];
            valid = tile === TileType.EMPTY || tile === TileType.NORMAL || tile === TileType.CRACKED;
        }

        // Preview background
        this.ctx.fillStyle = valid ? this.hexToRgba(this.colors.toolPreview, 0.3) : this.hexToRgba(this.colors.toolPreviewInvalid, 0.3);
        this.roundRect(rect.x, rect.y, rect.w, rect.h, 4);
        this.ctx.fill();

        // Preview border
        this.ctx.strokeStyle = valid ? this.colors.toolPreview : this.colors.toolPreviewInvalid;
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([6, 3]);
        this.roundRect(rect.x, rect.y, rect.w, rect.h, 4);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // Tool icon
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = valid ? this.colors.toolPreview : this.colors.toolPreviewInvalid;
        this.ctx.globalAlpha = 0.9;

        let icon = '';
        if (tool === 'hammer') icon = '⚒';
        else if (tool === 'arrow_up') icon = '↑';
        else if (tool === 'arrow_right') icon = '→';
        else if (tool === 'arrow_down') icon = '↓';
        else if (tool === 'arrow_left') icon = '←';
        else if (tool === 'boot') icon = '👢';
        else if (tool === 'portalGun') icon = '🔫';

        if (icon) {
            this.ctx.fillText(icon, cx, cy);
        }
        this.ctx.globalAlpha = 1;
    }

    drawArrowTile(rect, color, dimColor, dir, isBlue = false) {
        const cx = rect.x + rect.w / 2;
        const cy = rect.y + rect.h / 2;
        const size = Math.min(rect.w, rect.h) * 0.35;

        // Background
        this.ctx.fillStyle = '#2a2a4a';
        this.roundRect(rect.x, rect.y, rect.w, rect.h, 4);
        this.ctx.fill();

        // Arrow
        this.ctx.fillStyle = color;
        this.ctx.beginPath();

        const offsets = this.getArrowOffsets(dir, size);
        this.ctx.moveTo(cx + offsets[0].x, cy + offsets[0].y);
        for (let i = 1; i < offsets.length; i++) {
            this.ctx.lineTo(cx + offsets[i].x, cy + offsets[i].y);
        }
        this.ctx.closePath();
        this.ctx.fill();

        // Blue arrow has double shaft
        if (isBlue) {
            this.ctx.fillStyle = dimColor;
            this.ctx.beginPath();
            this.ctx.moveTo(cx + offsets[0].x * 0.5, cy + offsets[0].y * 0.5);
            for (let i = 1; i < offsets.length; i++) {
                this.ctx.lineTo(cx + offsets[i].x * 0.5, cy + offsets[i].y * 0.5);
            }
            this.ctx.closePath();
            this.ctx.fill();
        }
    }

    getArrowOffsets(dir, size) {
        // Arrow pointing right by default, rotated for other dirs
        const base = [
            { x: size, y: 0 },      // Tip
            { x: -size * 0.5, y: -size * 0.6 },
            { x: -size * 0.2, y: -size * 0.2 },
            { x: -size * 0.2, y: -size * 0.8 },
            { x: -size * 0.8, y: -size * 0.8 },
            { x: -size * 0.8, y: size * 0.8 },
            { x: -size * 0.2, y: size * 0.8 },
            { x: -size * 0.2, y: size * 0.2 },
            { x: -size * 0.5, y: size * 0.6 }
        ];

        // Rotate based on direction
        let angle = 0;
        switch (dir) {
            case Dir.UP: angle = -Math.PI / 2; break;
            case Dir.LEFT: angle = Math.PI; break;
            case Dir.DOWN: angle = Math.PI / 2; break;
        }

        if (angle !== 0) {
            return base.map(p => ({
                x: p.x * Math.cos(angle) - p.y * Math.sin(angle),
                y: p.x * Math.sin(angle) + p.y * Math.cos(angle)
            }));
        }
        return base;
    }

    draw4WayArrow(rect) {
        const cx = rect.x + rect.w / 2;
        const cy = rect.y + rect.h / 2;
        const size = Math.min(rect.w, rect.h) * 0.25;

        this.ctx.fillStyle = '#2a2a4a';
        this.roundRect(rect.x, rect.y, rect.w, rect.h, 4);
        this.ctx.fill();

        // Four small arrows
        for (const dir of [Dir.UP, Dir.RIGHT, Dir.DOWN, Dir.LEFT]) {
            this.ctx.fillStyle = this.colors.arrowGreen;
            this.ctx.beginPath();
            const offsets = this.getArrowOffsets(dir, size);
            this.ctx.moveTo(cx + offsets[0].x, cy + offsets[0].y);
            for (let i = 1; i < offsets.length; i++) {
                this.ctx.lineTo(cx + offsets[i].x, cy + offsets[i].y);
            }
            this.ctx.closePath();
            this.ctx.fill();
        }
    }

    drawButton(rect, time) {
        const cx = rect.x + rect.w / 2;
        const cy = rect.y + rect.h / 2;
        const radius = Math.min(rect.w, rect.h) * 0.35;

        // Base
        this.ctx.fillStyle = '#3a1a1a';
        this.roundRect(rect.x, rect.y, rect.w, rect.h, 4);
        this.ctx.fill();

        // Button
        this.ctx.fillStyle = this.colors.button;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        this.ctx.fill();

        // Pulse
        const pulse = Math.sin(time / 200) * 0.1 + 0.9;
        this.ctx.strokeStyle = `rgba(255, 100, 100, ${pulse})`;
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, radius * pulse, 0, Math.PI * 2);
        this.ctx.stroke();
    }

    drawBomb(rect, time) {
        const cx = rect.x + rect.w / 2;
        const cy = rect.y + rect.h / 2;
        const radius = Math.min(rect.w, rect.h) * 0.3;

        // Base
        this.ctx.fillStyle = '#1a1a1a';
        this.roundRect(rect.x, rect.y, rect.w, rect.h, 4);
        this.ctx.fill();

        // Bomb body
        this.ctx.fillStyle = this.colors.bomb;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        this.ctx.fill();

        // Fuse
        const fuseAngle = -Math.PI / 4 + Math.sin(time / 100) * 0.2;
        const fuseLength = radius * 1.2;
        this.ctx.strokeStyle = this.colors.bombFuse;
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(cx, cy - radius);
        this.ctx.lineTo(
            cx + Math.cos(fuseAngle) * fuseLength,
            cy - radius + Math.sin(fuseAngle) * fuseLength
        );
        this.ctx.stroke();

        // Spark
        if (Math.random() < 0.1) {
            this.ctx.fillStyle = this.colors.bombFuse;
            this.ctx.beginPath();
            this.ctx.arc(
                cx + Math.cos(fuseAngle) * fuseLength,
                cy - radius + Math.sin(fuseAngle) * fuseLength,
                1.5, 0, Math.PI * 2
            );
            this.ctx.fill();
        }
    }

    drawTrafficLight(rect, isGreen) {
        const cx = rect.x + rect.w / 2;
        const cy = rect.y + rect.h / 2;
        const radius = Math.min(rect.w, rect.h) * 0.3;

        this.ctx.fillStyle = '#1a1a2a';
        this.roundRect(rect.x, rect.y, rect.w, rect.h, 4);
        this.ctx.fill();

        this.ctx.fillStyle = isGreen ? this.colors.trafficGreen : this.colors.trafficRed;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        this.ctx.fill();

        // Glow
        this.ctx.shadowColor = isGreen ? this.colors.trafficGreen : this.colors.trafficRed;
        this.ctx.shadowBlur = 10;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, radius * 0.8, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
    }

    drawCoin(x, y) {
        const rect = this.getTileRect(x, y);
        const cx = rect.x + rect.w / 2;
        const cy = rect.y + rect.h / 2;
        const radius = Math.min(rect.w, rect.h) * 0.3;
        const time = this.time;

        // Spin animation
        const scaleX = Math.abs(Math.cos(time / 300));
        const currentRadius = radius * (0.5 + 0.5 * scaleX);

        // Glow
        this.ctx.shadowColor = this.colors.coinGlow;
        this.ctx.shadowBlur = 8;

        this.ctx.fillStyle = this.colors.coin;
        this.ctx.beginPath();
        this.ctx.ellipse(cx, cy, currentRadius, radius, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Inner detail
        this.ctx.fillStyle = '#ffaa00';
        this.ctx.beginPath();
        this.ctx.ellipse(cx, cy, currentRadius * 0.6, radius * 0.6, 0, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.shadowBlur = 0;
    }

    drawFlag(x, y, color) {
        const rect = this.getTileRect(x, y);
        const cx = rect.x + rect.w / 2;
        const cy = rect.y + rect.h / 2;

        // Pole
        this.ctx.strokeStyle = this.colors.flagPole;
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(cx, rect.y + rect.h - 4);
        this.ctx.lineTo(cx, rect.y + 4);
        this.ctx.stroke();

        // Flag
        this.ctx.fillStyle = this.colors.flag;
        this.ctx.beginPath();
        this.ctx.moveTo(cx, rect.y + 6);
        this.ctx.lineTo(cx + 16, rect.y + 12);
        this.ctx.lineTo(cx, rect.y + 18);
        this.ctx.closePath();
        this.ctx.fill();

        // Color indicator if colored flag
        if (color && color !== KnightColor.WHITE) {
            const knightColor = this.getKnightColor(color);
            this.ctx.fillStyle = knightColor;
            this.ctx.beginPath();
            this.ctx.arc(cx + 20, rect.y + 8, 4, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    drawChessPiece(x, y, type, color) {
        const rect = this.getTileRect(x, y);
        const cx = rect.x + rect.w / 2;
        const cy = rect.y + rect.h / 2;
        const size = Math.min(rect.w, rect.h) * 0.4;

        const knightColor = this.getKnightColor(color);

        // Base
        this.ctx.fillStyle = knightColor;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, size, 0, Math.PI * 2);
        this.ctx.fill();

        // Outline
        this.ctx.strokeStyle = this.colors.knightOutline;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Symbol
        this.ctx.fillStyle = color === KnightColor.WHITE ? '#1a1a2e' : '#ffffff';
        this.ctx.font = `bold ${size * 1.2}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        const symbols = {
            [TileType.CHESS_PAWN]: '♟',
            [TileType.CHESS_BISHOP]: '♝',
            [TileType.CHESS_ROOK]: '♜',
            [TileType.CHESS_QUEEN]: '♛',
            [TileType.CHESS_KING]: '♚'
        };
        this.ctx.fillText(symbols[type] || '?', cx, cy + size * 0.1);
    }

    drawPortal(x, y, color) {
        const rect = this.getTileRect(x, y);
        const cx = rect.x + rect.w / 2;
        const cy = rect.y + rect.h / 2;
        const time = this.time;

        const portalColors = {
            red: this.colors.portalRed,
            blue: this.colors.portalBlue,
            green: this.colors.portalGreen,
            yellow: this.colors.portalYellow,
            purple: this.colors.portalPurple,
            orange: this.colors.portalOrange
        };
        const colorHex = portalColors[color] || this.colors.portalRed;

        // Outer ring (animated)
        for (let i = 3; i >= 0; i--) {
            const radius = Math.min(rect.w, rect.h) * (0.35 + i * 0.08);
            const alpha = 0.15 + i * 0.1;
            const phase = time / 500 + i * 0.5;
            const r = radius + Math.sin(phase) * 3;

            this.ctx.strokeStyle = this.hexToRgba(colorHex, alpha);
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, r, 0, Math.PI * 2);
            this.ctx.stroke();
        }

        // Center
        this.ctx.fillStyle = colorHex;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, Math.min(rect.w, rect.h) * 0.25, 0, Math.PI * 2);
        this.ctx.fill();

        // Inner swirl
        this.ctx.strokeStyle = this.hexToRgba('#ffffff', 0.5);
        this.ctx.lineWidth = 1.5;
        for (let i = 0; i < 3; i++) {
            const angle = time / 300 + i * Math.PI * 2 / 3;
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, Math.min(rect.w, rect.h) * 0.15, angle, angle + Math.PI * 0.8);
            this.ctx.stroke();
        }
    }

    drawTether(tether, knights) {
        const knightA = knights.find(k => k.id === tether.knightAId);
        const knightB = knights.find(k => k.id === tether.knightBId);
        if (!knightA || !knightB) return;

        const rectA = this.getTileRect(knightA.x, knightA.y);
        const rectB = this.getTileRect(knightB.x, knightB.y);

        const x1 = rectA.x + rectA.w / 2;
        const y1 = rectA.y + rectA.h / 2;
        const x2 = rectB.x + rectB.w / 2;
        const y2 = rectB.y + rectB.h / 2;

        this.ctx.strokeStyle = tether.broken ? this.colors.tetherBroken : this.colors.tether;
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.setLineDash([8, 4]);
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    drawKnight(knight, gameState) {
        const rect = this.getTileRect(knight.x, knight.y);
        const cx = rect.x + rect.w / 2;
        const cy = rect.y + rect.h / 2;
        const size = Math.min(rect.w, rect.h) * 0.4;

        const color = this.getKnightColor(knight.color);
        const outline = knight.atFlag ? this.colors.selection : this.colors.knightOutline;

        // Elevation shadow (if carrying another knight)
        if (knight.elevation > 0) {
            this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
            this.ctx.beginPath();
            this.ctx.ellipse(cx, cy + size * 0.8, size * 0.8, size * 0.3, 0, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Knight body
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, size, 0, Math.PI * 2);
        this.ctx.fill();

        // Outline
        this.ctx.strokeStyle = outline;
        this.ctx.lineWidth = knight.atFlag ? 3 : 2;
        this.ctx.stroke();

        // Knight symbol (horse head)
        this.ctx.fillStyle = color === '#ffffff' ? '#1a1a2e' : '#ffffff';
        this.ctx.font = `bold ${size * 1.3}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('♞', cx, cy + size * 0.1);

        // Carried coin indicator
        if (knight.hasCoin) {
            this.ctx.fillStyle = this.colors.coin;
            this.ctx.beginPath();
            this.ctx.arc(cx + size * 0.7, cy - size * 0.7, 8, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillStyle = '#ffaa00';
            this.ctx.beginPath();
            this.ctx.arc(cx + size * 0.7, cy - size * 0.7, 4, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Carried knight indicator
        if (knight.carriedKnight) {
            this.ctx.strokeStyle = this.colors.selection;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, size + 4, 0, Math.PI * 2);
            this.ctx.stroke();
        }

        // Selected highlight
        if (this.callbacks && this.callbacks.getSelectedKnight) {
            const selected = this.callbacks.getSelectedKnight();
            if (selected === knight) {
                this.ctx.strokeStyle = this.colors.selection;
                this.ctx.lineWidth = 3;
                this.ctx.setLineDash([6, 3]);
                this.ctx.beginPath();
                this.ctx.arc(cx, cy, size + 6, 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.setLineDash([]);
            }
        }
    }

    drawAnimations() {
        // Particle effects, etc.
        for (let i = this.animations.length - 1; i >= 0; i--) {
            const anim = this.animations[i];
            anim.update();
            anim.draw(this.ctx);
            if (anim.done) this.animations.splice(i, 1);
        }
    }

    addAnimation(animation) {
        this.animations.push(animation);
    }

    // Utility
    roundRect(x, y, w, h, r) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + r, y);
        this.ctx.lineTo(x + w - r, y);
        this.ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        this.ctx.lineTo(x + w, y + h - r);
        this.ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        this.ctx.lineTo(x + r, y + h);
        this.ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        this.ctx.lineTo(x, y + r);
        this.ctx.quadraticCurveTo(x, y, x + r, y);
        this.ctx.closePath();
    }

    getKnightColor(color) {
        const colors = {
            [KnightColor.WHITE]: '#ffffff',
            [KnightColor.BLACK]: '#1a1a2e',
            [KnightColor.RED]: '#ff4444',
            [KnightColor.BLUE]: '#4488ff',
            [KnightColor.GREEN]: '#44ff88',
            [KnightColor.YELLOW]: '#ffff44'
        };
        return colors[color] || '#ffffff';
    }

    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // Callbacks for interaction
    setCallbacks(callbacks) {
        this.callbacks = callbacks;
    }

    getRenderInfo() {
        return {
            tileSize: this.tileSize,
            tileGap: this.tileGap,
            tileSpacing: this.tileSize + this.tileGap,
            offsetX: this.offsetX,
            offsetY: this.offsetY,
            dpr: this.dpr || 1
        };
    }
}

// ============================================================================
// ANIMATION CLASSES
// ============================================================================

export class ParticleAnimation {
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

export class ScreenShakeAnimation {
    constructor(intensity = 5, duration = 300) {
        this.intensity = intensity;
        this.duration = duration;
        this.startTime = Date.now();
        this.done = false;
    }

    update() {
        if (Date.now() - this.startTime > this.duration) {
            this.done = true;
        }
    }

    draw(ctx) {
        // Applied in main render loop
    }

    getOffset() {
        const progress = (Date.now() - this.startTime) / this.duration;
        const currentIntensity = this.intensity * (1 - progress);
        return {
            x: (Math.random() - 0.5) * currentIntensity * 2,
            y: (Math.random() - 0.5) * currentIntensity * 2
        };
    }
}

// Re-export for convenience
export { KNIGHT_MOVES };