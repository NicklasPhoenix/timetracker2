/**
 * Achievement UI - Comprehensive achievement display and management interface
 * Phase 7: Achievement System UI Component
 */

export class AchievementUI {
    constructor(achievementSystem, eventSystem) {
        this.achievementSystem = achievementSystem;
        this.eventSystem = eventSystem;
        this.currentCategory = 'all';
        this.sortBy = 'progress'; // 'progress', 'name', 'category', 'unlocked'
        
        this.initializeUI();
        this.setupEventListeners();
    }

    initializeUI() {
        // Add achievements UI to the HTML
        const uiOverlay = document.getElementById('ui-overlay');
        
        const achievementsUI = document.createElement('div');
        achievementsUI.id = 'achievements-ui';
        achievementsUI.style.display = 'none';
        achievementsUI.innerHTML = `
            <div class="achievements-header">
                <h3>🏆 Achievements</h3>
                <div class="achievements-stats">
                    <div class="completion-stats">
                        <div class="completion-percentage">
                            <span id="completion-percent">0</span>% Complete
                        </div>
                        <div class="achievement-counts">
                            <span id="unlocked-count">0</span> / <span id="total-count">0</span> Unlocked
                        </div>
                    </div>
                    <div class="category-filter">
                        <select id="category-filter">
                            <option value="all">All Categories</option>
                            <option value="combat">Combat</option>
                            <option value="collection">Collection</option>
                            <option value="crafting">Crafting</option>
                            <option value="exploration">Exploration</option>
                            <option value="progression">Progression</option>
                            <option value="challenges">Challenges</option>
                            <option value="special">Special</option>
                        </select>
                    </div>
                    <div class="sort-options">
                        <select id="sort-filter">
                            <option value="progress">Sort by Progress</option>
                            <option value="name">Sort by Name</option>
                            <option value="category">Sort by Category</option>
                            <option value="unlocked">Sort by Status</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <div class="achievements-content">
                <div class="achievements-grid" id="achievements-grid">
                    <!-- Achievement cards will be populated here -->
                </div>
            </div>
            
            <div class="achievements-footer">
                <div class="achievement-rewards-info">
                    <h4>💎 Rewards Available</h4>
                    <p>Complete achievements to earn experience, materials, equipment, and prestige points!</p>
                    <div class="reward-summary" id="reward-summary">
                        <div class="pending-rewards">
                            <span>🎁 <span id="pending-rewards-count">0</span> rewards ready to claim</span>
                        </div>
                    </div>
                </div>
                <button id="close-achievements-btn" class="close-btn">Close</button>
            </div>
        `;
        
        uiOverlay.appendChild(achievementsUI);

        // Add achievements button to game controls
        const gameControls = document.getElementById('game-controls');
        const achievementsBtn = document.createElement('button');
        achievementsBtn.id = 'achievements-btn';
        achievementsBtn.textContent = '🏆 Achievements';
        achievementsBtn.style.marginTop = '5px';
        gameControls.appendChild(achievementsBtn);
    }

    setupEventListeners() {
        // Show/hide achievements UI
        document.getElementById('achievements-btn').addEventListener('click', () => {
            this.showAchievements();
        });

        document.getElementById('close-achievements-btn').addEventListener('click', () => {
            this.hideAchievements();
        });

        // Filter and sort controls
        document.getElementById('category-filter').addEventListener('change', (e) => {
            this.currentCategory = e.target.value;
            this.renderAchievements();
        });

        document.getElementById('sort-filter').addEventListener('change', (e) => {
            this.sortBy = e.target.value;
            this.renderAchievements();
        });

        // Listen for achievement updates
        this.eventSystem.on('achievement_unlocked', () => {
            this.renderAchievements();
            this.updateStats();
        });

        // Update UI when game state changes
        this.eventSystem.on('state_changed', () => {
            this.renderAchievements();
        });
    }

    showAchievements() {
        document.getElementById('achievements-ui').style.display = 'block';
        this.renderAchievements();
        this.updateStats();
    }

    hideAchievements() {
        document.getElementById('achievements-ui').style.display = 'none';
    }

    renderAchievements() {
        const grid = document.getElementById('achievements-grid');
        const achievements = this.getFilteredAndSortedAchievements();
        
        grid.innerHTML = '';

        achievements.forEach(achievement => {
            const card = this.createAchievementCard(achievement);
            grid.appendChild(card);
        });

        this.updateStats();
    }

    getFilteredAndSortedAchievements() {
        let achievements = Object.values(this.achievementSystem.achievements);

        // Filter by category
        if (this.currentCategory !== 'all') {
            achievements = achievements.filter(a => a.category === this.currentCategory);
        }

        // Sort achievements
        achievements.sort((a, b) => {
            switch (this.sortBy) {
                case 'progress':
                    if (a.unlocked !== b.unlocked) {
                        return b.unlocked - a.unlocked; // Unlocked first
                    }
                    return b.progress - a.progress; // Higher progress first
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'category':
                    if (a.category !== b.category) {
                        return a.category.localeCompare(b.category);
                    }
                    return a.name.localeCompare(b.name);
                case 'unlocked':
                    if (a.unlocked !== b.unlocked) {
                        return b.unlocked - a.unlocked;
                    }
                    return b.progress - a.progress;
                default:
                    return 0;
            }
        });

        return achievements;
    }

    createAchievementCard(achievement) {
        const card = document.createElement('div');
        card.className = `achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`;
        
        const progressPercent = Math.round(achievement.progress);
        const isCloseToUnlock = !achievement.unlocked && progressPercent >= 50;
        
        if (isCloseToUnlock) {
            card.classList.add('close-to-unlock');
        }

        card.innerHTML = `
            <div class="achievement-icon">
                ${achievement.unlocked ? '🏆' : this.getCategoryIcon(achievement.category)}
            </div>
            <div class="achievement-info">
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-description">${achievement.description}</div>
                <div class="achievement-category">${this.formatCategory(achievement.category)}</div>
                <div class="achievement-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progressPercent}%"></div>
                    </div>
                    <div class="progress-text">${progressPercent}%</div>
                </div>
                <div class="achievement-requirement">
                    ${this.formatRequirement(achievement)}
                </div>
                <div class="achievement-reward">
                    <span class="reward-label">Reward:</span>
                    <span class="reward-value">${this.formatReward(achievement.reward)}</span>
                </div>
            </div>
            ${achievement.unlocked ? '<div class="achievement-checkmark">✓</div>' : ''}
        `;

        return card;
    }

    getCategoryIcon(category) {
        const icons = {
            combat: '⚔️',
            collection: '📦',
            crafting: '🔨',
            exploration: '🗺️',
            progression: '📈',
            challenges: '🎯',
            special: '⭐'
        };
        return icons[category] || '🏅';
    }

    formatCategory(category) {
        return category.charAt(0).toUpperCase() + category.slice(1);
    }

    formatRequirement(achievement) {
        const { stat, value, operator = 'greater_than_or_equal' } = achievement.requirement;
        const currentValue = this.achievementSystem.trackedStats[stat];
        
        let requirementText = '';
        switch (operator) {
            case 'greater_than_or_equal':
                requirementText = `${currentValue.toLocaleString()} / ${value.toLocaleString()}`;
                break;
            case 'less_than':
                if (currentValue === Infinity) {
                    requirementText = `Not yet achieved`;
                } else {
                    requirementText = `Best: ${currentValue.toFixed(1)}s (need < ${value}s)`;
                }
                break;
            case 'equal':
                requirementText = achievement.unlocked ? 'Completed!' : 'Not yet achieved';
                break;
        }
        
        return requirementText;
    }

    formatReward(reward) {
        switch (reward.type) {
            case 'experience':
                return `${reward.amount} XP`;
            case 'materials':
                return `${reward.amount} Materials`;
            case 'prestige_points':
                return `${reward.amount} Prestige Points`;
            case 'equipment':
                return `${this.formatItemName(reward.item)}`;
            default:
                return 'Unknown Reward';
        }
    }

    formatItemName(itemId) {
        return itemId.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    updateStats() {
        const totalAchievements = Object.keys(this.achievementSystem.achievements).length;
        const unlockedAchievements = this.achievementSystem.getUnlockedAchievements().length;
        const completionPercent = this.achievementSystem.getCompletionPercentage();

        document.getElementById('completion-percent').textContent = completionPercent;
        document.getElementById('unlocked-count').textContent = unlockedAchievements;
        document.getElementById('total-count').textContent = totalAchievements;

        // Update pending rewards count (achievements that are unlocked but rewards might not be claimed)
        const pendingCount = this.getPendingRewardsCount();
        document.getElementById('pending-rewards-count').textContent = pendingCount;
    }

    getPendingRewardsCount() {
        // For now, this is just the count of recently unlocked achievements
        // In a more complex system, this could track unclaimed rewards
        return this.achievementSystem.getUnlockedAchievements().length;
    }

    // Public method to update progress display
    updateProgress() {
        this.renderAchievements();
    }
}