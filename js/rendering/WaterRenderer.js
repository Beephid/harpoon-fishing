import { CONFIG } from '../data/config.js';
import { randomRange } from '../utils/math.js';

function shadeHex(hex, amount) {
    const value = parseInt(hex.slice(1), 16);
    const r = Math.min(255, Math.max(0, ((value >> 16) & 0xff) + Math.round(255 * amount)));
    const g = Math.min(255, Math.max(0, ((value >> 8) & 0xff) + Math.round(255 * amount)));
    const b = Math.min(255, Math.max(0, (value & 0xff) + Math.round(255 * amount)));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

class CoralPiece {
    constructor() {
        this.reset(true);
    }

    reset(initialPlacement) {
        // Coral types: colors and shapes
        const types = [
            { color: '#c0392b', width: 18, height: 30 },  // red branching
            { color: '#e67e22', width: 14, height: 22 },  // orange fan
            { color: '#8e44ad', width: 20, height: 26 },  // purple bush
            { color: '#27ae60', width: 16, height: 35 },  // green kelp
            { color: '#2980b9', width: 12, height: 20 },  // blue small
            { color: '#f39c12', width: 22, height: 18 },  // yellow flat
        ];
        const t = types[Math.floor(Math.random() * types.length)];
        this.color = t.color;
        this.width = t.width;
        this.height = t.height;
        this.darkColor = shadeHex(this.color, -0.18);
        this.lightColor = shadeHex(this.color, 0.2);
        this.highlightColor = shadeHex(this.color, 0.35);

        this.x = randomRange(0, CONFIG.DESIGN_WIDTH);
        if (initialPlacement) {
            this.y = randomRange(0, CONFIG.DESIGN_HEIGHT);
        } else {
            this.y = CONFIG.DESIGN_HEIGHT + 20;
        }
        this.vy = randomRange(-8, 8); // slowly drift upward
        this.swayPhase = Math.random() * Math.PI * 2;
        this.swaySpeed = randomRange(0.5, 1.5);
        this.swayAmount = randomRange(3, 8);
        this.alpha = randomRange(0.1, 0.4);

        this.stalkWidth = randomRange(3, 6);

        const branches = 2 + Math.floor(this.height / 10);
        this.branches = [];
        for (let i = 0; i < branches; i++) {
            const tIndex = branches > 1 ? i / (branches - 1) : 0.5;
            const bw = this.width * (0.45 + 0.55 * (1 - tIndex));
            const thickness = randomRange(3, 6);
            const buds = [];
            const budCount = 1 + Math.floor(Math.random() * 3);
            for (let b = 0; b < budCount; b++) {
                buds.push({
                    x: randomRange(-bw * 0.35, bw * 0.35),
                    y: -thickness * (0.4 + Math.random() * 0.4),
                    r: randomRange(1.2, 2.4),
                });
            }
            this.branches.push({
                y: this.height * (0.25 + 0.6 * tIndex),
                w: bw,
                thickness,
                tilt: randomRange(-0.5, 0.5),
                nubSize: randomRange(2.2, 4.2),
                buds,
            });
        }

        this.ridges = [];
        const ridgeCount = 2 + Math.floor(this.height / 12);
        for (let i = 0; i < ridgeCount; i++) {
            const tIndex = (i + 1) / (ridgeCount + 1);
            this.ridges.push({
                y: this.height * (0.15 + 0.7 * tIndex),
                skew: randomRange(-1.2, 1.2),
            });
        }

        this.topLobes = [];
        const lobeCount = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < lobeCount; i++) {
            this.topLobes.push({
                x: randomRange(-this.width * 0.35, this.width * 0.35),
                y: randomRange(-3, 5),
                r: randomRange(this.width * 0.16, this.width * 0.28),
            });
        }

        this.polyps = [];
        const polypCount = 5 + Math.floor(Math.random() * 6);
        for (let i = 0; i < polypCount; i++) {
            this.polyps.push({
                x: randomRange(-this.width * 0.4, this.width * 0.4),
                y: -this.height + randomRange(-4, 8),
                r: randomRange(0.9, 1.8),
            });
        }

        this.baseLumps = [];
        const baseCount = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < baseCount; i++) {
            this.baseLumps.push({
                x: randomRange(-this.width * 0.35, this.width * 0.35),
                r: randomRange(2, this.stalkWidth + 2),
            });
        }
    }

    update(dt) {
        this.y += this.vy * dt;
        this.swayPhase += this.swaySpeed * dt;
        if (this.y < -40) {
            this.reset(false);
        }
    }

    render(ctx) {
        const swayX = Math.sin(this.swayPhase) * this.swayAmount;

        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.translate(this.x + swayX, this.y);

        // Base lumps for a more organic silhouette
        ctx.fillStyle = this.darkColor;
        for (const lump of this.baseLumps) {
            ctx.beginPath();
            ctx.arc(lump.x, 2, lump.r, 0, Math.PI * 2);
            ctx.fill();
        }

        // Coral stalk (tapered)
        ctx.fillStyle = this.color;
        const baseHalf = this.stalkWidth * 0.5;
        const topHalf = Math.max(1.2, this.stalkWidth * 0.35);
        ctx.beginPath();
        ctx.moveTo(-baseHalf, 2);
        ctx.lineTo(-topHalf, -this.height);
        ctx.lineTo(topHalf, -this.height);
        ctx.lineTo(baseHalf, 2);
        ctx.closePath();
        ctx.fill();

        // Stalk ridges
        ctx.strokeStyle = this.darkColor;
        ctx.lineWidth = 1;
        for (const ridge of this.ridges) {
            const ry = -ridge.y;
            ctx.beginPath();
            ctx.moveTo(-topHalf * 0.9 + ridge.skew, ry);
            ctx.lineTo(topHalf * 0.9 + ridge.skew, ry);
            ctx.stroke();
        }

        // Coral branches with buds
        for (const branch of this.branches) {
            ctx.save();
            ctx.translate(0, -branch.y);
            ctx.rotate(branch.tilt);

            ctx.fillStyle = this.color;
            ctx.fillRect(-branch.w / 2, -branch.thickness / 2, branch.w, branch.thickness);

            ctx.beginPath();
            ctx.arc(branch.w / 2 - branch.nubSize * 0.2, 0, branch.nubSize, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = this.lightColor;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-branch.w / 2 + 2, -branch.thickness * 0.25);
            ctx.lineTo(branch.w / 2 - 2, -branch.thickness * 0.25);
            ctx.stroke();

            ctx.fillStyle = this.highlightColor;
            for (const bud of branch.buds) {
                ctx.beginPath();
                ctx.arc(bud.x, bud.y, bud.r, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }

        // Top lobes
        ctx.fillStyle = this.color;
        ctx.beginPath();
        for (const lobe of this.topLobes) {
            ctx.moveTo(lobe.x + lobe.r, -this.height + lobe.y);
            ctx.arc(lobe.x, -this.height + lobe.y, lobe.r, 0, Math.PI * 2);
        }
        ctx.fill();

        // Polyps/highlights
        ctx.fillStyle = this.highlightColor;
        for (const polyp of this.polyps) {
            ctx.beginPath();
            ctx.arc(polyp.x, polyp.y, polyp.r, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

export class WaterRenderer {
    constructor(spriteSheet) {
        this.sheet = spriteSheet;
        // Dark teal scale/diamond pattern tile from Water+.png
        this.tileSize = 16;
        this.tileSrcX = 96;
        this.tileSrcY = 32;

        // Sparse coral decorations
        this.corals = [];
        for (let i = 0; i < 12; i++) {
            this.corals.push(new CoralPiece());
        }
    }

    update(dt) {
        for (const coral of this.corals) {
            coral.update(dt);
        }
    }

    render(ctx) {
        if (!this.sheet.loaded) {
            ctx.fillStyle = '#1a6ea0';
            ctx.fillRect(0, 0, CONFIG.DESIGN_WIDTH, CONFIG.DESIGN_HEIGHT);
        } else {
            // Static tiled water - no scroll offset
            const drawSize = this.tileSize * 3;
            const cols = Math.ceil(CONFIG.DESIGN_WIDTH / drawSize) + 1;
            const rows = Math.ceil(CONFIG.DESIGN_HEIGHT / drawSize) + 1;

            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    this.sheet.drawFrame(
                        ctx,
                        this.tileSrcX, this.tileSrcY, this.tileSize, this.tileSize,
                        col * drawSize, row * drawSize, drawSize, drawSize
                    );
                }
            }
        }

        // Dark overlay to deepen the water color
        ctx.fillStyle = 'rgba(10, 40, 80, 0.35)';
        ctx.fillRect(0, 0, CONFIG.DESIGN_WIDTH, CONFIG.DESIGN_HEIGHT);

        // Render coral decorations
        for (const coral of this.corals) {
            coral.render(ctx);
        }
    }
}
