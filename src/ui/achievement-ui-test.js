/**
 * Simple Achievement UI Test - Minimal implementation for debugging
 */

export class AchievementUI {
    constructor(achievementSystem, eventSystem) {
        this.achievementSystem = achievementSystem;
        this.eventSystem = eventSystem;
        
        console.log('🏆 Achievement UI Test initialized');
        
        // Add a simple button
        const gameControls = document.getElementById('game-controls');
        if (gameControls) {
            const achievementsBtn = document.createElement('button');
            achievementsBtn.id = 'achievements-btn';
            achievementsBtn.textContent = '🏆 Achievements (Test)';
            achievementsBtn.style.marginTop = '5px';
            achievementsBtn.addEventListener('click', () => {
                console.log('Achievement button clicked');
                alert('Achievement system loaded successfully!');
            });
            gameControls.appendChild(achievementsBtn);
        }
    }
}