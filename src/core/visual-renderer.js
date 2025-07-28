/**
 * Visual Renderer - Enhanced canvas rendering with animations and effects
 * Phase 10 Implementation: Visual Enhancement & Game Polish
 */

class VisualRenderer {
    constructor(canvas, ctx, stateManager, eventSystem) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.stateManager = stateManager;
        this.eventSystem = eventSystem;
        
        // Animation system
        this.animations = [];
        this.particles = [];
        
        // Visual assets
        this.colors = {
            background: {
                forest: ['#1a4f3a', '#2d5a4d', '#3f6b5e'],
                mountain: ['#4a4a4a', '#5a5a5a', '#6a6a6a'],
                desert: ['#daa520', '#cd853f', '#8b4513'],
                ice: ['#87ceeb', '#b0e0e6', '#e0f6ff'],
                crystal: ['#9370db', '#8a2be2', '#7b68ee']
            },
            player: '#4CAF50',
            enemy: '#f44336',
            damage: '#ffeb3b',
            healing: '#4CAF50',
            critical: '#ff9800',
            ui: '#2196F3'
        };
        
        // Stage backgrounds
        this.stageBackgrounds = {
            1: 'forest',
            2: 'mountain', 
            3: 'desert',
            4: 'ice',
            5: 'crystal'
        };
        
        // Combat animations
        this.combatAnimations = {
            playerAttack: { duration: 500, progress: 0 },
            enemyAttack: { duration: 500, progress: 0 },
            damage: { duration: 800, progress: 0 }
        };
        
        console.log('🎨 Visual Renderer initialized');
    }
    
    /**
     * Main render method
     */
    render() {
        this.clearCanvas();
        this.drawBackground();
        
        const state = this.stateManager.getState();
        
        if (state.game && state.game.isInCombat) {
            this.renderCombatScene(state);
        } else {
            this.renderExplorationScene(state);
        }
        
        this.renderParticles();
        this.renderUI(state);
        this.updateAnimations();
    }
    
    /**
     * Clear canvas with gradient background
     */
    clearCanvas() {
        // Create gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    /**
     * Draw stage-appropriate background
     */
    drawBackground() {
        const state = this.stateManager.getState();
        const currentStage = state.game?.currentStage || 1;
        const backgroundType = this.stageBackgrounds[currentStage] || 'forest';
        const colors = this.colors.background[backgroundType];
        
        // Draw layered background for depth
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Background layer 1 (furthest)
        this.ctx.fillStyle = colors[0];
        this.ctx.fillRect(0, centerY + 100, this.canvas.width, this.canvas.height - centerY - 100);
        
        // Background layer 2 (middle)
        this.ctx.fillStyle = colors[1];
        this.ctx.fillRect(0, centerY + 150, this.canvas.width, this.canvas.height - centerY - 150);
        
        // Background layer 3 (foreground)
        this.ctx.fillStyle = colors[2];
        this.ctx.fillRect(0, centerY + 200, this.canvas.width, this.canvas.height - centerY - 200);
        
        // Add stage-specific background elements
        this.drawStageElements(backgroundType, currentStage);
    }
    
    /**
     * Draw stage-specific visual elements
     */
    drawStageElements(backgroundType, stage) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        switch (backgroundType) {
            case 'forest':
                this.drawTrees(centerX, centerY);
                break;
            case 'mountain':
                this.drawMountains(centerX, centerY);
                break;
            case 'desert':
                this.drawDunes(centerX, centerY);
                break;
            case 'ice':
                this.drawIce(centerX, centerY);
                break;
            case 'crystal':
                this.drawCrystals(centerX, centerY);
                break;
        }
    }
    
    /**
     * Draw forest trees
     */
    drawTrees(centerX, centerY) {
        this.ctx.fillStyle = '#2d5016';
        
        // Draw simple tree shapes
        for (let i = 0; i < 5; i++) {
            const x = (centerX / 6) * (i + 1) + Math.sin(Date.now() / 2000 + i) * 10;
            const y = centerY + 120 + Math.cos(Date.now() / 3000 + i) * 5;
            
            // Tree trunk
            this.ctx.fillRect(x - 5, y, 10, 40);
            
            // Tree foliage
            this.ctx.beginPath();
            this.ctx.arc(x, y - 10, 25, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    /**
     * Draw mountain peaks
     */
    drawMountains(centerX, centerY) {
        this.ctx.fillStyle = '#666666';
        this.ctx.beginPath();
        this.ctx.moveTo(0, centerY + 100);
        
        for (let i = 0; i <= this.canvas.width; i += 50) {
            const height = Math.sin(i / 100) * 80 + 80;
            this.ctx.lineTo(i, centerY + 100 - height);
        }
        
        this.ctx.lineTo(this.canvas.width, centerY + 200);
        this.ctx.lineTo(0, centerY + 200);
        this.ctx.fill();
    }
    
    /**
     * Draw desert dunes
     */
    drawDunes(centerX, centerY) {
        this.ctx.fillStyle = '#daa520';
        this.ctx.beginPath();
        this.ctx.moveTo(0, centerY + 150);
        
        for (let i = 0; i <= this.canvas.width; i += 30) {
            const height = Math.sin(i / 80 + Date.now() / 5000) * 20 + 20;
            this.ctx.lineTo(i, centerY + 150 - height);
        }
        
        this.ctx.lineTo(this.canvas.width, centerY + 200);
        this.ctx.lineTo(0, centerY + 200);
        this.ctx.fill();
    }
    
    /**
     * Draw ice formations
     */
    drawIce(centerX, centerY) {
        this.ctx.fillStyle = '#87ceeb';
        
        // Draw ice spikes
        for (let i = 0; i < 8; i++) {
            const x = (this.canvas.width / 9) * (i + 1);
            const height = 30 + Math.sin(i + Date.now() / 1000) * 10;
            
            this.ctx.beginPath();
            this.ctx.moveTo(x - 10, centerY + 180);
            this.ctx.lineTo(x, centerY + 180 - height);
            this.ctx.lineTo(x + 10, centerY + 180);
            this.ctx.fill();
        }
    }
    
    /**
     * Draw crystal formations
     */
    drawCrystals(centerX, centerY) {
        this.ctx.fillStyle = '#9370db';
        
        // Draw floating crystals
        for (let i = 0; i < 6; i++) {
            const x = (this.canvas.width / 7) * (i + 1);
            const y = centerY + 120 + Math.sin(Date.now() / 1000 + i) * 15;
            const size = 20 + Math.cos(Date.now() / 1200 + i) * 5;
            
            this.ctx.save();
            this.ctx.translate(x, y);
            this.ctx.rotate(Date.now() / 2000 + i);
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, -size);
            this.ctx.lineTo(size * 0.7, -size * 0.3);
            this.ctx.lineTo(size * 0.7, size * 0.3);
            this.ctx.lineTo(0, size);
            this.ctx.lineTo(-size * 0.7, size * 0.3);
            this.ctx.lineTo(-size * 0.7, -size * 0.3);
            this.ctx.fill();
            
            this.ctx.restore();
        }
    }
    
    /**
     * Render combat scene with characters and effects
     */
    renderCombatScene(state) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Draw player character
        this.drawPlayer(centerX - 150, centerY, state.player);
        
        // Draw enemy
        if (state.combat && state.combat.enemy) {
            this.drawEnemy(centerX + 150, centerY, state.combat.enemy);
        }
        
        // Draw combat effects
        this.drawCombatEffects(centerX, centerY);
        
        // Draw combat UI elements
        this.drawCombatUI(state);
    }
    
    /**
     * Draw player character
     */
    drawPlayer(x, y, playerData) {
        // Player shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.ellipse(x, y + 40, 25, 8, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Player body
        this.ctx.fillStyle = this.colors.player;
        this.ctx.beginPath();
        this.ctx.arc(x, y, 20, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Player health bar
        this.drawHealthBar(x - 30, y - 40, 60, 8, playerData?.hp || 100, playerData?.maxHp || 100, this.colors.player);
        
        // Weapon effect
        if (this.combatAnimations.playerAttack.progress > 0) {
            this.drawWeaponEffect(x + 15, y, this.combatAnimations.playerAttack.progress);
        }
    }
    
    /**
     * Draw enemy character
     */
    drawEnemy(x, y, enemyData) {
        // Enemy shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.ellipse(x, y + 40, 25, 8, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Enemy body (varies by type)
        const enemyColor = this.getEnemyColor(enemyData.type);
        this.ctx.fillStyle = enemyColor;
        this.ctx.beginPath();
        this.ctx.arc(x, y, 25, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Enemy type indicator
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(this.getEnemyEmoji(enemyData.type), x, y + 5);
        
        // Enemy name
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '12px Arial';
        this.ctx.fillText(enemyData.name, x, y - 50);
        
        // Enemy health bar
        this.drawHealthBar(x - 35, y - 40, 70, 8, enemyData.hp, enemyData.maxHp, this.colors.enemy);
        
        // Attack effect
        if (this.combatAnimations.enemyAttack.progress > 0) {
            this.drawAttackEffect(x - 15, y, this.combatAnimations.enemyAttack.progress);
        }
    }
    
    /**
     * Get enemy color based on type
     */
    getEnemyColor(type) {
        const colorMap = {
            wild_rabbit: '#8D6E63',
            forest_goblin: '#4CAF50',
            mountain_wolf: '#607D8B',
            desert_scorpion: '#FF9800',
            ice_elemental: '#03A9F4',
            crystal_golem: '#9C27B0'
        };
        return colorMap[type] || this.colors.enemy;
    }
    
    /**
     * Get enemy emoji based on type
     */
    getEnemyEmoji(type) {
        const emojiMap = {
            wild_rabbit: '🐰',
            forest_goblin: '👹',
            mountain_wolf: '🐺',
            desert_scorpion: '🦂',
            ice_elemental: '❄️',
            crystal_golem: '💎'
        };
        return emojiMap[type] || '👹';
    }
    
    /**
     * Draw health bar
     */
    drawHealthBar(x, y, width, height, currentHp, maxHp, color) {
        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(x, y, width, height);
        
        // Health fill
        const healthPercent = Math.max(0, currentHp / maxHp);
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x + 1, y + 1, (width - 2) * healthPercent, height - 2);
        
        // Health text
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${currentHp}/${maxHp}`, x + width / 2, y + height + 12);
    }
    
    /**
     * Draw weapon effect during player attack
     */
    drawWeaponEffect(x, y, progress) {
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(progress * Math.PI * 2);
        
        this.ctx.strokeStyle = '#ffeb3b';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 15 + progress * 10, 0, Math.PI * 2);
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    /**
     * Draw attack effect during enemy attack
     */
    drawAttackEffect(x, y, progress) {
        this.ctx.save();
        this.ctx.translate(x, y);
        
        this.ctx.fillStyle = `rgba(255, 0, 0, ${1 - progress})`;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, progress * 30, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    /**
     * Draw combat effects and animations
     */
    drawCombatEffects(centerX, centerY) {
        // Lightning effects for damage
        if (this.combatAnimations.damage.progress > 0) {
            this.drawLightningEffect(centerX, centerY, this.combatAnimations.damage.progress);
        }
    }
    
    /**
     * Draw lightning effect for dramatic damage
     */
    drawLightningEffect(x, y, progress) {
        this.ctx.strokeStyle = `rgba(255, 255, 0, ${1 - progress})`;
        this.ctx.lineWidth = 2 + progress * 3;
        
        // Draw a single central lightning bolt instead of 3
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - 80);
        
        // Create a more realistic single lightning bolt
        for (let j = 0; j < 6; j++) {
            const offsetX = (Math.random() - 0.5) * 30;
            const offsetY = j * 15 + (Math.random() - 0.5) * 8;
            this.ctx.lineTo(x + offsetX, y - 80 + offsetY);
        }
        
        this.ctx.stroke();
        
        // Add a subtle secondary branch occasionally
        if (Math.random() < 0.3) {
            this.ctx.beginPath();
            this.ctx.moveTo(x + (Math.random() - 0.5) * 20, y - 40);
            this.ctx.lineTo(x + (Math.random() - 0.5) * 40, y - 10);
            this.ctx.stroke();
        }
    }
    
    /**
     * Draw combat UI overlays
     */
    drawCombatUI(state) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Combat title
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 28px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 2;
        this.ctx.strokeText('⚔️ COMBAT ⚔️', centerX, 50);
        this.ctx.fillText('⚔️ COMBAT ⚔️', centerX, 50);
        
        // Turn indicator
        if (state.combat?.phase) {
            this.ctx.font = '16px Arial';
            this.ctx.fillStyle = '#ffeb3b';
            const phaseText = state.combat.phase === 'ACTION' ? '🧙 Your Turn' : '👹 Enemy Turn';
            this.ctx.fillText(phaseText, centerX, 80);
        }
    }
    
    /**
     * Render exploration scene
     */
    renderExplorationScene(state) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Draw exploration player
        this.drawPlayer(centerX, centerY + 50, state.player);
        
        // Title with glow effect
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 36px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.strokeStyle = '#4CAF50';
        this.ctx.lineWidth = 2;
        this.ctx.strokeText('Incremental Combat Game', centerX, centerY - 60);
        this.ctx.fillText('Incremental Combat Game', centerX, centerY - 60);
        
        // Subtitle
        this.ctx.font = '18px Arial';
        this.ctx.fillStyle = '#888888';
        this.ctx.fillText('Click anywhere to start combat!', centerX, centerY - 20);
        
        // Stage indicator
        const currentStage = state.game?.currentStage || 1;
        this.ctx.font = '14px Arial';
        this.ctx.fillStyle = '#4CAF50';
        this.ctx.fillText(`Current Stage: ${currentStage}`, centerX, centerY + 120);
    }
    
    /**
     * Render particle effects
     */
    renderParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = particle.alpha;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Update particle
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.alpha -= particle.decay;
            particle.size *= 0.99;
            
            // Remove dead particles
            if (particle.alpha <= 0 || particle.size <= 0.1) {
                this.particles.splice(i, 1);
            }
        }
        
        this.ctx.globalAlpha = 1.0;
    }
    
    /**
     * Render UI overlays
     */
    renderUI(state) {
        // FPS counter with background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(5, 5, 80, 25);
        
        this.ctx.fillStyle = '#00ff00';
        this.ctx.font = '14px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`FPS: ${state.performance?.fps || 60}`, 10, 22);
        
        // Stage indicator in top right
        if (state.game?.currentStage) {
            const stageText = `Stage ${state.game.currentStage}`;
            const textWidth = this.ctx.measureText(stageText).width;
            
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(this.canvas.width - textWidth - 15, 5, textWidth + 10, 25);
            
            this.ctx.fillStyle = '#4CAF50';
            this.ctx.font = '14px Arial';
            this.ctx.textAlign = 'right';
            this.ctx.fillText(stageText, this.canvas.width - 10, 22);
        }
    }
    
    /**
     * Update animation states
     */
    updateAnimations() {
        const deltaTime = 16; // Approximate frame time
        
        // Update combat animations
        for (const [name, animation] of Object.entries(this.combatAnimations)) {
            if (animation.progress > 0) {
                animation.progress = Math.max(0, animation.progress - deltaTime / animation.duration);
            }
        }
    }
    
    /**
     * Trigger combat animation
     */
    triggerAnimation(type, duration = 500) {
        if (this.combatAnimations[type]) {
            this.combatAnimations[type].progress = 1.0;
            this.combatAnimations[type].duration = duration;
        }
    }
    
    /**
     * Create damage particles
     */
    createDamageParticles(x, y, damage, isCritical = false) {
        const particleCount = isCritical ? 15 : 8;
        const color = isCritical ? this.colors.critical : this.colors.damage;
        
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 20,
                y: y + (Math.random() - 0.5) * 20,
                vx: (Math.random() - 0.5) * 4,
                vy: Math.random() * -3 - 1,
                size: Math.random() * 4 + 2,
                alpha: 1.0,
                decay: 0.02,
                color: color
            });
        }
    }
    
    /**
     * Create healing particles
     */
    createHealingParticles(x, y) {
        for (let i = 0; i < 6; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 30,
                y: y + (Math.random() - 0.5) * 30,
                vx: (Math.random() - 0.5) * 2,
                vy: Math.random() * -2 - 0.5,
                size: Math.random() * 3 + 3,
                alpha: 1.0,
                decay: 0.015,
                color: this.colors.healing
            });
        }
    }
}

export { VisualRenderer };