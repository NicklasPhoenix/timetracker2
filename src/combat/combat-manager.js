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
     * Get effective player stats including equipment and prestige bonuses
     * @returns {Object} Effective player stats
     */
    getEffectivePlayerStats() {
        const basePlayer = this.stateManager.getStateValue('player');
        
        // Get prestige bonuses if available
        let prestigeBonuses = {
            damageMultiplier: 1,
            healthMultiplier: 1,
            defenseMultiplier: 1,
            criticalChanceBonus: 0
        };
        
        const state = this.stateManager.getState();
        if (state.prestige && state.prestige.upgrades) {
            const upgrades = state.prestige.upgrades;
            prestigeBonuses = {
                damageMultiplier: 1 + (upgrades.combatDamage || 0) * 0.1,
                healthMultiplier: 1 + (upgrades.healthBoost || 0) * 0.15,
                defenseMultiplier: 1 + (upgrades.defenseBoost || 0) * 0.1,
                criticalChanceBonus: (upgrades.criticalChance || 0) * 0.05
            };
        }
        
        // Apply prestige bonuses
        return {
            ...basePlayer,
            attack: Math.floor(basePlayer.attack * prestigeBonuses.damageMultiplier),
            defense: Math.floor(basePlayer.defense * prestigeBonuses.defenseMultiplier),
            maxHp: Math.floor(basePlayer.maxHp * prestigeBonuses.healthMultiplier),
            criticalChance: prestigeBonuses.criticalChanceBonus
        };
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
        
        // Track combat metrics for achievements
        this.combatStartTime = Date.now();
        this.combatDamageTaken = 0;
        this.initialPlayerHp = this.stateManager.getStateValue('player').hp;
        
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
        
        const effectivePlayer = this.getEffectivePlayerStats();
        const damage = this.calculateDamage(effectivePlayer.attack, this.currentEnemy.defense, effectivePlayer.criticalChance);
        
        let combatResult = null;
        
        // Handle boss damage differently
        if (this.currentEnemy.isBoss && window.gameEngine && window.gameEngine.bossManager) {
            const result = window.gameEngine.bossManager.damageBoss(damage);
            if (result.defeated) {
                combatResult = result;
                this.currentEnemy.hp = 0; // Sync enemy HP for combat manager
            } else {
                this.currentEnemy.hp = result.hp || this.currentEnemy.hp - damage;
            }
        } else {
            // Apply damage to regular enemy
            this.currentEnemy.hp = Math.max(0, this.currentEnemy.hp - damage);
        }
        
        // Create damage effect
        this.createDamageEffect(damage, 'enemy');
        
        // Emit attack event
        this.eventSystem.emit('attack', {
            attacker: 'player',
            target: 'enemy',
            damage: damage,
            isBoss: this.currentEnemy.isBoss || false
        });
        
        console.log(`⚔️ Player attacks for ${damage} damage! ${this.currentEnemy.name} HP: ${this.currentEnemy.hp}`);
        
        // Check if enemy is defeated
        if (this.currentEnemy.hp <= 0) {
            // Store boss result for victory handling
            if (combatResult && combatResult.defeated) {
                this.bossVictoryData = combatResult;
            }
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
        
        const effectivePlayer = this.getEffectivePlayerStats();
        const combatState = this.stateManager.getStateValue('combat');
        
        let damage;
        let attackDescription = 'attacks';
        
        // Handle boss attacks differently
        if (this.currentEnemy.isBoss) {
            const bossAction = this.getBossAction();
            damage = bossAction.damage;
            attackDescription = bossAction.description;
            
            // Apply boss damage to boss manager (for phase tracking)
            if (window.gameEngine && window.gameEngine.bossManager && window.gameEngine.bossManager.currentBoss) {
                // Update boss phase if needed
                window.gameEngine.bossManager.updateBossPhase();
            }
        } else {
            damage = this.calculateDamage(this.currentEnemy.attack, effectivePlayer.defense);
        }
        
        // Reduce damage if player is defending
        if (combatState && combatState.playerDefending) {
            damage = Math.floor(damage * 0.5);
            this.stateManager.updateState({
                combat: { playerDefending: false }
            });
        }
        
        // Apply damage to player
        const basePlayer = this.stateManager.getStateValue('player');
        const newHp = Math.max(0, basePlayer.hp - damage);
        this.stateManager.updateState({
            player: { hp: newHp }
        });
        
        // Track damage taken for achievements
        this.combatDamageTaken += damage;
        
        // Create damage effect
        this.createDamageEffect(damage, 'player');
        
        // Emit attack event
        this.eventSystem.emit('attack', {
            attacker: 'enemy',
            target: 'player',
            damage: damage,
            isBoss: this.currentEnemy.isBoss || false,
            description: attackDescription
        });
        
        console.log(`👹 ${this.currentEnemy.name} ${attackDescription} for ${damage} damage! Player HP: ${newHp}`);
        
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
     * @param {number} criticalChance - Critical hit chance (0.0 to 1.0)
     * @returns {number} Calculated damage
     */
    calculateDamage(attack, defense, criticalChance = 0) {
        // Basic damage formula: attack - defense/2 + random variance
        const baseDamage = Math.max(1, attack - Math.floor(defense / 2));
        const variance = Math.floor(baseDamage * 0.2); // 20% variance
        const randomVariance = Math.floor(Math.random() * (variance * 2 + 1)) - variance;
        
        let finalDamage = Math.max(1, baseDamage + randomVariance);
        let isCritical = false;
        
        // Check for critical hit
        if (criticalChance > 0 && Math.random() < criticalChance) {
            finalDamage = Math.floor(finalDamage * 2); // Critical hits do 2x damage
            isCritical = true;
            console.log('💥 Critical hit!');
            
            // Emit critical hit event for achievements
            this.eventSystem.emit('critical_hit', {
                damage: finalDamage,
                baseDamage: finalDamage / 2
            });
        }
        
        // Emit damage dealt event for achievements
        this.eventSystem.emit('damage_dealt', {
            damage: finalDamage,
            isCritical: isCritical
        });
        
        return finalDamage;
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
        const player = this.stateManager.getStateValue('player');
        let expGained = combatData.enemy.level * 10;
        
        // Handle boss victory
        if (combatData.enemy.isBoss && this.bossVictoryData) {
            const bossRewards = this.bossVictoryData.rewards;
            
            // Boss gives more experience
            expGained = bossRewards.experience;
            
            // Award boss materials
            if (bossRewards.materials && bossRewards.materials.length > 0) {
                this.eventSystem.emit('boss_materials_gained', {
                    materials: bossRewards.materials
                });
            }
            
            // Award boss equipment
            if (bossRewards.equipment && bossRewards.equipment.length > 0) {
                this.eventSystem.emit('boss_equipment_gained', {
                    equipment: bossRewards.equipment
                });
            }
            
            console.log(`👑 Boss Victory! Gained ${expGained} experience and special rewards!`);
            
            // Show boss victory notification
            if (window.gameEngine && window.gameEngine.bossUI) {
                window.gameEngine.bossUI.showBossVictory(this.bossVictoryData);
            }
            
            // Clear boss victory data
            this.bossVictoryData = null;
        } else {
            console.log(`🏆 Victory! Gained ${expGained} experience`);
        }
        
        // Award experience
        this.stateManager.updateState({
            player: {
                exp: player.exp + expGained
            }
        });
        
        // Calculate combat metrics for achievements
        const combatTime = (Date.now() - this.combatStartTime) / 1000; // in seconds
        const playerHpRemaining = player.hp;
        const damageTaken = this.combatDamageTaken;
        
        // Emit combat victory event for material system (for regular enemies)
        if (!combatData.enemy.isBoss) {
            this.eventSystem.emit('combat_victory', {
                enemy: combatData.enemy,
                expGained: expGained,
                playerLevel: player.level,
                combatTime: combatTime,
                playerHpRemaining: playerHpRemaining,
                damageTaken: damageTaken
            });
        }
        
        // Always emit general victory event for achievements
        this.eventSystem.emit('combatVictory', {
            enemy: combatData.enemy,
            expGained: expGained,
            playerLevel: player.level,
            isBoss: combatData.enemy.isBoss || false
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
            
            // Emit level up event for achievements
            this.eventSystem.emit('level_up', {
                level: newLevel,
                previousLevel: newLevel - 1
            });
            
            console.log(`🌟 Level up! Now level ${newLevel}`);
        }
    }
    
    /**
     * Get boss action for boss combat
     * @returns {Object} Boss action with damage and description
     */
    getBossAction() {
        if (!this.currentEnemy.isBoss || !window.gameEngine || !window.gameEngine.bossManager) {
            return { damage: this.currentEnemy.attack || 10, description: 'attacks' };
        }
        
        // Use the boss manager's AI system
        return window.gameEngine.bossManager.getBossAction();
    }
}

export { CombatManager };