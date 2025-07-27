/**
 * Boss UI - User interface for boss encounters and management
 * Phase 8 Implementation: Boss System & Special Events
 */

class BossUI {
    constructor(bossManager, eventEmitter, stageManager, combatManager) {
        this.bossManager = bossManager;
        this.eventEmitter = eventEmitter;
        this.stageManager = stageManager;
        this.combatManager = combatManager;
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
            // Create a boss enemy object that works with the combat manager
            const bossEnemy = this.createBossEnemyForCombat(boss, stageId);
            
            // Close boss UI and start combat with the boss
            this.closeBossUI();
            
            // Start combat using the existing combat manager
            this.combatManager.startCombat(bossEnemy);
            
            console.log(`👑 Started boss encounter: ${boss.name}`);
        }
    }

    createBossEnemyForCombat(boss, stageId) {
        // Create an enemy object compatible with the combat manager
        return {
            name: boss.name,
            level: boss.level,
            hp: boss.currentHp,
            maxHp: boss.maxHp,
            damage: boss.damage,
            defense: boss.defense,
            isBoss: true,
            bossId: boss.id,
            stageId: stageId,
            phase: 0,
            abilities: boss.abilities,
            damageMultiplier: boss.damageMultiplier,
            description: `Level ${boss.level} Boss`,
            
            // Boss-specific properties
            phases: this.bossManager.bosses.get(stageId).phases,
            currentPhase: this.bossManager.bossPhase
        };
    }

    onBossEncounterStart(data) {
        // Boss encounter started, main combat system will handle it
        this.showNotification(`👑 Boss Battle: ${data.boss.name}!`, 'boss-encounter');
    }

    onBossPhaseChange(data) {
        // Show phase change notification
        this.showNotification(`👑 ${data.boss.name} entered ${data.phaseName}!`, 'boss-phase');
    }

    onBossDamaged(data) {
        // Boss took damage - no specific UI updates needed as main combat handles it
    }

    onBossDefeated(data) {
        // Boss defeated - refresh boss display to show new status
        if (this.isUIOpen) {
            this.updateBossDisplay();
        }
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