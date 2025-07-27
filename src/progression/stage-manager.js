/**
 * Stage Manager - Handles stage progression and area management
 * @module StageManager
 */

class StageManager {
    constructor(stateManager, eventSystem) {
        this.stateManager = stateManager;
        this.eventSystem = eventSystem;
        
        // Stage configuration
        this.stages = this.initializeStages();
        this.maxStage = this.stages.length;
        
        this.setupEventListeners();
        this.initializeStageState();
        
        console.log('🗺️ Stage Manager initialized with', this.maxStage, 'stages');
    }
    
    /**
     * Initialize stage definitions
     * @returns {Array} Array of stage configurations
     */
    initializeStages() {
        return [
            {
                id: 1,
                name: 'Forest Outskirts',
                description: 'A peaceful woodland area perfect for beginners',
                unlockCondition: { level: 1 },
                enemyPool: ['forest_goblin', 'wild_rabbit'],
                enemyLevelRange: [1, 3],
                materialMultiplier: 1.0,
                expMultiplier: 1.0,
                background: '#2d4a2b',
                theme: 'forest'
            },
            {
                id: 2,
                name: 'Dark Forest',
                description: 'Deeper into the woods where shadows lurk',
                unlockCondition: { level: 3, stage: 1 },
                enemyPool: ['forest_goblin', 'shadow_wolf', 'corrupted_tree'],
                enemyLevelRange: [3, 6],
                materialMultiplier: 1.2,
                expMultiplier: 1.2,
                background: '#1a2f1a',
                theme: 'dark_forest'
            },
            {
                id: 3,
                name: 'Mountain Pass',
                description: 'Rocky terrain with hardy mountain creatures',
                unlockCondition: { level: 6, stage: 2 },
                enemyPool: ['mountain_troll', 'stone_golem', 'ice_wolf'],
                enemyLevelRange: [6, 10],
                materialMultiplier: 1.5,
                expMultiplier: 1.4,
                background: '#4a4a6a',
                theme: 'mountain'
            },
            {
                id: 4,
                name: 'Volcanic Caves',
                description: 'Burning hot caverns filled with fire creatures',
                unlockCondition: { level: 10, stage: 3 },
                enemyPool: ['fire_elemental', 'lava_lizard', 'flame_imp'],
                enemyLevelRange: [10, 15],
                materialMultiplier: 1.8,
                expMultiplier: 1.6,
                background: '#6a2a1a',
                theme: 'volcanic'
            },
            {
                id: 5,
                name: 'Crystal Sanctum',
                description: 'Ancient magical realm with powerful guardians',
                unlockCondition: { level: 15, stage: 4 },
                enemyPool: ['crystal_guardian', 'magic_wisp', 'arcane_sentinel'],
                enemyLevelRange: [15, 20],
                materialMultiplier: 2.0,
                expMultiplier: 1.8,
                background: '#2a1a6a',
                theme: 'crystal'
            }
        ];
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        this.eventSystem.on('combat_victory', (data) => {
            this.checkStageProgression();
        });
        
        this.eventSystem.on('PLAYER_LEVEL_UP', () => {
            this.checkStageUnlocks();
        });
    }
    
    /**
     * Initialize stage state
     */
    initializeStageState() {
        const currentState = this.stateManager.getState();
        
        if (!currentState.stages) {
            this.stateManager.updateState({
                stages: {
                    currentStage: 1,
                    unlockedStages: [1],
                    stageProgress: {},
                    completedStages: []
                }
            });
        }
    }
    
    /**
     * Get current stage configuration
     * @returns {Object} Current stage config
     */
    getCurrentStage() {
        const state = this.stateManager.getState();
        const currentStageId = state.stages?.currentStage || 1;
        return this.stages.find(stage => stage.id === currentStageId) || this.stages[0];
    }
    
    /**
     * Get unlocked stages
     * @returns {Array} Array of unlocked stage IDs
     */
    getUnlockedStages() {
        const state = this.stateManager.getState();
        return state.stages?.unlockedStages || [1];
    }
    
    /**
     * Check if a stage is unlocked
     * @param {number} stageId - Stage ID to check
     * @returns {boolean} Whether stage is unlocked
     */
    isStageUnlocked(stageId) {
        const unlockedStages = this.getUnlockedStages();
        return unlockedStages.includes(stageId);
    }
    
    /**
     * Switch to a different stage
     * @param {number} stageId - Target stage ID
     * @returns {boolean} Whether switch was successful
     */
    switchToStage(stageId) {
        if (!this.isStageUnlocked(stageId)) {
            console.warn(`🗺️ Stage ${stageId} is not unlocked`);
            return false;
        }
        
        const stage = this.stages.find(s => s.id === stageId);
        if (!stage) {
            console.warn(`🗺️ Stage ${stageId} does not exist`);
            return false;
        }
        
        this.stateManager.updateState({
            stages: {
                ...this.stateManager.getStateValue('stages'),
                currentStage: stageId
            }
        });
        
        this.eventSystem.emit('STAGE_CHANGED', {
            previousStage: this.stateManager.getStateValue('stages.currentStage'),
            newStage: stageId,
            stageName: stage.name
        });
        
        console.log(`🗺️ Switched to stage ${stageId}: ${stage.name}`);
        return true;
    }
    
    /**
     * Check for stage progression after combat
     */
    checkStageProgression() {
        const state = this.stateManager.getState();
        const currentStageId = state.stages?.currentStage || 1;
        const stageProgress = state.stages?.stageProgress || {};
        
        // Track victories in current stage
        const currentProgress = stageProgress[currentStageId] || { victories: 0, completed: false };
        currentProgress.victories += 1;
        
        // Check if stage should be completed (e.g., 10 victories)
        const victoriesNeeded = 5 + (currentStageId * 2); // Scaling requirement
        
        if (currentProgress.victories >= victoriesNeeded && !currentProgress.completed) {
            this.completeStage(currentStageId);
            currentProgress.completed = true;
        }
        
        // Update progress
        this.stateManager.updateState({
            stages: {
                ...state.stages,
                stageProgress: {
                    ...stageProgress,
                    [currentStageId]: currentProgress
                }
            }
        });
    }
    
    /**
     * Complete a stage
     * @param {number} stageId - Stage to complete
     */
    completeStage(stageId) {
        const state = this.stateManager.getState();
        const completedStages = state.stages?.completedStages || [];
        
        if (!completedStages.includes(stageId)) {
            completedStages.push(stageId);
            
            this.stateManager.updateState({
                stages: {
                    ...state.stages,
                    completedStages
                }
            });
            
            this.eventSystem.emit('STAGE_COMPLETED', {
                stageId,
                stageName: this.stages.find(s => s.id === stageId)?.name
            });
            
            console.log(`🎉 Stage ${stageId} completed!`);
            
            // Check if next stage should be unlocked
            this.checkStageUnlocks();
        }
    }
    
    /**
     * Check for new stage unlocks
     */
    checkStageUnlocks() {
        const state = this.stateManager.getState();
        const playerLevel = state.player?.level || 1;
        const currentStageId = state.stages?.currentStage || 1;
        const unlockedStages = state.stages?.unlockedStages || [1];
        const completedStages = state.stages?.completedStages || [];
        
        for (const stage of this.stages) {
            if (!unlockedStages.includes(stage.id)) {
                const condition = stage.unlockCondition;
                
                // Check unlock conditions
                const levelMet = playerLevel >= condition.level;
                const stageMet = !condition.stage || completedStages.includes(condition.stage);
                
                if (levelMet && stageMet) {
                    unlockedStages.push(stage.id);
                    
                    this.stateManager.updateState({
                        stages: {
                            ...state.stages,
                            unlockedStages
                        }
                    });
                    
                    this.eventSystem.emit('STAGE_UNLOCKED', {
                        stageId: stage.id,
                        stageName: stage.name,
                        description: stage.description
                    });
                    
                    console.log(`🔓 New stage unlocked: ${stage.name}`);
                }
            }
        }
    }
    
    /**
     * Get enemy configuration for current stage
     * @returns {Object} Enemy configuration
     */
    getStageEnemyConfig() {
        const currentStage = this.getCurrentStage();
        const enemyType = this.selectRandomEnemy(currentStage.enemyPool);
        const enemyLevel = this.calculateEnemyLevel(currentStage.enemyLevelRange);
        
        return {
            type: enemyType,
            level: enemyLevel,
            stage: currentStage.id,
            stageName: currentStage.name
        };
    }
    
    /**
     * Select random enemy from stage pool
     * @param {Array} enemyPool - Array of enemy types
     * @returns {string} Selected enemy type
     */
    selectRandomEnemy(enemyPool) {
        return enemyPool[Math.floor(Math.random() * enemyPool.length)];
    }
    
    /**
     * Calculate enemy level based on stage range
     * @param {Array} levelRange - [min, max] level range
     * @returns {number} Enemy level
     */
    calculateEnemyLevel(levelRange) {
        const [min, max] = levelRange;
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    /**
     * Get stage material multiplier
     * @returns {number} Material drop multiplier
     */
    getStageMaterialMultiplier() {
        const currentStage = this.getCurrentStage();
        return currentStage.materialMultiplier;
    }
    
    /**
     * Get stage experience multiplier
     * @returns {number} Experience gain multiplier
     */
    getStageExpMultiplier() {
        const currentStage = this.getCurrentStage();
        return currentStage.expMultiplier;
    }
    
    /**
     * Get stage visual theme
     * @returns {Object} Visual theme configuration
     */
    getStageTheme() {
        const currentStage = this.getCurrentStage();
        return {
            background: currentStage.background,
            theme: currentStage.theme,
            name: currentStage.name
        };
    }
    
    /**
     * Get stage progress information
     * @param {number} stageId - Stage ID (optional, defaults to current)
     * @returns {Object} Stage progress info
     */
    getStageProgress(stageId = null) {
        const state = this.stateManager.getState();
        const targetStageId = stageId || state.stages?.currentStage || 1;
        const stageProgress = state.stages?.stageProgress || {};
        const progress = stageProgress[targetStageId] || { victories: 0, completed: false };
        
        const victoriesNeeded = 5 + (targetStageId * 2);
        const progressPercent = Math.min((progress.victories / victoriesNeeded) * 100, 100);
        
        return {
            victories: progress.victories,
            victoriesNeeded,
            progressPercent,
            completed: progress.completed
        };
    }
    
    /**
     * Get all stage information for UI
     * @returns {Array} Array of stage info objects
     */
    getAllStageInfo() {
        const unlockedStages = this.getUnlockedStages();
        const state = this.stateManager.getState();
        const currentStageId = state.stages?.currentStage || 1;
        
        return this.stages.map(stage => ({
            ...stage,
            unlocked: unlockedStages.includes(stage.id),
            current: stage.id === currentStageId,
            progress: this.getStageProgress(stage.id)
        }));
    }
    
    /**
     * Get performance stats
     * @returns {Object} Performance statistics
     */
    getPerformanceStats() {
        const state = this.stateManager.getState();
        const stages = state.stages || {};
        
        return {
            currentStage: stages.currentStage || 1,
            unlockedStages: (stages.unlockedStages || []).length,
            completedStages: (stages.completedStages || []).length,
            totalStages: this.maxStage
        };
    }
}

export { StageManager };