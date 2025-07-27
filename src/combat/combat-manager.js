/**
 * Combat Manager - Core combat system logic
 * @module CombatManager
 */

import { EventSystem } from '../core/event-system.js';

class CombatManager {
    constructor(stateManager, eventSystem, stageManager = null, enemyDatabase = null) {
        this.stateManager = stateManager;
        this.eventSystem = eventSystem;
        this.stageManager = stageManager;
        this.enemyDatabase = enemyDatabase;
        
        this.isInCombat = false;
        this.currentEnemy = null;
        this.turnOrder = [];
        this.currentTurnIndex = 0;
        this.combatPhase = 'preparation'; // preparation, action, resolution
        
        this.COMBAT_PHASES = {
            PREPARATION: 'preparation',
            ACTION: 'action',
            RESOLUTION: 'resolution'
        };
        
        this.setupEventListeners();
    }
    
    /**
     * Setup event listeners for combat-related events
     */
    setupEventListeners() {
        // Listen for attack button clicks
        this.eventSystem.on('button_click', (data) => {
            if (data.buttonId === 'attack-btn' && this.isInCombat) {
                this.playerAttack();
            }
            if (data.buttonId === 'defend-btn' && this.isInCombat) {
                this.playerDefend();
            }
        });
        
        // Listen for canvas clicks to start combat
        this.eventSystem.on('canvas_click', (data) => {
            if (!this.isInCombat) {
                this.startCombat();
            }
        });
    }
    
    /**
     * Start a new combat encounter
     * @param {Object} enemy - Enemy data (optional, uses default if not provided)
     */
    startCombat(enemy = null) {
        if (this.isInCombat) {
            console.warn('Combat already in progress');
            return;
        }
        
        // Create stage-appropriate enemy if none provided
        this.currentEnemy = enemy || this.createStageEnemy();
        
        this.isInCombat = true;
        this.combatPhase = this.COMBAT_PHASES.PREPARATION;
        this.setupTurnOrder();
        
        // Update game state
        this.stateManager.updateState({
            game: { isInCombat: true },
            combat: {
                enemy: this.currentEnemy,
                phase: this.combatPhase,
                turnIndex: 0
            }
        });
        
        // Show combat UI
        this.showCombatUI();
        
        // Emit combat start event
        this.eventSystem.emit('combat_start', {
            enemy: this.currentEnemy,
            player: this.stateManager.getStateValue('player')
        });
        
        console.log('⚔️ Combat started!', this.currentEnemy);
        
        // Start first turn
        this.nextTurn();
    }
    
    /**
     * End the current combat
     * @param {string} result - Combat result ('victory', 'defeat', 'flee')
     */
    endCombat(result) {
        if (!this.isInCombat) return;
        
        const combatData = {
            result,
            enemy: this.currentEnemy,
            playerState: this.stateManager.getStateValue('player')
        };
        
        this.isInCombat = false;
        this.currentEnemy = null;
        this.combatPhase = this.COMBAT_PHASES.PREPARATION;
        
        // Update game state
        this.stateManager.updateState({
            game: { isInCombat: false },
            combat: null
        });
        
        // Hide combat UI
        this.hideCombatUI();
        
        // Handle combat results
        this.handleCombatResult(result, combatData);
        
        // Emit combat end event
        this.eventSystem.emit('combat_end', combatData);
        
        console.log(`⚔️ Combat ended: ${result}`);
    }
    
    /**
     * Setup turn order for combat
     */
    setupTurnOrder() {
        this.turnOrder = ['player', 'enemy'];
        this.currentTurnIndex = 0;
    }
    
    /**
     * Progress to next turn
     */
    nextTurn() {
        if (!this.isInCombat) return;
        
        const currentActor = this.turnOrder[this.currentTurnIndex];
        
        if (currentActor === 'player') {
            this.playerTurn();
        } else if (currentActor === 'enemy') {
            this.enemyTurn();
        }
        
        // Advance turn index
        this.currentTurnIndex = (this.currentTurnIndex + 1) % this.turnOrder.length;
    }
    
    /**
     * Handle player's turn
     */
    playerTurn() {
        this.combatPhase = this.COMBAT_PHASES.ACTION;
        
        // Enable combat buttons
        this.enableCombatActions(true);
        
        console.log('🧙 Player turn');
    }
    
    /**
     * Handle enemy's turn
     */
    enemyTurn() {
        this.combatPhase = this.COMBAT_PHASES.ACTION;
        
        // Disable combat buttons during enemy turn
        this.enableCombatActions(false);
        
        // Simple AI: enemy always attacks
        setTimeout(() => {
            this.enemyAttack();
        }, 1000); // 1 second delay for enemy action
        
        console.log('👹 Enemy turn');
    }
    
    /**
     * Player attack action
     */
    playerAttack() {
        if (!this.isInCombat || this.combatPhase !== this.COMBAT_PHASES.ACTION) return;
        
        const player = this.stateManager.getStateValue('player');
        const damage = this.calculateDamage(player.attack, this.currentEnemy.defense);
        
        // Apply damage to enemy
        this.currentEnemy.hp = Math.max(0, this.currentEnemy.hp - damage);
        
        // Create damage effect
        this.createDamageEffect(damage, 'enemy');
        
        // Emit attack event
        this.eventSystem.emit('attack', {
            attacker: 'player',
            target: 'enemy',
            damage: damage
        });
        
        console.log(`⚔️ Player attacks for ${damage} damage! Enemy HP: ${this.currentEnemy.hp}`);
        
        // Check if enemy is defeated
        if (this.currentEnemy.hp <= 0) {
            this.endCombat('victory');
            return;
        }
        
        // Disable actions and continue to next turn
        this.enableCombatActions(false);
        setTimeout(() => this.nextTurn(), 500);
    }
    
    /**
     * Player defend action
     */
    playerDefend() {
        if (!this.isInCombat || this.combatPhase !== this.COMBAT_PHASES.ACTION) return;
        
        // Defending reduces incoming damage for this turn
        this.stateManager.updateState({
            combat: { playerDefending: true }
        });
        
        console.log('🛡️ Player defends!');
        
        // Disable actions and continue to next turn
        this.enableCombatActions(false);
        setTimeout(() => this.nextTurn(), 500);
    }
    
    /**
     * Enemy attack action
     */
    enemyAttack() {
        if (!this.isInCombat) return;
        
        const player = this.stateManager.getStateValue('player');
        const combatState = this.stateManager.getStateValue('combat');
        
        let damage = this.calculateDamage(this.currentEnemy.attack, player.defense);
        
        // Reduce damage if player is defending
        if (combatState && combatState.playerDefending) {
            damage = Math.floor(damage * 0.5);
            this.stateManager.updateState({
                combat: { playerDefending: false }
            });
        }
        
        // Apply damage to player
        const newHp = Math.max(0, player.hp - damage);
        this.stateManager.updateState({
            player: { hp: newHp }
        });
        
        // Create damage effect
        this.createDamageEffect(damage, 'player');
        
        // Emit attack event
        this.eventSystem.emit('attack', {
            attacker: 'enemy',
            target: 'player',
            damage: damage
        });
        
        console.log(`👹 Enemy attacks for ${damage} damage! Player HP: ${newHp}`);
        
        // Check if player is defeated
        if (newHp <= 0) {
            this.endCombat('defeat');
            return;
        }
        
        // Continue to next turn
        setTimeout(() => this.nextTurn(), 500);
    }
    
    /**
     * Calculate damage based on attack and defense
     * @param {number} attack - Attack value
     * @param {number} defense - Defense value
     * @returns {number} Calculated damage
     */
    calculateDamage(attack, defense) {
        // Basic damage formula: attack - defense/2 + random variance
        const baseDamage = Math.max(1, attack - Math.floor(defense / 2));
        const variance = Math.floor(baseDamage * 0.2); // 20% variance
        const randomVariance = Math.floor(Math.random() * (variance * 2 + 1)) - variance;
        
        return Math.max(1, baseDamage + randomVariance);
    }
    
    /**
     * Create default enemy for testing or when stage system isn't available
     * @returns {Object} Enemy data
     */
    createDefaultEnemy() {
        return {
            name: 'Forest Goblin',
            hp: 30,
            maxHp: 30,
            attack: 8,
            defense: 3,
            level: 1,
            sprite: 'goblin'
        };
    }
    
    /**
     * Create enemy based on current stage
     * @returns {Object} Stage-appropriate enemy
     */
    createStageEnemy() {
        if (!this.stageManager || !this.enemyDatabase) {
            return this.createDefaultEnemy();
        }
        
        try {
            const enemyConfig = this.stageManager.getStageEnemyConfig();
            const enemy = this.enemyDatabase.createEnemy(enemyConfig.type, enemyConfig.level);
            
            if (enemy) {
                // Add stage information
                enemy.stageId = enemyConfig.stage;
                enemy.stageName = enemyConfig.stageName;
                console.log(`👹 Created ${enemy.name} (Level ${enemy.level}) from ${enemyConfig.stageName}`);
                return enemy;
            }
        } catch (error) {
            console.warn('⚠️ Failed to create stage enemy, using default:', error);
        }
        
        return this.createDefaultEnemy();
    }
    
    /**
     * Show combat UI elements
     */
    showCombatUI() {
        const combatUI = document.getElementById('combat-ui');
        if (combatUI) {
            combatUI.style.display = 'flex';
            combatUI.classList.add('fade-in');
        }
    }
    
    /**
     * Hide combat UI elements
     */
    hideCombatUI() {
        const combatUI = document.getElementById('combat-ui');
        if (combatUI) {
            combatUI.style.display = 'none';
            combatUI.classList.remove('fade-in');
        }
    }
    
    /**
     * Enable/disable combat action buttons
     * @param {boolean} enabled - Whether to enable buttons
     */
    enableCombatActions(enabled) {
        const attackBtn = document.getElementById('attack-btn');
        const defendBtn = document.getElementById('defend-btn');
        
        if (attackBtn) attackBtn.disabled = !enabled;
        if (defendBtn) defendBtn.disabled = !enabled;
    }
    
    /**
     * Create visual damage effect
     * @param {number} damage - Damage amount
     * @param {string} target - Target of damage ('player' or 'enemy')
     */
    createDamageEffect(damage, target) {
        // This will be enhanced with proper visual effects later
        console.log(`💥 ${damage} damage to ${target}`);
        
        // Emit damage event for UI to handle
        this.eventSystem.emit('damage_dealt', {
            damage,
            target
        });
    }
    
    /**
     * Handle combat result (victory/defeat)
     * @param {string} result - Combat result
     * @param {Object} combatData - Combat data
     */
    handleCombatResult(result, combatData) {
        switch (result) {
            case 'victory':
                this.handleVictory(combatData);
                break;
            case 'defeat':
                this.handleDefeat(combatData);
                break;
            case 'flee':
                this.handleFlee(combatData);
                break;
        }
    }
    
    /**
     * Handle victory result
     * @param {Object} combatData - Combat data
     */
    handleVictory(combatData) {
        // Award experience and materials
        const expGained = combatData.enemy.level * 10;
        const player = this.stateManager.getStateValue('player');
        
        this.stateManager.updateState({
            player: {
                exp: player.exp + expGained
            }
        });
        
        console.log(`🏆 Victory! Gained ${expGained} experience`);
        
        // Emit combat victory event for material system
        this.eventSystem.emit('combat_victory', {
            enemy: combatData.enemy,
            expGained: expGained,
            playerLevel: player.level
        });
        
        // Check for level up
        this.checkLevelUp();
    }
    
    /**
     * Handle defeat result
     * @param {Object} combatData - Combat data
     */
    handleDefeat(combatData) {
        console.log('💀 Defeat! Game over');
        
        // Reset player HP to half
        const player = this.stateManager.getStateValue('player');
        this.stateManager.updateState({
            player: {
                hp: Math.floor(player.maxHp / 2)
            }
        });
    }
    
    /**
     * Handle flee result
     * @param {Object} combatData - Combat data
     */
    handleFlee(combatData) {
        console.log('🏃 Fled from combat');
    }
    
    /**
     * Check if player should level up
     */
    checkLevelUp() {
        const player = this.stateManager.getStateValue('player');
        const expRequired = player.level * 100; // Simple formula
        
        if (player.exp >= expRequired) {
            const newLevel = player.level + 1;
            const newMaxHp = 100 + (newLevel - 1) * 20;
            const newAttack = 10 + (newLevel - 1) * 3;
            const newDefense = 5 + (newLevel - 1) * 2;
            
            this.stateManager.updateState({
                player: {
                    level: newLevel,
                    maxHp: newMaxHp,
                    hp: newMaxHp, // Full heal on level up
                    attack: newAttack,
                    defense: newDefense,
                    exp: player.exp - expRequired
                }
            });
            
            this.eventSystem.emit('player_level_up', {
                newLevel,
                stats: { maxHp: newMaxHp, attack: newAttack, defense: newDefense }
            });
            
            console.log(`🌟 Level up! Now level ${newLevel}`);
        }
    }
}

export { CombatManager };