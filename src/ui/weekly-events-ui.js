/**
 * Weekly Events UI Manager - Handles weekly events interface and interactions
 * @module WeeklyEventsUI
 */

class WeeklyEventsUI {
    constructor(weeklyEvents, eventSystem) {
        this.weeklyEvents = weeklyEvents;
        this.eventSystem = eventSystem;
        
        this.isUIVisible = false;
        this.createUI();
        this.setupEventListeners();
    }
    
    /**
     * Create weekly events UI elements
     */
    createUI() {
        // Create weekly events UI container
        const weeklyEventsUI = document.createElement('div');
        weeklyEventsUI.id = 'weekly-events-ui';
        weeklyEventsUI.style.display = 'none';
        weeklyEventsUI.innerHTML = `
            <div class="weekly-events-content">
                <div class="weekly-events-header">
                    <h3>🎉 Weekly Events</h3>
                    <button id="close-weekly-events-btn" class="close-btn">×</button>
                </div>
                
                <div class="current-event-section">
                    <h4>Current Event</h4>
                    <div id="current-event-info">
                        <div id="event-not-active" class="no-event">
                            No active event this week
                        </div>
                        <div id="current-event-details" style="display: none;">
                            <div class="event-header">
                                <span id="event-icon" class="event-icon">🎯</span>
                                <div class="event-info">
                                    <h5 id="event-name">Event Name</h5>
                                    <p id="event-description">Event description</p>
                                    <div class="event-meta">
                                        <span id="event-difficulty" class="difficulty-badge">NORMAL</span>
                                        <span id="event-time-left" class="time-remaining">6 days remaining</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="event-objectives">
                                <h6>Objectives</h6>
                                <div id="objectives-list"></div>
                            </div>
                            
                            <div class="event-rewards">
                                <h6>Rewards Earned</h6>
                                <div id="rewards-list">No rewards yet</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="event-leaderboard-section">
                    <h4>🏆 Leaderboard</h4>
                    <div id="event-leaderboard">
                        <div class="leaderboard-entry">
                            <span class="rank">#1</span>
                            <span class="player">You</span>
                            <span class="score">0</span>
                        </div>
                    </div>
                </div>
                
                <div class="event-history-section">
                    <h4>📜 Event History</h4>
                    <div id="event-history">
                        <div class="no-history">No completed events yet</div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('ui-overlay').appendChild(weeklyEventsUI);
        
        // Add weekly events button to HUD
        this.addWeeklyEventsButton();
    }
    
    /**
     * Add weekly events button to the HUD
     */
    addWeeklyEventsButton() {
        const hud = document.getElementById('hud');
        const weeklyEventsBtn = document.createElement('button');
        weeklyEventsBtn.id = 'weekly-events-btn';
        weeklyEventsBtn.innerHTML = '🎉 Events';
        weeklyEventsBtn.className = 'ui-button';
        weeklyEventsBtn.onclick = () => this.toggleUI();
        
        // Add event indicator for active events
        const eventIndicator = document.createElement('span');
        eventIndicator.id = 'event-indicator';
        eventIndicator.className = 'event-indicator';
        eventIndicator.style.display = 'none';
        weeklyEventsBtn.appendChild(eventIndicator);
        
        hud.appendChild(weeklyEventsBtn);
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Close button
        document.getElementById('close-weekly-events-btn').onclick = () => this.hideUI();
        
        // Event system listeners
        this.eventSystem.on('weekly-event-started', (data) => {
            this.updateEventDisplay();
            this.showEventNotification(data.event, 'started');
        });
        
        this.eventSystem.on('weekly-event-completed', (data) => {
            this.updateEventDisplay();
            this.showEventNotification(data.event, 'completed');
        });
        
        this.eventSystem.on('treasure-found', (data) => {
            this.showTreasureNotification(data);
        });
        
        this.eventSystem.on('event-bonus-applied', (data) => {
            this.showBonusNotification(data);
        });
        
        // Update display when progress changes
        const progressEvents = ['combat-victory', 'material-collected', 'item-crafted', 'boss-defeated'];
        progressEvents.forEach(eventType => {
            this.eventSystem.on(eventType, () => {
                setTimeout(() => this.updateEventDisplay(), 100);
            });
        });
    }
    
    /**
     * Toggle weekly events UI visibility
     */
    toggleUI() {
        if (this.isUIVisible) {
            this.hideUI();
        } else {
            this.showUI();
        }
    }
    
    /**
     * Show weekly events UI
     */
    showUI() {
        this.updateEventDisplay();
        document.getElementById('weekly-events-ui').style.display = 'block';
        this.isUIVisible = true;
    }
    
    /**
     * Hide weekly events UI
     */
    hideUI() {
        document.getElementById('weekly-events-ui').style.display = 'none';
        this.isUIVisible = false;
    }
    
    /**
     * Update the entire event display
     */
    updateEventDisplay() {
        this.updateCurrentEvent();
        this.updateLeaderboard();
        this.updateEventHistory();
        this.updateEventIndicator();
    }
    
    /**
     * Update current event information
     */
    updateCurrentEvent() {
        const currentEvent = this.weeklyEvents.getCurrentEvent();
        const eventProgress = this.weeklyEvents.getEventProgress();
        
        const notActiveDiv = document.getElementById('event-not-active');
        const eventDetailsDiv = document.getElementById('current-event-details');
        
        if (!currentEvent) {
            notActiveDiv.style.display = 'block';
            eventDetailsDiv.style.display = 'none';
            return;
        }
        
        notActiveDiv.style.display = 'none';
        eventDetailsDiv.style.display = 'block';
        
        // Update event header
        document.getElementById('event-icon').textContent = currentEvent.icon;
        document.getElementById('event-name').textContent = currentEvent.name;
        document.getElementById('event-description').textContent = currentEvent.description;
        
        // Update difficulty badge
        const difficultyBadge = document.getElementById('event-difficulty');
        difficultyBadge.textContent = currentEvent.difficulty;
        difficultyBadge.className = `difficulty-badge difficulty-${currentEvent.difficulty.toLowerCase()}`;
        
        // Update time remaining
        const timeLeft = this.calculateTimeRemaining(currentEvent.endDate);
        document.getElementById('event-time-left').textContent = timeLeft;
        
        // Update objectives
        this.updateObjectives(currentEvent.objectives, eventProgress);
        
        // Update rewards
        this.updateRewards(eventProgress.rewardsEarned || []);
    }
    
    /**
     * Update objectives display
     */
    updateObjectives(objectives, progress) {
        const objectivesList = document.getElementById('objectives-list');
        objectivesList.innerHTML = '';
        
        Object.entries(objectives).forEach(([key, target]) => {
            const current = progress[key] || 0;
            const completed = current >= target;
            const percentage = Math.min((current / target) * 100, 100);
            
            const objectiveDiv = document.createElement('div');
            objectiveDiv.className = `objective ${completed ? 'completed' : ''}`;
            objectiveDiv.innerHTML = `
                <div class="objective-info">
                    <span class="objective-name">${this.formatObjectiveName(key)}</span>
                    <span class="objective-progress">${current}/${target}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${percentage}%"></div>
                </div>
                ${completed ? '<span class="checkmark">✓</span>' : ''}
            `;
            
            objectivesList.appendChild(objectiveDiv);
        });
    }
    
    /**
     * Update rewards display
     */
    updateRewards(rewards) {
        const rewardsList = document.getElementById('rewards-list');
        
        if (rewards.length === 0) {
            rewardsList.innerHTML = '<div class="no-rewards">No rewards earned yet</div>';
            return;
        }
        
        rewardsList.innerHTML = '';
        rewards.forEach(rewardEntry => {
            const rewardDiv = document.createElement('div');
            rewardDiv.className = 'reward-entry';
            rewardDiv.innerHTML = `
                <span class="reward-icon">${this.getRewardIcon(rewardEntry.reward.type)}</span>
                <span class="reward-text">${this.formatReward(rewardEntry.reward)}</span>
                <span class="reward-source">${this.formatObjectiveName(rewardEntry.objective)}</span>
            `;
            rewardsList.appendChild(rewardDiv);
        });
    }
    
    /**
     * Update leaderboard display
     */
    updateLeaderboard() {
        const leaderboard = this.weeklyEvents.getLeaderboard();
        const leaderboardDiv = document.getElementById('event-leaderboard');
        
        leaderboardDiv.innerHTML = '';
        
        if (leaderboard.length === 0) {
            leaderboardDiv.innerHTML = '<div class="no-leaderboard">No participants yet</div>';
            return;
        }
        
        leaderboard.forEach((entry, index) => {
            const entryDiv = document.createElement('div');
            entryDiv.className = 'leaderboard-entry';
            if (entry.playerId === 'local_player') {
                entryDiv.classList.add('current-player');
            }
            
            entryDiv.innerHTML = `
                <span class="rank">#${index + 1}</span>
                <span class="player">${entry.playerId === 'local_player' ? 'You' : 'Player'}</span>
                <span class="score">${entry.score.toLocaleString()}</span>
            `;
            
            leaderboardDiv.appendChild(entryDiv);
        });
    }
    
    /**
     * Update event history display
     */
    updateEventHistory() {
        const history = this.weeklyEvents.getEventHistory();
        const historyDiv = document.getElementById('event-history');
        
        if (history.length === 0) {
            historyDiv.innerHTML = '<div class="no-history">No completed events yet</div>';
            return;
        }
        
        historyDiv.innerHTML = '';
        
        // Show last 5 events
        history.slice(-5).reverse().forEach(event => {
            const eventDiv = document.createElement('div');
            eventDiv.className = 'history-entry';
            eventDiv.innerHTML = `
                <div class="history-event">
                    <span class="history-icon">${event.icon}</span>
                    <div class="history-info">
                        <div class="history-name">${event.name}</div>
                        <div class="history-completion">
                            ${event.finalProgress?.eventCompleted ? '✓ Completed' : '⏳ Participated'}
                        </div>
                    </div>
                    <div class="history-score">${event.finalProgress?.totalScore || 0}</div>
                </div>
            `;
            historyDiv.appendChild(eventDiv);
        });
    }
    
    /**
     * Update event indicator on button
     */
    updateEventIndicator() {
        const indicator = document.getElementById('event-indicator');
        const currentEvent = this.weeklyEvents.getCurrentEvent();
        
        if (currentEvent) {
            indicator.style.display = 'block';
            indicator.textContent = '!';
            indicator.title = `Active: ${currentEvent.name}`;
        } else {
            indicator.style.display = 'none';
        }
    }
    
    /**
     * Calculate time remaining until event ends
     */
    calculateTimeRemaining(endDate) {
        const now = new Date();
        const end = new Date(endDate);
        const diff = end - now;
        
        if (diff <= 0) return 'Expired';
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        if (days > 0) return `${days} day${days !== 1 ? 's' : ''} remaining`;
        if (hours > 0) return `${hours} hour${hours !== 1 ? 's' : ''} remaining`;
        return 'Less than 1 hour remaining';
    }
    
    /**
     * Format objective name for display
     */
    formatObjectiveName(key) {
        const names = {
            combatVictories: 'Combat Victories',
            materialsCollected: 'Materials Collected',
            itemsCrafted: 'Items Crafted',
            bossesDefeated: 'Bosses Defeated',
            treasuresFound: 'Treasures Found',
            fastCombats: 'Fast Combats',
            eliteBossesDefeated: 'Elite Bosses Defeated'
        };
        return names[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    }
    
    /**
     * Get icon for reward type
     */
    getRewardIcon(type) {
        const icons = {
            experience: '📚',
            materials: '💎',
            equipment: '⚔️',
            prestigePoints: '🌟'
        };
        return icons[type] || '🎁';
    }
    
    /**
     * Format reward for display
     */
    formatReward(reward) {
        switch (reward.type) {
            case 'experience':
                return `${reward.amount.toLocaleString()} XP`;
            case 'materials':
                return `${reward.amount} ${reward.rarity || 'Common'} Materials`;
            case 'equipment':
                return `${reward.amount} ${reward.quality || 'Common'} Equipment`;
            case 'prestigePoints':
                return `${reward.amount} Prestige Points`;
            default:
                return `${reward.amount} ${reward.type}`;
        }
    }
    
    /**
     * Show event notification
     */
    showEventNotification(event, type) {
        const message = type === 'started' 
            ? `🎉 ${event.name} has started!`
            : `🏆 ${event.name} completed!`;
            
        this.showNotification(message, type === 'completed' ? 'success' : 'info', 5000);
    }
    
    /**
     * Show treasure found notification
     */
    showTreasureNotification(data) {
        this.showNotification(data.message, 'treasure', 3000);
    }
    
    /**
     * Show bonus applied notification
     */
    showBonusNotification(data) {
        const message = `${data.bonus}x ${data.type} bonus applied!`;
        this.showNotification(message, 'bonus', 2000);
    }
    
    /**
     * Show notification to player
     */
    showNotification(message, type = 'info', duration = 3000) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `event-notification ${type}`;
        notification.textContent = message;
        
        // Position and style
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            border-left: 4px solid ${this.getNotificationColor(type)};
            z-index: 10000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // Animate out and remove
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }
    
    /**
     * Get notification color based on type
     */
    getNotificationColor(type) {
        const colors = {
            info: '#3498db',
            success: '#27ae60',
            treasure: '#f39c12',
            bonus: '#9b59b6'
        };
        return colors[type] || '#3498db';
    }
}

export default WeeklyEventsUI;