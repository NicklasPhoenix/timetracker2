/**
 * Crafting System - Recipe management and crafting mechanics
 * @module CraftingSystem
 */

export class CraftingSystem {
    constructor(stateManager, eventSystem, materialManager, inventoryManager) {
        this.stateManager = stateManager;
        this.eventSystem = eventSystem;
        this.materialManager = materialManager;
        this.inventoryManager = inventoryManager;
        
        this.CRAFTING_CATEGORIES = {
            WEAPONS: 'weapons',
            ARMOR: 'armor',
            ACCESSORIES: 'accessories',
            CONSUMABLES: 'consumables'
        };
        
        this.CRAFTING_DIFFICULTY = {
            SIMPLE: 'simple',      // 95% success rate
            MODERATE: 'moderate',  // 85% success rate
            COMPLEX: 'complex',    // 75% success rate
            MASTER: 'master'       // 60% success rate
        };
        
        this.SUCCESS_RATES = {
            simple: 0.95,
            moderate: 0.85,
            complex: 0.75,
            master: 0.60
        };
        
        this.initializeRecipes();
        this.setupEventListeners();
    }
    
    /**
     * Initialize crafting recipes
     */
    initializeRecipes() {
        this.recipes = {
            // Basic Weapons
            wooden_sword: {
                id: 'wooden_sword',
                name: 'Wooden Sword',
                description: 'A basic sword crafted from wood',
                category: this.CRAFTING_CATEGORIES.WEAPONS,
                difficulty: this.CRAFTING_DIFFICULTY.SIMPLE,
                craftTime: 2000, // 2 seconds
                requirements: {
                    wood: 5,
                    stone: 2
                },
                results: {
                    itemId: 'wooden_sword',
                    quantity: 1,
                    quality: 'normal'
                },
                unlockRequirements: {
                    playerLevel: 1
                }
            },
            
            iron_sword: {
                id: 'iron_sword',
                name: 'Iron Sword',
                description: 'A sturdy iron sword with improved damage',
                category: this.CRAFTING_CATEGORIES.WEAPONS,
                difficulty: this.CRAFTING_DIFFICULTY.MODERATE,
                craftTime: 5000, // 5 seconds
                requirements: {
                    iron_ore: 3,
                    wood: 2,
                    stone: 1
                },
                results: {
                    itemId: 'iron_sword',
                    quantity: 1,
                    quality: 'normal'
                },
                unlockRequirements: {
                    playerLevel: 3,
                    craftedItems: ['wooden_sword']
                }
            },
            
            // Basic Armor
            cloth_armor: {
                id: 'cloth_armor',
                name: 'Cloth Armor',
                description: 'Basic protection made from cloth',
                category: this.CRAFTING_CATEGORIES.ARMOR,
                difficulty: this.CRAFTING_DIFFICULTY.SIMPLE,
                craftTime: 3000, // 3 seconds
                requirements: {
                    cloth: 8,
                    wood: 2
                },
                results: {
                    itemId: 'cloth_armor',
                    quantity: 1,
                    quality: 'normal'
                },
                unlockRequirements: {
                    playerLevel: 1
                }
            },
            
            leather_armor: {
                id: 'leather_armor',
                name: 'Leather Armor',
                description: 'Durable armor crafted from beast hide',
                category: this.CRAFTING_CATEGORIES.ARMOR,
                difficulty: this.CRAFTING_DIFFICULTY.MODERATE,
                craftTime: 4000, // 4 seconds
                requirements: {
                    leather: 5,
                    iron_ore: 2,
                    cloth: 3
                },
                results: {
                    itemId: 'leather_armor',
                    quantity: 1,
                    quality: 'normal'
                },
                unlockRequirements: {
                    playerLevel: 2,
                    craftedItems: ['cloth_armor']
                }
            },
            
            // Accessories
            health_potion: {
                id: 'health_potion',
                name: 'Health Potion',
                description: 'Restores health when consumed',
                category: this.CRAFTING_CATEGORIES.CONSUMABLES,
                difficulty: this.CRAFTING_DIFFICULTY.SIMPLE,
                craftTime: 1500, // 1.5 seconds
                requirements: {
                    cloth: 2,
                    wood: 1
                },
                results: {
                    itemId: 'health_potion',
                    quantity: 3,
                    quality: 'normal'
                },
                unlockRequirements: {
                    playerLevel: 1
                }
            },
            
            // Advanced items
            silver_sword: {
                id: 'silver_sword',
                name: 'Silver Sword',
                description: 'An enchanted silver blade with magical properties',
                category: this.CRAFTING_CATEGORIES.WEAPONS,
                difficulty: this.CRAFTING_DIFFICULTY.COMPLEX,
                craftTime: 8000, // 8 seconds
                requirements: {
                    silver_ore: 4,
                    magic_crystal: 2,
                    iron_ore: 3,
                    wood: 1
                },
                results: {
                    itemId: 'silver_sword',
                    quantity: 1,
                    quality: 'normal'
                },
                unlockRequirements: {
                    playerLevel: 5,
                    craftedItems: ['iron_sword'],
                    materialsCollected: 50
                }
            },
            
            enchanted_armor: {
                id: 'enchanted_armor',
                name: 'Enchanted Armor',
                description: 'Magical armor enhanced with crystalline power',
                category: this.CRAFTING_CATEGORIES.ARMOR,
                difficulty: this.CRAFTING_DIFFICULTY.COMPLEX,
                craftTime: 10000, // 10 seconds
                requirements: {
                    magic_crystal: 3,
                    leather: 6,
                    silver_ore: 2,
                    enchanted_gem: 1
                },
                results: {
                    itemId: 'enchanted_armor',
                    quantity: 1,
                    quality: 'normal'
                },
                unlockRequirements: {
                    playerLevel: 6,
                    craftedItems: ['leather_armor'],
                    materialsCollected: 75
                }
            },
            
            // Master tier items
            legendary_blade: {
                id: 'legendary_blade',
                name: 'Legendary Blade',
                description: 'The ultimate weapon forged from mythril and dragon essence',
                category: this.CRAFTING_CATEGORIES.WEAPONS,
                difficulty: this.CRAFTING_DIFFICULTY.MASTER,
                craftTime: 15000, // 15 seconds
                requirements: {
                    mythril_ore: 2,
                    dragons_scale: 1,
                    enchanted_gem: 3,
                    gold_ore: 5
                },
                results: {
                    itemId: 'legendary_blade',
                    quantity: 1,
                    quality: 'normal'
                },
                unlockRequirements: {
                    playerLevel: 10,
                    craftedItems: ['silver_sword'],
                    materialsCollected: 200
                }
            }
        };
    }
    
    /**
     * Setup event listeners for crafting-related events
     */
    setupEventListeners() {
        // Listen for craft requests
        this.eventSystem.on('craft_item', (data) => {
            this.craftItem(data.recipeId, data.quantity || 1);
        });
        
        // Listen for recipe unlock checks
        this.eventSystem.on('check_recipe_unlocks', () => {
            this.checkRecipeUnlocks();
        });
        
        // Auto-check recipe unlocks when player levels up or crafts items
        this.eventSystem.on('player_level_up', () => {
            this.checkRecipeUnlocks();
        });
        
        this.eventSystem.on('item_crafted', () => {
            this.checkRecipeUnlocks();
        });
    }
    
    /**
     * Attempt to craft an item
     * @param {string} recipeId - Recipe to craft
     * @param {number} quantity - Number of items to craft
     * @returns {boolean} Success/failure
     */
    craftItem(recipeId, quantity = 1) {
        const recipe = this.recipes[recipeId];
        if (!recipe) {
            console.error(`Recipe not found: ${recipeId}`);
            return false;
        }
        
        // Check if recipe is unlocked
        if (!this.isRecipeUnlocked(recipeId)) {
            console.log(`Recipe not unlocked: ${recipe.name}`);
            this.eventSystem.emit('crafting_failed', {
                reason: 'recipe_locked',
                recipeId: recipeId
            });
            return false;
        }
        
        // Check if we have enough materials
        const totalRequirements = {};
        for (const [materialId, amount] of Object.entries(recipe.requirements)) {
            totalRequirements[materialId] = amount * quantity;
        }
        
        if (!this.hasRequiredMaterials(totalRequirements)) {
            console.log(`Insufficient materials for ${recipe.name}`);
            this.eventSystem.emit('crafting_failed', {
                reason: 'insufficient_materials',
                recipeId: recipeId,
                requirements: totalRequirements
            });
            return false;
        }
        
        // Start crafting process
        this.startCrafting(recipeId, quantity, totalRequirements);
        return true;
    }
    
    /**
     * Start the crafting process
     * @param {string} recipeId - Recipe to craft
     * @param {number} quantity - Number to craft
     * @param {Object} materialRequirements - Materials needed
     */
    startCrafting(recipeId, quantity, materialRequirements) {
        const recipe = this.recipes[recipeId];
        
        // Remove materials from inventory
        for (const [materialId, amount] of Object.entries(materialRequirements)) {
            this.materialManager.removeMaterial(materialId, amount);
        }
        
        // Emit crafting started event
        this.eventSystem.emit('crafting_started', {
            recipeId: recipeId,
            quantity: quantity,
            craftTime: recipe.craftTime * quantity,
            materialsUsed: materialRequirements
        });
        
        console.log(`🔨 Started crafting ${quantity}x ${recipe.name}`);
        
        // Simulate crafting time
        setTimeout(() => {
            this.completeCrafting(recipeId, quantity);
        }, recipe.craftTime * quantity);
    }
    
    /**
     * Complete the crafting process
     * @param {string} recipeId - Recipe that was crafted
     * @param {number} quantity - Number crafted
     */
    completeCrafting(recipeId, quantity) {
        const recipe = this.recipes[recipeId];
        let successfulCrafts = 0;
        
        for (let i = 0; i < quantity; i++) {
            if (this.calculateCraftingSuccess(recipe.difficulty)) {
                successfulCrafts++;
            }
        }
        
        if (successfulCrafts > 0) {
            // Add crafted items to inventory
            const totalResults = successfulCrafts * recipe.results.quantity;
            this.eventSystem.emit('equipment_acquired', {
                equipmentId: recipe.results.itemId,
                quantity: totalResults,
                quality: recipe.results.quality
            });
            
            // Track crafted items for unlock requirements
            this.trackCraftedItem(recipeId, successfulCrafts);
            
            // Update prestige progress for equipment crafting
            for (let i = 0; i < successfulCrafts; i++) {
                this.eventSystem.emit('equipment_crafted');
            }
            
            console.log(`✅ Successfully crafted ${successfulCrafts}x ${recipe.name}`);
        }
        
        const failedCrafts = quantity - successfulCrafts;
        if (failedCrafts > 0) {
            console.log(`❌ Failed to craft ${failedCrafts}x ${recipe.name}`);
        }
        
        // Emit crafting completed event
        this.eventSystem.emit('crafting_completed', {
            recipeId: recipeId,
            successful: successfulCrafts,
            failed: failedCrafts,
            totalResults: successfulCrafts * recipe.results.quantity
        });
        
        // Trigger recipe unlock check
        this.checkRecipeUnlocks();
    }
    
    /**
     * Calculate if a crafting attempt succeeds
     * @param {string} difficulty - Crafting difficulty
     * @returns {boolean} Success/failure
     */
    calculateCraftingSuccess(difficulty) {
        const successRate = this.SUCCESS_RATES[difficulty] || 0.5;
        const roll = Math.random();
        
        // Bonus success chance based on player level (1% per level up to 10%)
        const player = this.stateManager.getStateValue('player');
        const levelBonus = Math.min(player ? player.level * 0.01 : 0, 0.1);
        
        return roll <= (successRate + levelBonus);
    }
    
    /**
     * Check if player has required materials
     * @param {Object} requirements - Material requirements
     * @returns {boolean} Has all required materials
     */
    hasRequiredMaterials(requirements) {
        for (const [materialId, amount] of Object.entries(requirements)) {
            const currentAmount = this.materialManager.getMaterialCount(materialId);
            if (currentAmount < amount) {
                return false;
            }
        }
        return true;
    }
    
    /**
     * Check if recipe is unlocked
     * @param {string} recipeId - Recipe to check
     * @returns {boolean} Is unlocked
     */
    isRecipeUnlocked(recipeId) {
        const recipe = this.recipes[recipeId];
        if (!recipe || !recipe.unlockRequirements) {
            return true;
        }
        
        const currentState = this.stateManager.getState();
        const player = currentState.player || {};
        const crafting = currentState.crafting || {};
        const requirements = recipe.unlockRequirements;
        
        // Check player level requirement
        if (requirements.playerLevel && player.level < requirements.playerLevel) {
            return false;
        }
        
        // Check crafted items requirement
        if (requirements.craftedItems) {
            const craftedItems = crafting.craftedItems || {};
            for (const requiredItem of requirements.craftedItems) {
                if (!craftedItems[requiredItem] || craftedItems[requiredItem] < 1) {
                    return false;
                }
            }
        }
        
        // Check materials collected requirement
        if (requirements.materialsCollected) {
            const totalMaterials = this.materialManager.calculateTotalValue();
            if (totalMaterials < requirements.materialsCollected) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Get all unlocked recipes
     * @returns {Array} Array of unlocked recipes
     */
    getUnlockedRecipes() {
        return Object.values(this.recipes).filter(recipe => this.isRecipeUnlocked(recipe.id));
    }
    
    /**
     * Get recipes by category
     * @param {string} category - Category to filter by
     * @param {boolean} unlockedOnly - Only return unlocked recipes
     * @returns {Array} Filtered recipes
     */
    getRecipesByCategory(category, unlockedOnly = true) {
        const recipes = Object.values(this.recipes).filter(recipe => recipe.category === category);
        
        if (unlockedOnly) {
            return recipes.filter(recipe => this.isRecipeUnlocked(recipe.id));
        }
        
        return recipes;
    }
    
    /**
     * Track crafted items for unlock requirements
     * @param {string} recipeId - Recipe that was crafted
     * @param {number} quantity - Number crafted
     */
    trackCraftedItem(recipeId, quantity) {
        const currentState = this.stateManager.getState();
        const crafting = currentState.crafting || {};
        const craftedItems = crafting.craftedItems || {};
        
        if (!craftedItems[recipeId]) {
            craftedItems[recipeId] = 0;
        }
        
        craftedItems[recipeId] += quantity;
        
        this.stateManager.updateState({
            crafting: {
                ...crafting,
                craftedItems: craftedItems
            }
        });
        
        // Emit item crafted event
        this.eventSystem.emit('item_crafted', {
            recipeId: recipeId,
            quantity: quantity,
            totalCrafted: craftedItems[recipeId]
        });
    }
    
    /**
     * Check and unlock new recipes based on current progress
     */
    checkRecipeUnlocks() {
        const currentState = this.stateManager.getState();
        const crafting = currentState.crafting || {};
        const unlockedRecipes = crafting.unlockedRecipes || [];
        
        let newUnlocks = [];
        
        for (const recipe of Object.values(this.recipes)) {
            if (!unlockedRecipes.includes(recipe.id) && this.isRecipeUnlocked(recipe.id)) {
                unlockedRecipes.push(recipe.id);
                newUnlocks.push(recipe);
            }
        }
        
        if (newUnlocks.length > 0) {
            this.stateManager.updateState({
                crafting: {
                    ...crafting,
                    unlockedRecipes: unlockedRecipes
                }
            });
            
            // Emit recipe unlock events
            newUnlocks.forEach(recipe => {
                this.eventSystem.emit('recipe_unlocked', {
                    recipeId: recipe.id,
                    recipeName: recipe.name,
                    category: recipe.category
                });
                
                console.log(`🔓 New recipe unlocked: ${recipe.name}`);
            });
        }
    }
    
    /**
     * Get recipe information
     * @param {string} recipeId - Recipe ID
     * @returns {Object|null} Recipe data
     */
    getRecipe(recipeId) {
        return this.recipes[recipeId] || null;
    }
    
    /**
     * Calculate total crafting cost for a recipe
     * @param {string} recipeId - Recipe ID
     * @param {number} quantity - Number to craft
     * @returns {Object} Cost breakdown
     */
    calculateCraftingCost(recipeId, quantity = 1) {
        const recipe = this.recipes[recipeId];
        if (!recipe) return null;
        
        const cost = {
            materials: {},
            totalValue: 0,
            craftTime: recipe.craftTime * quantity
        };
        
        for (const [materialId, amount] of Object.entries(recipe.requirements)) {
            const totalAmount = amount * quantity;
            cost.materials[materialId] = totalAmount;
            
            const materialDef = this.materialManager.getMaterialDefinition(materialId);
            if (materialDef) {
                cost.totalValue += materialDef.value * totalAmount;
            }
        }
        
        return cost;
    }
}