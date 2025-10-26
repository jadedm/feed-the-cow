# Feed The Cow 🐄

A fun, fast-paced browser game built with Phaser 2 for World Milk Day. Help the cow eat healthy green fodder while avoiding harmful injections!

[![GitHub stars](https://img.shields.io/github/stars/jadedm/feed-the-cow?style=social)](https://github.com/jadedm/feed-the-cow)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 📖 About

"Feed The Cow" was created to raise awareness about the importance of natural feed for cattle. In India, there's an alarming gap between the demand and supply of feed & fodder. Most cows are on a diet of man-made concentrates which increases milk production but has long-lasting negative impacts on their health, making medications and injections a necessity.

This game illustrates the importance of feeding cows natural, fresh green fodder to keep them healthy!

## ✨ Features

- **Progressive Difficulty**: Game speed increases infinitely using smooth square root scaling
- **Matrix Swarm Mode**: Massive injection waves appear after 50 seconds
- **Multiple Control Options**:
  - Mouse/Touch drag controls
  - Keyboard arrow keys (↑/↓)
  - Virtual joystick for mobile devices
- **Responsive Design**: Works on desktop and mobile browsers
- **Sound Effects**: Immersive audio feedback
- **Score Tracking**: Keep track of how much grass you've collected

## 🕹️ Controls

| Input                | Action                                  |
| -------------------- | --------------------------------------- |
| **Mouse/Touch**      | Click and drag the cow vertically       |
| **Arrow Keys**       | ↑ Move up, ↓ Move down                  |
| **Virtual Joystick** | Touch and drag on mobile (bottom right) |

## 🎯 How to Play

1. Move the cow up and down to collect **green grass** (good!)
2. Avoid the **injections** (bad!)
3. Each grass collected gives you **10 points**
4. Game speed increases as time progresses
5. More injections spawn over time - survive as long as you can!
6. One hit from an injection ends the game

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone git@github.com:jadedm/feed-the-cow.git

# Navigate to project directory
cd feed-the-cow

# Install dependencies
npm install

# Start development server
npm run dev
```

The game will be available at `http://localhost:8000`

### Build for Production

```bash
# Create optimized production build
npm run build

# Preview production build
npm run preview
```

## 🛠️ Tech Stack

- **Game Engine**: [Phaser 2](https://phaser.io/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Language**: JavaScript (ES6)
- **Plugin**: [Phaser Virtual Gamepad](https://github.com/ShawnHymel/phaser-plugin-virtual-gamepad)

## 📂 Project Structure

```
feedthecow/
├── src/
│   ├── audio/          # Sound effects and music
│   ├── css/            # Stylesheets
│   ├── images/         # Game sprites and assets
│   ├── libs/           # Third-party libraries
│   │   └── plugins/    # Phaser plugins
│   ├── Boot.js         # Initial game setup
│   ├── Preloader.js    # Asset loading
│   ├── StartMenu.js    # Title screen
│   └── Game.js         # Main game logic
├── index.html
├── main.js             # Entry point
├── vite.config.js      # Vite configuration
├── jsdoc.json          # JSDoc configuration
└── package.json
```

## 📚 Documentation

Generate API documentation using JSDoc:

```bash
npm run docs
```

Documentation will be generated in the `docs/` folder. Open `docs/index.html` to view.

## 🎨 Game Mechanics

### Difficulty Progression

- **Background Scroll Speed**: Increases using `speed = 3 + √(seconds) × 0.5`
  - At 0s: 3 px/frame
  - At 16s: ~5 px/frame
  - At 36s: ~6 px/frame
  - At 64s: ~7 px/frame
  - Continues increasing infinitely

### Injection Spawning Timeline

| Time (seconds) | Injections Added | Total Injections   |
| -------------- | ---------------- | ------------------ |
| 0s             | 2                | 2                  |
| 10s            | +1               | 3                  |
| 20s            | +2               | 5                  |
| 30s            | +2               | 7                  |
| 40s            | +3               | 10                 |
| 45s            | +5               | 15                 |
| 50s            | +8               | 23 (Matrix Swarm!) |

### Scoring

- Grass collected: **+10 points**
- Hit by injection: **Game Over**

## 🤝 Contributing

Contributions are welcome! Feel free to:

1. Fork the project
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📜 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Created for **World Milk Day**
- Powered by **Phaser 2** game framework
- Virtual gamepad by [Shawn Hymel](https://github.com/ShawnHymel/phaser-plugin-virtual-gamepad)
- Inspired by the mission to promote natural, healthy feed for cattle

---

**Made with ❤️ for healthier cows and sustainable dairy farming**

🌾 Feed them good, keep them healthy! 🐄
