/**
 * Core Game Engine - Main game loop and initialization
 * @module GameEngine
 */

import { StateManager } from './state-manager.js';
import { EventSystem } from './event-system.js';
import { CombatManager } from '../combat/combat-manager.js';

class GameEngine {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.lastTime = 0;
        this.deltaTime = 0;
        this.fps = 0;
        this.frameCount = 0;
        this.isRunning = false;
        
        // Core systems
        this.stateManager = new StateManager();
        this.eventSystem = new EventSystem();
        this.combatManager = new CombatManager(this.stateManager, this.eventSystem);
        
        // Performance monitoring
        this.fpsUpdateTime = 0;
        this.targetFPS = 60;
        this.frameTimeBuffer = [];
        this.maxFrameTimeBufferSize = 60;
        
        this.init();
    }
    
    /**
     * Initialize the game engine
     */
    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.loadInitialState();
        
        // Subscribe to state changes for UI updates
        this.stateManager.subscribe('player.hp', () => this.updateUI());
        this.stateManager.subscribe('player.level', () => this.updateUI());
        
        this.start();
        
        console.log('🎮 Game Engine initialized');
    }
    
    /**
     * Setup HTML5 canvas with responsive design
     */
    setupCanvas() {
        this.canvas = document.getElementById('game-canvas');
        if (!this.canvas) {
            throw new Error('Game canvas not found');
        }
        
        this.ctx = this.canvas.getContext('2d');
        this.setupCanvasResponsive();
        
        // Setup canvas styling for crisp pixel art
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.webkitImageSmoothingEnabled = false;
        this.ctx.mozImageSmoothingEnabled = false;
        this.ctx.msImageSmoothingEnabled = false;
    }
    
    /**
     * Setup responsive canvas sizing
     */
    setupCanvasResponsive() {
        const updateCanvasSize = () => {
            const container = document.getElementById('game-container');
            const containerRect = container.getBoundingClientRect();
            
            // Maintain aspect ratio while fitting in container
            const aspectRatio = 800 / 600;
            let newWidth = containerRect.width * 0.9;
            let newHeight = newWidth / aspectRatio;
            
            if (newHeight > containerRect.height * 0.8) {
                newHeight = containerRect.height * 0.8;
                newWidth = newHeight * aspectRatio;
            }
            
            this.canvas.style.width = `${newWidth}px`;
            this.canvas.style.height = `${newHeight}px`;
        };
        
        updateCanvasSize();
        window.addEventListener('resize', updateCanvasSize);
    }
    
    /**
     * Setup event listeners for input and window events
     */
    setupEventListeners() {
        // Canvas input events
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        
        // UI button events
        document.addEventListener('click', (e) => this.handleButtonClick(e));
        
        // Keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Visibility API for pause/resume
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pause();
            } else {
                this.resume();
            }
        });
    }
    
    /**
     * Load initial game state
     */
    loadInitialState() {
        const initialState = {
            player: {
                hp: 100,
                maxHp: 100,
                level: 1,
                exp: 0,
                attack: 10,
                defense: 5
            },
            game: {
                currentStage: 1,
                isPaused: false,
                isInCombat: false
            },
            performance: {
                fps: 60,
                frameTime: 16.67
            }
        };
        
        this.stateManager.setState(initialState);
        this.updateUI();
    }
    
    /**
     * Start the game loop
     */
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop();
        
        console.log('🚀 Game loop started');
    }
    
    /**
     * Pause the game
     */
    pause() {
        this.isRunning = false;
        this.stateManager.updateState({ game: { isPaused: true } });
        console.log('⏸️ Game paused');
    }
    
    /**
     * Resume the game
     */
    resume() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.stateManager.updateState({ game: { isPaused: false } });
        this.lastTime = performance.now();
        this.gameLoop();
        
        console.log('▶️ Game resumed');
    }
    
    /**
     * Main game loop using requestAnimationFrame
     * @param {number} currentTime - Current timestamp
     */
    gameLoop(currentTime = performance.now()) {
        if (!this.isRunning) return;
        
        // Calculate delta time
        this.deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Update FPS tracking
        this.updateFPS(this.deltaTime);
        
        // Update game systems
        this.update(this.deltaTime);
        
        // Render frame
        this.render();
        
        // Continue loop
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    /**
     * Update FPS tracking and performance metrics
     * @param {number} deltaTime - Time since last frame
     */
    updateFPS(deltaTime) {
        this.frameCount++;
        this.fpsUpdateTime += deltaTime;
        
        // Add current frame time to buffer
        this.frameTimeBuffer.push(deltaTime);
        if (this.frameTimeBuffer.length > this.maxFrameTimeBufferSize) {
            this.frameTimeBuffer.shift();
        }
        
        // Update FPS display every second
        if (this.fpsUpdateTime >= 1000) {
            this.fps = Math.round(this.frameCount * 1000 / this.fpsUpdateTime);
            this.frameCount = 0;
            this.fpsUpdateTime = 0;
            
            // Update performance state
            const avgFrameTime = this.frameTimeBuffer.reduce((a, b) => a + b, 0) / this.frameTimeBuffer.length;
            this.stateManager.updateState({
                performance: {
                    fps: this.fps,
                    frameTime: avgFrameTime
                }
            });
            
            this.updateFPSDisplay();
        }
    }
    
    /**
     * Update game systems
     * @param {number} deltaTime - Time since last frame
     */
    update(deltaTime) {
        // TODO: Update game systems here
        // - Combat system
        // - Player movement/actions
        // - Enemy AI
        // - Animations
        
        // For now, just emit a game tick event
        this.eventSystem.emit('game_tick', { deltaTime });
    }
    
    /**
     * Render the current frame
     */
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // TODO: Render game objects here
        // - Background
        // - Player
        // - Enemies
        // - Effects
        
        // Placeholder rendering
        this.renderPlaceholder();
    }
    
    /**
     * Render placeholder content during development
     */
    renderPlaceholder() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        const state = this.stateManager.getState();
        
        if (state.game && state.game.isInCombat) {
            // Combat mode rendering
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('⚔️ COMBAT ⚔️', centerX, centerY - 60);
            
            // Draw enemy info
            if (state.combat && state.combat.enemy) {
                const enemy = state.combat.enemy;
                this.ctx.font = '18px Arial';
                this.ctx.fillStyle = '#ff6b6b';
                this.ctx.fillText(enemy.name, centerX, centerY - 20);
                this.ctx.fillText(`HP: ${enemy.hp}/${enemy.maxHp}`, centerX, centerY + 10);
            }
            
            // Draw combat instructions
            this.ctx.font = '14px Arial';
            this.ctx.fillStyle = '#888888';
            this.ctx.fillText('Use the buttons below to fight!', centerX, centerY + 50);
        } else {
            // Exploration mode rendering
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '32px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Incremental Combat Game', centerX, centerY - 40);
            
            // Draw loading message
            this.ctx.font = '16px Arial';
            this.ctx.fillStyle = '#888888';
            this.ctx.fillText('Click anywhere to start combat!', centerX, centerY + 20);
        }
        
        // Draw FPS
        this.ctx.fillStyle = '#00ff00';
        this.ctx.font = '14px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`FPS: ${this.fps}`, 10, 30);
    }
    
    /**
     * Update UI elements
     */
    updateUI() {
        const state = this.stateManager.getState();
        
        // Update player stats
        const playerHpElement = document.getElementById('player-hp');
        const playerLevelElement = document.getElementById('player-level');
        
        if (playerHpElement && state.player) {
            playerHpElement.textContent = state.player.hp;
            
            // Color code HP based on percentage
            const hpPercent = state.player.hp / state.player.maxHp;
            if (hpPercent <= 0.25) {
                playerHpElement.style.color = '#ff6b6b'; // Red for low HP
            } else if (hpPercent <= 0.5) {
                playerHpElement.style.color = '#ffd43b'; // Yellow for medium HP
            } else {
                playerHpElement.style.color = '#51cf66'; // Green for high HP
            }
        }
        
        if (playerLevelElement && state.player) {
            playerLevelElement.textContent = state.player.level;
        }
    }
    
    /**
     * Update FPS display in UI
     */
    updateFPSDisplay() {
        const fpsElement = document.getElementById('fps');
        if (fpsElement) {
            fpsElement.textContent = this.fps;
            
            // Color code FPS
            if (this.fps >= 55) {
                fpsElement.style.color = '#51cf66'; // Green
            } else if (this.fps >= 30) {
                fpsElement.style.color = '#ffd43b'; // Yellow
            } else {
                fpsElement.style.color = '#ff6b6b'; // Red
            }
        }
    }
    
    /**
     * Handle canvas click events
     * @param {MouseEvent} event - Mouse event
     */
    handleCanvasClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (event.clientX - rect.left) * (this.canvas.width / rect.width);
        const y = (event.clientY - rect.top) * (this.canvas.height / rect.height);
        
        this.eventSystem.emit('canvas_click', { x, y });
    }
    
    /**
     * Handle touch start events
     * @param {TouchEvent} event - Touch event
     */
    handleTouchStart(event) {
        event.preventDefault();
        const touch = event.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const x = (touch.clientX - rect.left) * (this.canvas.width / rect.width);
        const y = (touch.clientY - rect.top) * (this.canvas.height / rect.height);
        
        this.eventSystem.emit('canvas_touch', { x, y });
    }
    
    /**
     * Handle key down events
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleKeyDown(event) {
        this.eventSystem.emit('key_down', { key: event.key, code: event.code });
        
        // Debug controls
        if (event.key === 'p' || event.key === 'P') {
            if (this.isRunning) {
                this.pause();
            } else {
                this.resume();
            }
        }
    }
    
    /**
     * Handle key up events
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleKeyUp(event) {
        this.eventSystem.emit('key_up', { key: event.key, code: event.code });
    }
    
    /**
     * Handle button click events
     * @param {MouseEvent} event - Mouse event
     */
    handleButtonClick(event) {
        if (event.target.tagName === 'BUTTON') {
            this.eventSystem.emit('button_click', {
                buttonId: event.target.id,
                buttonText: event.target.textContent
            });
        }
    }
}

// Initialize game engine when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.gameEngine = new GameEngine();
});

export { GameEngine };