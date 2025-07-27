/**
 * Material Manager - Core material system with rarity and drop mechanics
 * @module MaterialManager
 */

export class MaterialManager {
    constructor(stateManager, eventSystem, stageManager = null) {
        this.stateManager = stateManager;
        this.eventSystem = eventSystem;
        this.stageManager = stageManager;
        
        this.MATERIAL_RARITY = {
            COMMON: 'common',
            UNCOMMON: 'uncommon', 
            RARE: 'rare',
            EPIC: 'epic',
            LEGENDARY: 'legendary'
        };
        
        this.RARITY_COLORS = {
            common: '#9ca3af',     // Gray
            uncommon: '#10b981',   // Green
            rare: '#3b82f6',       // Blue
            epic: '#8b5cf6',       // Purple
            legendary: '#f59e0b'   // Orange
        };
        
        this.RARITY_DROP_RATES = {
            common: 0.60,      // 60%
            uncommon: 0.25,    // 25%
            rare: 0.10,        // 10%
            epic: 0.04,        // 4%
            legendary: 0.01    // 1%
        };
        
        this.initializeMaterials();
        this.setupEventListeners();
    }
    
    /**
     * Initialize material definitions
     */
    initializeMaterials() {
        this.materialDefinitions = {
            // Common materials
            wood: {
                id: 'wood',
                name: 'Wood',
                description: 'Basic crafting material from forest creatures',
                rarity: this.MATERIAL_RARITY.COMMON,
                stackSize: 99,
                value: 1
            },
            stone: {
                id: 'stone',
                name: 'Stone',
                description: 'Sturdy material for basic equipment',
                rarity: this.MATERIAL_RARITY.COMMON,
                stackSize: 99,
                value: 1
            },
            cloth: {
                id: 'cloth',
                name: 'Cloth',
                description: 'Soft material for basic armor',
                rarity: this.MATERIAL_RARITY.COMMON,
                stackSize: 99,
                value: 1
            },
            
            // Uncommon materials
            iron_ore: {
                id: 'iron_ore',
                name: 'Iron Ore',
                description: 'Solid metal ore for sturdy equipment',
                rarity: this.MATERIAL_RARITY.UNCOMMON,
                stackSize: 50,
                value: 3
            },
            leather: {
                id: 'leather',
                name: 'Leather',
                description: 'Durable material from beast hide',
                rarity: this.MATERIAL_RARITY.UNCOMMON,
                stackSize: 50,
                value: 3
            },
            
            // Rare materials
            silver_ore: {
                id: 'silver_ore',
                name: 'Silver Ore',
                description: 'Precious metal with magical properties',
                rarity: this.MATERIAL_RARITY.RARE,
                stackSize: 25,
                value: 8
            },
            magic_crystal: {
                id: 'magic_crystal',
                name: 'Magic Crystal',
                description: 'Crystallized magical energy',
                rarity: this.MATERIAL_RARITY.RARE,
                stackSize: 25,
                value: 10
            },
            
            // Epic materials
            gold_ore: {
                id: 'gold_ore',
                name: 'Gold Ore',
                description: 'Valuable metal ore with enhanced properties',
                rarity: this.MATERIAL_RARITY.EPIC,
                stackSize: 10,
                value: 20
            },
            enchanted_gem: {
                id: 'enchanted_gem',
                name: 'Enchanted Gem',
                description: 'Gem infused with powerful magic',
                rarity: this.MATERIAL_RARITY.EPIC,
                stackSize: 10,
                value: 25
            },
            
            // Legendary materials
            mythril_ore: {
                id: 'mythril_ore',
                name: 'Mythril Ore',
                description: 'Legendary metal of incredible strength',
                rarity: this.MATERIAL_RARITY.LEGENDARY,
                stackSize: 5,
                value: 50
            },
            dragons_scale: {
                id: 'dragons_scale',
                name: 'Dragon Scale',
                description: 'Indestructible scale from ancient dragons',
                rarity: this.MATERIAL_RARITY.LEGENDARY,
                stackSize: 5,
                value: 75
            }
        };
    }
    
    /**
     * Setup event listeners for material-related events
     */
    setupEventListeners() {
        // Listen for combat victory to award materials
        this.eventSystem.on('combat_victory', (data) => {
            this.awardPostCombatMaterials(data.enemy);
        });
        
        // Listen for material collection requests
        this.eventSystem.on('collect_material', (data) => {
            this.collectMaterial(data.materialId, data.quantity);
        });
    }
    
    /**
     * Award materials after combat victory
     * @param {Object} enemy - Defeated enemy data
     */
    awardPostCombatMaterials(enemy) {
        const materials = this.calculateMaterialDrops(enemy);
        
        materials.forEach(drop => {
            this.addMaterial(drop.materialId, drop.quantity);
            
            // Emit material collected event for UI feedback and achievements
            this.eventSystem.emit('material_collected', {
                materialId: drop.materialId,
                quantity: drop.quantity,
                amount: drop.quantity, // For achievement tracking
                rarity: this.getMaterialRarity(drop.materialId),
                type: drop.materialId
            });
        });
        
        console.log('📦 Materials awarded:', materials);
    }
    
    /**
     * Calculate material drops based on enemy and RNG
     * @param {Object} enemy - Enemy that was defeated
     * @returns {Array} Array of material drops
     */
    calculateMaterialDrops(enemy) {
        const drops = [];
        const baseDropCount = Math.floor(Math.random() * 3) + 1; // 1-3 materials
        
        // Apply stage multiplier if available
        const stageMultiplier = this.stageManager ? this.stageManager.getStageMaterialMultiplier() : 1.0;
        
        // Apply prestige material drop multiplier
        const state = this.stateManager.getState();
        const prestigeMultiplier = 1 + ((state.prestige?.upgrades?.materialDrops || 0) * 0.2);
        
        const totalMultiplier = stageMultiplier * prestigeMultiplier;
        const adjustedDropCount = Math.ceil(baseDropCount * totalMultiplier);
        
        for (let i = 0; i < adjustedDropCount; i++) {
            const rarity = this.rollMaterialRarity();
            const materialId = this.selectMaterialByRarity(rarity, enemy);
            const quantity = this.calculateMaterialQuantity(rarity);
            
            if (materialId) {
                drops.push({ materialId, quantity });
            }
        }
        
        return drops;
    }
    
    /**
     * Roll for material rarity based on drop rates
     * @returns {string} Material rarity
     */
    rollMaterialRarity() {
        const roll = Math.random();
        let cumulative = 0;
        
        // Get prestige bonuses for luck
        const state = this.stateManager.getState();
        const luckBonus = (state.prestige?.upgrades?.luckBonus || 0) * 0.1;
        
        // Apply luck bonus to higher rarity chances
        const modifiedRates = {
            common: this.RARITY_DROP_RATES.common,
            uncommon: this.RARITY_DROP_RATES.uncommon,
            rare: this.RARITY_DROP_RATES.rare + luckBonus * 0.3,
            epic: this.RARITY_DROP_RATES.epic + luckBonus * 0.2,
            legendary: this.RARITY_DROP_RATES.legendary + luckBonus * 0.1
        };
        
        // Normalize rates to ensure they add up to 1.0
        const totalRate = Object.values(modifiedRates).reduce((sum, rate) => sum + rate, 0);
        if (totalRate > 1.0) {
            const excess = totalRate - 1.0;
            modifiedRates.common = Math.max(0.1, modifiedRates.common - excess);
        }
        
        for (const [rarity, rate] of Object.entries(modifiedRates)) {
            cumulative += rate;
            if (roll <= cumulative) {
                return rarity;
            }
        }
        
        return this.MATERIAL_RARITY.COMMON;
    }
    
    /**
     * Select a material of specific rarity appropriate for the enemy
     * @param {string} rarity - Target rarity
     * @param {Object} enemy - Enemy context for material selection
     * @returns {string|null} Material ID
     */
    selectMaterialByRarity(rarity, enemy) {
        const materialsOfRarity = Object.values(this.materialDefinitions)
            .filter(mat => mat.rarity === rarity);
            
        if (materialsOfRarity.length === 0) {
            return null;
        }
        
        // For now, randomly select from available materials of that rarity
        // Later this could be influenced by enemy type/stage
        const randomIndex = Math.floor(Math.random() * materialsOfRarity.length);
        return materialsOfRarity[randomIndex].id;
    }
    
    /**
     * Calculate material quantity based on rarity
     * @param {string} rarity - Material rarity
     * @returns {number} Quantity to award
     */
    calculateMaterialQuantity(rarity) {
        const baseQuantity = {
            common: Math.floor(Math.random() * 5) + 1,     // 1-5
            uncommon: Math.floor(Math.random() * 3) + 1,   // 1-3
            rare: Math.floor(Math.random() * 2) + 1,       // 1-2
            epic: 1,                                       // Always 1
            legendary: 1                                   // Always 1
        };
        
        return baseQuantity[rarity] || 1;
    }
    
    /**
     * Add material to player inventory
     * @param {string} materialId - Material to add
     * @param {number} quantity - Amount to add
     */
    addMaterial(materialId, quantity) {
        const currentState = this.stateManager.getState();
        const materials = currentState.materials || {};
        
        if (!materials[materialId]) {
            materials[materialId] = 0;
        }
        
        materials[materialId] += quantity;
        
        this.stateManager.updateState({ materials });
        
        // Update prestige progress (if prestige system exists)
        this.eventSystem.emit('material_collected_progress', { quantity });
        
        console.log(`Added ${quantity}x ${materialId} (Total: ${materials[materialId]})`);
    }
    
    /**
     * Remove material from player inventory
     * @param {string} materialId - Material to remove
     * @param {number} quantity - Amount to remove
     * @returns {boolean} Success/failure
     */
    removeMaterial(materialId, quantity) {
        const currentState = this.stateManager.getState();
        const materials = currentState.materials || {};
        
        if (!materials[materialId] || materials[materialId] < quantity) {
            return false; // Not enough materials
        }
        
        materials[materialId] -= quantity;
        
        if (materials[materialId] <= 0) {
            delete materials[materialId];
        }
        
        this.stateManager.updateState({ materials });
        return true;
    }
    
    /**
     * Get material count in inventory
     * @param {string} materialId - Material to check
     * @returns {number} Current count
     */
    getMaterialCount(materialId) {
        const currentState = this.stateManager.getState();
        const materials = currentState.materials || {};
        return materials[materialId] || 0;
    }
    
    /**
     * Get material definition
     * @param {string} materialId - Material ID
     * @returns {Object|null} Material definition
     */
    getMaterialDefinition(materialId) {
        return this.materialDefinitions[materialId] || null;
    }
    
    /**
     * Get material rarity
     * @param {string} materialId - Material ID
     * @returns {string} Material rarity
     */
    getMaterialRarity(materialId) {
        const definition = this.getMaterialDefinition(materialId);
        return definition ? definition.rarity : this.MATERIAL_RARITY.COMMON;
    }
    
    /**
     * Get all materials in inventory
     * @returns {Object} All materials with counts
     */
    getAllMaterials() {
        const currentState = this.stateManager.getState();
        return currentState.materials || {};
    }
    
    /**
     * Get materials grouped by rarity
     * @returns {Object} Materials grouped by rarity
     */
    getMaterialsByRarity() {
        const allMaterials = this.getAllMaterials();
        const grouped = {};
        
        for (const [materialId, count] of Object.entries(allMaterials)) {
            const definition = this.getMaterialDefinition(materialId);
            if (definition) {
                const rarity = definition.rarity;
                if (!grouped[rarity]) {
                    grouped[rarity] = [];
                }
                grouped[rarity].push({
                    id: materialId,
                    count: count,
                    definition: definition
                });
            }
        }
        
        return grouped;
    }
    
    /**
     * Calculate total inventory value
     * @returns {number} Total value of all materials
     */
    calculateTotalValue() {
        const allMaterials = this.getAllMaterials();
        let totalValue = 0;
        
        for (const [materialId, count] of Object.entries(allMaterials)) {
            const definition = this.getMaterialDefinition(materialId);
            if (definition) {
                totalValue += definition.value * count;
            }
        }
        
        return totalValue;
    }
}