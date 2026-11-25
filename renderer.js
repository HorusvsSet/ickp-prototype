/**
 * ICKP Renderer - Polished Pixel Art Engine
 * High-quality canvas rendering with fluid animations
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
        this.screenShake = { x: 0, y: 0 };

        // Caches for performance
        this.knightCache = new Map();
        this.tileCache = new Map();
        this.spriteCache = new Map();

        // Color palette - enhanced with more depth
        this.colors = {
            bg: '#0a0a14',
            grid: '#151528',
            normal: '#1a1a2e',
            normalHighlight: '#2a2a48',
            normalEdge: '#101020',
            cracked: '#2d2020',
            crackedHighlight: '#3d2a2a',
            crackedLines: '#1a1010',
            brick: '#8b3e1f',
            brickDark: '#5d2814',
            brickHighlight: '#a85028',
            brickMortar: '#3d2010',
            metal: '#4a5a6a',
            metalDark: '#2d3a48',
            metalLight: '#6a7f90',
            metalRivet: '#1a2530',
            metalSheen: '#8ab4c8',
            coin: '#ffd43b',
            coinDim: '#e6bf35',
            coinGlow: '#fff0a0',
            flagGold: '#ffd700',
            flagWhite: '#ffffff',
            flagBlack: '#0d0d1a',
            flagPole: '#6b5535',
            arrowGreen: '#00ff88',
            arrowGreenDim: '#00cc6a',
            arrowBlue: '#0099ff',
            arrowBlueDim: '#007acc',
            arrowVoid: '#8844ff',
            portalRed: '#ff3366',
            portalBlue: '#3399ff',
            portalGreen: '#33ff99',
            portalYellow: '#ffff33',
            portalPurple: '#cc33ff',
            portalOrange: '#ff9933',
            button: '#cc2222',
            buttonGlow: '#ff6666',
            bomb: '#1a1a1a',
            bombFuse: '#ff8800',
            trafficGreen: '#00ff88',
            trafficRed: '#ff4444',
            knightWhite: '#ffffff',
            knightBlack: '#0d0d1a',
            knightRed: '#ff4444',
            knightBlue: '#4488ff',
            knightGreen: '#44ff88',
            knightYellow: '#ffff44',
            knightOutline: '#000000',
            knightOutlineWhite: '#333344',
            tether: '#ff66aa',
            tetherBroken: '#555577',
            selection: '#00e8b4',
            validMove: '#00ff88',
            invalidMove: '#ff5a5f',
            pathTrace: 'rgba(0, 232, 180, 0.25)',
            text: '#f0f0f8',
            textDim: '#b8b8d0',
            toolPreview: '#ffcc00',
            toolPreviewInvalid: '#ff5a5f',
            voidDeep: '#030308',
            voidStars: '#101020',
            // Enhanced colors
            normalAccent: '#3a3a58',
            crackedAccent: '#4a2a2a',
            brickAccent: '#c86030',
            metalAccent: '#8ab4c8'
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
        this.clearCaches();
    }

    clearCaches() {
        this.tileCache.clear();
        this.spriteCache.clear();
    }

    render(gameState, selectedTool = null, hoverTile = null, dragPreview = null) {
        this.time += 16; // ~60fps
        const { board, knights, flags, coins, chessPieces, portals, tethers, trafficLights, voidArrows, offBoardTiles } = gameState;

        // Calculate board pixel dimensions
        const boardWidth = board[0].length;
        const boardHeight = board.length;
        const tilePixelSize = this.tileSize + this.tileGap;
        const totalWidth = boardWidth * tilePixelSize - this.tileGap;
        const totalHeight = boardHeight * tilePixelSize - this.tileGap;

        const canvasWidth = this.cssWidth || this.canvas.width;
        const canvasHeight = this.cssHeight || this.canvas.height;
        this.offsetX = (canvasWidth - totalWidth) / 2;
        this.offsetY = (canvasHeight - totalHeight) / 2;

        // Apply screen shake
        const shakeX = this.screenShake.x || 0;
        const shakeY = this.screenShake.y || 0;
        this.ctx.save();
        this.ctx.translate(shakeX, shakeY);

        // Clear
        this.ctx.fillStyle = this.colors.bg;
        this.ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Draw subtle board background glow
        this.drawBoardBackground(boardWidth, boardHeight);

        // Draw selection glow around board when knight is selected
        const selectedKnight = this.callbacks?.getSelectedKnight?.();
        if (selectedKnight) {
            this.drawSelectionGlow(boardWidth, boardHeight, selectedKnight.color);
        }

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

        // Draw valid move destinations for selected knight
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

        // Draw tethers (before knights so they appear behind)
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

        this.ctx.restore();
    }

    drawBoardBackground(boardWidth, boardHeight) {
        const tilePixelSize = this.tileSize + this.tileGap;
        const totalWidth = boardWidth * tilePixelSize - this.tileGap;
        const totalHeight = boardHeight * tilePixelSize - this.tileGap;

        // Subtle vignette
        const gradient = this.ctx.createRadialGradient(
            this.offsetX + totalWidth / 2, this.offsetY + totalHeight / 2, 0,
            this.offsetX + totalWidth / 2, this.offsetY + totalHeight / 2, Math.max(totalWidth, totalHeight) * 0.7
        );
        gradient.addColorStop(0, 'rgba(0, 232, 180, 0.02)');
        gradient.addColorStop(0.5, 'rgba(187, 134, 252, 0.015)');
        gradient.addColorStop(1, 'transparent');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(this.offsetX, this.offsetY, totalWidth, totalHeight);
    }

    drawSelectionGlow(boardWidth, boardHeight, knightColor) {
        const tilePixelSize = this.tileSize + this.tileGap;
        const totalWidth = boardWidth * tilePixelSize - this.tileGap;
        const totalHeight = boardHeight * tilePixelSize - this.tileGap;

        const color = this.getKnightColor(knightColor);
        const pulse = (Math.sin(this.time / 400) + 1) / 2;
        const alpha = 0.05 + pulse * 0.08;

        // Outer glow
        this.ctx.strokeStyle = this.hexToRgba(color, alpha);
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(
            this.offsetX - 8, this.offsetY - 8,
            totalWidth + 16, totalHeight + 16
        );

        // Inner subtle glow
        this.ctx.strokeStyle = this.hexToRgba(color, alpha * 0.5);
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(
            this.offsetX - 4, this.offsetY - 4,
            totalWidth + 8, totalHeight + 8
        );
    }

    drawVoidArrows(voidArrows, boardWidth, boardHeight) {
        for (const va of voidArrows) {
            const rect = this.getTileRect(va.x, va.y);
            const dir = va.dir || Dir.RIGHT;

            // Void arrows have a subtle void background
            this.ctx.fillStyle = 'rgba(8, 8, 20, 0.6)';
            this.roundRect(rect.x, rect.y, rect.w, rect.h, 4);
            this.ctx.fill();

            // Border
            this.ctx.strokeStyle = 'rgba(136, 68, 255, 0.4)';
            this.ctx.lineWidth = 1;
            this.roundRect(rect.x, rect.y, rect.w, rect.h, 4);
            this.ctx.stroke();

            // Arrow sprite
            this.drawArrowSprite(rect, this.colors.arrowVoid, this.colors.arrowVoid, dir, false);
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

        // Check cache for static tiles
        const cacheKey = `${tileType}_${x}_${y}_${isHover ? 1 : 0}`;
        if (!isHover && (tileType === TileType.NORMAL || tileType === TileType.EMPTY || tileType === TileType.BRICK || tileType === TileType.METAL)) {
            const cached = this.tileCache.get(cacheKey);
            if (cached) {
                this.ctx.drawImage(cached, rect.x, rect.y);
                return;
            }
        }

        const useCache = !isHover && (tileType === TileType.NORMAL || tileType === TileType.EMPTY || tileType === TileType.BRICK || tileType === TileType.METAL);
        let offscreenCanvas = null;
        let offscreenCtx = null;

        if (useCache) {
            offscreenCanvas = document.createElement('canvas');
            offscreenCanvas.width = rect.w;
            offscreenCanvas.height = rect.h;
            offscreenCtx = offscreenCanvas.getContext('2d');
            this.ctx.save();
            this.ctx.translate(rect.x, rect.y);
            this.drawTileInternal(tileType, { x: 0, y: 0, w: rect.w, h: rect.h }, gameState, time, offscreenCtx);
            this.ctx.restore();
            this.tileCache.set(cacheKey, offscreenCanvas);
            this.ctx.drawImage(offscreenCanvas, rect.x, rect.y);
        } else {
            this.ctx.save();
            this.ctx.translate(rect.x, rect.y);
            this.drawTileInternal(tileType, { x: 0, y: 0, w: rect.w, h: rect.h }, gameState, time, this.ctx);
            this.ctx.restore();
        }

        // Highlight hover (only if not placing tool)
        const placingTool = this.callbacks?.getPlacingTool?.();
        if (isHover && !placingTool) {
            this.ctx.strokeStyle = this.colors.selection;
            this.ctx.lineWidth = 2;
            this.ctx.globalAlpha = 0.8;
            this.roundRect(rect.x, rect.y, rect.w, rect.h, 4);
            this.ctx.stroke();
            this.ctx.globalAlpha = 1;

            // Subtle glow
            this.ctx.shadowColor = this.colors.selection;
            this.ctx.shadowBlur = 8;
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;
        }
    }

    drawTileInternal(tileType, rect, gameState, time, ctx = this.ctx) {
        const w = rect.w, h = rect.h;

        switch (tileType) {
            case TileType.EMPTY:
                this.drawVoidTile(ctx, w, h, time);
                break;

            case TileType.NORMAL:
                this.drawNormalTile(ctx, w, h);
                break;

            case TileType.CRACKED:
                this.drawCrackedTile(ctx, w, h);
                break;

            case TileType.BRICK:
                this.drawBrickTile(ctx, w, h);
                break;

            case TileType.METAL:
                this.drawMetalTile(ctx, w, h);
                break;

            case TileType.ARROW_GREEN_UP:
            case TileType.ARROW_GREEN_RIGHT:
            case TileType.ARROW_GREEN_DOWN:
            case TileType.ARROW_GREEN_LEFT:
                this.drawArrowTile(ctx, w, h, this.colors.arrowGreen, this.colors.arrowGreenDim,
                    tileType === TileType.ARROW_GREEN_UP ? Dir.UP :
                    tileType === TileType.ARROW_GREEN_RIGHT ? Dir.RIGHT :
                    tileType === TileType.ARROW_GREEN_DOWN ? Dir.DOWN : Dir.LEFT);
                break;

            case TileType.ARROW_GREEN_VOID_UP:
            case TileType.ARROW_GREEN_VOID_RIGHT:
            case TileType.ARROW_GREEN_VOID_DOWN:
            case TileType.ARROW_GREEN_VOID_LEFT:
                this.drawVoidTile(ctx, w, h, time, true); // Static background for arrow tiles
                this.drawArrowSprite({ x: 0, y: 0, w, h }, this.colors.arrowGreen, this.colors.arrowGreenDim,
                    tileType === TileType.ARROW_GREEN_VOID_UP ? Dir.UP :
                    tileType === TileType.ARROW_GREEN_VOID_RIGHT ? Dir.RIGHT :
                    tileType === TileType.ARROW_GREEN_VOID_DOWN ? Dir.DOWN : Dir.LEFT);
                break;

            case TileType.ARROW_BLUE_UP:
            case TileType.ARROW_BLUE_RIGHT:
            case TileType.ARROW_BLUE_DOWN:
            case TileType.ARROW_BLUE_LEFT:
                this.drawArrowTile(ctx, w, h, this.colors.arrowBlue, this.colors.arrowBlueDim,
                    tileType === TileType.ARROW_BLUE_UP ? Dir.UP :
                    tileType === TileType.ARROW_BLUE_RIGHT ? Dir.RIGHT :
                    tileType === TileType.ARROW_BLUE_DOWN ? Dir.DOWN : Dir.LEFT, true);
                break;

            case TileType.ARROW_BLUE_VOID_UP:
            case TileType.ARROW_BLUE_VOID_RIGHT:
            case TileType.ARROW_BLUE_VOID_DOWN:
            case TileType.ARROW_BLUE_VOID_LEFT:
                this.drawVoidTile(ctx, w, h, time, true); // Static background for arrow tiles
                this.drawArrowSprite({ x: 0, y: 0, w, h }, this.colors.arrowBlue, this.colors.arrowBlueDim,
                    tileType === TileType.ARROW_BLUE_VOID_UP ? Dir.UP :
                    tileType === TileType.ARROW_BLUE_VOID_RIGHT ? Dir.RIGHT :
                    tileType === TileType.ARROW_BLUE_VOID_DOWN ? Dir.DOWN : Dir.LEFT, true);
                break;

            case TileType.ARROW_4WAY:
                this.draw4WayArrow(ctx, w, h);
                break;

            case TileType.BUTTON:
                this.drawButton(ctx, w, h, time);
                break;

            case TileType.BOMB:
                this.drawBomb(ctx, w, h, time);
                break;

            case TileType.TRAFFIC_LIGHT_GREEN:
            case TileType.TRAFFIC_LIGHT_RED:
                this.drawTrafficLight(ctx, w, h, tileType === TileType.TRAFFIC_LIGHT_GREEN);
                break;

            default:
                if (tileType >= TileType.PORTAL_RED && tileType <= TileType.PORTAL_ORANGE) {
                    // Portal drawn separately
                } else {
                    this.drawNormalTile(ctx, w, h);
                }
        }

        // Draw portal overlay if this tile has a portal
        if (gameState && gameState.portals) {
            for (const portal of gameState.portals) {
                const portalX = portal.x;
                const portalY = portal.y;
                // Check if portal is on this tile (including off-board)
                const tx = rect.x === 0 ? null : null; // we're in local coords
                // Portal rendering is handled separately in render()
            }
        }
    }

    drawVoidTile(ctx, w, h, time, staticBg = false) {
        // Deep void background
        ctx.fillStyle = this.colors.voidDeep;
        this.roundRect(0, 0, w, h, 4);
        ctx.fill();

        if (!staticBg) {
            // Subtle animated stars/particles
            ctx.fillStyle = this.colors.voidStars;
            for (let i = 0; i < 5; i++) {
                const seed = (time / 1000 + i * 100) * 0.5;
                const sx = (Math.sin(seed + i) * 0.4 + 0.5) * w;
                const sy = (Math.cos(seed * 1.3 + i) * 0.4 + 0.5) * h;
                const size = 1 + Math.sin(time / 500 + i) * 0.5;
                ctx.fillRect(sx, sy, size, size);
            }

            // Subtle swirl
            ctx.strokeStyle = 'rgba(136, 68, 255, 0.08)';
            ctx.lineWidth = 1;
            for (let i = 0; i < 2; i++) {
                const angle = time / 2000 + i * Math.PI;
                const radius = Math.min(w, h) * 0.3 + Math.sin(time / 1000 + i) * 3;
                ctx.beginPath();
                ctx.arc(w / 2, h / 2, radius, angle, angle + Math.PI * 1.5);
                ctx.stroke();
            }
        } else {
            // Static void pattern for arrow tiles - subtle fixed stars
            ctx.fillStyle = this.colors.voidStars;
            const staticStars = [
                { x: 0.2, y: 0.3 }, { x: 0.8, y: 0.2 },
                { x: 0.4, y: 0.7 }, { x: 0.7, y: 0.8 },
                { x: 0.5, y: 0.5 }
            ];
            for (const star of staticStars) {
                ctx.fillRect(star.x * w, star.y * h, 1, 1);
            }
        }
    }

    drawNormalTile(ctx, w, h) {
        // Base - flat, clean pixel art style
        ctx.fillStyle = this.colors.normal;
        this.roundRect(0, 0, w, h, 4);
        ctx.fill();

        // Subtle top edge highlight (just 1px)
        ctx.fillStyle = this.colors.normalHighlight;
        ctx.fillRect(4, 0, w - 8, 1);
        ctx.fillRect(0, 4, 1, h - 8);

        // Subtle inner edge
        ctx.fillStyle = this.colors.normalEdge;
        ctx.fillRect(4, h - 1, w - 8, 1);
        ctx.fillRect(w - 1, 4, 1, h - 8);

        // Tiny texture dots (very subtle)
        ctx.fillStyle = '#202038';
        ctx.fillRect(8, 8, 1, 1);
        ctx.fillRect(w - 9, h - 9, 1, 1);
        ctx.fillRect(w - 9, 8, 1, 1);
        ctx.fillRect(8, h - 9, 1, 1);
    }

    drawCrackedTile(ctx, w, h) {
        // Base - flat, slightly reddish
        ctx.fillStyle = this.colors.cracked;
        this.roundRect(0, 0, w, h, 4);
        ctx.fill();

        // Subtle top edge highlight
        ctx.fillStyle = this.colors.crackedHighlight;
        ctx.fillRect(4, 0, w - 8, 1);
        ctx.fillRect(0, 4, 1, h - 8);

        // Subtle inner edge
        ctx.fillStyle = this.colors.crackedLines;
        ctx.fillRect(4, h - 1, w - 8, 1);
        ctx.fillRect(w - 1, 4, 1, h - 8);

        // Crack pattern - clean, static lines (not moving)
        ctx.strokeStyle = this.colors.crackedLines;
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';

        // Main diagonal crack
        ctx.beginPath();
        ctx.moveTo(6, 4);
        ctx.lineTo(w - 6, h - 4);
        ctx.stroke();

        // Branch cracks
        ctx.beginPath();
        ctx.moveTo(w * 0.5, h * 0.3);
        ctx.lineTo(w * 0.7, h * 0.7);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(w * 0.5, h * 0.3);
        ctx.lineTo(w * 0.3, h * 0.6);
        ctx.stroke();

        // Small edge cracks
        ctx.beginPath();
        ctx.moveTo(w - 4, 6);
        ctx.lineTo(w - 12, 14);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(4, h - 6);
        ctx.lineTo(12, h - 14);
        ctx.stroke();
    }

    drawBrickTile(ctx, w, h) {
        // Base mortar
        ctx.fillStyle = this.colors.brickMortar;
        this.roundRect(0, 0, w, h, 4);
        ctx.fill();

        // Brick pattern - 4 rows, offset for more detail
        const brickW = (w - 8) / 4;
        const brickH = (h - 8) / 4;
        const startX = 4;
        const startY = 4;

        for (let row = 0; row < 4; row++) {
            const offset = row % 2 === 0 ? 0 : brickW / 2;
            for (let col = 0; col < 4; col++) {
                const bx = startX + col * brickW + offset;
                const by = startY + row * brickH;
                const bw = brickW - 2;
                const bh = brickH - 2;

                // Brick body - flat color
                ctx.fillStyle = this.colors.brick;
                this.roundRect(bx, by, bw, bh, 1);
                ctx.fill();

                // Top-left highlight (1px)
                ctx.fillStyle = this.colors.brickHighlight;
                ctx.fillRect(bx + 1, by + 1, bw - 2, 1);
                ctx.fillRect(bx + 1, by + 1, 1, bh - 2);

                // Bottom-right shadow (1px)
                ctx.fillStyle = this.colors.brickDark;
                ctx.fillRect(bx + 1, by + bh - 2, bw - 2, 1);
                ctx.fillRect(bx + bw - 2, by + 1, 1, bh - 2);
            }
        }

        // Mortar lines (subtle)
        ctx.strokeStyle = this.colors.brickMortar;
        ctx.lineWidth = 1;
        ctx.strokeRect(1, 1, w - 2, h - 2);
    }

    drawMetalTile(ctx, w, h) {
        // Base - flat metallic
        ctx.fillStyle = this.colors.metal;
        this.roundRect(0, 0, w, h, 4);
        ctx.fill();

        // Top-left highlight edge
        ctx.fillStyle = this.colors.metalLight;
        ctx.fillRect(4, 0, w - 8, 1);
        ctx.fillRect(0, 4, 1, h - 8);

        // Bottom-right shadow edge
        ctx.fillStyle = this.colors.metalDark;
        ctx.fillRect(4, h - 1, w - 8, 1);
        ctx.fillRect(w - 1, 4, 1, h - 8);

        // Industrial bolt pattern - 3x3 grid
        ctx.fillStyle = this.colors.metalRivet;
        const boltSize = 4;
        const spacing = Math.min(w, h) / 4;
        const start = (Math.min(w, h) - spacing * 2) / 2;

        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                const bx = w / 2 - spacing + col * spacing;
                const by = h / 2 - spacing + row * spacing;

                // Bolt base
                ctx.fillRect(bx - boltSize / 2, by - boltSize / 2, boltSize, boltSize);

                // Bolt highlight (top-left)
                ctx.fillStyle = this.colors.metalSheen;
                ctx.fillRect(bx - boltSize / 2, by - boltSize / 2, 1, 1);
                ctx.fillRect(bx - boltSize / 2, by - boltSize / 2 + 1, 1, 1);

                // Bolt shadow (bottom-right)
                ctx.fillStyle = this.colors.metalDark;
                ctx.fillRect(bx + boltSize / 2 - 1, by + boltSize / 2 - 1, 1, 1);
                ctx.fillRect(bx + boltSize / 2 - 2, by + boltSize / 2 - 1, 1, 1);

                ctx.fillStyle = this.colors.metalRivet;
            }
        }

        // Subtle panel cross lines
        ctx.strokeStyle = this.colors.metalDark;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(w / 2, 6);
        ctx.lineTo(w / 2, h - 6);
        ctx.moveTo(6, h / 2);
        ctx.lineTo(w - 6, h / 2);
        ctx.stroke();
    }

    drawArrowTile(ctx, w, h, color, dimColor, dir, isBlue = false) {
        const cx = w / 2, cy = h / 2;

        // Background - flat, subtle
        ctx.fillStyle = '#16162e';
        this.roundRect(0, 0, w, h, 4);
        ctx.fill();

        // Subtle edge highlight
        ctx.fillStyle = 'rgba(255,255,255,0.03)';
        ctx.fillRect(4, 0, w - 8, 1);
        ctx.fillRect(0, 4, 1, h - 8);
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(4, h - 1, w - 8, 1);
        ctx.fillRect(w - 1, 4, 1, h - 8);

        // Arrow
        this.drawArrowShape(ctx, cx, cy, Math.min(w, h) * 0.38, color, dimColor, dir, isBlue);
    }

    drawArrowShape(ctx, cx, cy, size, color, dimColor, dir, isBlue) {
        const offsets = this.getArrowOffsets(dir, size);

        // Main arrow - solid fill
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(cx + offsets[0].x, cy + offsets[0].y);
        for (let i = 1; i < offsets.length; i++) {
            ctx.lineTo(cx + offsets[i].x, cy + offsets[i].y);
        }
        ctx.closePath();
        ctx.fill();

        // Blue arrow - inner highlight shaft
        if (isBlue) {
            ctx.fillStyle = dimColor;
            ctx.beginPath();
            ctx.moveTo(cx + offsets[0].x * 0.45, cy + offsets[0].y * 0.45);
            for (let i = 1; i < offsets.length; i++) {
                ctx.lineTo(cx + offsets[i].x * 0.45, cy + offsets[i].y * 0.45);
            }
            ctx.closePath();
            ctx.fill();
        }
    }

    getArrowOffsets(dir, size) {
        const base = [
            { x: size, y: 0 },
            { x: -size * 0.5, y: -size * 0.65 },
            { x: -size * 0.2, y: -size * 0.2 },
            { x: -size * 0.2, y: -size * 0.8 },
            { x: -size * 0.85, y: -size * 0.8 },
            { x: -size * 0.85, y: size * 0.8 },
            { x: -size * 0.2, y: size * 0.8 },
            { x: -size * 0.2, y: size * 0.2 },
            { x: -size * 0.5, y: size * 0.65 }
        ];

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

    drawArrowSprite(rect, color, dimColor, dir, isBlue = false) {
        const cx = rect.x + rect.w / 2;
        const cy = rect.y + rect.h / 2;
        const size = Math.min(rect.w, rect.h) * 0.38;
        this.drawArrowShape(this.ctx, cx, cy, size, color, dimColor, dir, isBlue);
    }

    draw4WayArrow(ctx, w, h) {
        const cx = w / 2, cy = h / 2;
        const size = Math.min(w, h) * 0.22;

        // Background - flat
        ctx.fillStyle = '#16162e';
        this.roundRect(0, 0, w, h, 4);
        ctx.fill();

        // Subtle edge highlight
        ctx.fillStyle = 'rgba(255,255,255,0.03)';
        ctx.fillRect(4, 0, w - 8, 1);
        ctx.fillRect(0, 4, 1, h - 8);
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(4, h - 1, w - 8, 1);
        ctx.fillRect(w - 1, 4, 1, h - 8);

        // Center cross
        ctx.fillStyle = this.colors.arrowGreen;
        ctx.fillRect(cx - 1, cy - size, 2, size * 2);
        ctx.fillRect(cx - size, cy - 1, size * 2, 2);

        // Four small arrows
        for (const dir of [Dir.UP, Dir.RIGHT, Dir.DOWN, Dir.LEFT]) {
            ctx.fillStyle = this.colors.arrowGreen;
            ctx.beginPath();
            const offsets = this.getArrowOffsets(dir, size);
            ctx.moveTo(cx + offsets[0].x, cy + offsets[0].y);
            for (let i = 1; i < offsets.length; i++) {
                ctx.lineTo(cx + offsets[i].x, cy + offsets[i].y);
            }
            ctx.closePath();
            ctx.fill();
        }
    }

    drawButton(ctx, w, h, time) {
        const cx = w / 2, cy = h / 2;
        const radius = Math.min(w, h) * 0.28;

        // Base - show underlying normal tile
        this.drawNormalTile(ctx, w, h);

        // Button body - flat, no pulse (static for cleaner look)
        ctx.fillStyle = this.colors.button;
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Subtle highlight ring
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, radius - 1, 0, Math.PI * 2);
        ctx.stroke();

        // Small crosshair center for clarity
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx - 4, cy);
        ctx.lineTo(cx + 4, cy);
        ctx.moveTo(cx, cy - 4);
        ctx.lineTo(cx, cy + 4);
        ctx.stroke();
    }

    drawBomb(ctx, w, h, time) {
        const cx = w / 2, cy = h / 2;
        const radius = Math.min(w, h) * 0.26;

        // Base - show underlying normal tile
        this.drawNormalTile(ctx, w, h);

        // Bomb body - flat
        ctx.fillStyle = this.colors.bomb;
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Highlight
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, radius - 1, 0, Math.PI * 2);
        ctx.stroke();

        // Fuse - static (no animation for cleaner look)
        const fuseAngle = -Math.PI / 4;
        const fuseLength = radius * 1.1;

        ctx.strokeStyle = this.colors.bombFuse;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(cx, cy - radius);
        ctx.lineTo(cx + Math.cos(fuseAngle) * fuseLength, cy - radius + Math.sin(fuseAngle) * fuseLength);
        ctx.stroke();

        // Fuse tip
        const tipX = cx + Math.cos(fuseAngle) * fuseLength;
        const tipY = cy - radius + Math.sin(fuseAngle) * fuseLength;
        ctx.fillStyle = this.colors.bombFuse;
        ctx.beginPath();
        ctx.arc(tipX, tipY, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    drawTrafficLight(ctx, w, h, isGreen) {
        const cx = w / 2, cy = h / 2;
        const radius = Math.min(w, h) * 0.26;

        // Base - show underlying normal tile
        this.drawNormalTile(ctx, w, h);

        // Light housing - flat
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(cx - 10, 6, 20, h - 12);

        // Light
        const lightColor = isGreen ? this.colors.trafficGreen : this.colors.trafficRed;
        ctx.fillStyle = lightColor;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();

        // Subtle glow
        ctx.shadowColor = lightColor;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 0.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Inner highlight
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.beginPath();
        ctx.arc(cx - 2, cy - 2, radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }

    drawCoin(x, y) {
        const rect = this.getTileRect(x, y);
        const cx = rect.x + rect.w / 2;
        const cy = rect.y + rect.h / 2;
        const radius = Math.min(rect.w, rect.h) * 0.42;
        const time = this.time;

        // Spin animation - more pronounced
        const scaleX = Math.abs(Math.cos(time / 300));
        const currentRadius = radius * (0.5 + 0.5 * scaleX);

        // Drop shadow on tile (more visible)
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.ellipse(cx + 2, cy + 3, currentRadius * 0.95, radius * 0.18, 0, 0, Math.PI * 2);
        ctx.fill();

        // Outer glow ring
        ctx.shadowColor = this.colors.coinGlow;
        ctx.shadowBlur = 16;
        ctx.strokeStyle = this.colors.coin;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(cx, cy, currentRadius + 2, radius + 2, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Main coin body - brighter
        ctx.fillStyle = this.colors.coin;
        ctx.beginPath();
        ctx.ellipse(cx, cy, currentRadius, radius, 0, 0, Math.PI * 2);
        ctx.fill();

        // Inner detail ring
        ctx.fillStyle = this.colors.coinDim;
        ctx.beginPath();
        ctx.ellipse(cx, cy, currentRadius * 0.7, radius * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Center shine (larger)
        ctx.fillStyle = '#fff8cc';
        ctx.beginPath();
        ctx.ellipse(cx - 2, cy - 2, currentRadius * 0.35, radius * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();

        // Edge highlight for depth
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(cx, cy, currentRadius, radius, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Sparkle effect (static positions for pixel art feel)
        ctx.fillStyle = '#fff';
        const sparkleTime = Math.floor(time / 200) % 4;
        const sparkles = [
            { x: -0.6, y: -0.6 }, { x: 0.6, y: -0.6 },
            { x: -0.6, y: 0.6 }, { x: 0.6, y: 0.6 }
        ];
        const s = sparkles[sparkleTime];
        ctx.beginPath();
        ctx.arc(cx + s.x * currentRadius * 0.5, cy + s.y * radius * 0.5, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    drawFlag(x, y, color) {
        const rect = this.getTileRect(x, y);
        const cx = rect.x + rect.w / 2;
        const cy = rect.y + rect.h / 2;
        const time = this.time;

        // Pole - flat pixel art style
        ctx.fillStyle = '#5a4525';
        ctx.fillRect(cx - 1, rect.y + 4, 3, rect.h - 10);

        // Pole base
        ctx.fillStyle = '#4a3520';
        ctx.beginPath();
        ctx.arc(cx, rect.y + rect.h - 4, 4, 0, Math.PI * 2);
        ctx.fill();

        // Flag cloth - waving animation
        const wave = Math.sin(time / 300) * 3;
        const flagW = 20;
        const flagH = 14;

        // Determine flag color and symbol based on type
        let flagColor, flagSymbol, flagAccent;
        if (color === KnightColor.WHITE) {
            flagColor = this.colors.flagWhite;
            flagSymbol = '★'; // Star for white
            flagAccent = '#ffd700';
        } else if (color === KnightColor.BLACK) {
            flagColor = this.colors.flagBlack;
            flagSymbol = '☠'; // Skull for black
            flagAccent = '#ff4444';
        } else {
            flagColor = this.colors.flagGold;
            flagSymbol = '◆'; // Diamond for gold
            flagAccent = '#ffcc00';
        }

        // Flag cloth
        ctx.fillStyle = flagColor;
        ctx.beginPath();
        ctx.moveTo(cx, rect.y + 6);
        ctx.bezierCurveTo(
            cx + flagW, rect.y + 6 + wave,
            cx + flagW, rect.y + 6 + flagH + wave,
            cx, rect.y + 6 + flagH
        );
        ctx.closePath();
        ctx.fill();

        // Flag highlight (subtle)
        ctx.fillStyle = flagColor === this.colors.flagWhite ? '#e8e8f0' :
                        flagColor === this.colors.flagBlack ? '#2a2a4a' : '#fff8a0';
        ctx.globalAlpha = 0.25;
        ctx.beginPath();
        ctx.moveTo(cx + 2, rect.y + 8);
        ctx.bezierCurveTo(
            cx + flagW * 0.6, rect.y + 8 + wave * 0.5,
            cx + flagW * 0.6, rect.y + 8 + flagH * 0.6 + wave * 0.5,
            cx + 2, rect.y + 8 + flagH * 0.6
        );
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;

        // Flag outline for visibility
        ctx.strokeStyle = flagColor === this.colors.flagWhite ? '#8888a0' :
                         flagColor === this.colors.flagBlack ? '#000000' : '#b89000';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx, rect.y + 6);
        ctx.bezierCurveTo(
            cx + flagW, rect.y + 6 + wave,
            cx + flagW, rect.y + 6 + flagH + wave,
            cx, rect.y + 6 + flagH
        );
        ctx.stroke();

        // Symbol on flag - distinct for each type
        ctx.fillStyle = flagColor === this.colors.flagWhite ? '#1a1a2e' :
                        flagColor === this.colors.flagBlack ? '#ff6666' : '#1a1a2e';
        ctx.font = `bold ${flagH * 0.7}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const symbolX = cx + flagW * 0.45 + wave * 0.3;
        const symbolY = rect.y + 6 + flagH * 0.5 + wave * 0.5;
        ctx.fillText(flagSymbol, symbolX, symbolY);

        // Pole top ornament - different for each type
        ctx.fillStyle = flagAccent;
        ctx.beginPath();
        ctx.arc(cx, rect.y + 4, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = flagColor === this.colors.flagWhite ? '#fff' : '#000';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    drawChessPiece(x, y, type, color) {
        const rect = this.getTileRect(x, y);
        const cx = rect.x + rect.w / 2;
        const cy = rect.y + rect.h / 2;
        const size = Math.min(rect.w, rect.h) * 0.38;

        const knightColor = this.getKnightColor(color);
        const isWhite = color === KnightColor.WHITE;

        // Base circle - flat style matching knights
        if (isWhite) {
            const grad = ctx.createRadialGradient(cx - 3, cy - 3, 0, cx, cy, size);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.5, '#f0f0f8');
            grad.addColorStop(1, '#d0d0e8');
            ctx.fillStyle = grad;
        } else {
            const grad = ctx.createRadialGradient(cx - 3, cy - 3, 0, cx, cy, size);
            grad.addColorStop(0, '#2a2a4a');
            grad.addColorStop(0.5, '#16162a');
            grad.addColorStop(1, '#080814');
            ctx.fillStyle = grad;
        }
        ctx.beginPath();
        ctx.arc(cx, cy, size, 0, Math.PI * 2);
        ctx.fill();

        // Colored rim for black pieces
        if (!isWhite) {
            ctx.strokeStyle = knightColor;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(cx, cy, size - 1, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Outline
        ctx.strokeStyle = isWhite ? this.colors.knightOutlineWhite : this.colors.knightOutline;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Symbol
        ctx.fillStyle = isWhite ? '#1a1a2e' : '#ffffff';
        ctx.font = `bold ${size * 1.2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const symbols = {
            [TileType.CHESS_PAWN]: '♟',
            [TileType.CHESS_BISHOP]: '♝',
            [TileType.CHESS_ROOK]: '♜',
            [TileType.CHESS_QUEEN]: '♛',
            [TileType.CHESS_KING]: '♚'
        };
        ctx.fillText(symbols[type] || '?', cx, cy + size * 0.08);
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

        // Outer animated rings - cleaner
        for (let i = 3; i >= 0; i--) {
            const baseRadius = Math.min(rect.w, rect.h) * (0.28 + i * 0.08);
            const radius = baseRadius + Math.sin(time / 600 + i) * 3;
            const alpha = 0.1 + i * 0.08;

            ctx.strokeStyle = this.hexToRgba(colorHex, alpha);
            ctx.lineWidth = i === 0 ? 2.5 : 1.5;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Center core
        const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(rect.w, rect.h) * 0.2);
        coreGrad.addColorStop(0, '#ffffff');
        coreGrad.addColorStop(0.4, colorHex);
        coreGrad.addColorStop(1, this.hexToRgba(colorHex, 0));
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, Math.min(rect.w, rect.h) * 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Swirl lines
        ctx.strokeStyle = this.hexToRgba('#ffffff', 0.35);
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        for (let i = 0; i < 3; i++) {
            const angle = time / 500 + i * Math.PI * 2 / 3;
            const r1 = Math.min(rect.w, rect.h) * 0.08;
            const r2 = Math.min(rect.w, rect.h) * 0.22;
            ctx.beginPath();
            ctx.arc(cx, cy, r1, angle, angle + Math.PI * 0.5);
            ctx.arc(cx, cy, r2, angle + Math.PI * 0.5, angle);
            ctx.stroke();
        }

        // Particles
        ctx.fillStyle = colorHex;
        for (let i = 0; i < 4; i++) {
            const angle = time / 800 + i * Math.PI * 2 / 4;
            const r = Math.min(rect.w, rect.h) * (0.18 + Math.sin(time / 700 + i) * 0.06);
            const px = cx + Math.cos(angle) * r;
            const py = cy + Math.sin(angle) * r;
            ctx.beginPath();
            ctx.arc(px, py, 1.5, 0, Math.PI * 2);
            ctx.fill();
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

        const dist = Math.hypot(x2 - x1, y2 - y1);
        const maxDist = tether.length * (this.tileSize + this.tileGap);
        const tension = Math.min(1, dist / maxDist);

        ctx.strokeStyle = tether.broken ? this.colors.tetherBroken : this.colors.tether;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.setLineDash([8, 4]);
        ctx.globalAlpha = tether.broken ? 0.5 : 0.8;

        // Curved line with tension
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const perpX = -(y2 - y1) / dist * 10 * Math.sin(this.time / 400);
        const perpY = (x2 - x1) / dist * 10 * Math.sin(this.time / 400);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.quadraticCurveTo(midX + perpX, midY + perpY, x2, y2);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.globalAlpha = 1;

        // End markers
        if (!tether.broken) {
            ctx.fillStyle = this.colors.tether;
            for (const [x, y] of [[x1, y1], [x2, y2]]) {
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(x, y, 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = this.colors.tether;
            }
        }
    }

    drawKnight(knight, gameState) {
        const rect = this.getTileRect(knight.x, knight.y);
        const cx = rect.x + rect.w / 2;
        const cy = rect.y + rect.h / 2;
        const size = Math.min(rect.w, rect.h) * 0.42;

        const color = this.getKnightColor(knight.color);
        const isWhite = knight.color === KnightColor.WHITE;
        const outline = knight.atFlag ? this.colors.selection : (isWhite ? this.colors.knightOutlineWhite : this.colors.knightOutline);

        const isSelected = this.callbacks?.getSelectedKnight?.() === knight;
        const pulse = isSelected ? (Math.sin(this.time / 200) + 1) / 2 : 0;

        // Elevation shadow (if carrying another knight)
        if (knight.elevation > 0) {
            ctx.fillStyle = 'rgba(0,0,0,0.25)';
            ctx.beginPath();
            ctx.ellipse(cx, cy + size * 0.85, size * 0.85, size * 0.25, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Selected knight glow (behind knight)
        if (isSelected) {
            const glowSize = size + 8 + pulse * 6;
            const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowSize);
            grad.addColorStop(0, this.hexToRgba(this.colors.selection, 0.3));
            grad.addColorStop(0.5, this.hexToRgba(this.colors.selection, 0.1));
            grad.addColorStop(1, this.hexToRgba(this.colors.selection, 0));
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(cx, cy, glowSize, 0, Math.PI * 2);
            ctx.fill();
        }

        // Knight body - distinct flat styles for white vs black
        if (isWhite) {
            // White knight - bright, clean with blue accent
            const bodyGrad = ctx.createRadialGradient(cx - 3, cy - 3, 0, cx, cy, size);
            bodyGrad.addColorStop(0, '#ffffff');
            bodyGrad.addColorStop(0.5, '#f0f0f8');
            bodyGrad.addColorStop(1, '#d0d0e8');
            ctx.fillStyle = bodyGrad;
            ctx.beginPath();
            ctx.arc(cx, cy, size, 0, Math.PI * 2);
            ctx.fill();

            // Inner highlight (top-left)
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.beginPath();
            ctx.arc(cx - 3, cy - 3, size * 0.55, -Math.PI / 4, Math.PI * 3 / 4);
            ctx.fill();

            // White knight accent ring
            ctx.strokeStyle = '#4488ff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(cx, cy, size - 2, 0, Math.PI * 2);
            ctx.stroke();
        } else {
            // Black knight - dark with distinct colored rim and red accent
            const bodyGrad = ctx.createRadialGradient(cx - 3, cy - 3, 0, cx, cy, size);
            bodyGrad.addColorStop(0, '#2a2a4a');
            bodyGrad.addColorStop(0.5, '#16162a');
            bodyGrad.addColorStop(1, '#080814');
            ctx.fillStyle = bodyGrad;
            ctx.beginPath();
            ctx.arc(cx, cy, size, 0, Math.PI * 2);
            ctx.fill();

            // Colored rim for black knight (shows knight color)
            ctx.strokeStyle = color;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(cx, cy, size - 1, 0, Math.PI * 2);
            ctx.stroke();

            // Black knight accent ring
            ctx.strokeStyle = '#ff4444';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(cx, cy, size - 5, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Outline
        ctx.strokeStyle = outline;
        ctx.lineWidth = knight.atFlag ? 3 : (isSelected ? 2.5 : 2);
        ctx.stroke();

        // Selected double ring
        if (isSelected) {
            ctx.strokeStyle = this.hexToRgba(this.colors.selection, 0.8);
            ctx.lineWidth = 1.5;
            ctx.setLineDash([8, 4]);
            ctx.lineDashOffset = -this.time / 80;
            ctx.beginPath();
            ctx.arc(cx, cy, size + 5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);

            // Pulsing outer ring
            ctx.strokeStyle = this.hexToRgba(this.colors.selection, 0.4 + pulse * 0.4);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(cx, cy, size + 8 + pulse * 4, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Knight symbol (horse) - different for white/black
        ctx.fillStyle = isWhite ? '#1a1a2e' : '#ffffff';
        ctx.font = `bold ${size * 1.5}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // White knight = white horse (♘), Black knight = black horse (♞)
        const symbol = isWhite ? '♘' : '♞';
        ctx.fillText(symbol, cx, cy + size * 0.05);

        // Carried coin indicator
        if (knight.hasCoin) {
            const coinX = cx + size * 0.7;
            const coinY = cy - size * 0.7;
            const coinR = 8;

            ctx.shadowColor = this.colors.coinGlow;
            ctx.shadowBlur = 6;
            ctx.fillStyle = this.colors.coin;
            ctx.beginPath();
            ctx.arc(coinX, coinY, coinR, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            ctx.fillStyle = this.colors.coinDim;
            ctx.beginPath();
            ctx.arc(coinX, coinY, coinR * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Carried knight indicator
        if (knight.carriedKnight) {
            ctx.strokeStyle = this.colors.selection;
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 2]);
            ctx.beginPath();
            ctx.arc(cx, cy, size + 5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }

    drawValidDestinations(destinations) {
        for (const dest of destinations) {
            // Skip drawing void destinations
            if (dest.stuckInVoid || (dest.offBoard && dest.stuckInVoid)) {
                continue;
            }

            const rect = this.getTileRect(dest.x, dest.y);
            const cx = rect.x + rect.w / 2;
            const cy = rect.y + rect.h / 2;

            const pulse = (Math.sin(this.time / 250) + 1) / 2;
            const alpha = 0.25 + pulse * 0.25;
            const ringAlpha = 0.5 + pulse * 0.3;

            // Destination circle with gradient
            const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(rect.w, rect.h) * 0.38);
            grad.addColorStop(0, this.hexToRgba(this.colors.validMove, alpha * 1.5));
            grad.addColorStop(1, this.hexToRgba(this.colors.validMove, 0));
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(cx, cy, Math.min(rect.w, rect.h) * 0.38, 0, Math.PI * 2);
            ctx.fill();

            // Outer pulsing ring
            ctx.strokeStyle = this.hexToRgba(this.colors.validMove, ringAlpha);
            ctx.lineWidth = 2;
            ctx.setLineDash([10, 5]);
            ctx.lineDashOffset = -this.time / 40;
            ctx.beginPath();
            ctx.arc(cx, cy, Math.min(rect.w, rect.h) * 0.48, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);

            // Knight move indicator (L-shape)
            ctx.strokeStyle = this.hexToRgba(this.colors.validMove, 0.6);
            ctx.lineWidth = 1.5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(cx - 10, cy - 10);
            ctx.lineTo(cx - 10, cy + 10);
            ctx.lineTo(cx + 10, cy + 10);
            ctx.stroke();

            // Subtle arrow pointing to destination from knight
            const selectedKnight = this.callbacks?.getSelectedKnight?.();
            if (selectedKnight) {
                const knightRect = this.getTileRect(selectedKnight.x, selectedKnight.y);
                const kcx = knightRect.x + knightRect.w / 2;
                const kcy = knightRect.y + knightRect.h / 2;
                const angle = Math.atan2(cy - kcy, cx - kcx);
                const dist = Math.hypot(cx - kcx, cy - kcy);
                const midX = kcx + Math.cos(angle) * dist * 0.5;
                const midY = kcy + Math.sin(angle) * dist * 0.5;

                ctx.strokeStyle = this.hexToRgba(this.colors.validMove, 0.3 + pulse * 0.3);
                ctx.lineWidth = 1;
                ctx.lineCap = 'round';
                ctx.setLineDash([8, 4]);
                ctx.lineDashOffset = -this.time / 30;
                ctx.beginPath();
                ctx.moveTo(kcx, kcy);
                ctx.lineTo(cx, cy);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }
    }

    drawToolPreview(tool, x, y, gameState) {
        const rect = this.getTileRect(x, y);
        const cx = rect.x + rect.w / 2;
        const cy = rect.y + rect.h / 2;

        let valid = false;
        if (tool === 'hammer') {
            const tile = gameState.board[y]?.[x];
            valid = tile === TileType.EMPTY || tile === TileType.NORMAL || tile === TileType.BRICK || tile === TileType.METAL || tile === TileType.CRACKED;
            // Off-board check
            if (!valid && gameState.offBoardTiles && gameState.offBoardTiles.has(`${x},${y}`)) {
                valid = true;
            }
        } else if (tool.startsWith('arrow_')) {
            const tile = gameState.board[y]?.[x];
            valid = tile === TileType.EMPTY || tile === TileType.NORMAL || tile === TileType.CRACKED;
            if (!valid && gameState.offBoardTiles && gameState.offBoardTiles.has(`${x},${y}`)) {
                valid = true;
            }
        } else if (tool === 'portalGun') {
            // Portal gun can be placed on empty/normal tiles
            const tile = gameState.board[y]?.[x];
            valid = tile === TileType.EMPTY || tile === TileType.NORMAL;
        }

        const previewColor = valid ? this.colors.toolPreview : this.colors.toolPreviewInvalid;
        const pulse = (Math.sin(this.time / 200) + 1) / 2;

        // Preview tile highlight with pulse
        ctx.fillStyle = this.hexToRgba(previewColor, 0.15 + pulse * 0.1);
        this.roundRect(rect.x, rect.y, rect.w, rect.h, 4);
        ctx.fill();

        // Animated border with pulse
        ctx.strokeStyle = previewColor;
        ctx.lineWidth = 2 + pulse * 1.5;
        ctx.setLineDash([8, 4]);
        ctx.lineDashOffset = -this.time / 50;
        this.roundRect(rect.x, rect.y, rect.w, rect.h, 4);
        ctx.stroke();
        ctx.setLineDash([]);

        // Corner brackets for valid placement
        if (valid) {
            const bracketSize = 12 + pulse * 4;
            ctx.strokeStyle = previewColor;
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';

            // Top-left
            ctx.beginPath();
            ctx.moveTo(rect.x + 4, rect.y + bracketSize + 4);
            ctx.lineTo(rect.x + 4, rect.y + 4);
            ctx.lineTo(rect.x + bracketSize + 4, rect.y + 4);
            ctx.stroke();

            // Top-right
            ctx.beginPath();
            ctx.moveTo(rect.x + rect.w - 4 - bracketSize, rect.y + 4);
            ctx.lineTo(rect.x + rect.w - 4, rect.y + 4);
            ctx.lineTo(rect.x + rect.w - 4, rect.y + bracketSize + 4);
            ctx.stroke();

            // Bottom-left
            ctx.beginPath();
            ctx.moveTo(rect.x + 4, rect.y + rect.h - 4 - bracketSize);
            ctx.lineTo(rect.x + 4, rect.y + rect.h - 4);
            ctx.lineTo(rect.x + bracketSize + 4, rect.y + rect.h - 4);
            ctx.stroke();

            // Bottom-right
            ctx.beginPath();
            ctx.moveTo(rect.x + rect.w - 4 - bracketSize, rect.y + rect.h - 4);
            ctx.lineTo(rect.x + rect.w - 4, rect.y + rect.h - 4);
            ctx.lineTo(rect.x + rect.w - 4, rect.y + rect.h - 4 - bracketSize);
            ctx.stroke();
        }

        // Tool icon
        ctx.font = '32px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = previewColor;
        ctx.globalAlpha = 0.95 + pulse * 0.05;

        let icon = '';
        if (tool === 'hammer') icon = '⚒';
        else if (tool === 'arrow_up') icon = '↑';
        else if (tool === 'arrow_right') icon = '→';
        else if (tool === 'arrow_down') icon = '↓';
        else if (tool === 'arrow_left') icon = '←';
        else if (tool === 'boot') icon = '👢';
        else if (tool === 'portalGun') icon = '🌀';

        if (icon) {
            ctx.shadowColor = previewColor;
            ctx.shadowBlur = 8 + pulse * 8;
            ctx.fillText(icon, cx, cy + 2);
            ctx.shadowBlur = 0;
        }
        ctx.globalAlpha = 1;

        // Show action hint for hammer
        if (tool === 'hammer' && valid) {
            const tile = gameState.board[y]?.[x];
            const isOffBoard = !gameState.board[y]?.[x];
            const isBrickOrMetal = tile === TileType.BRICK || tile === TileType.METAL;
            const hint = isOffBoard ? 'Build' : (isBrickOrMetal ? 'Right-click: Destroy' : 'Left-click: Build');
            ctx.font = '10px JetBrains Mono';
            ctx.fillStyle = this.hexToRgba(previewColor, 0.8);
            ctx.textAlign = 'center';
            ctx.fillText(hint, cx, rect.y - 8);
        }
    }

    drawAnimations() {
        for (let i = this.animations.length - 1; i >= 0; i--) {
            const anim = this.animations[i];
            anim.update();
            anim.draw(this.ctx, this);
            if (anim.done) this.animations.splice(i, 1);
        }
    }

    addAnimation(animation) {
        this.animations.push(animation);
    }

    setScreenShake(x, y) {
        this.screenShake = { x, y };
    }

    clearScreenShake() {
        this.screenShake = { x: 0, y: 0 };
    }

    // Utility
    roundRect(x, y, w, h, r) {
        const ctx = this.ctx;
        r = Math.min(r, w / 2, h / 2);
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    getKnightColor(color) {
        const colors = {
            [KnightColor.WHITE]: '#ffffff',
            [KnightColor.BLACK]: '#0d0d1a',
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
    constructor(x, y, color, count = 8, options = {}) {
        this.particles = [];
        this.done = false;
        const gravity = options.gravity ?? 0.1;
        const life = options.life ?? 1;
        const decay = options.decay ?? 0.02;
        const speed = options.speed ?? 3;
        const size = options.size ?? 3;

        for (let i = 0; i < count; i++) {
            const angle = options.directional
                ? options.baseAngle + (Math.random() - 0.5) * (options.spread ?? Math.PI / 2)
                : (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
            const spd = speed + Math.random() * speed * 0.5;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                life,
                maxLife: life,
                decay: decay + Math.random() * decay,
                size: size + Math.random() * size * 0.5,
                color,
                gravity,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.1
            });
        }
    }

    update() {
        let alive = 0;
        for (const p of this.particles) {
            if (p.life > 0) {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += p.gravity;
                p.vx *= 0.99; // Air resistance
                p.vy *= 0.99;
                p.life -= p.decay;
                p.rotation += p.rotationSpeed;
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

                // Draw as small squares for pixel art feel
                const size = p.size * p.life;
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);
                ctx.fillRect(-size / 2, -size / 2, size, size);
                ctx.restore();

                // Add glow for certain particles
                if (p.maxLife > 0.5) {
                    ctx.globalAlpha = p.life * 0.3;
                    ctx.shadowColor = p.color;
                    ctx.shadowBlur = 6;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, size * 1.5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }
                ctx.globalAlpha = 1;
            }
        }
    }
}

export class KnightMoveAnimation {
    constructor(knight, fromX, fromY, toX, toY, tileSize, tileGap, offsetX, offsetY, duration = 200) {
        this.knight = knight;
        this.fromX = fromX;
        this.fromY = fromY;
        this.toX = toX;
        this.toY = toY;
        this.tileSize = tileSize;
        this.tileGap = tileGap;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        this.duration = duration;
        this.startTime = Date.now();
        this.done = false;
        this.color = knight.color === KnightColor.WHITE ? '#ffffff' : '#0d0d1a';
        this.symbol = knight.color === KnightColor.WHITE ? '♘' : '♞';
    }

    getProgress() {
        const elapsed = Date.now() - this.startTime;
        return Math.min(1, elapsed / this.duration);
    }

    update() {
        if (this.getProgress() >= 1) {
            this.done = true;
        }
    }

    draw(ctx, renderer) {
        const t = this.getProgress();
        const eased = 1 - Math.pow(1 - t, 3); // Ease out cubic

        // L-shaped path interpolation
        const dx = this.toX - this.fromX;
        const dy = this.toY - this.fromY;
        const midX = this.fromX + dx / 2;
        const midY = this.fromY + dy / 2;

        // Calculate position along L-path
        let px, py;
        if (t < 0.5) {
            // First leg
            const legT = t * 2;
            px = this.fromX + (midX - this.fromX) * legT;
            py = this.fromY + (midY - this.fromY) * legT;
        } else {
            // Second leg
            const legT = (t - 0.5) * 2;
            px = midX + (this.toX - midX) * legT;
            py = midY + (this.toY - midY) * legT;
        }

        const rect = renderer.getTileRect(px, py);
        const cx = rect.x + rect.w / 2;
        const cy = rect.y + rect.h / 2;
        const size = Math.min(rect.w, rect.h) * 0.42;

        // Ghost trail with fading
        for (let i = 1; i <= 5; i++) {
            const trailT = Math.max(0, t - i * 0.08);
            if (trailT > 0) {
                let tx, ty;
                if (trailT < 0.5) {
                    const lt = trailT * 2;
                    tx = this.fromX + (midX - this.fromX) * lt;
                    ty = this.fromY + (midY - this.fromY) * lt;
                } else {
                    const lt = (trailT - 0.5) * 2;
                    tx = midX + (this.toX - midX) * lt;
                    ty = midY + (this.toY - midY) * lt;
                }
                const trailRect = renderer.getTileRect(tx, ty);
                const tcx = trailRect.x + trailRect.w / 2;
                const tcy = trailRect.y + trailRect.h / 2;
                const alpha = 0.15 * (1 - i * 0.18);
                const trailSize = size * (0.6 + i * 0.08);
                ctx.globalAlpha = alpha;
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(tcx, tcy, trailSize, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.globalAlpha = 1;

        // Draw knight at interpolated position with subtle scale
        const scale = 1 + (1 - eased) * 0.1;
        const drawSize = size * scale;

        // Glow during movement
        if (t < 1) {
            const glowAlpha = (1 - t) * 0.3;
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 10 * glowAlpha;
        }

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(cx, cy, drawSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Outline
        ctx.strokeStyle = this.knight.color === KnightColor.WHITE ? '#333344' : '#000000';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Inner highlight for white knight
        if (this.knight.color === KnightColor.WHITE) {
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(cx - 2, cy - 2, drawSize * 0.6, -Math.PI / 4, Math.PI * 3 / 4);
            ctx.stroke();
        }

        // Symbol
        ctx.fillStyle = this.knight.color === KnightColor.WHITE ? '#1a1a2e' : '#fff';
        ctx.font = `bold ${drawSize * 1.4}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.symbol, cx, cy + drawSize * 0.05);
    }
}

export class ScreenShakeAnimation {
    constructor(intensity = 5, duration = 300) {
        this.intensity = intensity;
        this.duration = duration;
        this.startTime = Date.now();
        this.done = false;
        this.seed = Math.random() * 1000;
    }

    update() {
        if (Date.now() - this.startTime > this.duration) {
            this.done = true;
        }
    }

    draw(ctx) {
        // Applied externally via renderer.screenShake
    }

    getOffset() {
        const progress = (Date.now() - this.startTime) / this.duration;
        const currentIntensity = this.intensity * (1 - progress) * (1 - progress); // Ease out
        const time = Date.now() / 30;
        return {
            x: Math.sin(time * 1.3 + this.seed) * currentIntensity + Math.cos(time * 2.1 + this.seed) * currentIntensity * 0.5,
            y: Math.cos(time * 1.7 + this.seed) * currentIntensity + Math.sin(time * 2.5 + this.seed) * currentIntensity * 0.5
        };
    }
}

export class TileTransitionAnimation {
    constructor(x, y, fromType, toType, tileSize, tileGap, offsetX, offsetY, duration = 300) {
        this.x = x;
        this.y = y;
        this.fromType = fromType;
        this.toType = toType;
        this.tileSize = tileSize;
        this.tileGap = tileGap;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        this.duration = duration;
        this.startTime = Date.now();
        this.done = false;
    }

    update() {
        if (Date.now() - this.startTime > this.duration) {
            this.done = true;
        }
    }

    draw(ctx, renderer) {
        const t = Math.min(1, (Date.now() - this.startTime) / this.duration);
        const rect = renderer.getTileRect(this.x, this.y);

        // Dissolve effect
        ctx.globalAlpha = 1 - t;
        // Draw fromType fading out
        // (Simplified - would need tile drawing logic here)
        ctx.globalAlpha = 1;
    }
}

export class CoinCollectAnimation {
    constructor(x, y, tileSize, tileGap, offsetX, offsetY) {
        this.x = x;
        this.y = y;
        this.tileSize = tileSize;
        this.tileGap = tileGap;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        this.startTime = Date.now();
        this.duration = 600;
        this.done = false;
    }

    update() {
        if (Date.now() - this.startTime > this.duration) {
            this.done = true;
        }
    }

    draw(ctx, renderer) {
        const t = Math.min(1, (Date.now() - this.startTime) / this.duration);
        const eased = 1 - Math.pow(1 - t, 3);
        const rect = renderer.getTileRect(this.x, this.y);
        const cx = rect.x + rect.w / 2;
        const cy = rect.y + rect.h / 2;

        const scale = 1 + eased * 2;
        const alpha = 1 - eased;

        // Central expanding ring
        ctx.globalAlpha = alpha * 0.5;
        ctx.strokeStyle = '#ffd43b';
        ctx.lineWidth = 3 * (1 - eased);
        ctx.beginPath();
        ctx.arc(cx, cy, 10 + eased * 40, 0, Math.PI * 2);
        ctx.stroke();

        // Main coin burst
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#ffd43b';
        ctx.shadowColor = '#fff0a0';
        ctx.shadowBlur = 20 * alpha;
        ctx.beginPath();
        ctx.arc(cx, cy, 12 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Inner shine
        ctx.globalAlpha = alpha * 0.8;
        ctx.fillStyle = '#fff8cc';
        ctx.beginPath();
        ctx.arc(cx, cy, 6 * scale, 0, Math.PI * 2);
        ctx.fill();

        // Burst particles with trails
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 * i) / 12 + t * 2;
            const dist = 15 + eased * 35;
            const particleAlpha = alpha * (1 - i * 0.05);
            ctx.globalAlpha = particleAlpha;
            ctx.fillStyle = '#ffd43b';
            ctx.beginPath();
            ctx.arc(cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist, 4 * (1 - eased), 0, Math.PI * 2);
            ctx.fill();
        }

        // Sparkle lines
        ctx.globalAlpha = alpha * 0.6;
        ctx.strokeStyle = '#fff8cc';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            const len = 10 + eased * 20;
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(angle) * 8, cy + Math.sin(angle) * 8);
            ctx.lineTo(cx + Math.cos(angle) * (8 + len), cy + Math.sin(angle) * (8 + len));
            ctx.stroke();
        }

        ctx.globalAlpha = 1;
    }
}

export class FlagReachAnimation {
    constructor(x, y, color, tileSize, tileGap, offsetX, offsetY) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.tileSize = tileSize;
        this.tileGap = tileGap;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        this.startTime = Date.now();
        this.duration = 1000;
        this.done = false;
    }

    update() {
        if (Date.now() - this.startTime > this.duration) {
            this.done = true;
        }
    }

    draw(ctx, renderer) {
        const t = Math.min(1, (Date.now() - this.startTime) / this.duration);
        const eased = 1 - Math.pow(1 - t, 3);
        const rect = renderer.getTileRect(this.x, this.y);
        const cx = rect.x + rect.w / 2;
        const cy = rect.y + rect.h / 2;

        const colors = {
            white: '#ffffff',
            black: '#0d0d1a',
            red: '#ff4444',
            blue: '#4488ff',
            green: '#44ff88',
            yellow: '#ffff44'
        };
        const colorHex = colors[this.color] || '#ffd700';

        // Expanding rings with glow
        for (let i = 0; i < 4; i++) {
            const ringT = Math.max(0, t - i * 0.15) / 0.85;
            if (ringT > 0 && ringT <= 1) {
                const radius = 8 + ringT * 70;
                const alpha = (1 - ringT) * 0.6;
                ctx.strokeStyle = renderer.hexToRgba(colorHex, alpha);
                ctx.lineWidth = 4 * (1 - ringT);
                ctx.shadowColor = colorHex;
                ctx.shadowBlur = 15 * (1 - ringT);
                ctx.beginPath();
                ctx.arc(cx, cy, radius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.shadowBlur = 0;
            }
        }

        // Central burst with particles
        const burstAlpha = 1 - eased;
        ctx.globalAlpha = burstAlpha;
        ctx.fillStyle = colorHex;

        // Radial burst particles
        for (let i = 0; i < 16; i++) {
            const angle = (Math.PI * 2 * i) / 16 + t * 3;
            const dist = 20 + eased * 50;
            const size = 5 * (1 - eased);
            ctx.beginPath();
            ctx.arc(cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist, size, 0, Math.PI * 2);
            ctx.fill();
        }

        // Sparkle stars
        ctx.globalAlpha = burstAlpha * 0.8;
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8 + t * 4;
            const dist = 15 + eased * 30;
            ctx.beginPath();
            ctx.arc(cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist, 3 * (1 - eased), 0, Math.PI * 2);
            ctx.fill();
        }

        // Vertical beam
        ctx.globalAlpha = (1 - t) * 0.4;
        ctx.strokeStyle = colorHex;
        ctx.lineWidth = 3;
        ctx.shadowColor = colorHex;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.moveTo(cx, cy - 100);
        ctx.lineTo(cx, cy + 50);
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.globalAlpha = 1;
    }
}

export class ArrowActivationAnimation {
    constructor(x, y, dir, isBlue, tileSize, tileGap, offsetX, offsetY) {
        this.x = x;
        this.y = y;
        this.dir = dir;
        this.isBlue = isBlue;
        this.tileSize = tileSize;
        this.tileGap = tileGap;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        this.startTime = Date.now();
        this.duration = 500;
        this.done = false;
    }

    update() {
        if (Date.now() - this.startTime > this.duration) {
            this.done = true;
        }
    }

    draw(ctx, renderer) {
        const t = Math.min(1, (Date.now() - this.startTime) / this.duration);
        const eased = 1 - Math.pow(1 - t, 3);
        const rect = renderer.getTileRect(this.x, this.y);
        const cx = rect.x + rect.w / 2;
        const cy = rect.y + rect.h / 2;

        const color = this.isBlue ? '#0099ff' : '#00ff88';
        const size = Math.min(rect.w, rect.h) * (0.3 + eased * 0.3);
        const alpha = 1 - eased;

        // Expanding ring
        ctx.globalAlpha = alpha * 0.4;
        ctx.strokeStyle = color;
        ctx.lineWidth = 3 * (1 - eased);
        ctx.beginPath();
        ctx.arc(cx, cy, 10 + eased * 30, 0, Math.PI * 2);
        ctx.stroke();

        // Directional pulse
        const dirVec = this.getDirVec(this.dir);
        const pulseX = cx + dirVec.x * (15 + eased * 25);
        const pulseY = cy + dirVec.y * (15 + eased * 25);
        ctx.globalAlpha = alpha * 0.6;
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 10 * (1 - eased);
        ctx.beginPath();
        ctx.arc(pulseX, pulseY, 5 * (1 - eased), 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Arrow shape
        ctx.globalAlpha = alpha;
        renderer.drawArrowShape(ctx, cx, cy, size, color, color, this.dir, this.isBlue);
        ctx.globalAlpha = 1;
    }

    getDirVec(dir) {
        const vecs = {
            [Dir.UP]: { x: 0, y: -1 },
            [Dir.DOWN]: { x: 0, y: 1 },
            [Dir.LEFT]: { x: -1, y: 0 },
            [Dir.RIGHT]: { x: 1, y: 0 }
        };
        return vecs[dir] || { x: 1, y: 0 };
    }
}

export class PortalTeleportAnimation {
    constructor(fromX, fromY, toX, toY, color, tileSize, tileGap, offsetX, offsetY) {
        this.fromX = fromX;
        this.fromY = fromY;
        this.toX = toX;
        this.toY = toY;
        this.color = color;
        this.tileSize = tileSize;
        this.tileGap = tileGap;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        this.startTime = Date.now();
        this.duration = 700;
        this.done = false;
    }

    update() {
        if (Date.now() - this.startTime > this.duration) {
            this.done = true;
        }
    }

    draw(ctx, renderer) {
        const t = Math.min(1, (Date.now() - this.startTime) / this.duration);
        const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

        const fromRect = renderer.getTileRect(this.fromX, this.fromY);
        const toRect = renderer.getTileRect(this.toX, this.toY);
        const fromCx = fromRect.x + fromRect.w / 2;
        const fromCy = fromRect.y + fromRect.h / 2;
        const toCx = toRect.x + toRect.w / 2;
        const toCy = toRect.y + toRect.h / 2;

        const portalColors = {
            red: '#ff3366', blue: '#3399ff', green: '#33ff99',
            yellow: '#ffff33', purple: '#cc33ff', orange: '#ff9933'
        };
        const colorHex = portalColors[this.color] || '#ff3366';

        // Swirling particles along path
        ctx.globalAlpha = (1 - t) * 0.5;
        ctx.strokeStyle = colorHex;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        for (let i = 0; i < 3; i++) {
            const offset = (t + i * 0.33) % 1;
            const x = fromCx + (toCx - fromCx) * offset;
            const y = fromCy + (toCy - fromCy) * offset;
            const perpX = -(toCy - fromCy) * 0.1 * Math.sin(Date.now() / 200 + i);
            const perpY = (toCx - fromCx) * 0.1 * Math.sin(Date.now() / 200 + i);
            ctx.beginPath();
            ctx.moveTo(fromCx, fromCy);
            ctx.quadraticCurveTo((fromCx + toCx) / 2 + perpX, (fromCy + toCy) / 2 + perpY, toCx, toCy);
            ctx.stroke();
        }

        // Entry portal collapsing
        if (t < 0.6) {
            const entryT = t / 0.6;
            const radius = 35 * (1 - entryT);
            const alpha = (1 - entryT) * 0.8;
            const pulse = Math.sin(Date.now() / 100) * 0.1 + 0.9;

            // Multiple rings
            for (let r = 0; r < 3; r++) {
                const ringRadius = radius * (0.7 + r * 0.2) * pulse;
                ctx.strokeStyle = renderer.hexToRgba(colorHex, alpha * (1 - r * 0.2));
                ctx.lineWidth = 2 * (1 - r * 0.2);
                ctx.beginPath();
                ctx.arc(fromCx, fromCy, ringRadius, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Particles being sucked in
            ctx.fillStyle = colorHex;
            ctx.globalAlpha = alpha;
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 * i) / 8 - Date.now() / 150;
                const dist = radius * (0.5 + 0.5 * entryT);
                ctx.beginPath();
                ctx.arc(fromCx + Math.cos(angle) * dist, fromCy + Math.sin(angle) * dist, 3 * (1 - entryT), 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Exit portal expanding
        if (t > 0.4) {
            const exitT = (t - 0.4) / 0.6;
            const radius = 5 + exitT * 45;
            const alpha = exitT * 0.8;
            const pulse = Math.sin(Date.now() / 100) * 0.1 + 0.9;

            // Multiple rings
            for (let r = 0; r < 4; r++) {
                const ringRadius = radius * (0.5 + r * 0.2) * pulse;
                const ringAlpha = alpha * (1 - r * 0.15);
                ctx.strokeStyle = renderer.hexToRgba(colorHex, ringAlpha);
                ctx.lineWidth = 3 * (1 - r * 0.2);
                ctx.shadowColor = colorHex;
                ctx.shadowBlur = 15 * ringAlpha;
                ctx.beginPath();
                ctx.arc(toCx, toCy, ringRadius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.shadowBlur = 0;
            }

            // Particles bursting out
            ctx.fillStyle = colorHex;
            ctx.globalAlpha = alpha;
            for (let i = 0; i < 12; i++) {
                const angle = (Math.PI * 2 * i) / 12 + Date.now() / 200;
                const dist = radius * (0.3 + 0.7 * exitT);
                ctx.beginPath();
                ctx.arc(toCx + Math.cos(angle) * dist, toCy + Math.sin(angle) * dist, 4 * exitT, 0, Math.PI * 2);
                ctx.fill();
            }

            // Central glow
            ctx.globalAlpha = alpha * 0.5;
            ctx.fillStyle = colorHex;
            ctx.shadowColor = colorHex;
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.arc(toCx, toCy, radius * 0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        // Connecting beam (brief)
        if (t > 0.3 && t < 0.7) {
            const beamAlpha = Math.sin((t - 0.3) / 0.4 * Math.PI) * 0.3;
            ctx.globalAlpha = beamAlpha;
            ctx.strokeStyle = colorHex;
            ctx.lineWidth = 3;
            ctx.shadowColor = colorHex;
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.moveTo(fromCx, fromCy);
            ctx.lineTo(toCx, toCy);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        ctx.globalAlpha = 1;
    }
}

export class VoidSwirlAnimation {
    constructor(x, y, tileSize, tileGap, offsetX, offsetY, color = '#8844ff') {
        this.x = x;
        this.y = y;
        this.tileSize = tileSize;
        this.tileGap = tileGap;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        this.color = color;
        this.startTime = Date.now();
        this.duration = 800;
        this.done = false;
    }

    update() {
        if (Date.now() - this.startTime > this.duration) {
            this.done = true;
        }
    }

    draw(ctx, renderer) {
        const t = Math.min(1, (Date.now() - this.startTime) / this.duration);
        const eased = 1 - Math.pow(1 - t, 3);
        const rect = renderer.getTileRect(this.x, this.y);
        const cx = rect.x + rect.w / 2;
        const cy = rect.y + rect.h / 2;
        const size = Math.min(rect.w, rect.h);

        // Swirling vortex
        ctx.globalAlpha = (1 - t) * 0.6;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2 * (1 - eased);
        ctx.lineCap = 'round';

        for (let i = 0; i < 3; i++) {
            const angle = Date.now() / 300 + i * Math.PI * 2 / 3 + eased * Math.PI * 4;
            const radius = size * 0.15 + eased * size * 0.4;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, angle, angle + Math.PI * 1.5);
            ctx.stroke();
        }

        // Particles being pulled in
        ctx.fillStyle = this.color;
        ctx.globalAlpha = (1 - t) * 0.8;
        for (let i = 0; i < 8; i++) {
            const angle = Date.now() / 200 + i * Math.PI * 2 / 8 - eased * Math.PI * 2;
            const radius = size * 0.5 * (1 - eased * 0.7);
            ctx.beginPath();
            ctx.arc(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius, 2 * (1 - eased), 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.globalAlpha = 1;
    }
}

// Re-export for convenience
export { KNIGHT_MOVES };