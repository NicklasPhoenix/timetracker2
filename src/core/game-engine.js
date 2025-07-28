/**
 * Core Game Engine - Main game loop and initialization
 * @module GameEngine
 */

import { StateManager } from './state-manager.js';
import { EventSystem } from './event-system.js';
import { VisualRenderer } from './visual-renderer.js';
import { CombatManager } from '../combat/combat-manager.js';
import { MaterialManager } from '../progression/material-manager.js';
import { InventoryManager } from '../progression/inventory-manager.js';
import { CraftingSystem } from '../progression/crafting-system.js';
import { EquipmentManager } from '../progression/equipment-manager.js';
import { StageManager } from '../progression/stage-manager.js';
import { EnemyDatabase } from '../progression/enemy-database.js';
import { PrestigeManager } from '../progression/prestige-manager.js';
import DailyChallenges from '../progression/daily-challenges.js';
import DailyChallengesUI from '../ui/daily-challenges-ui.js';
import WeeklyEvents from '../progression/weekly-events.js';
import WeeklyEventsUI from '../ui/weekly-events-ui.js';
import { AchievementSystem } from '../progression/achievement-system-test.js';
import { AchievementUI } from '../ui/achievement-ui-test.js';
import BossManager from '../progression/boss-manager.js';
import BossUI from '../ui/boss-ui.js';

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
        
        // Visual system
        this.visualRenderer = null; // Initialized after canvas setup
        
        // Prestige system
        this.prestigeManager = new PrestigeManager(this.stateManager, this.eventSystem);
        
        // Stage and enemy systems
        this.enemyDatabase = new EnemyDatabase();
        this.stageManager = new StageManager(this.stateManager, this.eventSystem);
        this.combatManager = new CombatManager(this.stateManager, this.eventSystem, this.stageManager, this.enemyDatabase);
        
        // Progression systems
        this.materialManager = new MaterialManager(this.stateManager, this.eventSystem, this.stageManager);
        this.inventoryManager = new InventoryManager(this.stateManager, this.eventSystem);
        this.equipmentManager = new EquipmentManager(this.stateManager, this.eventSystem);
        this.craftingSystem = new CraftingSystem(this.stateManager, this.eventSystem, this.materialManager, this.inventoryManager);
        
        // Daily challenges system
        this.dailyChallenges = new DailyChallenges(this.stateManager, this.eventSystem);
        
        // Weekly events system
        this.weeklyEvents = new WeeklyEvents(this.stateManager, this.eventSystem);
        this.weeklyEventsUI = new WeeklyEventsUI(this.weeklyEvents, this.eventSystem);
        
        // Connect weekly events to material system
        this.materialManager.weeklyEvents = this.weeklyEvents;
        
        // Boss system
        this.bossManager = new BossManager(this.stateManager);
        this.bossManager.setEventEmitter(this.eventSystem);
        
        // Achievement system
        this.achievementSystem = new AchievementSystem(this.eventSystem, this.stateManager);
        this.achievementUI = new AchievementUI(this.achievementSystem, this.eventSystem);
        
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
        this.stateManager.subscribe('materials', () => this.updateUI());
        
        // Listen for material collection events for visual feedback
        this.eventSystem.on('material_collected', (data) => {
            this.showMaterialCollectedFeedback(data);
        });
        
        // Listen for crafting UI events
        this.eventSystem.on('button_click', (data) => {
            if (data.buttonId === 'crafting-btn') {
                this.showCraftingUI();
            }
            if (data.buttonId === 'close-crafting-btn') {
                this.hideCraftingUI();
            }
            if (data.buttonId === 'equipment-btn') {
                this.showEquipmentUI();
            }
            if (data.buttonId === 'close-equipment-btn') {
                this.hideEquipmentUI();
            }
            if (data.buttonId === 'stages-btn') {
                this.showStagesUI();
            }
            if (data.buttonId === 'close-stages-btn') {
                this.hideStagesUI();
            }
            if (data.buttonId === 'prestige-btn') {
                this.showPrestigeUI();
            }
            if (data.buttonId === 'close-prestige-btn') {
                this.hidePrestigeUI();
            }
            if (data.buttonId === 'prestige-reset-btn') {
                this.performPrestige();
            }
            if (data.buttonId === 'challenges-btn') {
                this.showChallengesUI();
            }
            if (data.buttonId === 'close-challenges-btn') {
                this.hideChallengesUI();
            }
            if (data.buttonId === 'boss-btn') {
                this.showBossUI();
            }
            if (data.buttonId === 'close-boss-btn') {
                this.hideBossUI();
            }
        });
        
        // Listen for recipe unlocks
        this.eventSystem.on('recipe_unlocked', (data) => {
            this.showRecipeUnlockedFeedback(data);
        });
        
        // Listen for equipment events
        this.eventSystem.on('item_equipped', () => {
            this.updateUI();
            if (document.getElementById('equipment-ui').style.display !== 'none') {
                this.updateEquipmentDisplay();
                this.updateInventoryDisplay();
            }
        });
        
        // Listen for stage events
        this.eventSystem.on('STAGE_UNLOCKED', (data) => {
            this.showStageUnlockedFeedback(data);
        });
        
        this.eventSystem.on('STAGE_COMPLETED', (data) => {
            this.showStageCompletedFeedback(data);
        });
        
        this.eventSystem.on('STAGE_CHANGED', (data) => {
            this.updateStageDisplay();
        });
        
        this.eventSystem.on('item_unequipped', () => {
            this.updateUI();
            if (document.getElementById('equipment-ui').style.display !== 'none') {
                this.updateEquipmentDisplay();
                this.updateInventoryDisplay();
            }
        });
        
        this.eventSystem.on('consumable_used', () => {
            this.updateUI();
            if (document.getElementById('equipment-ui').style.display !== 'none') {
                this.updateInventoryDisplay();
            }
        });
        
        // Visual effects event listeners
        this.setupVisualEffectListeners();
        
        this.start();
        
        // Initialize UI components
        this.dailyChallengesUI = new DailyChallengesUI(this.dailyChallenges, this.eventSystem);
        this.bossUI = new BossUI(this.bossManager, this.eventSystem, this.stageManager, this.combatManager);
        
        // Load achievement progress
        this.achievementSystem.loadProgress();
        
        console.log('🎮 Game Engine initialized');
    }
    
    /**
     * Setup visual effect event listeners
     */
    setupVisualEffectListeners() {
        // Combat visual effects
        this.eventSystem.on('damage_dealt', (data) => {
            if (this.visualRenderer && data.target === 'enemy') {
                this.visualRenderer.triggerAnimation('playerAttack');
                this.visualRenderer.triggerAnimation('damage');
                this.visualRenderer.createDamageParticles(
                    this.canvas.width / 2 + 150, 
                    this.canvas.height / 2, 
                    data.damage, 
                    data.isCritical
                );
            }
        });
        
        this.eventSystem.on('player_attacked', (data) => {
            if (this.visualRenderer) {
                this.visualRenderer.triggerAnimation('enemyAttack');
                this.visualRenderer.createDamageParticles(
                    this.canvas.width / 2 - 150, 
                    this.canvas.height / 2, 
                    data.damage
                );
            }
        });
        
        this.eventSystem.on('critical_hit', (data) => {
            if (this.visualRenderer) {
                this.visualRenderer.triggerAnimation('damage', 800);
            }
        });
        
        this.eventSystem.on('item_used', (data) => {
            if (this.visualRenderer && data.effect === 'heal') {
                this.visualRenderer.createHealingParticles(
                    this.canvas.width / 2 - 150, 
                    this.canvas.height / 2
                );
            }
        });
        
        console.log('🎨 Visual effect listeners setup complete');
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
        
        // Initialize visual renderer after canvas is ready
        this.visualRenderer = new VisualRenderer(this.canvas, this.ctx, this.stateManager, this.eventSystem);
        
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
        // Get prestige bonuses (if any exist)
        const bonuses = this.prestigeManager.getPrestigeBonuses();
        
        const initialState = {
            player: {
                hp: Math.floor(100 * bonuses.healthMultiplier),
                maxHp: Math.floor(100 * bonuses.healthMultiplier),
                level: 1,
                exp: 0,
                attack: Math.floor(10 * bonuses.damageMultiplier),
                defense: Math.floor(5 * bonuses.defenseMultiplier)
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
        
        // Emit stateLoaded event for subsystems
        this.eventSystem.emit('stateLoaded');
        
        // Check for recipe unlocks after state is loaded
        setTimeout(() => {
            this.craftingSystem.checkRecipeUnlocks();
        }, 100);
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
        // Update core systems
        if (this.dailyChallenges) {
            this.dailyChallenges.checkAndRefreshChallenges();
        }
        
        if (this.weeklyEvents) {
            this.weeklyEvents.update();
        }
        
        // Emit game tick for other systems
        this.eventSystem.emit('game_tick', { deltaTime });
    }
    
    /**
     * Render the current frame
     */
    render() {
        if (this.visualRenderer) {
            this.visualRenderer.render();
        } else {
            // Fallback rendering if visual renderer not ready
            this.ctx.fillStyle = '#1a1a2e';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
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
        const materialCountElement = document.getElementById('material-count');
        
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
        
        // Update material count
        if (materialCountElement && state.materials) {
            const totalMaterials = Object.values(state.materials).reduce((sum, count) => sum + count, 0);
            materialCountElement.textContent = totalMaterials;
            
            // Color code material count
            if (totalMaterials >= 50) {
                materialCountElement.style.color = '#51cf66'; // Green for lots of materials
            } else if (totalMaterials >= 10) {
                materialCountElement.style.color = '#ffd43b'; // Yellow for some materials
            } else {
                materialCountElement.style.color = '#9ca3af'; // Gray for few materials
            }
        } else if (materialCountElement) {
            materialCountElement.textContent = '0';
            materialCountElement.style.color = '#9ca3af';
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
    
    /**
     * Show visual feedback for material collection
     * @param {Object} data - Material collection data
     */
    showMaterialCollectedFeedback(data) {
        const { materialId, quantity, rarity } = data;
        const material = this.materialManager.getMaterialDefinition(materialId);
        
        if (!material) return;
        
        // Create floating text effect
        const feedback = document.createElement('div');
        feedback.className = 'material-feedback';
        feedback.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: ${this.materialManager.RARITY_COLORS[rarity]};
            font-size: 18px;
            font-weight: bold;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
            pointer-events: none;
            z-index: 1000;
            animation: materialFeedback 2s ease-out forwards;
        `;
        feedback.textContent = `+${quantity} ${material.name}`;
        
        document.body.appendChild(feedback);
        
        // Remove element after animation
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.parentNode.removeChild(feedback);
            }
        }, 2000);
        
        console.log(`✨ Material feedback: +${quantity} ${material.name} (${rarity})`);
    }
    
    /**
     * Show crafting UI
     */
    showCraftingUI() {
        // Close all other UIs first
        this.closeAllUIs();
        
        const craftingUI = document.getElementById('crafting-ui');
        const gameControls = document.getElementById('game-controls');
        
        if (craftingUI) {
            craftingUI.style.display = 'block';
            this.updateCraftingRecipeList();
        }
        
        if (gameControls) {
            gameControls.style.display = 'none';
        }
        
        console.log('🔨 Opened crafting UI');
    }
    
    /**
     * Hide crafting UI
     */
    hideCraftingUI() {
        const craftingUI = document.getElementById('crafting-ui');
        const gameControls = document.getElementById('game-controls');
        
        if (craftingUI) {
            craftingUI.style.display = 'none';
        }
        
        if (gameControls) {
            gameControls.style.display = 'block';
        }
        
        console.log('❌ Closed crafting UI');
    }
    
    /**
     * Update crafting recipe list
     */
    updateCraftingRecipeList() {
        const recipeList = document.getElementById('recipe-list');
        if (!recipeList) return;
        
        const unlockedRecipes = this.craftingSystem.getUnlockedRecipes();
        
        recipeList.innerHTML = '';
        
        if (unlockedRecipes.length === 0) {
            recipeList.innerHTML = '<p>No recipes available. Keep exploring to unlock more!</p>';
            return;
        }
        
        unlockedRecipes.forEach(recipe => {
            const recipeElement = document.createElement('div');
            recipeElement.className = 'recipe-item';
            recipeElement.style.cssText = `
                border: 1px solid #444;
                margin: 5px 0;
                padding: 10px;
                background: #222;
                cursor: pointer;
            `;
            
            const canCraft = this.craftingSystem.hasRequiredMaterials(recipe.requirements);
            const materialsList = Object.entries(recipe.requirements)
                .map(([materialId, amount]) => {
                    const currentAmount = this.materialManager.getMaterialCount(materialId);
                    const color = currentAmount >= amount ? '#51cf66' : '#ff6b6b';
                    const material = this.materialManager.getMaterialDefinition(materialId);
                    return `<span style="color: ${color}">${material?.name || materialId}: ${currentAmount}/${amount}</span>`;
                })
                .join(', ');
            
            recipeElement.innerHTML = `
                <strong>${recipe.name}</strong><br>
                <small>${recipe.description}</small><br>
                <small>Materials: ${materialsList}</small><br>
                <small>Craft Time: ${recipe.craftTime / 1000}s</small>
            `;
            
            if (canCraft) {
                recipeElement.style.borderColor = '#51cf66';
                recipeElement.addEventListener('click', () => {
                    this.craftingSystem.craftItem(recipe.id);
                    setTimeout(() => this.updateCraftingRecipeList(), 100);
                });
            } else {
                recipeElement.style.borderColor = '#ff6b6b';
                recipeElement.style.opacity = '0.6';
            }
            
            recipeList.appendChild(recipeElement);
        });
    }
    
    /**
     * Show equipment UI
     */
    showEquipmentUI() {
        // Close all other UIs first
        this.closeAllUIs();
        
        const equipmentUI = document.getElementById('equipment-ui');
        const gameControls = document.getElementById('game-controls');
        
        if (equipmentUI) {
            equipmentUI.style.display = 'block';
            this.updateEquipmentDisplay();
            this.updateInventoryDisplay();
        }
        
        if (gameControls) {
            gameControls.style.display = 'none';
        }
        
        console.log('⚔️ Opened equipment UI');
    }
    
    /**
     * Hide equipment UI
     */
    hideEquipmentUI() {
        const equipmentUI = document.getElementById('equipment-ui');
        const gameControls = document.getElementById('game-controls');
        
        if (equipmentUI) {
            equipmentUI.style.display = 'none';
        }
        
        if (gameControls) {
            gameControls.style.display = 'block';
        }
        
        console.log('❌ Closed equipment UI');
    }
    
    /**
     * Update equipment display
     */
    updateEquipmentDisplay() {
        const equippedItemsDiv = document.getElementById('equipped-items');
        if (!equippedItemsDiv) return;
        
        const equippedItems = this.equipmentManager.getEquippedItems();
        
        equippedItemsDiv.innerHTML = '';
        
        // Show all equipment slots
        const slots = {
            main_hand: 'Main Hand',
            chest: 'Chest',
            accessory_1: 'Accessory 1',
            accessory_2: 'Accessory 2'
        };
        
        for (const [slotId, slotName] of Object.entries(slots)) {
            const slotDiv = document.createElement('div');
            slotDiv.className = 'equipment-slot';
            slotDiv.style.cssText = `
                border: 1px solid #444;
                margin: 5px 0;
                padding: 10px;
                background: #1a1a1a;
                min-height: 60px;
            `;
            
            const equippedItem = equippedItems[slotId];
            
            if (equippedItem && equippedItem.itemData) {
                const item = equippedItem.itemData;
                const statsText = Object.entries(item.stats)
                    .map(([stat, value]) => `${stat}: +${value}`)
                    .join(', ');
                
                slotDiv.innerHTML = `
                    <strong>${slotName}</strong><br>
                    <div style="color: #51cf66;">
                        ${item.name} (${item.quality})<br>
                        <small>${statsText}</small>
                    </div>
                    <button data-unequip-slot="${slotId}" class="unequip-btn"
                            style="margin-top: 5px; background: #ff6b6b; border: none; padding: 2px 8px; color: white; cursor: pointer;">
                        Unequip
                    </button>
                `;
                
                // Add event listener for unequip button
                const unequipBtn = slotDiv.querySelector('.unequip-btn');
                if (unequipBtn) {
                    unequipBtn.addEventListener('click', () => {
                        this.equipmentManager.unequipItem(slotId);
                        this.updateEquipmentDisplay();
                        this.updateInventoryDisplay();
                        this.updateUI();
                    });
                }
            } else {
                slotDiv.innerHTML = `<strong>${slotName}</strong><br><em style="color: #666;">Empty</em>`;
            }
            
            equippedItemsDiv.appendChild(slotDiv);
        }
    }
    
    /**
     * Update inventory display
     */
    updateInventoryDisplay() {
        const inventoryList = document.getElementById('inventory-list');
        if (!inventoryList) return;
        
        const currentState = this.stateManager.getState();
        const inventory = currentState.inventory || {};
        const equipment = inventory.equipment || {};
        
        inventoryList.innerHTML = '';
        
        const unequippedItems = Object.values(equipment).filter(item => !item.equipped);
        
        if (unequippedItems.length === 0) {
            inventoryList.innerHTML = '<p style="color: #666;">No items in inventory</p>';
            return;
        }
        
        unequippedItems.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'inventory-item';
            itemDiv.style.cssText = `
                border: 1px solid #444;
                margin: 5px 0;
                padding: 10px;
                background: #222;
                cursor: pointer;
            `;
            
            const statsText = Object.entries(item.stats || {})
                .map(([stat, value]) => `${stat}: +${value}`)
                .join(', ');
            
            const canEquip = this.equipmentManager.meetsRequirements(item);
            const borderColor = canEquip ? '#51cf66' : '#ff6b6b';
            
            itemDiv.style.borderColor = borderColor;
            
            itemDiv.innerHTML = `
                <strong>${item.name} (${item.quality})</strong><br>
                <small>${item.description}</small><br>
                <small style="color: #51cf66;">${statsText}</small><br>
                <small>Value: ${item.value} gold</small>
            `;
            
            if (item.consumable) {
                // Add use button for consumables
                const useButton = document.createElement('button');
                useButton.textContent = 'Use';
                useButton.style.cssText = `
                    margin-top: 5px; 
                    background: #51cf66; 
                    border: none; 
                    padding: 4px 12px; 
                    color: white; 
                    cursor: pointer;
                    margin-right: 5px;
                `;
                useButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.equipmentManager.useConsumable(item.uniqueId);
                    this.updateInventoryDisplay();
                    this.updateUI();
                });
                itemDiv.appendChild(useButton);
            } else if (canEquip && item.slot) {
                // Add equip button for equipment
                const equipButton = document.createElement('button');
                equipButton.textContent = 'Equip';
                equipButton.style.cssText = `
                    margin-top: 5px; 
                    background: #339af0; 
                    border: none; 
                    padding: 4px 12px; 
                    color: white; 
                    cursor: pointer;
                `;
                equipButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.equipmentManager.equipItem(item.uniqueId);
                    this.updateEquipmentDisplay();
                    this.updateInventoryDisplay();
                    this.updateUI();
                });
                itemDiv.appendChild(equipButton);
            }
            
            inventoryList.appendChild(itemDiv);
        });
    }
    
    /**
     * Show stages UI
     */
    showStagesUI() {
        // Close all other UIs first
        this.closeAllUIs();
        
        const stagesUI = document.getElementById('stages-ui');
        const gameControls = document.getElementById('game-controls');
        
        if (stagesUI) {
            stagesUI.style.display = 'block';
            this.updateStageDisplay();
            this.updateStageList();
        }
        
        if (gameControls) {
            gameControls.style.display = 'none';
        }
        
        console.log('🗺️ Opened stages UI');
    }
    
    /**
     * Hide stages UI
     */
    hideStagesUI() {
        const stagesUI = document.getElementById('stages-ui');
        const gameControls = document.getElementById('game-controls');
        
        if (stagesUI) {
            stagesUI.style.display = 'none';
        }
        
        if (gameControls) {
            gameControls.style.display = 'block';
        }
        
        console.log('❌ Closed stages UI');
    }
    
    /**
     * Update current stage display
     */
    updateStageDisplay() {
        const stageDetails = document.getElementById('current-stage-details');
        if (!stageDetails) return;
        
        const currentStage = this.stageManager.getCurrentStage();
        const progress = this.stageManager.getStageProgress();
        
        stageDetails.innerHTML = `
            <div style="background: #222; padding: 15px; border: 1px solid #444; margin: 10px 0;">
                <h5 style="color: #ffd43b; margin: 0 0 10px 0;">${currentStage.name}</h5>
                <p style="color: #ccc; margin: 5px 0;">${currentStage.description}</p>
                <div style="color: #51cf66; margin: 10px 0;">
                    <strong>Progress:</strong> ${progress.victories}/${progress.victoriesNeeded} victories 
                    (${Math.round(progress.progressPercent)}%)
                </div>
                <div style="background: #333; height: 20px; border-radius: 10px; overflow: hidden; margin: 10px 0;">
                    <div style="background: linear-gradient(90deg, #51cf66, #69db7c); height: 100%; width: ${progress.progressPercent}%; transition: width 0.3s ease;"></div>
                </div>
                <div style="color: #74c0fc;">
                    <strong>Rewards:</strong> ${currentStage.expMultiplier}x EXP, ${currentStage.materialMultiplier}x Materials
                </div>
            </div>
        `;
    }
    
    /**
     * Update stage selection list
     */
    updateStageList() {
        const stageSelection = document.getElementById('stage-selection');
        if (!stageSelection) return;
        
        const allStages = this.stageManager.getAllStageInfo();
        
        stageSelection.innerHTML = '';
        
        allStages.forEach(stage => {
            const stageElement = document.createElement('div');
            stageElement.className = 'stage-item';
            stageElement.style.cssText = `
                border: 1px solid ${stage.unlocked ? (stage.current ? '#ffd43b' : '#444') : '#666'};
                margin: 5px 0;
                padding: 15px;
                background: ${stage.current ? '#2a2a0a' : '#222'};
                cursor: ${stage.unlocked ? 'pointer' : 'not-allowed'};
                opacity: ${stage.unlocked ? '1' : '0.5'};
                position: relative;
            `;
            
            const progressBar = stage.unlocked ? `
                <div style="background: #333; height: 8px; border-radius: 4px; overflow: hidden; margin: 10px 0;">
                    <div style="background: linear-gradient(90deg, #51cf66, #69db7c); height: 100%; width: ${stage.progress.progressPercent}%; transition: width 0.3s ease;"></div>
                </div>
                <div style="color: #888; font-size: 12px;">
                    ${stage.progress.victories}/${stage.progress.victoriesNeeded} victories ${stage.progress.completed ? '✅' : ''}
                </div>
            ` : '';
            
            stageElement.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong style="color: ${stage.current ? '#ffd43b' : '#fff'};">
                            ${stage.name} ${stage.current ? '(Current)' : ''}
                        </strong>
                        <div style="color: #ccc; margin: 5px 0;">${stage.description}</div>
                        ${stage.unlocked ? `
                            <div style="color: #74c0fc; font-size: 12px;">
                                Level Range: ${stage.enemyLevelRange[0]}-${stage.enemyLevelRange[1]} | 
                                ${stage.expMultiplier}x EXP | ${stage.materialMultiplier}x Materials
                            </div>
                        ` : `
                            <div style="color: #ff6b6b; font-size: 12px;">
                                🔒 Requires: Level ${stage.unlockCondition.level}${stage.unlockCondition.stage ? `, Complete Stage ${stage.unlockCondition.stage}` : ''}
                            </div>
                        `}
                        ${progressBar}
                    </div>
                    ${stage.unlocked && !stage.current ? `
                        <button class="stage-select-btn" data-stage-id="${stage.id}"
                                style="background: #51cf66; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer;">
                            Select
                        </button>
                    ` : ''}
                </div>
            `;
            
            stageSelection.appendChild(stageElement);
            
            // Add event listener for stage select button
            const stageSelectBtn = stageElement.querySelector('.stage-select-btn');
            if (stageSelectBtn) {
                stageSelectBtn.addEventListener('click', () => {
                    this.stageManager.switchToStage(stage.id);
                    this.updateStageDisplay();
                    this.updateStageList();
                });
            }
        });
    }
    
    /**
     * Show stage unlocked feedback
     * @param {Object} data - Stage unlock data
     */
    showStageUnlockedFeedback(data) {
        const { stageName, description } = data;
        
        const feedback = document.createElement('div');
        feedback.className = 'stage-unlocked-feedback';
        feedback.style.cssText = `
            position: fixed;
            top: 25%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: #ffd43b;
            padding: 20px;
            border: 2px solid #ffd43b;
            border-radius: 10px;
            font-size: 18px;
            font-weight: bold;
            text-align: center;
            box-shadow: 0 0 20px rgba(255, 212, 59, 0.5);
            pointer-events: none;
            z-index: 1000;
            animation: stageUnlockedFeedback 4s ease-out forwards;
        `;
        
        feedback.innerHTML = `
            <div style="font-size: 24px; margin-bottom: 10px;">🗺️ New Stage Unlocked!</div>
            <div style="color: #fff; font-size: 18px; margin-bottom: 5px;">${stageName}</div>
            <div style="color: #ccc; font-size: 14px;">${description}</div>
        `;
        
        document.body.appendChild(feedback);
        
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.parentNode.removeChild(feedback);
            }
        }, 4000);
        
        console.log(`🗺️ Stage unlocked: ${stageName}`);
    }
    
    /**
     * Show stage completed feedback
     * @param {Object} data - Stage completion data
     */
    showStageCompletedFeedback(data) {
        const { stageName } = data;
        
        const feedback = document.createElement('div');
        feedback.className = 'stage-completed-feedback';
        feedback.style.cssText = `
            position: fixed;
            top: 30%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: #51cf66;
            padding: 20px;
            border: 2px solid #51cf66;
            border-radius: 10px;
            font-size: 18px;
            font-weight: bold;
            text-align: center;
            box-shadow: 0 0 20px rgba(81, 207, 102, 0.5);
            pointer-events: none;
            z-index: 1000;
            animation: stageCompletedFeedback 3s ease-out forwards;
        `;
        
        feedback.innerHTML = `
            <div style="font-size: 24px; margin-bottom: 10px;">🎉 Stage Completed!</div>
            <div style="color: #fff; font-size: 18px;">${stageName}</div>
        `;
        
        document.body.appendChild(feedback);
        
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.parentNode.removeChild(feedback);
            }
        }, 3000);
        
        console.log(`🎉 Stage completed: ${stageName}`);
    }
    
    /**
     * Show recipe unlocked feedback
     * @param {Object} data - Recipe unlock data
     */
    showRecipeUnlockedFeedback(data) {
        const { recipeName } = data;
        
        const feedback = document.createElement('div');
        feedback.className = 'recipe-feedback';
        feedback.style.cssText = `
            position: fixed;
            top: 30%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #ffd43b;
            font-size: 20px;
            font-weight: bold;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
            pointer-events: none;
            z-index: 1000;
            animation: materialFeedback 3s ease-out forwards;
        `;
        feedback.textContent = `🔓 New Recipe: ${recipeName}`;
        
        document.body.appendChild(feedback);
        
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.parentNode.removeChild(feedback);
            }
        }, 3000);
        
        console.log(`🔓 Recipe unlocked: ${recipeName}`);
    }
    
    /**
     * Show prestige UI
     */
    showPrestigeUI() {
        // Close all other UIs first
        this.closeAllUIs();
        
        const prestigeUI = document.getElementById('prestige-ui');
        const gameControls = document.getElementById('game-controls');
        
        if (prestigeUI) {
            prestigeUI.style.display = 'block';
            this.updatePrestigeDisplay();
        }
        
        if (gameControls) {
            gameControls.style.display = 'none';
        }
        
        console.log('🌟 Opened prestige UI');
    }
    
    /**
     * Hide prestige UI
     */
    hidePrestigeUI() {
        const prestigeUI = document.getElementById('prestige-ui');
        const gameControls = document.getElementById('game-controls');
        
        if (prestigeUI) {
            prestigeUI.style.display = 'none';
        }
        
        if (gameControls) {
            gameControls.style.display = 'block';
        }
        
        console.log('❌ Closed prestige UI');
    }
    
    /**
     * Update prestige display
     */
    updatePrestigeDisplay() {
        const stats = this.prestigeManager.getPrestigeStats();
        
        // Update prestige stats
        document.getElementById('prestige-level').textContent = stats.level;
        document.getElementById('prestige-points').textContent = stats.points;
        document.getElementById('run-number').textContent = stats.runNumber;
        document.getElementById('total-resets').textContent = stats.totalResets;
        
        // Update current run progress
        document.getElementById('max-stage-reached').textContent = stats.currentRunProgress.maxStageReached || 1;
        document.getElementById('total-combat-wins').textContent = stats.currentRunProgress.totalCombatWins || 0;
        document.getElementById('total-materials').textContent = stats.currentRunProgress.totalMaterialsCollected || 0;
        document.getElementById('total-equipment').textContent = stats.currentRunProgress.totalEquipmentCrafted || 0;
        
        // Update prestige reset section
        document.getElementById('available-prestige-points').textContent = stats.availablePrestigePoints;
        const resetBtn = document.getElementById('prestige-reset-btn');
        resetBtn.disabled = !stats.canPrestige;
        resetBtn.textContent = stats.canPrestige ? 
            `Reset & Gain ${stats.availablePrestigePoints} Points` : 
            'Not Available Yet (Need 100+ Progress)';
        
        // Update upgrades list
        this.updatePrestigeUpgrades(stats);
    }
    
    /**
     * Update prestige upgrades display
     * @param {Object} stats - Prestige statistics
     */
    updatePrestigeUpgrades(stats) {
        const upgradeList = document.getElementById('upgrade-list');
        if (!upgradeList) return;
        
        const state = this.stateManager.getState();
        const prestige = state.prestige || {};
        const upgrades = prestige.upgrades || {};
        const availableUpgrades = prestige.availableUpgrades || [];
        
        upgradeList.innerHTML = '';
        
        const upgradeDescriptions = {
            'combatDamage': 'Combat Damage: +10% attack damage per level',
            'healthBoost': 'Health Boost: +15% max HP per level',
            'materialDrops': 'Material Drops: +20% material drop rate per level',
            'craftingSpeed': 'Crafting Speed: +10% faster crafting per level',
            'experienceGain': 'Experience Gain: +25% EXP gain per level',
            'criticalChance': 'Critical Chance: +5% critical hit chance per level',
            'defenseBoost': 'Defense Boost: +10% defense per level',
            'luckBonus': 'Luck Bonus: +10% rare material chance per level'
        };
        
        availableUpgrades.forEach(upgradeType => {
            const currentLevel = upgrades[upgradeType] || 0;
            const cost = this.prestigeManager.getUpgradeCost(upgradeType, currentLevel);
            const canAfford = stats.points >= cost;
            
            const upgradeElement = document.createElement('div');
            upgradeElement.className = 'prestige-upgrade';
            upgradeElement.style.cssText = `
                border: 1px solid ${canAfford ? '#51cf66' : '#666'};
                margin: 5px 0;
                padding: 10px;
                background: #222;
                opacity: ${canAfford ? '1' : '0.6'};
            `;
            
            upgradeElement.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${upgradeDescriptions[upgradeType]}</strong><br>
                        <small>Current Level: ${currentLevel}</small><br>
                        <small>Cost: ${cost} prestige points</small>
                    </div>
                    <button class="prestige-upgrade-btn" data-upgrade-type="${upgradeType}" 
                            ${canAfford ? '' : 'disabled'}
                            style="background: ${canAfford ? '#51cf66' : '#666'}; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: ${canAfford ? 'pointer' : 'not-allowed'};">
                        ${canAfford ? 'Purchase' : 'Not Affordable'}
                    </button>
                </div>
            `;
            
            upgradeList.appendChild(upgradeElement);
            
            // Add event listener for prestige upgrade button
            const upgradeBtn = upgradeElement.querySelector('.prestige-upgrade-btn');
            if (upgradeBtn && canAfford) {
                upgradeBtn.addEventListener('click', () => {
                    this.prestigeManager.purchaseUpgrade(upgradeType);
                    this.updatePrestigeDisplay();
                });
            }
        });
        
        if (availableUpgrades.length === 0) {
            upgradeList.innerHTML = '<p style="color: #666;">Reach prestige level 1 to unlock upgrades!</p>';
        }
    }
    
    /**
     * Perform prestige reset
     */
    performPrestige() {
        if (this.prestigeManager.performPrestige()) {
            // Show prestige success feedback
            const feedback = document.createElement('div');
            feedback.className = 'prestige-feedback';
            feedback.style.cssText = `
                position: fixed;
                top: 25%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.9);
                color: #ffd43b;
                padding: 20px;
                border: 2px solid #ffd43b;
                border-radius: 10px;
                font-size: 20px;
                font-weight: bold;
                text-align: center;
                box-shadow: 0 0 20px rgba(255, 212, 59, 0.5);
                pointer-events: none;
                z-index: 1000;
                animation: prestigeFeedback 4s ease-out forwards;
            `;
            
            feedback.innerHTML = `
                <div style="font-size: 30px; margin-bottom: 10px;">🌟 PRESTIGE! 🌟</div>
                <div>You have reset your progress and gained permanent bonuses!</div>
                <div style="color: #ccc; margin-top: 10px; font-size: 16px;">Your new journey begins...</div>
            `;
            
            document.body.appendChild(feedback);
            
            setTimeout(() => {
                if (feedback.parentNode) {
                    feedback.parentNode.removeChild(feedback);
                }
            }, 4000);
            
            // Hide prestige UI and update everything
            this.hidePrestigeUI();
            this.updateUI();
            this.updateStageDisplay();
            
            console.log('🌟 Prestige performed successfully!');
        }
    }
    
    /**
     * Show daily challenges UI
     */
    showChallengesUI() {
        // Close all other UIs first
        this.closeAllUIs();
        
        // The UI is handled by DailyChallengesUI class
        if (this.dailyChallengesUI) {
            this.dailyChallengesUI.showChallengesUI();
        }
        
        const gameControls = document.getElementById('game-controls');
        if (gameControls) {
            gameControls.style.display = 'none';
        }
        
        console.log('📅 Opened challenges UI');
    }
    
    /**
     * Hide daily challenges UI
     */
    hideChallengesUI() {
        // The UI is handled by DailyChallengesUI class
        if (this.dailyChallengesUI) {
            this.dailyChallengesUI.hideChallengesUI();
        }
        
        const gameControls = document.getElementById('game-controls');
        if (gameControls) {
            gameControls.style.display = 'block';
        }
        
        console.log('❌ Closed challenges UI');
    }
    
    /**
     * Show boss UI
     */
    showBossUI() {
        // Close all other UIs first
        this.closeAllUIs();
        
        if (this.bossUI) {
            this.bossUI.openBossUI();
        }
        
        const gameControls = document.getElementById('game-controls');
        if (gameControls) {
            gameControls.style.display = 'none';
        }
        
        console.log('👑 Opened boss UI');
    }
    
    /**
     * Hide boss UI
     */
    hideBossUI() {
        if (this.bossUI) {
            this.bossUI.closeBossUI();
        }
        
        const gameControls = document.getElementById('game-controls');
        if (gameControls) {
            gameControls.style.display = 'block';
        }
        
        console.log('❌ Closed boss UI');
    }
    
    /**
     * Close all UI panels to prevent overlapping
     */
    closeAllUIs() {
        const uiPanels = [
            'crafting-ui',
            'equipment-ui', 
            'stages-ui',
            'prestige-ui',
            'challenges-ui',
            'boss-ui'
        ];
        
        uiPanels.forEach(panelId => {
            const panel = document.getElementById(panelId);
            if (panel) {
                panel.style.display = 'none';
            }
        });
        
        // Also handle UI classes
        if (this.dailyChallengesUI) {
            this.dailyChallengesUI?.hideChallengesUI?.();
        }
        
        if (this.bossUI) {
            this.bossUI?.closeBossUI?.();
        }
    }
}

// Initialize game engine when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.gameEngine = new GameEngine();
});

export { GameEngine };