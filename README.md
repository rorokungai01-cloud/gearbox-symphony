# ⚙️ Gearbox Symphony

**Build machines that make music!**
A steampunk musical puzzle game created for the **Gamedev.js Jam 2026** — Theme: "Machines"

🎮 **[▶ Play on itch.io](https://mochipuff-studio.itch.io/gearbox-symphony)**

---

## 🎮 What is Gearbox Symphony?

Listen to a target melody, then place mechanical tools on a grid to recreate it. Hit **POWER ON** and watch the playhead sweep across your machine. Match the blueprint, earn stars, and advance through the factory.

No sheet music. No instructions. Just your ears and a box full of tools.

---

## 🔧 Tools

| Tool | Sound |
|---|---|
| 🔨 **Hammer** | A sharp metallic clang — main percussion |
| 🪗 **Bellows** | A warm breathy "whoosh" |
| 🌀 **Spring** | A bright bouncy "boing!" |
| 🔱 **Tuning Fork** | A clean, sustained tone |
| ⚙️ **Gear** | A mechanical click-clack |

All sounds are generated procedurally in real-time using the **Web Audio API** — no pre-recorded audio files.

---

## 🏭 Game Structure

- **Floor 1 — The Brass Workshop**: 5 introductory levels
- **Floor 2 — Steam Powered**: 5 intermediate levels
- **Floor 3 — Crystal Harmonic**: 5 advanced levels
- **Free Play**: Unlocked after clearing Floor 2. Randomized blueprints with customizable settings.

---

## 🛠️ Run Locally

Built with **Phaser 3** and **Vite**.

```bash
git clone https://github.com/rorokungai01-cloud/gearbox-symphony.git
cd gearbox-symphony
npm install
npm run dev
```

Build for production:
```bash
npm run build
```

---

## 📂 Project Structure

```
src/
├── config/         # Game constants, level data, Phaser config
├── effects/        # Background gears, sparks, steam particles
├── objects/        # Machine parts (Hammer, Bellows, Spring, etc.)
├── scenes/         # Boot, Menu, LevelSelect, Game, FreePlay
├── systems/        # Audio engine, grid, playhead, scoring
├── ui/             # Toolbar, overlays, star display, buttons
└── utils/          # Audio, color, math, storage utilities
```
