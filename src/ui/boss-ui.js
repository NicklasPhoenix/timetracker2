/**
 * Boss UI - User interface for boss encounters and management
 * Phase 8 Implementation: Boss System & Special Events
 */

class BossUI {
    constructor(bossManager, eventEmitter, stageManager) {
        this.bossManager = bossManager;
        this.eventEmitter = eventEmitter;
        this.stageManager = stageManager;
        this.isUIOpen = false;
        
        this.initializeUI();
        this.bindEvents();
        
        console.log('👑 Boss UI initialized');
    }

    initializeUI() {
        // Create boss UI container
        const bossUI = document.createElement('div');
        bossUI.id = 'boss-ui';
        bossUI.style.display = 'none';
        bossUI.innerHTML = `
            <h3>👑 Boss Encounters</h3>
            <div id="boss-info">
                <h4>Boss Overview</h4>
                <div id="boss-summary"></div>
            </div>
            <div id="boss-list">
                <h4>Stage Bosses</h4>
                <div id="boss-selection"></div>
            </div>
            <div id="current-boss-fight" style="display: none;">
                <h4>Boss Battle</h4>
                <div id="boss-fight-info"></div>
                <div id="boss-combat-actions">
                    <button id="boss-attack-btn">Attack Boss</button>
                    <button id="boss-defend-btn">Defend</button>
                    <button id="boss-flee-btn">Flee</button>
                </div>
            </div>
            <button id="close-boss-btn">Close</button>
        `;

        // Insert into the game UI
        const uiOverlay = document.getElementById('ui-overlay');
        if (uiOverlay) {
            uiOverlay.appendChild(bossUI);
        }

        // Create boss button in game controls
        const gameControls = document.getElementById('game-controls');
        if (gameControls) {
            const bossButton = document.createElement('button');
            bossButton.id = 'boss-btn';
            bossButton.style.marginTop = '5px';
            bossButton.textContent = '👑 Bosses';
            gameControls.appendChild(bossButton);
        }
    }

    bindEvents() {
        // Boss UI toggle
        const bossBtn = document.getElementById('boss-btn');
        const closeBossBtn = document.getElementById('close-boss-btn');
        
        if (bossBtn) {
            bossBtn.addEventListener('click', () => this.toggleBossUI());
        }
        
        if (closeBossBtn) {
            closeBossBtn.addEventListener('click', () => this.closeBossUI());
        }

        // Boss combat actions
        const bossAttackBtn = document.getElementById('boss-attack-btn');
        const bossDefendBtn = document.getElementById('boss-defend-btn');
        const bossFleeBtn = document.getElementById('boss-flee-btn');

        if (bossAttackBtn) {
            bossAttackBtn.addEventListener('click', () => this.attackBoss());
        }

        if (bossDefendBtn) {
            bossDefendBtn.addEventListener('click', () => this.defendFromBoss());
        }

        if (bossFleeBtn) {
            bossFleeBtn.addEventListener('click', () => this.fleeBoss());
        }

        // Listen for boss events
        this.eventEmitter.on('bossEncounterStart', (data) => this.onBossEncounterStart(data));
        this.eventEmitter.on('bossPhaseChange', (data) => this.onBossPhaseChange(data));
        this.eventEmitter.on('bossDamaged', (data) => this.onBossDamaged(data));
        this.eventEmitter.on('bossDefeated', (data) => this.onBossDefeated(data));
        this.eventEmitter.on('stateLoaded', () => this.updateBossDisplay());
    }

    toggleBossUI() {
        const bossUI = document.getElementById('boss-ui');
        if (!bossUI) return;

        if (this.isUIOpen) {
            this.closeBossUI();
        } else {
            this.openBossUI();
        }
    }

    openBossUI() {
        const bossUI = document.getElementById('boss-ui');
        if (!bossUI) return;

        bossUI.style.display = 'block';
        this.isUIOpen = true;
        this.updateBossDisplay();
        
        console.log('👑 Opened boss UI');
    }

    closeBossUI() {
        const bossUI = document.getElementById('boss-ui');
        if (!bossUI) return;

        bossUI.style.display = 'none';
        this.isUIOpen = false;
        
        console.log('👑 Closed boss UI');
    }

    updateBossDisplay() {
        this.updateBossSummary();
        this.updateBossSelection();
    }

    updateBossSummary() {
        const summary = document.getElementById('boss-summary');
        if (!summary) return;

        const bossesStatus = this.bossManager.getAllBossesStatus();
        const stageProgress = this.stageManager.getStageProgress();
        
        let totalBosses = 0;
        let defeatedBosses = 0;
        let availableBosses = 0;

        // Update boss unlock status based on stage progress
        for (const [stageId, status] of Object.entries(bossesStatus)) {
            totalBosses++;
            const stageNum = parseInt(stageId);
            const victories = stageProgress[stageNum]?.victories || 0;
            
            status.unlocked = this.bossManager.isBossUnlocked(stageNum, victories);
            
            if (status.defeated) defeatedBosses++;
            if (status.unlocked && !status.defeated) availableBosses++;
        }

        summary.innerHTML = `
            <div class="boss-stats">
                <div>Total Bosses: ${totalBosses}</div>
                <div>Defeated: ${defeatedBosses}</div>
                <div>Available: ${availableBosses}</div>
                <div>Locked: ${totalBosses - defeatedBosses - availableBosses}</div>
            </div>
        `;
    }

    updateBossSelection() {
        const selection = document.getElementById('boss-selection');
        if (!selection) return;

        const bossesStatus = this.bossManager.getAllBossesStatus();
        const stageProgress = this.stageManager.getStageProgress();
        
        let html = '';

        for (const [stageId, status] of Object.entries(bossesStatus)) {
            const stageNum = parseInt(stageId);
            const victories = stageProgress[stageNum]?.victories || 0;
            const boss = status.boss;
            
            // Update unlock status
            status.unlocked = this.bossManager.isBossUnlocked(stageNum, victories);
            
            const unlocked = status.unlocked;
            const defeated = status.defeated;
            
            let buttonClass = 'boss-button';
            let buttonText = 'Fight Boss';
            let disabled = false;
            
            if (!unlocked) {
                buttonClass += ' boss-locked';
                buttonText = `Locked (${victories}/${boss.unlockRequirement.victories} victories)`;
                disabled = true;
            } else if (defeated) {
                buttonClass += ' boss-defeated';
                buttonText = 'Boss Defeated ✓';
                disabled = false; // Allow refighting defeated bosses
            }

            html += `
                <div class="boss-entry">
                    <div class="boss-header">
                        <h5>Stage ${stageId}: ${boss.name}</h5>
                        <span class="boss-level">Level ${boss.level}</span>
                    </div>
                    <div class="boss-description">${boss.description}</div>
                    <div class="boss-stats">
                        <span>HP: ${boss.baseHp}</span>
                        <span>Damage: ${boss.baseDamage}</span>
                        <span>Defense: ${boss.defense}</span>
                        <span>Phases: ${boss.phases.length}</span>
                    </div>
                    <div class="boss-unlock-req">
                        Requires: ${boss.unlockRequirement.victories} victories in Stage ${boss.unlockRequirement.stage}
                    </div>
                    <button class="${buttonClass}" 
                            onclick="window.gameEngine.bossUI.startBossEncounter(${stageId})"
                            ${disabled ? 'disabled' : ''}>
                        ${buttonText}
                    </button>
                </div>
            `;
        }

        selection.innerHTML = html;
    }

    startBossEncounter(stageId) {
        // Check if boss is unlocked
        const stageProgress = this.stageManager.getStageProgress();
        const victories = stageProgress[stageId]?.victories || 0;
        
        if (!this.bossManager.isBossUnlocked(stageId, victories)) {
            alert(`Boss not unlocked! You need ${this.bossManager.getBoss(stageId).unlockRequirement.victories} victories in Stage ${stageId}.`);
            return;
        }

        // Get player level for boss scaling
        const gameState = this.bossManager.stateManager.getState();
        const playerLevel = gameState.player?.level || 1;

        // Start boss encounter
        const boss = this.bossManager.startBossEncounter(stageId, playerLevel);
        
        if (boss) {
            this.showBossFight();
            console.log(`👑 Started boss encounter: ${boss.name}`);
        }
    }

    showBossFight() {
        const bossInfo = document.getElementById('boss-info');
        const bossList = document.getElementById('boss-list');
        const bossFight = document.getElementById('current-boss-fight');
        
        if (bossInfo) bossInfo.style.display = 'none';
        if (bossList) bossList.style.display = 'none';
        if (bossFight) bossFight.style.display = 'block';
        
        this.updateBossFightDisplay();
    }

    hideBossFight() {
        const bossInfo = document.getElementById('boss-info');
        const bossList = document.getElementById('boss-list');
        const bossFight = document.getElementById('current-boss-fight');
        
        if (bossInfo) bossInfo.style.display = 'block';
        if (bossList) bossList.style.display = 'block';
        if (bossFight) bossFight.style.display = 'none';
        
        this.updateBossDisplay();
    }

    updateBossFightDisplay() {
        const fightInfo = document.getElementById('boss-fight-info');
        if (!fightInfo || !this.bossManager.currentBoss) return;

        const boss = this.bossManager.currentBoss;
        const hpPercentage = (boss.currentHp / boss.maxHp) * 100;
        const currentPhase = this.bossManager.bossPhase;
        const phases = this.bossManager.bosses.get(this.bossManager.getCurrentBossStage()).phases;

        fightInfo.innerHTML = `
            <div class="boss-fight-header">
                <h4>${boss.name}</h4>
                <div class="boss-phase">Phase ${currentPhase + 1}: ${phases[currentPhase].name}</div>
            </div>
            <div class="boss-health-bar">
                <div class="health-bar-bg">
                    <div class="health-bar-fill boss-health" style="width: ${hpPercentage}%"></div>
                </div>
                <div class="health-text">${boss.currentHp} / ${boss.maxHp} HP</div>
            </div>
            <div class="boss-abilities">
                <strong>Current Abilities:</strong> ${boss.abilities.join(', ')}
            </div>
        `;
    }

    attackBoss() {
        if (!this.bossManager.currentBoss) return;

        // Get player stats
        const gameState = this.bossManager.stateManager.getState();
        const player = gameState.player;
        
        if (!player) return;

        // Calculate player damage (similar to combat manager)
        const baseDamage = player.attack || 10;
        const result = this.bossManager.damageBoss(baseDamage);
        
        if (result.defeated) {
            this.hideBossFight();
            return;
        }

        // Boss counter-attack
        const bossAction = this.bossManager.getBossAction();
        const playerDamage = Math.max(1, bossAction.damage - (player.defense || 5));
        
        // Apply damage to player
        const newHp = Math.max(0, player.hp - playerDamage);
        this.bossManager.stateManager.setState({
            player: { ...player, hp: newHp }
        });

        this.updateBossFightDisplay();
        
        // Check if player died
        if (newHp <= 0) {
            alert('You have been defeated by the boss!');
            this.fleeBoss();
        }

        console.log(`⚔️ Player dealt ${baseDamage} damage, Boss ${bossAction.description} for ${playerDamage} damage`);
    }

    defendFromBoss() {
        if (!this.bossManager.currentBoss) return;

        // Get player stats
        const gameState = this.bossManager.stateManager.getState();
        const player = gameState.player;
        
        if (!player) return;

        // Boss attack with reduced damage due to defending
        const bossAction = this.bossManager.getBossAction();
        const reducedDamage = Math.max(1, Math.floor(bossAction.damage * 0.5) - (player.defense || 5));
        
        // Apply reduced damage to player
        const newHp = Math.max(0, player.hp - reducedDamage);
        this.bossManager.stateManager.setState({
            player: { ...player, hp: newHp }
        });

        this.updateBossFightDisplay();
        
        // Check if player died
        if (newHp <= 0) {
            alert('You have been defeated by the boss!');
            this.fleeBoss();
        }

        console.log(`🛡️ Player defended, Boss ${bossAction.description} for ${reducedDamage} damage (reduced)`);
    }

    fleeBoss() {
        this.bossManager.currentBoss = null;
        this.bossManager.bossPhase = 0;
        this.hideBossFight();
        console.log('🏃 Fled from boss encounter');
    }

    onBossEncounterStart(data) {
        if (this.isUIOpen) {
            this.showBossFight();
        }
    }

    onBossPhaseChange(data) {
        if (this.isUIOpen) {
            this.updateBossFightDisplay();
        }
        
        // Show phase change notification
        this.showNotification(`👑 Boss entered ${data.phaseName}!`, 'boss-phase');
    }

    onBossDamaged(data) {
        if (this.isUIOpen) {
            this.updateBossFightDisplay();
        }
    }

    onBossDefeated(data) {
        this.showBossVictory(data);
        this.hideBossFight();
    }

    showBossVictory(data) {
        const rewards = data.rewards;
        let rewardText = `Boss Defeated: ${data.boss.name}!\n\n`;
        rewardText += `Experience: +${rewards.experience}\n`;
        
        if (rewards.materials.length > 0) {
            rewardText += `Materials:\n`;
            rewards.materials.forEach(material => {
                rewardText += `  - ${material.type} x${material.amount}\n`;
            });
        }
        
        if (rewards.equipment.length > 0) {
            rewardText += `Equipment:\n`;
            rewards.equipment.forEach(equipment => {
                rewardText += `  - ${equipment}\n`;
            });
        }

        alert(rewardText);
        
        // Show visual notification
        this.showNotification(`👑 ${data.boss.name} Defeated!`, 'boss-victory');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `boss-notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #2a5d2a;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 10000;
            animation: slideIn 0.5s ease-out;
        `;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.5s ease-out';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 500);
        }, 3000);
    }
}

export default BossUI;