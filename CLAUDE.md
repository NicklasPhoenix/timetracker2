# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an incremental combat game built with vanilla JavaScript using HTML5 Canvas for rendering. The game features a modular architecture with distinct systems for combat, progression, crafting, and visual effects.

## Architecture

### Core Systems
- **Game Engine** (`src/core/game-engine.js`): Main game loop, initialization, and system coordination
- **State Manager** (`src/core/state-manager.js`): Centralized state management with localStorage save/load
- **Event System** (`src/core/event-system.js`): Custom event dispatcher for inter-system communication
- **Visual Renderer** (`src/core/visual-renderer.js`): Canvas rendering with animations and particle effects

### Combat System
- **Combat Manager** (`src/combat/combat-manager.js`): Turn-based combat logic
- **Damage Calculator** (`src/combat/damage-calculator.js`): Damage calculations and critical hits
- **Enemy AI** (`src/combat/enemy-ai.js`): Enemy behavior patterns

### Progression Systems
- **Stage Manager** (`src/progression/stage-manager.js`): Level progression and stage unlocking
- **Material Manager** (`src/progression/material-manager.js`): Resource collection and management
- **Inventory Manager** (`src/progression/inventory-manager.js`): Item storage and management
- **Equipment Manager** (`src/progression/equipment-manager.js`): Equipment system with stat bonuses
- **Crafting System** (`src/progression/crafting-system.js`): Recipe-based item creation
- **Prestige Manager** (`src/progression/prestige-manager.js`): Meta-progression system
- **Daily Challenges** (`src/progression/daily-challenges.js`): Time-gated challenges
- **Weekly Events** (`src/progression/weekly-events.js`): Special event system
- **Achievement System** (`src/progression/achievement-system.js`): Achievement tracking

## Development Commands

Since this is a vanilla JavaScript project without a build system:

- **Development Server**: Use any local HTTP server (e.g., `python -m http.server 8000`, `npx serve`, or VS Code Live Server extension)
- **Testing**: No automated test framework - manual testing via browser
- **File Structure**: All source files are in `src/` directory, styles in `styles/`

## Key Development Patterns

### Event-Driven Architecture
The game uses a custom event system for communication between modules. All major game actions emit events that other systems can listen to.

### State Management
Centralized state in StateManager with deep merge updates. State is automatically saved to localStorage every 30 seconds.

### Module Imports
Uses ES6 modules with relative imports. The main entry point is `src/core/game-engine.js` which orchestrates all other systems.

### Canvas Rendering
Visual rendering happens in VisualRenderer with stage-specific backgrounds, character sprites, and particle effects.

## Important Notes

- Game state persists in localStorage under key 'incremental-combat-game-save'
- All systems are initialized through GameEngine constructor
- Combat is turn-based and triggered by canvas clicks
- Prestige system allows meta-progression with permanent bonuses
- Daily challenges reset at midnight local time
- Equipment has stat requirements and multiple item slots