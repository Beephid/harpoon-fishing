import { segmentIntersectsCircle } from '../utils/math.js';
import { CREATURE_TYPES } from '../data/creatureData.js';

// Compute average hitbox radius for pierce distance
const _avgHitboxRadius = (() => {
    const types = Object.values(CREATURE_TYPES);
    const sum = types.reduce((s, t) => s + t.hitboxRadius, 0);
    return sum / types.length;
})();

function _isPierceExempt(creature) {
    return creature.typeKey === 'tubeworm' || creature.typeKey.startsWith('treasure_');
}

export class CollisionSystem {
    /**
     * Check if the harpoon hit any creature(s) this frame.
     * Uses ray-segment vs circle to prevent tunneling.
     * If a hit is found, checks if the trajectory would pierce through
     * additional creatures within 3 average hitbox radii beyond the hit.
     * Returns an array of hit creatures (empty if no hit).
     */
    check(harpoon, creatures) {
        if (harpoon.state !== 'traveling') return [];

        let closestCreature = null;
        let closestT = Infinity;

        for (const creature of creatures) {
            if (!creature.alive) continue;

            const t = segmentIntersectsCircle(
                harpoon.prevTipX, harpoon.prevTipY,
                harpoon.tipX, harpoon.tipY,
                creature.x, creature.renderY,
                creature.hitboxRadius
            );

            if (t >= 0 && t < closestT) {
                closestT = t;
                closestCreature = creature;
            }
        }

        if (!closestCreature) return [];

        // No pierce for tubeworms or treasure — return single hit
        if (_isPierceExempt(closestCreature)) return [closestCreature];

        // Calculate hit point and direction for pierce check
        const dx = harpoon.tipX - harpoon.prevTipX;
        const dy = harpoon.tipY - harpoon.prevTipY;
        const segLen = Math.sqrt(dx * dx + dy * dy);

        const hitX = harpoon.prevTipX + closestT * dx;
        const hitY = harpoon.prevTipY + closestT * dy;

        const pierceDistance = 3 * _avgHitboxRadius;
        const nx = segLen > 0 ? dx / segLen : 0;
        const ny = segLen > 0 ? dy / segLen : 0;

        const pierceEndX = hitX + nx * pierceDistance;
        const pierceEndY = hitY + ny * pierceDistance;

        // Check for additional creatures along the pierce segment
        const hits = [{ creature: closestCreature, dist: 0 }];

        for (const creature of creatures) {
            if (!creature.alive || creature === closestCreature) continue;
            if (_isPierceExempt(creature)) continue;

            const pt = segmentIntersectsCircle(
                hitX, hitY,
                pierceEndX, pierceEndY,
                creature.x, creature.renderY,
                creature.hitboxRadius
            );

            if (pt >= 0) {
                hits.push({ creature, dist: pt });
            }
        }

        // Sort by distance along trajectory
        hits.sort((a, b) => a.dist - b.dist);
        return hits.map(h => h.creature);
    }
}
