/**
 * Weekly Events Manager - Handles time-limited weekly events and special rewards
 * @module WeeklyEvents
 */

class WeeklyEvents {
    constructor(stateManager, eventSystem) {
        this.stateManager = stateManager;
        this.eventSystem = eventSystem;
        
        // Event types with unique mechanics and rewards
        this.eventTypes = {
            DOUBLE_MATERIALS: {
                id: 'double_materials',
                name: 'Material Bonanza',
                description: 'All material drops are doubled this week!',
                type: 'passive',
                effect: 'materialDropMultiplier',
                value: 2.0,
                icon: '💎',
                rarity: 'common'
            },
            BOSS_RUSH: {
                id: 'boss_rush',
                name: 'Boss Rush Week',
                description: 'Face enhanced bosses for legendary rewards!',
                type: 'active',
                effect: 'bossEnhancement',
                value: 1.5,
                icon: '👑',
                rarity: 'epic',
                specialRewards: ['legendary_material', 'rare_equipment', 'prestige_points']
            },
            CRAFTING_MASTERY: {
                id: 'crafting_mastery',
                name: 'Artisan\'s Week',
                description: 'Crafting costs reduced by 50% and success rates increased!',
                type: 'passive',
                effect: 'craftingBonus',
                value: 0.5,
                icon: '🔨',
                rarity: 'uncommon'
            },
            EXPERIENCE_SURGE: {
                id: 'experience_surge',
                name: 'Knowledge Festival',
                description: 'Gain 300% more experience from all sources!',
                type: 'passive',
                effect: 'experienceMultiplier',
                value: 4.0,
                icon: '📚',
                rarity: 'rare'
            },
            TREASURE_HUNT: {
                id: 'treasure_hunt',
                name: 'Treasure Hunter\'s Paradise',
                description: 'Find hidden treasure chests in combat!',
                type: 'active',
                effect: 'treasureChance',
                value: 0.25,
                icon: '🏆',
                rarity: 'legendary',
                specialRewards: ['treasure_chest', 'gold_bonus', 'rare_materials']
            },
            SPEED_CHALLENGE: {
                id: 'speed_challenge',
                name: 'Lightning Week',
                description: 'Complete objectives faster for bonus rewards!',
                type: 'active',
                effect: 'speedBonus',
                value: 1.5,
                icon: '⚡',
                rarity: 'rare'
            }
        };
        
        // Event difficulty scaling
        this.eventDifficulties = {
            EASY: { multiplier: 1.0, rewardBonus: 1.0 },
            NORMAL: { multiplier: 1.3, rewardBonus: 1.5 },
            HARD: { multiplier: 1.7, rewardBonus: 2.0 },
            EXTREME: { multiplier: 2.5, rewardBonus: 3.0 }
        };
        
        this.currentWeeklyEvent = null;
        this.eventHistory = [];
        this.eventProgress = {};
        this.leaderboard = [];
        
        this.initializeEvents();
        this.setupEventListeners();
    }
    
    /**
     * Initialize weekly events system
     */
    initializeEvents() {
        const gameState = this.stateManager.getGameState();
        
        // Load existing event data
        if (gameState.weeklyEvents) {
            this.currentWeeklyEvent = gameState.weeklyEvents.currentEvent;
            this.eventHistory = gameState.weeklyEvents.history || [];
            this.eventProgress = gameState.weeklyEvents.progress || {};
            this.leaderboard = gameState.weeklyEvents.leaderboard || [];
        }
        
        // Check if we need to start a new weekly event
        this.checkAndUpdateWeeklyEvent();
    }
    
    /**
     * Setup event listeners for tracking event progress
     */
    setupEventListeners() {
        // Listen for combat events
        this.eventSystem.on('combat-victory', (data) => {
            this.updateEventProgress('combatVictories', 1);
            this.processEventEffects('combat', data);
        });
        
        // Listen for material collection
        this.eventSystem.on('material-collected', (data) => {
            this.updateEventProgress('materialsCollected', data.amount);
            this.processEventEffects('materials', data);
        });
        
        // Listen for crafting events
        this.eventSystem.on('item-crafted', (data) => {
            this.updateEventProgress('itemsCrafted', 1);
            this.processEventEffects('crafting', data);
        });
        
        // Listen for boss defeats
        this.eventSystem.on('boss-defeated', (data) => {
            this.updateEventProgress('bossesDefeated', 1);
            this.processEventEffects('boss', data);
        });
    }
    
    /**
     * Check if current weekly event needs to be updated
     */
    checkAndUpdateWeeklyEvent() {
        const now = new Date();
        const currentWeek = this.getWeekNumber(now);
        
        if (!this.currentWeeklyEvent || this.currentWeeklyEvent.week !== currentWeek) {
            this.startNewWeeklyEvent();
        }
        
        this.saveEventState();
    }
    
    /**
     * Get ISO week number for consistent weekly cycles
     */
    getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }
    
    /**
     * Start a new weekly event
     */
    startNewWeeklyEvent() {
        // Archive current event if it exists
        if (this.currentWeeklyEvent) {
            this.archiveCurrentEvent();
        }
        
        // Generate new weekly event
        this.currentWeeklyEvent = this.generateWeeklyEvent();
        this.eventProgress = this.initializeEventProgress();
        
        // Notify players about new event
        this.eventSystem.emit('weekly-event-started', {
            event: this.currentWeeklyEvent,
            message: `New Weekly Event: ${this.currentWeeklyEvent.name}!`
        });
        
        console.log(`Started new weekly event: ${this.currentWeeklyEvent.name}`);
    }
    
    /**
     * Generate a new weekly event
     */
    generateWeeklyEvent() {
        const now = new Date();
        const currentWeek = this.getWeekNumber(now);
        
        // Select event type (weighted by rarity)
        const eventType = this.selectRandomEventType();
        const difficulty = this.selectEventDifficulty();
        
        const event = {
            id: `${eventType.id}_week_${currentWeek}`,
            type: eventType.id,
            name: eventType.name,
            description: eventType.description,
            icon: eventType.icon,
            rarity: eventType.rarity,
            difficulty: difficulty,
            effect: eventType.effect,
            value: eventType.value * this.eventDifficulties[difficulty].multiplier,
            specialRewards: eventType.specialRewards || [],
            week: currentWeek,
            startDate: now.toISOString(),
            endDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            participants: 0,
            totalRewards: 0
        };
        
        // Add event-specific objectives
        event.objectives = this.generateEventObjectives(eventType, difficulty);
        
        return event;
    }
    
    /**
     * Select random event type weighted by rarity
     */
    selectRandomEventType() {
        const weights = {
            common: 40,
            uncommon: 30,
            rare: 20,
            epic: 8,
            legendary: 2
        };
        
        const eventTypes = Object.values(this.eventTypes);
        const weightedEvents = [];
        
        eventTypes.forEach(event => {
            const weight = weights[event.rarity] || 10;
            for (let i = 0; i < weight; i++) {
                weightedEvents.push(event);
            }
        });
        
        return weightedEvents[Math.floor(Math.random() * weightedEvents.length)];
    }
    
    /**
     * Select event difficulty based on player progression
     */
    selectEventDifficulty() {
        const gameState = this.stateManager.getGameState();
        const playerLevel = gameState.player.level || 1;
        const stageProgress = gameState.stages?.currentStage || 1;
        
        // Calculate difficulty based on player progression
        const progressScore = playerLevel + (stageProgress * 5);
        
        if (progressScore < 10) return 'EASY';
        if (progressScore < 25) return 'NORMAL';
        if (progressScore < 50) return 'HARD';
        return 'EXTREME';
    }
    
    /**
     * Generate objectives for the weekly event
     */
    generateEventObjectives(eventType, difficulty) {
        const difficultySettings = this.eventDifficulties[difficulty];
        const baseObjectives = {
            combatVictories: Math.floor(50 * difficultySettings.multiplier),
            materialsCollected: Math.floor(200 * difficultySettings.multiplier),
            itemsCrafted: Math.floor(20 * difficultySettings.multiplier),
            bossesDefeated: Math.floor(3 * difficultySettings.multiplier)
        };
        
        // Add event-specific objectives
        switch (eventType.id) {
            case 'boss_rush':
                baseObjectives.bossesDefeated *= 2;
                baseObjectives.eliteBossesDefeated = Math.floor(2 * difficultySettings.multiplier);
                break;
            case 'treasure_hunt':
                baseObjectives.treasuresFound = Math.floor(10 * difficultySettings.multiplier);
                break;
            case 'speed_challenge':
                baseObjectives.fastCombats = Math.floor(25 * difficultySettings.multiplier);
                break;
        }
        
        return baseObjectives;
    }
    
    /**
     * Initialize event progress tracking
     */
    initializeEventProgress() {
        const objectives = this.currentWeeklyEvent?.objectives || {};
        const progress = {};
        
        Object.keys(objectives).forEach(key => {
            progress[key] = 0;
        });
        
        progress.totalScore = 0;
        progress.rewardsEarned = [];
        
        return progress;
    }
    
    /**
     * Update event progress
     */
    updateEventProgress(type, amount) {
        if (!this.currentWeeklyEvent || !this.eventProgress) return;
        
        if (this.eventProgress.hasOwnProperty(type)) {
            this.eventProgress[type] += amount;
            this.eventProgress.totalScore += amount;
            
            // Check for objective completion
            this.checkObjectiveCompletion(type);
            
            // Update leaderboard
            this.updateLeaderboard();
            
            this.saveEventState();
        }
    }
    
    /**
     * Process event effects (bonuses, special mechanics)
     */
    processEventEffects(context, data) {
        if (!this.currentWeeklyEvent) return;
        
        const eventType = this.eventTypes[this.currentWeeklyEvent.type];
        if (!eventType) return;
        
        switch (eventType.effect) {
            case 'materialDropMultiplier':
                if (context === 'materials') {
                    // Materials already processed with multiplier in material system
                    this.eventSystem.emit('event-bonus-applied', {
                        type: 'materials',
                        bonus: eventType.value,
                        amount: data.amount
                    });
                }
                break;
                
            case 'treasureChance':
                if (context === 'combat' && Math.random() < eventType.value) {
                    this.grantTreasureReward();
                }
                break;
                
            case 'speedBonus':
                if (context === 'combat' && data.duration < 30) { // Fast combat
                    this.updateEventProgress('fastCombats', 1);
                    this.grantSpeedBonus();
                }
                break;
        }
    }
    
    /**
     * Check if objectives are completed and grant rewards
     */
    checkObjectiveCompletion(type) {
        const objectives = this.currentWeeklyEvent.objectives;
        const progress = this.eventProgress;
        
        if (objectives[type] && progress[type] >= objectives[type]) {
            // Grant completion reward
            this.grantObjectiveReward(type);
        }
        
        // Check overall completion
        const totalObjectives = Object.keys(objectives).length;
        const completedObjectives = Object.keys(objectives).filter(key => 
            progress[key] >= objectives[key]
        ).length;
        
        if (completedObjectives === totalObjectives && !progress.eventCompleted) {
            this.completeWeeklyEvent();
        }
    }
    
    /**
     * Grant reward for completing an objective
     */
    grantObjectiveReward(objectiveType) {
        const difficulty = this.currentWeeklyEvent.difficulty;
        const rewardBonus = this.eventDifficulties[difficulty].rewardBonus;
        
        const rewards = {
            combatVictories: { type: 'experience', amount: Math.floor(500 * rewardBonus) },
            materialsCollected: { type: 'materials', amount: Math.floor(100 * rewardBonus) },
            itemsCrafted: { type: 'prestigePoints', amount: Math.floor(10 * rewardBonus) },
            bossesDefeated: { type: 'equipment', amount: 1, quality: 'rare' }
        };
        
        const reward = rewards[objectiveType];
        if (reward) {
            this.grantReward(reward);
            this.eventProgress.rewardsEarned.push({
                objective: objectiveType,
                reward: reward,
                timestamp: new Date().toISOString()
            });
        }
    }
    
    /**
     * Complete the weekly event
     */
    completeWeeklyEvent() {
        this.eventProgress.eventCompleted = true;
        
        // Grant completion bonus
        const completionReward = {
            type: 'prestigePoints',
            amount: 50,
            bonus: 'Weekly Event Champion!'
        };
        
        this.grantReward(completionReward);
        
        this.eventSystem.emit('weekly-event-completed', {
            event: this.currentWeeklyEvent,
            progress: this.eventProgress,
            reward: completionReward
        });
    }
    
    /**
     * Grant treasure reward for treasure hunt events
     */
    grantTreasureReward() {
        this.updateEventProgress('treasuresFound', 1);
        
        const treasureRewards = [
            { type: 'materials', amount: 50, rarity: 'rare' },
            { type: 'equipment', amount: 1, quality: 'epic' },
            { type: 'experience', amount: 1000 },
            { type: 'prestigePoints', amount: 25 }
        ];
        
        const reward = treasureRewards[Math.floor(Math.random() * treasureRewards.length)];
        this.grantReward(reward);
        
        this.eventSystem.emit('treasure-found', {
            reward: reward,
            message: '🏆 Treasure Found!'
        });
    }
    
    /**
     * Grant speed bonus for fast completion
     */
    grantSpeedBonus() {
        const speedReward = {
            type: 'experience',
            amount: 100,
            bonus: 'Speed Bonus'
        };
        
        this.grantReward(speedReward);
    }
    
    /**
     * Grant a reward to the player
     */
    grantReward(reward) {
        switch (reward.type) {
            case 'experience':
                this.eventSystem.emit('experience-gained', { amount: reward.amount });
                break;
            case 'materials':
                this.eventSystem.emit('materials-granted', { 
                    amount: reward.amount, 
                    rarity: reward.rarity || 'common' 
                });
                break;
            case 'equipment':
                this.eventSystem.emit('equipment-granted', { 
                    amount: reward.amount, 
                    quality: reward.quality || 'common' 
                });
                break;
            case 'prestigePoints':
                this.eventSystem.emit('prestige-points-granted', { amount: reward.amount });
                break;
        }
    }
    
    /**
     * Update leaderboard with current progress
     */
    updateLeaderboard() {
        // Simple leaderboard implementation
        const playerEntry = {
            playerId: 'local_player',
            score: this.eventProgress.totalScore,
            progress: { ...this.eventProgress },
            lastUpdate: new Date().toISOString()
        };
        
        // Update or add player entry
        const existingIndex = this.leaderboard.findIndex(entry => entry.playerId === 'local_player');
        if (existingIndex >= 0) {
            this.leaderboard[existingIndex] = playerEntry;
        } else {
            this.leaderboard.push(playerEntry);
        }
        
        // Sort by score
        this.leaderboard.sort((a, b) => b.score - a.score);
        
        // Keep top 100
        this.leaderboard = this.leaderboard.slice(0, 100);
    }
    
    /**
     * Archive completed event
     */
    archiveCurrentEvent() {
        if (this.currentWeeklyEvent) {
            this.eventHistory.push({
                ...this.currentWeeklyEvent,
                finalProgress: { ...this.eventProgress },
                archived: new Date().toISOString()
            });
            
            // Keep only last 12 weeks of history
            this.eventHistory = this.eventHistory.slice(-12);
        }
    }
    
    /**
     * Get current weekly event
     */
    getCurrentEvent() {
        return this.currentWeeklyEvent;
    }
    
    /**
     * Get event progress
     */
    getEventProgress() {
        return this.eventProgress;
    }
    
    /**
     * Get event leaderboard
     */
    getLeaderboard() {
        return this.leaderboard.slice(0, 10); // Top 10 for display
    }
    
    /**
     * Get event history
     */
    getEventHistory() {
        return this.eventHistory;
    }
    
    /**
     * Check if event effect is active
     */
    isEventEffectActive(effectType) {
        return this.currentWeeklyEvent && 
               this.eventTypes[this.currentWeeklyEvent.type]?.effect === effectType;
    }
    
    /**
     * Get event effect value
     */
    getEventEffectValue(effectType) {
        if (!this.isEventEffectActive(effectType)) return 1;
        return this.currentWeeklyEvent.value || 1;
    }
    
    /**
     * Save event state to game state
     */
    saveEventState() {
        const eventData = {
            currentEvent: this.currentWeeklyEvent,
            progress: this.eventProgress,
            history: this.eventHistory,
            leaderboard: this.leaderboard,
            lastUpdate: new Date().toISOString()
        };
        
        this.stateManager.updateGameState({ weeklyEvents: eventData });
    }
    
    /**
     * Update system (called from game loop)
     */
    update() {
        // Check for event expiration
        if (this.currentWeeklyEvent) {
            const now = new Date();
            const endDate = new Date(this.currentWeeklyEvent.endDate);
            
            if (now > endDate) {
                this.checkAndUpdateWeeklyEvent();
            }
        }
    }
}

export default WeeklyEvents;