# Harpoon Fishing

A top-down arcade fishing game where you aim and fire harpoons to catch deep-sea creatures. Compete solo or head-to-head in split-screen two-player mode.

Built with vanilla JavaScript and the Canvas 2D API — no frameworks, no dependencies.

![Two-player gameplay](screenshots/gameplay-2p.png)

## How to Play

Drag to aim your harpoon, release to fire. Catch creatures to earn points and bonus harpoons. When you're out of harpoons or the round timer hits zero, the game is over.

### Controls

| Action      | Input                          |
|-------------|--------------------------------|
| Aim         | Click/touch and drag           |
| Fire        | Release                        |
| Player zone | Bottom half (P1), Top half (P2)|

## Features

### Game Modes

- **Single Player** — catch as many creatures as you can before running out of harpoons
- **Two Player** — split-screen competitive mode with a shared play field
- **Configurable Rounds** — set round length from 1 to 10 minutes

![Start screen](screenshots/start-screen.png)

### 22 Deep-Sea Creatures

Creatures are organized into rarity tiers with increasing point values and speed:

| Rarity    | Examples                              | Points    |
|-----------|---------------------------------------|-----------|
| Common    | Blobfish, Dumbo Octopus, Sea Toad     | 10–15     |
| Uncommon  | Vampire Squid, Frilled Shark          | 25–35     |
| Rare      | Anglerfish, Gulper Eel, Fangtooth     | 50–65     |
| Epic      | Goblin Shark, Sea Spider, Lanternfish | 100–150   |
| Legendary | Siphonophore                          | 10        |

Rarer creatures move faster and are harder to hit, but some award bonus harpoons on catch. A ghost creature appears every 30 seconds and grants +10 harpoons if caught.

### Dynamic Difficulty

The game gets harder as your harpoon supply dwindles:

- **Early** (7+ harpoons) — mostly common spawns, normal speed
- **Mid** (4–6 harpoons) — uncommon and rare creatures appear, 1.3x speed
- **Late** (0–3 harpoons) — epic and legendary creatures enter, 1.6x speed

Schools of 3–6 creatures occasionally spawn together for big scoring opportunities.

### Treasure Chest

A treasure chest at the center of the screen opens at random intervals, revealing one of 17 items worth 150–750 points with bonus harpoons. Time your shot to snag it before it closes.

### Two-Player Competitive

![Single-player gameplay](screenshots/gameplay-1p.png)

Players fire from opposite ends of the screen into a shared ocean. When your shot timer expires, you can buy back 5 harpoons for 500 points — a risk/reward tradeoff that keeps matches close.

### Score Screen

Track your total score, accuracy percentage, best single catch, and a gallery of every creature you caught during the round.

![Score screen](screenshots/score-screen.png)

## Getting Started

**Prerequisites:** Node.js 18+

```bash
# Install dependencies
npm install

# Start the dev server (opens http://localhost:3000)
npm run dev

# Production build
npm run build

# Preview the production build
npm run preview
```

## Deployment

The game auto-deploys to GitHub Pages on push to `main` via the included workflow at `.github/workflows/deploy.yml`.

## Project Structure

```
js/
├── main.js                  # Entry point, canvas setup, responsive scaling
├── game.js                  # Fixed-timestep game loop (60 FPS)
├── data/                    # Creature definitions, config, spawn patterns
├── entities/                # Harpoon, SeaCreature, TreasureChest
├── rendering/               # SpriteSheet, Animator, UI, water background
├── states/                  # Start screen, gameplay, score screen
├── systems/                 # Input, collision, scoring, spawning, particles
└── utils/                   # Audio synthesis, math helpers
assets/                      # Sprite sheets and textures
css/                         # Minimal dark-theme styling
```

## Tech Stack

- **Rendering** — Canvas 2D API
- **Audio** — Procedurally generated via Web Audio API (no audio files)
- **Build** — Vite
- **Language** — Vanilla ES modules, no frameworks
