/**
 * Daily Challenges UI Manager - Handles daily challenges interface
 * @module DailyChallengesUI
 */

class DailyChallengesUI {
    constructor(dailyChallenges, eventSystem) {
        this.dailyChallenges = dailyChallenges;
        this.eventSystem = eventSystem;
        
        // DOM elements
        this.challengesUI = document.getElementById('challenges-ui');
        this.challengesBtn = document.getElementById('challenges-btn');
        this.closeChallengesBtn = document.getElementById('close-challenges-btn');
        this.challengesContainer = document.getElementById('challenges-container');
        this.challengeStreak = document.getElementById('challenge-streak');
        this.totalChallengesCompleted = document.getElementById('total-challenges-completed');
        this.challengesCompletedToday = document.getElementById('challenges-completed-today');
        
        this.bindEventListeners();
        this.updateChallengeStats();
        this.renderChallenges();
        
        console.log('📅 Daily Challenges UI initialized');
    }
    
    /**
     * Bind event listeners
     */
    bindEventListeners() {
        // UI Controls
        this.challengesBtn.addEventListener('click', () => this.showChallengesUI());
        this.closeChallengesBtn.addEventListener('click', () => this.hideChallengesUI());
        
        // Game events
        this.eventSystem.on('challengeCompleted', (data) => {
            this.onChallengeCompleted(data);
        });
        
        this.eventSystem.on('stateLoaded', () => {
            this.updateChallengeStats();
            this.renderChallenges();
        });
        
        // Update UI when challenges progress
        this.eventSystem.on('combatVictory', () => this.updateChallengesDisplay());
        this.eventSystem.on('material_collected', () => this.updateChallengesDisplay());
        this.eventSystem.on('equipment_crafted', () => this.updateChallengesDisplay());
    }
    
    /**
     * Show challenges UI
     */
    showChallengesUI() {
        this.challengesUI.style.display = 'block';
        this.updateChallengeStats();
        this.renderChallenges();
    }
    
    /**
     * Hide challenges UI
     */
    hideChallengesUI() {
        this.challengesUI.style.display = 'none';
    }
    
    /**
     * Update challenge statistics display
     */
    updateChallengeStats() {
        const stats = this.dailyChallenges.getChallengeStats();
        
        this.challengeStreak.textContent = stats.streak;
        this.totalChallengesCompleted.textContent = stats.totalCompleted;
        this.challengesCompletedToday.textContent = stats.completedToday;
    }
    
    /**
     * Render all current challenges
     */
    renderChallenges() {
        const challenges = this.dailyChallenges.getCurrentChallenges();
        this.challengesContainer.innerHTML = '';
        
        challenges.forEach(challenge => {
            const challengeElement = this.createChallengeElement(challenge);
            this.challengesContainer.appendChild(challengeElement);
        });
    }
    
    /**
     * Create a challenge element
     */
    createChallengeElement(challenge) {
        const challengeDiv = document.createElement('div');
        challengeDiv.className = 'challenge-item';
        challengeDiv.dataset.challengeId = challenge.id;
        
        const progressPercentage = Math.min((challenge.progress / challenge.target) * 100, 100);
        const isCompleted = challenge.completed;
        
        challengeDiv.innerHTML = `
            <div class="challenge-header">
                <h5 class="challenge-name ${isCompleted ? 'completed' : ''}">${challenge.name}</h5>
                <span class="challenge-status">${isCompleted ? '✅' : '⏳'}</span>
            </div>
            <div class="challenge-description">${challenge.description}</div>
            <div class="challenge-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progressPercentage}%"></div>
                </div>
                <span class="progress-text">${challenge.progress}/${challenge.target}</span>
            </div>
            <div class="challenge-reward">
                <span class="reward-text">Reward: ${challenge.rewardAmount} ${this.formatRewardType(challenge.rewardType)}</span>
            </div>
        `;
        
        if (isCompleted) {
            challengeDiv.classList.add('completed');
        }
        
        return challengeDiv;
    }
    
    /**
     * Format reward type for display
     */
    formatRewardType(rewardType) {
        const rewardTypeMap = {
            'materials': 'Materials',
            'exp': 'Experience',
            'equipment': 'Equipment',
            'prestigePoints': 'Prestige Points'
        };
        
        return rewardTypeMap[rewardType] || rewardType;
    }
    
    /**
     * Update challenges display (refresh progress)
     */
    updateChallengesDisplay() {
        const challenges = this.dailyChallenges.getCurrentChallenges();
        
        challenges.forEach(challenge => {
            const challengeElement = this.challengesContainer.querySelector(`[data-challenge-id="${challenge.id}"]`);
            if (challengeElement) {
                // Update progress bar
                const progressFill = challengeElement.querySelector('.progress-fill');
                const progressText = challengeElement.querySelector('.progress-text');
                
                const progressPercentage = Math.min((challenge.progress / challenge.target) * 100, 100);
                progressFill.style.width = `${progressPercentage}%`;
                progressText.textContent = `${challenge.progress}/${challenge.target}`;
                
                // Update completion status
                if (challenge.completed && !challengeElement.classList.contains('completed')) {
                    challengeElement.classList.add('completed');
                    const challengeName = challengeElement.querySelector('.challenge-name');
                    const challengeStatus = challengeElement.querySelector('.challenge-status');
                    
                    challengeName.classList.add('completed');
                    challengeStatus.textContent = '✅';
                }
            }
        });
        
        // Update stats
        this.updateChallengeStats();
    }
    
    /**
     * Handle challenge completion
     */
    onChallengeCompleted(data) {
        const { challenge, reward } = data;
        
        // Update display
        this.updateChallengesDisplay();
        
        // Show completion notification
        this.showChallengeCompletionNotification(challenge, reward);
    }
    
    /**
     * Show challenge completion notification
     */
    showChallengeCompletionNotification(challenge, reward) {
        // Get next available position from game engine to prevent overlap
        const position = window.gameEngine ? window.gameEngine.getNextFeedbackPosition() : { top: 50, left: 50 };
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'challenge-notification';
        notification.style.top = `${position.top}%`;
        notification.style.left = `${position.left}%`;
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-title">🎉 Challenge Completed!</div>
                <div class="notification-challenge">${challenge.name}</div>
                <div class="notification-reward">+${reward.amount} ${this.formatRewardType(reward.type)}</div>
            </div>
        `;
        
        // Add to DOM
        document.body.appendChild(notification);
        
        // Register with game engine feedback system
        if (window.gameEngine) {
            window.gameEngine.registerFeedback(notification, 4000);
        }
        
        // Animate in
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Remove after 4 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }
}

export default DailyChallengesUI;