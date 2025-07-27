/**
 * Prestige Manager - Handles prestige system for infinite progression
 * @module PrestigeManager
 */

class PrestigeManager {
    constructor(stateManager, eventSystem) {
        this.stateManager = stateManager;
        this.eventSystem = eventSystem;
        
        // Initialize prestige state
        this.initializePrestigeState();
        
        // Bind event listeners
        this.eventSystem.on('stateLoaded', () => this.onStateLoaded());
        this.eventSystem.on('combatVictory', () => this.updatePrestigeProgress());
        this.eventSystem.on('material_collected_progress', (data) => this.updateMaterialProgress(data.quantity));
        this.eventSystem.on('equipment_crafted', () => this.updateCraftingProgress());
        
        console.log('🌟 Prestige Manager initialized');
    }
    
    /**
     * Initialize prestige state structure
     */
    initializePrestigeState() {
        const state = this.stateManager.getState();
        
        if (!state.prestige) {
            this.stateManager.updateState({
                prestige: {
                    points: 0,
                    totalPoints: 0,
                    level: 0,
                    runNumber: 1,
                    totalResets: 0,
                    currentRunProgress: {
                        maxStageReached: 1,
                        totalCombatWins: 0,
                        totalMaterialsCollected: 0,
                        totalEquipmentCrafted: 0
                    },
                    upgrades: {
                        combatDamage: 0,      // Increases base attack damage
                        healthBoost: 0,       // Increases max HP
                        materialDrops: 0,     // Increases material drop rate
                        craftingSpeed: 0,     // Reduces crafting requirements
                        experienceGain: 0,    // Increases exp gain rate
                        criticalChance: 0,    // Increases critical hit chance
                        defenseBoost: 0,      // Increases base defense
                        luckBonus: 0          // Increases rare material chance
                    },
                    availableUpgrades: [
                        'combatDamage',
                        'healthBoost',
                        'materialDrops'
                    ]
                }
            });
        }
    }
    
    /**
     * Calculate prestige points based on current run progress
     * @returns {number} Available prestige points for reset
     */
    calculatePrestigePoints() {
        const state = this.stateManager.getState();
        
        // Ensure prestige state exists
        if (!state.prestige || !state.prestige.currentRunProgress) {
            return 0;
        }
        
        const progress = state.prestige.currentRunProgress;
        const playerLevel = state.player.level;
        
        // Base points calculation
        let points = 0;
        
        // Points from stage progression (exponential scaling)
        const stageMultiplier = Math.pow(progress.maxStageReached, 1.5);
        points += Math.floor(stageMultiplier * 10);
        
        // Points from player level (level² scaling)
        points += Math.floor(Math.pow(playerLevel, 2) / 10);
        
        // Points from combat victories
        points += Math.floor(progress.totalCombatWins / 5);
        
        // Points from materials collected
        points += Math.floor(progress.totalMaterialsCollected / 50);
        
        // Points from equipment crafted
        points += Math.floor(progress.totalEquipmentCrafted * 5);
        
        // Minimum prestige requirement
        const minimumThreshold = 100;
        return Math.max(0, points - minimumThreshold);
    }
    
    /**
     * Check if prestige is available
     * @returns {boolean} True if player can prestige
     */
    canPrestige() {
        return this.calculatePrestigePoints() > 0;
    }
    
    /**
     * Perform prestige reset
     * @returns {boolean} True if prestige was successful
     */
    performPrestige() {
        if (!this.canPrestige()) {
            console.warn('Prestige not available yet');
            return false;
        }
        
        const prestigePoints = this.calculatePrestigePoints();
        const state = this.stateManager.getState();
        const currentPrestige = state.prestige;
        
        // Calculate new prestige state
        const newPrestigeState = {
            ...currentPrestige,
            points: currentPrestige.points + prestigePoints,
            totalPoints: currentPrestige.totalPoints + prestigePoints,
            level: currentPrestige.level + 1,
            runNumber: currentPrestige.runNumber + 1,
            totalResets: currentPrestige.totalResets + 1,
            currentRunProgress: {
                maxStageReached: 1,
                totalCombatWins: 0,
                totalMaterialsCollected: 0,
                totalEquipmentCrafted: 0
            }
        };
        
        // Unlock new upgrades based on prestige level
        this.unlockUpgrades(newPrestigeState);
        
        // Reset game state but preserve prestige data
        this.resetGameState(newPrestigeState);
        
        console.log(`🌟 Prestige! Gained ${prestigePoints} points (Total: ${newPrestigeState.totalPoints})`);
        
        // Fire prestige event
        this.eventSystem.dispatchEvent('prestigeReset', {
            pointsGained: prestigePoints,
            newPrestigeLevel: newPrestigeState.level,
            totalPoints: newPrestigeState.totalPoints
        });
        
        return true;
    }
    
    /**
     * Unlock new upgrades based on prestige level
     * @param {Object} prestigeState - Current prestige state
     */
    unlockUpgrades(prestigeState) {
        const allUpgrades = [
            'combatDamage',    // Always available
            'healthBoost',     // Always available
            'materialDrops',   // Always available
            'craftingSpeed',   // Unlock at level 3
            'experienceGain',  // Unlock at level 5
            'criticalChance',  // Unlock at level 7
            'defenseBoost',    // Unlock at level 10
            'luckBonus'        // Unlock at level 15
        ];
        
        const unlockLevels = {
            'combatDamage': 0,
            'healthBoost': 0,
            'materialDrops': 0,
            'craftingSpeed': 3,
            'experienceGain': 5,
            'criticalChance': 7,
            'defenseBoost': 10,
            'luckBonus': 15
        };
        
        prestigeState.availableUpgrades = allUpgrades.filter(upgrade => 
            prestigeState.level >= unlockLevels[upgrade]
        );
    }
    
    /**
     * Purchase prestige upgrade
     * @param {string} upgradeType - Type of upgrade to purchase
     * @returns {boolean} True if purchase was successful
     */
    purchaseUpgrade(upgradeType) {
        const state = this.stateManager.getState();
        const prestige = state.prestige;
        
        if (!prestige.availableUpgrades.includes(upgradeType)) {
            console.warn(`Upgrade ${upgradeType} not available`);
            return false;
        }
        
        const cost = this.getUpgradeCost(upgradeType, prestige.upgrades[upgradeType]);
        
        if (prestige.points < cost) {
            console.warn(`Not enough prestige points. Need ${cost}, have ${prestige.points}`);
            return false;
        }
        
        // Purchase upgrade
        const newUpgrades = { ...prestige.upgrades };
        newUpgrades[upgradeType]++;
        
        this.stateManager.updateState({
            prestige: {
                ...prestige,
                points: prestige.points - cost,
                upgrades: newUpgrades
            }
        });
        
        console.log(`🌟 Purchased ${upgradeType} upgrade level ${newUpgrades[upgradeType]} for ${cost} points`);
        
        // Fire upgrade purchase event
        this.eventSystem.dispatchEvent('prestigeUpgrade', {
            upgradeType,
            newLevel: newUpgrades[upgradeType],
            cost
        });
        
        return true;
    }
    
    /**
     * Calculate cost of prestige upgrade
     * @param {string} upgradeType - Type of upgrade
     * @param {number} currentLevel - Current upgrade level
     * @returns {number} Cost in prestige points
     */
    getUpgradeCost(upgradeType, currentLevel = 0) {
        const baseCosts = {
            'combatDamage': 10,
            'healthBoost': 10,
            'materialDrops': 15,
            'craftingSpeed': 20,
            'experienceGain': 25,
            'criticalChance': 30,
            'defenseBoost': 35,
            'luckBonus': 50
        };
        
        const baseCost = baseCosts[upgradeType] || 10;
        return Math.floor(baseCost * Math.pow(1.5, currentLevel));
    }
    
    /**
     * Get prestige bonus multipliers
     * @returns {Object} Multipliers for various game mechanics
     */
    getPrestigeBonuses() {
        const state = this.stateManager.getState();
        const upgrades = state.prestige?.upgrades || {};
        
        return {
            damageMultiplier: 1 + (upgrades.combatDamage * 0.1),
            healthMultiplier: 1 + (upgrades.healthBoost * 0.15),
            materialDropMultiplier: 1 + (upgrades.materialDrops * 0.2),
            craftingSpeedMultiplier: 1 + (upgrades.craftingSpeed * 0.1),
            experienceMultiplier: 1 + (upgrades.experienceGain * 0.25),
            criticalChanceBonus: upgrades.criticalChance * 0.05,
            defenseMultiplier: 1 + (upgrades.defenseBoost * 0.1),
            luckBonus: upgrades.luckBonus * 0.1
        };
    }
    
    /**
     * Reset game state while preserving prestige
     * @param {Object} newPrestigeState - New prestige state to apply
     */
    resetGameState(newPrestigeState) {
        // Get prestige bonuses for initial stats
        const bonuses = this.getPrestigeBonuses();
        
        const resetState = {
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
            materials: {},
            inventory: {
                equipment: {},
                consumables: {}
            },
            equippedItems: {},
            stages: {
                1: { completed: false, victories: 0 }
            },
            prestige: newPrestigeState
        };
        
        this.stateManager.setState(resetState);
    }
    
    /**
     * Update prestige run progress
     */
    updatePrestigeProgress() {
        const state = this.stateManager.getState();
        
        if (!state.prestige) return;
        
        const currentProgress = state.prestige.currentRunProgress;
        const newProgress = {
            ...currentProgress,
            maxStageReached: Math.max(currentProgress.maxStageReached, state.game.currentStage),
            totalCombatWins: currentProgress.totalCombatWins + 1
        };
        
        this.stateManager.updateState({
            prestige: {
                ...state.prestige,
                currentRunProgress: newProgress
            }
        });
    }
    
    /**
     * Update material collection progress
     * @param {number} quantity - Number of materials collected
     */
    updateMaterialProgress(quantity = 1) {
        const state = this.stateManager.getState();
        
        if (!state.prestige) return;
        
        const currentProgress = state.prestige.currentRunProgress;
        const newProgress = {
            ...currentProgress,
            totalMaterialsCollected: currentProgress.totalMaterialsCollected + quantity
        };
        
        this.stateManager.updateState({
            prestige: {
                ...state.prestige,
                currentRunProgress: newProgress
            }
        });
    }
    
    /**
     * Update equipment crafting progress
     */
    updateCraftingProgress() {
        const state = this.stateManager.getState();
        
        if (!state.prestige) return;
        
        const currentProgress = state.prestige.currentRunProgress;
        const newProgress = {
            ...currentProgress,
            totalEquipmentCrafted: currentProgress.totalEquipmentCrafted + 1
        };
        
        this.stateManager.updateState({
            prestige: {
                ...state.prestige,
                currentRunProgress: newProgress
            }
        });
    }
    
    /**
     * Handle state loaded event
     */
    onStateLoaded() {
        const state = this.stateManager.getState();
        
        // Ensure prestige state exists
        if (!state.prestige) {
            this.initializePrestigeState();
        }
        
        console.log('🌟 Prestige system loaded');
    }
    
    /**
     * Get prestige statistics for UI
     * @returns {Object} Prestige statistics
     */
    getPrestigeStats() {
        const state = this.stateManager.getState();
        const prestige = state.prestige || {};
        
        return {
            points: prestige.points || 0,
            totalPoints: prestige.totalPoints || 0,
            level: prestige.level || 0,
            runNumber: prestige.runNumber || 1,
            totalResets: prestige.totalResets || 0,
            availablePrestigePoints: this.calculatePrestigePoints(),
            canPrestige: this.canPrestige(),
            bonuses: this.getPrestigeBonuses(),
            currentRunProgress: prestige.currentRunProgress || {}
        };
    }
}

export { PrestigeManager };