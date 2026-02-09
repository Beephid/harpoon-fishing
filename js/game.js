import { CONFIG } from './data/config.js';
import { StartScreenState } from './states/StartScreenState.js';
import { PlayState } from './states/PlayState.js';
import { ScoreScreenState } from './states/ScoreScreenState.js';
import { audio } from './utils/audio.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        this.canvas.width = CONFIG.DESIGN_WIDTH;
        this.canvas.height = CONFIG.DESIGN_HEIGHT;
        this.ctx.imageSmoothingEnabled = false;

        // Auto-scale canvas font sizes for mobile readability
        const fontDesc = Object.getOwnPropertyDescriptor(
            CanvasRenderingContext2D.prototype, 'font'
        );
        Object.defineProperty(this.ctx, 'font', {
            set(value) {
                if (CONFIG.textScale > 1) {
                    value = value.replace(
                        /(\d+(?:\.\d+)?)px/,
                        (_, s) => `${Math.round(parseFloat(s) * CONFIG.textScale)}px`
                    );
                }
                fontDesc.set.call(this, value);
            },
            get() {
                return fontDesc.get.call(this);
            },
            configurable: true,
        });

        // Register state classes so states can reference each other
        this._stateClasses = { StartScreenState, PlayState, ScoreScreenState };

        this.currentState = null;
        this.lastTime = 0;
        this.accumulator = 0;
        this.fixedDt = 1000 / 60;
        this.running = false;

        this._boundLoop = (timestamp) => this.loop(timestamp);
        this.sessionHighScore = 0;

        // Music toggle button bounds
        this.musicBtnBounds = { x: CONFIG.DESIGN_WIDTH - 95, y: CONFIG.DESIGN_HEIGHT - 95, w: 75, h: 75 };

        // Music toggle click handler
        this._onMusicTap = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const sx = this.canvas.width / rect.width;
            const sy = this.canvas.height / rect.height;
            const px = (e.clientX - rect.left) * sx;
            const py = (e.clientY - rect.top) * sy;
            const b = this.musicBtnBounds;
            if (px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h) {
                audio.toggleMusic();
                e.stopImmediatePropagation();
            }
        };
        canvas.addEventListener('pointerdown', this._onMusicTap);

        // Pause when tab is hidden
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.running = false;
            } else {
                this.running = true;
                this.lastTime = performance.now();
                this.accumulator = 0;
                requestAnimationFrame(this._boundLoop);
            }
        });
    }

    start() {
        this.changeState(new StartScreenState(this));
        this.running = true;
        this.lastTime = performance.now();
        requestAnimationFrame(this._boundLoop);
    }

    loop(timestamp) {
        if (!this.running) return;

        const frameTime = Math.min(timestamp - this.lastTime, 50);
        this.lastTime = timestamp;
        this.accumulator += frameTime;

        while (this.accumulator >= this.fixedDt) {
            if (this.currentState) {
                this.currentState.update(this.fixedDt / 1000);
            }
            this.accumulator -= this.fixedDt;
        }

        const alpha = this.accumulator / this.fixedDt;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.imageSmoothingEnabled = false;

        if (this.currentState) {
            this.currentState.render(this.ctx, alpha);
        }

        this._renderMusicToggle(this.ctx);

        requestAnimationFrame(this._boundLoop);
    }

    _renderMusicToggle(ctx) {
        const b = this.musicBtnBounds;
        const cx = b.x + b.w / 2;
        const cy = b.y + b.h / 2;

        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.translate(cx, cy);
        ctx.scale(1.5, 1.5);

        // Note head
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(4, 8, 7, 5, -0.3, 0, Math.PI * 2);
        ctx.fill();

        // Stem
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(10, 8);
        ctx.lineTo(10, -14);
        ctx.stroke();

        // Flag
        ctx.beginPath();
        ctx.moveTo(10, -14);
        ctx.quadraticCurveTo(26, -8, 10, -2);
        ctx.fill();

        // Muted slash
        if (!audio.musicEnabled) {
            ctx.strokeStyle = '#e74c3c';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(-8, -12);
            ctx.lineTo(16, 16);
            ctx.stroke();
        }

        ctx.restore();
    }

    changeState(newState) {
        if (this.currentState && this.currentState.exit) {
            this.currentState.exit();
        }
        this.currentState = newState;
        if (this.currentState && this.currentState.enter) {
            this.currentState.enter();
        }
    }
}
