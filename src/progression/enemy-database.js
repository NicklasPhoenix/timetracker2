/**
 * Enemy Database - Definitions for all enemy types across stages
 * @module EnemyDatabase
 */

class EnemyDatabase {
    constructor() {
        this.enemies = this.initializeEnemies();
        console.log('👹 Enemy Database initialized with', Object.keys(this.enemies).length, 'enemy types');
    }
    
    /**
     * Initialize enemy definitions
     * @returns {Object} Enemy configuration database
     */
    initializeEnemies() {
        return {
            // Stage 1 - Forest Outskirts
            forest_goblin: {
                name: 'Forest Goblin',
                description: 'A small, mischievous creature from the forest',
                baseStats: {
                    hp: 25,
                    attack: 6,
                    defense: 2
                },
                aiType: 'aggressive',
                materialDrops: [
                    { type: 'cloth', rarity: 'common', quantity: [1, 3] },
                    { type: 'wood', rarity: 'common', quantity: [1, 2] }
                ],
                expReward: 8,
                levelScaling: {
                    hp: 5,
                    attack: 2,
                    defense: 1
                },
                stage: 1,
                color: '#4a7c59'
            },
            
            wild_rabbit: {
                name: 'Wild Rabbit',
                description: 'A quick and nimble forest creature',
                baseStats: {
                    hp: 15,
                    attack: 4,
                    defense: 1
                },
                aiType: 'defensive',
                materialDrops: [
                    { type: 'leather', rarity: 'common', quantity: [1, 2] },
                    { type: 'cloth', rarity: 'common', quantity: [1, 1] }
                ],
                expReward: 5,
                levelScaling: {
                    hp: 3,
                    attack: 1,
                    defense: 0.5
                },
                stage: 1,
                color: '#8b4513'
            },
            
            // Stage 2 - Dark Forest
            shadow_wolf: {
                name: 'Shadow Wolf',
                description: 'A dark wolf that stalks through the shadows',
                baseStats: {
                    hp: 40,
                    attack: 12,
                    defense: 4
                },
                aiType: 'smart',
                materialDrops: [
                    { type: 'leather', rarity: 'uncommon', quantity: [2, 4] },
                    { type: 'shadow_essence', rarity: 'rare', quantity: [1, 1] },
                    { type: 'wood', rarity: 'common', quantity: [1, 2] }
                ],
                expReward: 15,
                levelScaling: {
                    hp: 8,
                    attack: 3,
                    defense: 1.5
                },
                stage: 2,
                color: '#2c2c54'
            },
            
            corrupted_tree: {
                name: 'Corrupted Tree',
                description: 'An ancient tree twisted by dark magic',
                baseStats: {
                    hp: 60,
                    attack: 8,
                    defense: 8
                },
                aiType: 'defensive',
                materialDrops: [
                    { type: 'wood', rarity: 'uncommon', quantity: [3, 5] },
                    { type: 'corrupted_bark', rarity: 'rare', quantity: [1, 2] },
                    { type: 'shadow_essence', rarity: 'uncommon', quantity: [1, 1] }
                ],
                expReward: 20,
                levelScaling: {
                    hp: 12,
                    attack: 2,
                    defense: 2.5
                },
                stage: 2,
                color: '#1a1a2e'
            },
            
            // Stage 3 - Mountain Pass
            mountain_troll: {
                name: 'Mountain Troll',
                description: 'A massive troll adapted to mountain life',
                baseStats: {
                    hp: 80,
                    attack: 18,
                    defense: 6
                },
                aiType: 'berserker',
                materialDrops: [
                    { type: 'stone', rarity: 'common', quantity: [2, 4] },
                    { type: 'troll_hide', rarity: 'uncommon', quantity: [1, 2] },
                    { type: 'mountain_crystal', rarity: 'rare', quantity: [1, 1] }
                ],
                expReward: 30,
                levelScaling: {
                    hp: 15,
                    attack: 4,
                    defense: 2
                },
                stage: 3,
                color: '#5d4e75'
            },
            
            stone_golem: {
                name: 'Stone Golem',
                description: 'An animated construct of mountain stone',
                baseStats: {
                    hp: 100,
                    attack: 12,
                    defense: 12
                },
                aiType: 'balanced',
                materialDrops: [
                    { type: 'stone', rarity: 'uncommon', quantity: [3, 6] },
                    { type: 'iron_ore', rarity: 'uncommon', quantity: [1, 3] },
                    { type: 'golem_core', rarity: 'epic', quantity: [1, 1] }
                ],
                expReward: 35,
                levelScaling: {
                    hp: 18,
                    attack: 3,
                    defense: 3
                },
                stage: 3,
                color: '#696969'
            },
            
            ice_wolf: {
                name: 'Ice Wolf',
                description: 'A wolf adapted to the cold mountain peaks',
                baseStats: {
                    hp: 50,
                    attack: 16,
                    defense: 4
                },
                aiType: 'aggressive',
                materialDrops: [
                    { type: 'ice_crystal', rarity: 'uncommon', quantity: [1, 2] },
                    { type: 'frost_fur', rarity: 'rare', quantity: [1, 2] },
                    { type: 'leather', rarity: 'common', quantity: [1, 3] }
                ],
                expReward: 25,
                levelScaling: {
                    hp: 10,
                    attack: 4,
                    defense: 1.5
                },
                stage: 3,
                color: '#87ceeb'
            },
            
            // Stage 4 - Volcanic Caves
            fire_elemental: {
                name: 'Fire Elemental',
                description: 'A being of pure flame and heat',
                baseStats: {
                    hp: 70,
                    attack: 25,
                    defense: 3
                },
                aiType: 'aggressive',
                materialDrops: [
                    { type: 'fire_essence', rarity: 'rare', quantity: [1, 2] },
                    { type: 'molten_rock', rarity: 'uncommon', quantity: [2, 3] },
                    { type: 'flame_crystal', rarity: 'epic', quantity: [1, 1] }
                ],
                expReward: 45,
                levelScaling: {
                    hp: 12,
                    attack: 6,
                    defense: 1
                },
                stage: 4,
                color: '#ff4500'
            },
            
            lava_lizard: {
                name: 'Lava Lizard',
                description: 'A reptile that thrives in volcanic heat',
                baseStats: {
                    hp: 60,
                    attack: 20,
                    defense: 5
                },
                aiType: 'smart',
                materialDrops: [
                    { type: 'dragon_scale', rarity: 'rare', quantity: [1, 2] },
                    { type: 'fire_essence', rarity: 'uncommon', quantity: [1, 2] },
                    { type: 'molten_rock', rarity: 'common', quantity: [1, 3] }
                ],
                expReward: 40,
                levelScaling: {
                    hp: 11,
                    attack: 5,
                    defense: 1.5
                },
                stage: 4,
                color: '#dc143c'
            },
            
            flame_imp: {
                name: 'Flame Imp',
                description: 'A mischievous fire demon',
                baseStats: {
                    hp: 45,
                    attack: 22,
                    defense: 2
                },
                aiType: 'smart',
                materialDrops: [
                    { type: 'demon_horn', rarity: 'rare', quantity: [1, 1] },
                    { type: 'fire_essence', rarity: 'uncommon', quantity: [1, 2] },
                    { type: 'sulfur', rarity: 'common', quantity: [2, 4] }
                ],
                expReward: 38,
                levelScaling: {
                    hp: 9,
                    attack: 5,
                    defense: 0.5
                },
                stage: 4,
                color: '#b22222'
            },
            
            // Stage 5 - Crystal Sanctum
            crystal_guardian: {
                name: 'Crystal Guardian',
                description: 'An ancient protector of the crystal sanctum',
                baseStats: {
                    hp: 120,
                    attack: 30,
                    defense: 15
                },
                aiType: 'healer',
                materialDrops: [
                    { type: 'pure_crystal', rarity: 'epic', quantity: [1, 2] },
                    { type: 'guardian_essence', rarity: 'legendary', quantity: [1, 1] },
                    { type: 'magic_crystal', rarity: 'rare', quantity: [2, 3] }
                ],
                expReward: 60,
                levelScaling: {
                    hp: 20,
                    attack: 7,
                    defense: 4
                },
                stage: 5,
                color: '#9370db'
            },
            
            magic_wisp: {
                name: 'Magic Wisp',
                description: 'A floating orb of concentrated magical energy',
                baseStats: {
                    hp: 40,
                    attack: 35,
                    defense: 2
                },
                aiType: 'smart',
                materialDrops: [
                    { type: 'wisp_essence', rarity: 'rare', quantity: [1, 2] },
                    { type: 'magic_crystal', rarity: 'uncommon', quantity: [1, 3] },
                    { type: 'pure_energy', rarity: 'epic', quantity: [1, 1] }
                ],
                expReward: 50,
                levelScaling: {
                    hp: 8,
                    attack: 8,
                    defense: 0.5
                },
                stage: 5,
                color: '#40e0d0'
            },
            
            arcane_sentinel: {
                name: 'Arcane Sentinel',
                description: 'A magical construct bound to protect the sanctum',
                baseStats: {
                    hp: 150,
                    attack: 25,
                    defense: 20
                },
                aiType: 'balanced',
                materialDrops: [
                    { type: 'arcane_metal', rarity: 'epic', quantity: [1, 2] },
                    { type: 'sentinel_core', rarity: 'legendary', quantity: [1, 1] },
                    { type: 'pure_crystal', rarity: 'rare', quantity: [1, 2] }
                ],
                expReward: 70,
                levelScaling: {
                    hp: 25,
                    attack: 6,
                    defense: 5
                },
                stage: 5,
                color: '#483d8b'
            }
        };
    }
    
    /**
     * Get enemy configuration by type
     * @param {string} enemyType - Enemy type identifier
     * @returns {Object|null} Enemy configuration
     */
    getEnemyConfig(enemyType) {
        return this.enemies[enemyType] || null;
    }
    
    /**
     * Create enemy instance with level scaling
     * @param {string} enemyType - Enemy type identifier
     * @param {number} level - Enemy level
     * @returns {Object|null} Scaled enemy instance
     */
    createEnemy(enemyType, level = 1) {
        const config = this.getEnemyConfig(enemyType);
        if (!config) {
            console.warn(`👹 Enemy type '${enemyType}' not found`);
            return null;
        }
        
        // Calculate scaled stats
        const scaledStats = this.calculateScaledStats(config, level);
        
        return {
            type: enemyType,
            name: config.name,
            description: config.description,
            level,
            hp: scaledStats.hp,
            maxHp: scaledStats.hp,
            attack: scaledStats.attack,
            defense: scaledStats.defense,
            aiType: config.aiType,
            materialDrops: config.materialDrops,
            expReward: this.calculateScaledExp(config.expReward, level),
            stage: config.stage,
            color: config.color
        };
    }
    
    /**
     * Calculate scaled stats for enemy level
     * @param {Object} config - Enemy configuration
     * @param {number} level - Target level
     * @returns {Object} Scaled stats
     */
    calculateScaledStats(config, level) {
        const levelBonus = level - 1;
        const scaling = config.levelScaling;
        
        return {
            hp: Math.floor(config.baseStats.hp + (scaling.hp * levelBonus)),
            attack: Math.floor(config.baseStats.attack + (scaling.attack * levelBonus)),
            defense: Math.floor(config.baseStats.defense + (scaling.defense * levelBonus))
        };
    }
    
    /**
     * Calculate scaled experience reward
     * @param {number} baseExp - Base experience reward
     * @param {number} level - Enemy level
     * @returns {number} Scaled experience
     */
    calculateScaledExp(baseExp, level) {
        return Math.floor(baseExp * (1 + (level - 1) * 0.2));
    }
    
    /**
     * Get enemies for a specific stage
     * @param {number} stageId - Stage identifier
     * @returns {Array} Array of enemy types for the stage
     */
    getEnemiesForStage(stageId) {
        return Object.entries(this.enemies)
            .filter(([_, config]) => config.stage === stageId)
            .map(([type, _]) => type);
    }
    
    /**
     * Get all enemy types
     * @returns {Array} Array of all enemy type identifiers
     */
    getAllEnemyTypes() {
        return Object.keys(this.enemies);
    }
    
    /**
     * Get enemy material drops with rarity and quantity
     * @param {string} enemyType - Enemy type identifier
     * @param {number} level - Enemy level (affects drop rates)
     * @returns {Array} Array of material drop configurations
     */
    getEnemyDrops(enemyType, level = 1) {
        const config = this.getEnemyConfig(enemyType);
        if (!config) return [];
        
        // Level affects drop quantity slightly
        const levelMultiplier = 1 + ((level - 1) * 0.1);
        
        return config.materialDrops.map(drop => ({
            ...drop,
            quantity: drop.quantity.map(q => Math.ceil(q * levelMultiplier))
        }));
    }
    
    /**
     * Get enemy statistics for debugging
     * @returns {Object} Enemy database statistics
     */
    getStatistics() {
        const enemyTypes = Object.keys(this.enemies);
        const stageDistribution = {};
        
        enemyTypes.forEach(type => {
            const stage = this.enemies[type].stage;
            stageDistribution[stage] = (stageDistribution[stage] || 0) + 1;
        });
        
        return {
            totalEnemies: enemyTypes.length,
            stageDistribution,
            enemyTypes
        };
    }
}

export { EnemyDatabase };