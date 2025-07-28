/**
 * Daily Challenges Manager - Handles daily rotating challenges and events
 * @module DailyChallenges
 */

class DailyChallenges {
    constructor(stateManager, eventSystem) {
        this.stateManager = stateManager;
        this.eventSystem = eventSystem;
        
        // Challenge types and their configurations
        this.challengeTypes = {
            DEFEAT_ENEMIES: {
                id: 'defeat_enemies',
                name: 'Monster Hunter',
                description: 'Defeat {target} enemies',
                checkProgress: (progress, target) => progress >= target,
                rewardType: 'materials',
                baseReward: 20
            },
            COLLECT_MATERIALS: {
                id: 'collect_materials',
                name: 'Resource Gatherer',
                description: 'Collect {target} materials',
                checkProgress: (progress, target) => progress >= target,
                rewardType: 'exp',
                baseReward: 100
            },
            WIN_COMBATS: {
                id: 'win_combats',
                name: 'Victory Streak',
                description: 'Win {target} combats in a row',
                checkProgress: (progress, target) => progress >= target,
                rewardType: 'equipment',
                baseReward: 1
            },
            REACH_STAGE: {
                id: 'reach_stage',
                name: 'Explorer',
                description: 'Reach stage {target}',
                checkProgress: (progress, target) => progress >= target,
                rewardType: 'prestigePoints',
                baseReward: 5
            },
            CRAFT_ITEMS: {
                id: 'craft_items',
                name: 'Master Crafter',
                description: 'Craft {target} items',
                checkProgress: (progress, target) => progress >= target,
                rewardType: 'materials',
                baseReward: 15
            }
        };
        
        // Initialize daily challenges state
        this.initializeDailyChallenges();
        
        // Bind event listeners
        this.eventSystem.on('stateLoaded', () => this.onStateLoaded());
        this.bindEventListeners();
        
        console.log('📅 Daily Challenges Manager initialized');
    }
    
    /**
     * Initialize daily challenges state structure
     */
    initializeDailyChallenges() {
        const state = this.stateManager.getState();
        
        if (!state.dailyChallenges) {
            const today = this.getCurrentDateString();
            this.stateManager.updateState({
                dailyChallenges: {
                    lastRefresh: today,
                    currentChallenges: this.generateDailyChallenges(),
                    completedToday: [],
                    totalCompleted: 0,
                    streak: 0,
                    lastCompletionDate: null
                }
            });
        } else {
            // Check if we need to refresh challenges for a new day
            this.checkAndRefreshChallenges();
        }
    }
    
    /**
     * Handle state loaded event
     */
    onStateLoaded() {
        const state = this.stateManager.getState();
        
        // Ensure daily challenges state exists
        if (!state.dailyChallenges) {
            this.initializeDailyChallenges();
        } else {
            // Check if we need to refresh challenges for a new day
            this.checkAndRefreshChallenges();
        }
        
        console.log('📅 Daily challenges system loaded');
    }
    
    /**
     * Bind event listeners for tracking challenge progress
     */
    bindEventListeners() {
        this.eventSystem.on('combatVictory', (data) => {
            this.updateChallengeProgress('defeat_enemies', 1);
            this.updateChallengeProgress('win_combats', 1);
        });
        
        this.eventSystem.on('material_collected', (data) => {
            this.updateChallengeProgress('collect_materials', data.quantity || 1);
        });
        
        this.eventSystem.on('equipment_crafted', () => {
            this.updateChallengeProgress('craft_items', 1);
        });
        
        this.eventSystem.on('stageCompleted', (data) => {
            this.updateChallengeProgress('reach_stage', data.stageNumber);
        });
        
        this.eventSystem.on('combatDefeat', () => {
            // Reset win streak for victory streak challenges
            this.resetChallengeProgress('win_combats');
        });
    }
    
    /**
     * Generate 3 random daily challenges
     */
    generateDailyChallenges() {
        const challengeTypeKeys = Object.keys(this.challengeTypes);
        const selectedChallenges = [];
        
        // Ensure we don't pick the same challenge type twice
        const shuffled = [...challengeTypeKeys].sort(() => Math.random() - 0.5);
        
        for (let i = 0; i < 3 && i < shuffled.length; i++) {
            const challengeType = this.challengeTypes[shuffled[i]];
            const challenge = this.generateSingleChallenge(challengeType);
            selectedChallenges.push(challenge);
        }
        
        return selectedChallenges;
    }
    
    /**
     * Generate a single challenge with random target and rewards
     */
    generateSingleChallenge(challengeType) {
        const targets = {
            defeat_enemies: [10, 15, 20, 25, 30],
            collect_materials: [25, 40, 60, 80, 100],
            win_combats: [3, 5, 8, 10, 12],
            reach_stage: [2, 3, 4, 5],
            craft_items: [3, 5, 8, 12, 15]
        };
        
        const possibleTargets = targets[challengeType.id] || [5, 10, 15];
        const target = possibleTargets[Math.floor(Math.random() * possibleTargets.length)];
        
        // Calculate reward based on difficulty
        const difficultyMultiplier = 1 + (target / possibleTargets[possibleTargets.length - 1]);
        const reward = Math.floor(challengeType.baseReward * difficultyMultiplier);
        
        return {
            id: challengeType.id + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            type: challengeType.id,
            name: challengeType.name,
            description: challengeType.description.replace('{target}', target),
            target: target,
            progress: 0,
            completed: false,
            rewardType: challengeType.rewardType,
            rewardAmount: reward
        };
    }
    
    /**
     * Update progress for a specific challenge type
     */
    updateChallengeProgress(challengeType, amount) {
        const state = this.stateManager.getState();
        const challenges = state.dailyChallenges.currentChallenges;
        let updated = false;
        
        challenges.forEach(challenge => {
            if (challenge.type === challengeType && !challenge.completed) {
                if (challengeType === 'win_combats') {
                    // For streak challenges, increment
                    challenge.progress += amount;
                } else if (challengeType === 'reach_stage') {
                    // For stage challenges, use max value
                    challenge.progress = Math.max(challenge.progress, amount);
                } else {
                    // For accumulative challenges
                    challenge.progress += amount;
                }
                
                // Check if challenge is completed
                const challengeConfig = this.challengeTypes[challengeType.toUpperCase()];
                if (challengeConfig && challengeConfig.checkProgress(challenge.progress, challenge.target)) {
                    this.completeChallenge(challenge);
                }
                updated = true;
            }
        });
        
        if (updated) {
            this.stateManager.updateState({
                dailyChallenges: state.dailyChallenges
            });
        }
    }
    
    /**
     * Reset progress for a specific challenge type (e.g., for streaks)
     */
    resetChallengeProgress(challengeType) {
        const state = this.stateManager.getState();
        const challenges = state.dailyChallenges.currentChallenges;
        let updated = false;
        
        challenges.forEach(challenge => {
            if (challenge.type === challengeType && !challenge.completed) {
                challenge.progress = 0;
                updated = true;
            }
        });
        
        if (updated) {
            this.stateManager.updateState({
                dailyChallenges: state.dailyChallenges
            });
        }
    }
    
    /**
     * Complete a challenge and give rewards
     */
    completeChallenge(challenge) {
        const state = this.stateManager.getState();
        
        challenge.completed = true;
        state.dailyChallenges.completedToday.push(challenge.id);
        state.dailyChallenges.totalCompleted++;
        
        // Update completion streak
        const today = this.getCurrentDateString();
        if (state.dailyChallenges.lastCompletionDate !== today) {
            if (this.isConsecutiveDay(state.dailyChallenges.lastCompletionDate, today)) {
                state.dailyChallenges.streak++;
            } else {
                state.dailyChallenges.streak = 1;
            }
            state.dailyChallenges.lastCompletionDate = today;
        }
        
        // Give rewards
        this.giveReward(challenge.rewardType, challenge.rewardAmount);
        
        // Update state
        this.stateManager.updateState({
            dailyChallenges: state.dailyChallenges
        });
        
        // Trigger event
        this.eventSystem.emit('challengeCompleted', {
            challenge: challenge,
            reward: { type: challenge.rewardType, amount: challenge.rewardAmount }
        });
        
        // Emit challenge completed event for achievements
        this.eventSystem.emit('challenge_completed', {
            challengeType: challenge.type,
            challengeName: challenge.name
        });
        
        // Emit streak update event for achievements
        this.eventSystem.emit('challenge_streak_updated', {
            streak: state.dailyChallenges.currentStreak
        });
        
        console.log(`✅ Challenge completed: ${challenge.name} - Reward: ${challenge.rewardAmount} ${challenge.rewardType}`);
    }
    
    /**
     * Give rewards for completing challenges
     */
    giveReward(rewardType, amount) {
        const state = this.stateManager.getState();
        
        switch (rewardType) {
            case 'materials':
                // Give random materials
                const materialTypes = ['cloth', 'stone', 'wood', 'iron_ore', 'gem'];
                for (let i = 0; i < amount; i++) {
                    const materialType = materialTypes[Math.floor(Math.random() * materialTypes.length)];
                    this.eventSystem.emit('material_collected', {
                        type: materialType,
                        quantity: 1,
                        source: 'daily_challenge'
                    });
                }
                break;
                
            case 'exp':
                state.player.experience += amount;
                break;
                
            case 'equipment':
                // Give random equipment (simplified - could be enhanced)
                this.eventSystem.emit('equipment_reward', {
                    type: 'challenge_reward',
                    quality: 'uncommon'
                });
                break;
                
            case 'prestigePoints':
                if (state.prestige) {
                    state.prestige.points += amount;
                }
                break;
                
            default:
                console.warn(`Unknown reward type: ${rewardType}`);
        }
        
        this.stateManager.updateState(state);
    }
    
    /**
     * Check if challenges need to be refreshed for a new day
     */
    checkAndRefreshChallenges() {
        const state = this.stateManager.getState();
        const today = this.getCurrentDateString();
        
        // Initialize dailyChallenges if it doesn't exist
        if (!state.dailyChallenges) {
            state.dailyChallenges = {
                lastRefresh: '',
                currentChallenges: [],
                completedToday: [],
                streak: 0,
                totalCompleted: 0
            };
        }
        
        if (state.dailyChallenges.lastRefresh !== today) {
            // New day - refresh challenges
            state.dailyChallenges.lastRefresh = today;
            state.dailyChallenges.currentChallenges = this.generateDailyChallenges();
            state.dailyChallenges.completedToday = [];
            
            this.stateManager.updateState({
                dailyChallenges: state.dailyChallenges
            });
            
            console.log('📅 Daily challenges refreshed for new day');
        }
    }
    
    /**
     * Get current date as string (YYYY-MM-DD)
     */
    getCurrentDateString() {
        const now = new Date();
        return now.getFullYear() + '-' + 
               String(now.getMonth() + 1).padStart(2, '0') + '-' + 
               String(now.getDate()).padStart(2, '0');
    }
    
    /**
     * Check if two dates are consecutive days
     */
    isConsecutiveDay(lastDate, currentDate) {
        if (!lastDate) return false;
        
        const last = new Date(lastDate);
        const current = new Date(currentDate);
        const diffTime = current - last;
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        
        return diffDays === 1;
    }
    
    /**
     * Get current challenges
     */
    getCurrentChallenges() {
        const state = this.stateManager.getState();
        return state.dailyChallenges?.currentChallenges || [];
    }
    
    /**
     * Get challenge statistics
     */
    getChallengeStats() {
        const state = this.stateManager.getState();
        return {
            totalCompleted: state.dailyChallenges?.totalCompleted || 0,
            streak: state.dailyChallenges?.streak || 0,
            completedToday: state.dailyChallenges?.completedToday?.length || 0
        };
    }
}

export default DailyChallenges;