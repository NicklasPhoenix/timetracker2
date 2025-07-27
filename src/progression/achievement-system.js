/**
 * Achievement System - Comprehensive achievement tracking with categories and rewards
 * Phase 7: Adds progression goals and rewards across all game systems
 */

export class AchievementSystem {
    constructor(eventSystem, stateManager) {
        this.eventSystem = eventSystem;
        this.stateManager = stateManager;
        this.achievements = this.initializeAchievements();
        this.trackedStats = this.initializeTrackedStats();
        
        this.setupEventListeners();
    }

    initializeAchievements() {
        return {
            // Combat Achievements
            'first_blood': {
                id: 'first_blood',
                name: 'First Blood',
                description: 'Win your first combat',
                category: 'combat',
                requirement: { stat: 'combatWins', value: 1 },
                reward: { type: 'experience', amount: 50 },
                unlocked: false,
                progress: 0
            },
            'combat_veteran': {
                id: 'combat_veteran',
                name: 'Combat Veteran',
                description: 'Win 100 combats',
                category: 'combat',
                requirement: { stat: 'combatWins', value: 100 },
                reward: { type: 'equipment', item: 'veteran_sword' },
                unlocked: false,
                progress: 0
            },
            'critical_master': {
                id: 'critical_master',
                name: 'Critical Master',
                description: 'Land 50 critical hits',
                category: 'combat',
                requirement: { stat: 'criticalHits', value: 50 },
                reward: { type: 'prestige_points', amount: 5 },
                unlocked: false,
                progress: 0
            },
            'damage_dealer': {
                id: 'damage_dealer',
                name: 'Damage Dealer',
                description: 'Deal 10,000 total damage',
                category: 'combat',
                requirement: { stat: 'totalDamageDealt', value: 10000 },
                reward: { type: 'materials', amount: 25 },
                unlocked: false,
                progress: 0
            },

            // Collection Achievements
            'material_collector': {
                id: 'material_collector',
                name: 'Material Collector',
                description: 'Collect 500 materials',
                category: 'collection',
                requirement: { stat: 'materialsCollected', value: 500 },
                reward: { type: 'materials', amount: 50 },
                unlocked: false,
                progress: 0
            },
            'rare_finder': {
                id: 'rare_finder',
                name: 'Rare Finder',
                description: 'Find 10 rare or better materials',
                category: 'collection',
                requirement: { stat: 'rareMaterialsFound', value: 10 },
                reward: { type: 'equipment', item: 'lucky_charm' },
                unlocked: false,
                progress: 0
            },
            'legendary_seeker': {
                id: 'legendary_seeker',
                name: 'Legendary Seeker',
                description: 'Find a legendary material',
                category: 'collection',
                requirement: { stat: 'legendaryMaterialsFound', value: 1 },
                reward: { type: 'prestige_points', amount: 10 },
                unlocked: false,
                progress: 0
            },

            // Crafting Achievements
            'apprentice_crafter': {
                id: 'apprentice_crafter',
                name: 'Apprentice Crafter',
                description: 'Craft 10 items',
                category: 'crafting',
                requirement: { stat: 'itemsCrafted', value: 10 },
                reward: { type: 'experience', amount: 100 },
                unlocked: false,
                progress: 0
            },
            'master_crafter': {
                id: 'master_crafter',
                name: 'Master Crafter',
                description: 'Craft 100 items',
                category: 'crafting',
                requirement: { stat: 'itemsCrafted', value: 100 },
                reward: { type: 'equipment', item: 'crafting_tools' },
                unlocked: false,
                progress: 0
            },
            'weapon_smith': {
                id: 'weapon_smith',
                name: 'Weapon Smith',
                description: 'Craft 25 weapons',
                category: 'crafting',
                requirement: { stat: 'weaponsCrafted', value: 25 },
                reward: { type: 'prestige_points', amount: 8 },
                unlocked: false,
                progress: 0
            },

            // Exploration Achievements
            'explorer': {
                id: 'explorer',
                name: 'Explorer',
                description: 'Complete stage 2',
                category: 'exploration',
                requirement: { stat: 'maxStageReached', value: 2 },
                reward: { type: 'materials', amount: 20 },
                unlocked: false,
                progress: 0
            },
            'world_traveler': {
                id: 'world_traveler',
                name: 'World Traveler',
                description: 'Complete all 5 stages',
                category: 'exploration',
                requirement: { stat: 'maxStageReached', value: 5 },
                reward: { type: 'equipment', item: 'explorer_boots' },
                unlocked: false,
                progress: 0
            },

            // Progression Achievements
            'level_up': {
                id: 'level_up',
                name: 'Level Up!',
                description: 'Reach level 5',
                category: 'progression',
                requirement: { stat: 'playerLevel', value: 5 },
                reward: { type: 'experience', amount: 200 },
                unlocked: false,
                progress: 0
            },
            'prestige_pioneer': {
                id: 'prestige_pioneer',
                name: 'Prestige Pioneer',
                description: 'Perform your first prestige',
                category: 'progression',
                requirement: { stat: 'prestigeCount', value: 1 },
                reward: { type: 'prestige_points', amount: 15 },
                unlocked: false,
                progress: 0
            },
            'prestige_master': {
                id: 'prestige_master',
                name: 'Prestige Master',
                description: 'Perform 10 prestiges',
                category: 'progression',
                requirement: { stat: 'prestigeCount', value: 10 },
                reward: { type: 'equipment', item: 'prestige_crown' },
                unlocked: false,
                progress: 0
            },

            // Challenge Achievements
            'challenge_complete': {
                id: 'challenge_complete',
                name: 'Challenge Complete',
                description: 'Complete your first daily challenge',
                category: 'challenges',
                requirement: { stat: 'challengesCompleted', value: 1 },
                reward: { type: 'experience', amount: 75 },
                unlocked: false,
                progress: 0
            },
            'challenge_streaker': {
                id: 'challenge_streaker',
                name: 'Challenge Streaker',
                description: 'Complete challenges for 7 days in a row',
                category: 'challenges',
                requirement: { stat: 'challengeStreak', value: 7 },
                reward: { type: 'equipment', item: 'streak_medallion' },
                unlocked: false,
                progress: 0
            },
            'challenge_champion': {
                id: 'challenge_champion',
                name: 'Challenge Champion',
                description: 'Complete 100 daily challenges',
                category: 'challenges',
                requirement: { stat: 'challengesCompleted', value: 100 },
                reward: { type: 'prestige_points', amount: 20 },
                unlocked: false,
                progress: 0
            },

            // Special Achievements
            'speed_demon': {
                id: 'speed_demon',
                name: 'Speed Demon',
                description: 'Win a combat in under 5 seconds',
                category: 'special',
                requirement: { stat: 'fastestCombat', value: 5, operator: 'less_than' },
                reward: { type: 'equipment', item: 'speed_boots' },
                unlocked: false,
                progress: 0
            },
            'survivor': {
                id: 'survivor',
                name: 'Survivor',
                description: 'Win a combat with 1 HP remaining',
                category: 'special',
                requirement: { stat: 'closeCallVictories', value: 1 },
                reward: { type: 'prestige_points', amount: 12 },
                unlocked: false,
                progress: 0
            },
            'no_damage': {
                id: 'no_damage',
                name: 'Untouchable',
                description: 'Win a combat without taking damage',
                category: 'special',
                requirement: { stat: 'perfectVictories', value: 1 },
                reward: { type: 'equipment', item: 'perfect_shield' },
                unlocked: false,
                progress: 0
            }
        };
    }

    initializeTrackedStats() {
        return {
            combatWins: 0,
            criticalHits: 0,
            totalDamageDealt: 0,
            materialsCollected: 0,
            rareMaterialsFound: 0,
            legendaryMaterialsFound: 0,
            itemsCrafted: 0,
            weaponsCrafted: 0,
            maxStageReached: 1,
            playerLevel: 1,
            prestigeCount: 0,
            challengesCompleted: 0,
            challengeStreak: 0,
            fastestCombat: Infinity,
            closeCallVictories: 0,
            perfectVictories: 0
        };
    }

    setupEventListeners() {
        // Combat events
        this.eventSystem.on('combat_victory', (data) => {
            this.updateStat('combatWins', 1);
            if (data.combatTime < this.trackedStats.fastestCombat) {
                this.trackedStats.fastestCombat = data.combatTime;
                this.checkAchievements(['speed_demon']);
            }
            if (data.playerHpRemaining === 1) {
                this.updateStat('closeCallVictories', 1);
            }
            if (data.damageTaken === 0) {
                this.updateStat('perfectVictories', 1);
            }
        });

        this.eventSystem.on('critical_hit', () => {
            this.updateStat('criticalHits', 1);
        });

        this.eventSystem.on('damage_dealt', (data) => {
            this.updateStat('totalDamageDealt', data.damage);
        });

        // Material events
        this.eventSystem.on('material_collected', (data) => {
            this.updateStat('materialsCollected', data.amount);
            if (data.rarity === 'rare' || data.rarity === 'epic' || data.rarity === 'legendary') {
                this.updateStat('rareMaterialsFound', 1);
            }
            if (data.rarity === 'legendary') {
                this.updateStat('legendaryMaterialsFound', 1);
            }
        });

        // Crafting events
        this.eventSystem.on('item_crafted', (data) => {
            this.updateStat('itemsCrafted', 1);
            if (data.category === 'weapon') {
                this.updateStat('weaponsCrafted', 1);
            }
        });

        // Stage events
        this.eventSystem.on('stage_completed', (data) => {
            if (data.stageNumber > this.trackedStats.maxStageReached) {
                this.trackedStats.maxStageReached = data.stageNumber;
                this.checkAchievements(['explorer', 'world_traveler']);
            }
        });

        // Level events
        this.eventSystem.on('level_up', (data) => {
            this.trackedStats.playerLevel = data.level;
            this.checkAchievements(['level_up']);
        });

        // Prestige events
        this.eventSystem.on('prestige_performed', () => {
            this.updateStat('prestigeCount', 1);
        });

        // Challenge events
        this.eventSystem.on('challenge_completed', () => {
            this.updateStat('challengesCompleted', 1);
        });

        this.eventSystem.on('challenge_streak_updated', (data) => {
            this.trackedStats.challengeStreak = data.streak;
            this.checkAchievements(['challenge_streaker']);
        });
    }

    updateStat(statName, amount) {
        if (typeof this.trackedStats[statName] === 'number') {
            this.trackedStats[statName] += amount;
            this.checkAchievements();
            this.saveProgress();
        }
    }

    checkAchievements(specificAchievements = null) {
        const achievementsToCheck = specificAchievements || Object.keys(this.achievements);
        
        achievementsToCheck.forEach(achievementId => {
            const achievement = this.achievements[achievementId];
            if (!achievement || achievement.unlocked) return;

            const { stat, value, operator = 'greater_than_or_equal' } = achievement.requirement;
            const currentValue = this.trackedStats[stat];
            
            let isUnlocked = false;
            switch (operator) {
                case 'greater_than_or_equal':
                    isUnlocked = currentValue >= value;
                    achievement.progress = Math.min(currentValue / value * 100, 100);
                    break;
                case 'less_than':
                    isUnlocked = currentValue < value && currentValue > 0;
                    achievement.progress = isUnlocked ? 100 : 0;
                    break;
                case 'equal':
                    isUnlocked = currentValue === value;
                    achievement.progress = isUnlocked ? 100 : 0;
                    break;
            }

            if (isUnlocked && !achievement.unlocked) {
                this.unlockAchievement(achievementId);
            }
        });
    }

    unlockAchievement(achievementId) {
        const achievement = this.achievements[achievementId];
        if (!achievement || achievement.unlocked) return;

        achievement.unlocked = true;
        achievement.progress = 100;

        // Grant reward
        this.grantReward(achievement.reward);

        // Emit achievement unlocked event
        this.eventSystem.emit('achievement_unlocked', {
            achievement: achievement,
            reward: achievement.reward
        });

        // Show notification
        this.showAchievementNotification(achievement);

        this.saveProgress();
    }

    grantReward(reward) {
        switch (reward.type) {
            case 'experience':
                this.eventSystem.emit('gain_experience', { amount: reward.amount });
                break;
            case 'materials':
                this.eventSystem.emit('gain_materials', { 
                    materials: [{ type: 'cloth', amount: reward.amount }] 
                });
                break;
            case 'prestige_points':
                this.eventSystem.emit('gain_prestige_points', { amount: reward.amount });
                break;
            case 'equipment':
                this.eventSystem.emit('gain_equipment', { item: reward.item });
                break;
        }
    }

    showAchievementNotification(achievement) {
        // Create achievement notification overlay
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-notification-content">
                <div class="achievement-icon">🏆</div>
                <div class="achievement-details">
                    <div class="achievement-title">Achievement Unlocked!</div>
                    <div class="achievement-name">${achievement.name}</div>
                    <div class="achievement-description">${achievement.description}</div>
                </div>
            </div>
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => notification.classList.add('show'), 100);

        // Remove after delay
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 500);
        }, 4000);
    }

    getAchievementsByCategory() {
        const categories = {};
        Object.values(this.achievements).forEach(achievement => {
            if (!categories[achievement.category]) {
                categories[achievement.category] = [];
            }
            categories[achievement.category].push(achievement);
        });
        return categories;
    }

    getUnlockedAchievements() {
        return Object.values(this.achievements).filter(a => a.unlocked);
    }

    getCompletionPercentage() {
        const total = Object.keys(this.achievements).length;
        const unlocked = this.getUnlockedAchievements().length;
        return Math.round((unlocked / total) * 100);
    }

    saveProgress() {
        this.stateManager.updateState({
            achievements: this.achievements,
            achievementStats: this.trackedStats
        });
    }

    loadProgress() {
        const state = this.stateManager.getState();
        const savedAchievements = state.achievements;
        const savedStats = state.achievementStats;

    loadProgress() {
        const state = this.stateManager.getState();
        const savedAchievements = state.achievements;
        const savedStats = state.achievementStats;

        if (savedAchievements) {
            // Merge saved achievements with current definitions (in case new achievements were added)
            Object.keys(savedAchievements).forEach(id => {
                if (this.achievements[id]) {
                    this.achievements[id].unlocked = savedAchievements[id].unlocked;
                    this.achievements[id].progress = savedAchievements[id].progress;
                }
            });
        }

        if (savedStats) {
            this.trackedStats = { ...this.trackedStats, ...savedStats };
        }

        // Update progress for all achievements
        this.checkAchievements();
    }
}

export { AchievementSystem };