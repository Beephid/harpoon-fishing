import { CONFIG } from '../data/config.js';
import { SpriteSheet } from '../rendering/SpriteSheet.js';
import { WaterRenderer } from '../rendering/WaterRenderer.js';
import { Animator } from '../rendering/Animator.js';
import { CREATURE_TYPES } from '../data/creatureData.js';
import { audio } from '../utils/audio.js';

export class StartScreenState {
    constructor(game) {
        this.game = game;
        this.waterSheet = new SpriteSheet('Water+.png');
        this.waterRenderer = new WaterRenderer(this.waterSheet);
        this.creatureSheet = new SpriteSheet('DeepseaCreatures_spritesheet.png');
        this.time = 0;
        this.ready = false;
        this.roundMinutes = 3;

        // Background creatures swimming calmly
        const bgTypes = ['giant_isopod', 'lanternfish', 'siphonophore', 'dumbo_octopus',
            'fangtooth', 'winged_comb_jelly', 'viperfish', 'blobfish'];
        this.bgCreatures = bgTypes.map(typeKey => {
            const data = CREATURE_TYPES[typeKey];
            const dir = Math.random() < 0.5 ? -1 : 1;
            return {
                x: Math.random() * CONFIG.DESIGN_WIDTH,
                y: 80 + Math.random() * (CONFIG.DESIGN_HEIGHT - 160),
                vx: (30 + Math.random() * 40) * dir,
                displaySize: data.displaySize * 0.8,
                animator: new Animator(data.frames, 2 + Math.random() * 2),
            };
        });

        this._onTap = this._onTap.bind(this);
        this._onKeyDown = this._onKeyDown.bind(this);
    }

    enter() {
        this.time = 0;
        this.ready = false;
        // Delay readiness briefly to prevent accidental taps
        setTimeout(() => { this.ready = true; }, 500);
        this.game.canvas.addEventListener('pointerdown', this._onTap);
        window.addEventListener('keydown', this._onKeyDown);
    }

    _onKeyDown(e) {
        if (!this.ready || e.repeat) return;
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            e.preventDefault();
            if (this.roundMinutes > 1) this.roundMinutes--;
        }
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            e.preventDefault();
            if (this.roundMinutes < 10) this.roundMinutes++;
        }
        if (e.key === '1') this._startGame(1);
        if (e.key === '2') this._startGame(2);
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this._startGame(1);
        }
    }

    _screenToCanvas(e) {
        const rect = this.game.canvas.getBoundingClientRect();
        const scaleX = this.game.canvas.width / rect.width;
        const scaleY = this.game.canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY,
        };
    }

    _onTap(e) {
        if (!this.ready) return;

        const pos = this._screenToCanvas(e);
        const cx = CONFIG.DESIGN_WIDTH / 2;
        const cy = CONFIG.DESIGN_HEIGHT / 2;

        // Timer spinner arrows (hit area around the arrow glyphs)
        const arrowCenterY = cy + 100;
        const arrowHH = 30;

        // Left arrow (decrease)
        if (pos.x >= cx - 150 && pos.x <= cx - 70 &&
            pos.y >= arrowCenterY - arrowHH && pos.y <= arrowCenterY + arrowHH) {
            if (this.roundMinutes > 1) this.roundMinutes--;
            return;
        }
        // Right arrow (increase)
        if (pos.x >= cx + 70 && pos.x <= cx + 150 &&
            pos.y >= arrowCenterY - arrowHH && pos.y <= arrowCenterY + arrowHH) {
            if (this.roundMinutes < 10) this.roundMinutes++;
            return;
        }

        // Mode selection buttons
        const buttonY = cy + 150;
        const buttonWidth = 200;
        const buttonHeight = 60;
        const buttonSpacing = 240;

        // Check if tap is on 1 Player button
        const btn1X = cx - buttonSpacing / 2 - buttonWidth / 2;
        if (pos.x >= btn1X && pos.x <= btn1X + buttonWidth &&
            pos.y >= buttonY && pos.y <= buttonY + buttonHeight) {
            this._startGame(1);
            return;
        }

        // Check if tap is on 2 Players button
        const btn2X = cx + buttonSpacing / 2 - buttonWidth / 2;
        if (pos.x >= btn2X && pos.x <= btn2X + buttonWidth &&
            pos.y >= buttonY && pos.y <= buttonY + buttonHeight) {
            this._startGame(2);
            return;
        }
    }

    _startGame(playerCount) {
        // Initialize audio on first user gesture (required for mobile)
        audio.init();
        audio.resume();
        const { PlayState } = this.game._stateClasses;
        this.game.changeState(new PlayState(this.game, playerCount, this.roundMinutes * 60));
    }

    update(dt) {
        this.time += dt;
        this.waterRenderer.update(dt);

        // Move background creatures, wrapping around edges
        for (const c of this.bgCreatures) {
            c.x += c.vx * dt;
            c.animator.update(dt);
            if (c.vx > 0 && c.x > CONFIG.DESIGN_WIDTH + c.displaySize) {
                c.x = -c.displaySize;
            } else if (c.vx < 0 && c.x < -c.displaySize) {
                c.x = CONFIG.DESIGN_WIDTH + c.displaySize;
            }
        }
    }

    render(ctx, alpha) {
        this.waterRenderer.render(ctx);

        // Background creatures (rendered before overlay so they appear underwater)
        if (this.creatureSheet.loaded) {
            ctx.save();
            ctx.globalAlpha = 0.4;
            for (const c of this.bgCreatures) {
                const frame = c.animator.getCurrentFrame();
                const half = c.displaySize / 2;
                ctx.save();
                if (c.vx < 0) {
                    ctx.translate(c.x, c.y);
                    ctx.scale(-1, 1);
                    this.creatureSheet.drawFrame(ctx, frame.sx, frame.sy, frame.sw, frame.sh, -half, -half, c.displaySize, c.displaySize);
                } else {
                    this.creatureSheet.drawFrame(ctx, frame.sx, frame.sy, frame.sw, frame.sh, c.x - half, c.y - half, c.displaySize, c.displaySize);
                }
                ctx.restore();
            }
            ctx.restore();
        }

        const cx = CONFIG.DESIGN_WIDTH / 2;
        const cy = CONFIG.DESIGN_HEIGHT / 2;

        // Dark overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.fillRect(0, 0, CONFIG.DESIGN_WIDTH, CONFIG.DESIGN_HEIGHT);

        // Title
        ctx.save();
        ctx.textAlign = 'center';

        // Title shadow
        ctx.fillStyle = '#dd0a0a';
        ctx.font = 'bold 80px monospace';
        ctx.fillText('ABYSSAL', cx + 3, cy - 100 + 3);
        ctx.font = 'bold 60px monospace';
        ctx.fillText('FISHING', cx + 3, cy - 35 + 3);

        // Title text
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 80px monospace';
        ctx.fillText('ABYSSAL', cx, cy - 100);
        ctx.fillStyle = '#7ec8e3';
        ctx.font = 'bold 60px monospace';
        ctx.fillText('FISHING', cx, cy - 35);

        // Subtitle
        ctx.fillStyle = '#cccccc';
        ctx.font = '28px monospace';
        ctx.fillText('Use your harpoon to collect deep sea creatures for points!', cx, cy + 20);

        // Timer spinner
        ctx.fillStyle = '#cccccc';
        ctx.font = '22px monospace';
        ctx.fillText('ROUND TIME', cx, cy + 70);

        ctx.font = 'bold 36px monospace';
        ctx.fillStyle = '#FFD700';
        ctx.fillText(`${this.roundMinutes}:00`, cx, cy + 105);

        // Spinner arrows
        ctx.font = 'bold 36px monospace';
        ctx.fillStyle = this.roundMinutes > 1 ? '#ffffff' : '#555555';
        ctx.fillText('\u25C0', cx - 110, cy + 105);
        ctx.fillStyle = this.roundMinutes < 10 ? '#ffffff' : '#555555';
        ctx.fillText('\u25B6', cx + 85, cy + 105);

        // Mode selection buttons
        const buttonY = cy + 150;
        const buttonWidth = 200;
        const buttonHeight = 60;
        const buttonSpacing = 240;

        // 1 Player button
        this._drawButton(ctx, cx - buttonSpacing / 2, buttonY, buttonWidth, buttonHeight, '1 PLAYER', '#3498db');

        // 2 Players button
        this._drawButton(ctx, cx + buttonSpacing / 2, buttonY, buttonWidth, buttonHeight, '2 PLAYERS', '#e74c3c');

        // Controls hint
        ctx.fillStyle = '#ebe7e7';
        ctx.font = 'bold 28px monospace';
        ctx.fillText('Touch to aim, or use Arrow Keys', cx, cy + 260);

        // 2 player hint
        ctx.fillStyle = '#d4d4d4';
        ctx.font = 'bold 24px monospace';
        ctx.fillText('2 Players: Top half vs Bottom half', cx, cy + 295);

        ctx.restore();
    }

    _drawButton(ctx, x, y, w, h, text, color) {
        const pulse = 0.9 + 0.1 * Math.sin(this.time * 4);

        ctx.save();
        ctx.translate(x, y + h / 2);
        ctx.scale(pulse, pulse);

        // Button background
        ctx.fillStyle = color;
        ctx.beginPath();
        const r = 10;
        const rx = -w / 2, ry = -h / 2;
        ctx.moveTo(rx + r, ry);
        ctx.lineTo(rx + w - r, ry);
        ctx.quadraticCurveTo(rx + w, ry, rx + w, ry + r);
        ctx.lineTo(rx + w, ry + h - r);
        ctx.quadraticCurveTo(rx + w, ry + h, rx + w - r, ry + h);
        ctx.lineTo(rx + r, ry + h);
        ctx.quadraticCurveTo(rx, ry + h, rx, ry + h - r);
        ctx.lineTo(rx, ry + r);
        ctx.quadraticCurveTo(rx, ry, rx + r, ry);
        ctx.closePath();
        ctx.fill();

        // Button border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Button text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(text, 0, 10);

        ctx.restore();
    }

    exit() {
        this.game.canvas.removeEventListener('pointerdown', this._onTap);
        window.removeEventListener('keydown', this._onKeyDown);
    }
}
