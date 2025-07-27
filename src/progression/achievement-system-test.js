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
        console.log('🏆 Achievement System initialized with', Object.keys(this.achievements).length, 'achievements');
    }

    initializeAchievements() {
        // Start with just a few achievements to test
        return {
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
            'material_collector': {
                id: 'material_collector',
                name: 'Material Collector',
                description: 'Collect 100 materials',
                category: 'collection',
                requirement: { stat: 'materialsCollected', value: 100 },
                reward: { type: 'materials', amount: 50 },
                unlocked: false,
                progress: 0
            }
        };
    }

    initializeTrackedStats() {
        return {
            combatWins: 0,
            playerLevel: 1,
            materialsCollected: 0
        };
    }

    setupEventListeners() {
        // Combat events
        this.eventSystem.on('combat_victory', () => {
            this.updateStat('combatWins', 1);
        });

        // Level events
        this.eventSystem.on('level_up', (data) => {
            this.trackedStats.playerLevel = data.level;
            this.checkAchievements(['level_up']);
        });

        // Material events
        this.eventSystem.on('material_collected', (data) => {
            this.updateStat('materialsCollected', data.amount);
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

            const { stat, value } = achievement.requirement;
            const currentValue = this.trackedStats[stat];
            
            const isUnlocked = currentValue >= value;
            achievement.progress = Math.min(currentValue / value * 100, 100);

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
        console.log('🏆 Achievement Unlocked:', achievement.name);
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

        if (savedAchievements) {
            // Merge saved achievements with current definitions
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