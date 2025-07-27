/**
 * Equipment Manager - Handle equipment stats, modifiers, and item management
 * @module EquipmentManager
 */

export class EquipmentManager {
    constructor(stateManager, eventSystem) {
        this.stateManager = stateManager;
        this.eventSystem = eventSystem;
        
        this.EQUIPMENT_TYPES = {
            WEAPON: 'weapon',
            ARMOR: 'armor',
            ACCESSORY: 'accessory',
            CONSUMABLE: 'consumable'
        };
        
        this.EQUIPMENT_SLOTS = {
            MAIN_HAND: 'main_hand',
            CHEST: 'chest',
            ACCESSORY_1: 'accessory_1',
            ACCESSORY_2: 'accessory_2'
        };
        
        this.STAT_TYPES = {
            ATTACK: 'attack',
            DEFENSE: 'defense',
            HP: 'hp',
            CRIT_CHANCE: 'crit_chance',
            CRIT_DAMAGE: 'crit_damage',
            SPEED: 'speed'
        };
        
        this.EQUIPMENT_QUALITY = {
            POOR: 'poor',
            NORMAL: 'normal',
            GOOD: 'good',
            RARE: 'rare',
            EPIC: 'epic',
            LEGENDARY: 'legendary'
        };
        
        this.QUALITY_MULTIPLIERS = {
            poor: 0.8,      // 80% stats
            normal: 1.0,    // 100% stats
            good: 1.2,      // 120% stats
            rare: 1.5,      // 150% stats
            epic: 2.0,      // 200% stats
            legendary: 3.0  // 300% stats
        };
        
        this.initializeEquipmentDefinitions();
        this.setupEventListeners();
    }
    
    /**
     * Initialize equipment definitions
     */
    initializeEquipmentDefinitions() {
        this.equipmentDefinitions = {
            // Weapons
            wooden_sword: {
                id: 'wooden_sword',
                name: 'Wooden Sword',
                description: 'A basic sword made from wood',
                type: this.EQUIPMENT_TYPES.WEAPON,
                slot: this.EQUIPMENT_SLOTS.MAIN_HAND,
                baseStats: {
                    attack: 8,
                    crit_chance: 0.05 // 5%
                },
                requirements: {
                    level: 1
                },
                value: 10
            },
            
            iron_sword: {
                id: 'iron_sword',
                name: 'Iron Sword',
                description: 'A sturdy iron blade with improved damage',
                type: this.EQUIPMENT_TYPES.WEAPON,
                slot: this.EQUIPMENT_SLOTS.MAIN_HAND,
                baseStats: {
                    attack: 15,
                    crit_chance: 0.08 // 8%
                },
                requirements: {
                    level: 3
                },
                value: 30
            },
            
            silver_sword: {
                id: 'silver_sword',
                name: 'Silver Sword',
                description: 'An enchanted silver blade with magical properties',
                type: this.EQUIPMENT_TYPES.WEAPON,
                slot: this.EQUIPMENT_SLOTS.MAIN_HAND,
                baseStats: {
                    attack: 25,
                    crit_chance: 0.12, // 12%
                    crit_damage: 0.5   // +50% crit damage
                },
                requirements: {
                    level: 5
                },
                value: 80
            },
            
            legendary_blade: {
                id: 'legendary_blade',
                name: 'Legendary Blade',
                description: 'The ultimate weapon forged from mythril and dragon essence',
                type: this.EQUIPMENT_TYPES.WEAPON,
                slot: this.EQUIPMENT_SLOTS.MAIN_HAND,
                baseStats: {
                    attack: 50,
                    crit_chance: 0.20, // 20%
                    crit_damage: 1.0,  // +100% crit damage
                    speed: 10
                },
                requirements: {
                    level: 10
                },
                value: 300
            },
            
            // Armor
            cloth_armor: {
                id: 'cloth_armor',
                name: 'Cloth Armor',
                description: 'Basic protection made from cloth',
                type: this.EQUIPMENT_TYPES.ARMOR,
                slot: this.EQUIPMENT_SLOTS.CHEST,
                baseStats: {
                    defense: 5,
                    hp: 20
                },
                requirements: {
                    level: 1
                },
                value: 8
            },
            
            leather_armor: {
                id: 'leather_armor',
                name: 'Leather Armor',
                description: 'Durable armor crafted from beast hide',
                type: this.EQUIPMENT_TYPES.ARMOR,
                slot: this.EQUIPMENT_SLOTS.CHEST,
                baseStats: {
                    defense: 12,
                    hp: 40,
                    speed: 2
                },
                requirements: {
                    level: 2
                },
                value: 25
            },
            
            enchanted_armor: {
                id: 'enchanted_armor',
                name: 'Enchanted Armor',
                description: 'Magical armor enhanced with crystalline power',
                type: this.EQUIPMENT_TYPES.ARMOR,
                slot: this.EQUIPMENT_SLOTS.CHEST,
                baseStats: {
                    defense: 20,
                    hp: 80,
                    crit_chance: 0.05, // 5%
                    speed: 5
                },
                requirements: {
                    level: 6
                },
                value: 120
            },
            
            // Consumables
            health_potion: {
                id: 'health_potion',
                name: 'Health Potion',
                description: 'Restores health when consumed',
                type: this.EQUIPMENT_TYPES.CONSUMABLE,
                slot: null, // Consumables don't occupy slots
                baseStats: {
                    hp_restore: 50
                },
                requirements: {
                    level: 1
                },
                value: 5,
                consumable: true
            }
        };
    }
    
    /**
     * Setup event listeners for equipment-related events
     */
    setupEventListeners() {
        // Listen for equipment acquisition from crafting
        this.eventSystem.on('equipment_acquired', (data) => {
            this.addEquipment(data.equipmentId, data.quantity || 1, data.quality || 'normal');
        });
        
        // Listen for equipment operations
        this.eventSystem.on('equip_item', (data) => {
            this.equipItem(data.equipmentId, data.slot);
        });
        
        this.eventSystem.on('unequip_item', (data) => {
            this.unequipItem(data.slot);
        });
        
        this.eventSystem.on('use_consumable', (data) => {
            this.useConsumable(data.equipmentId);
        });
    }
    
    /**
     * Add equipment to inventory
     * @param {string} equipmentId - Equipment ID
     * @param {number} quantity - Quantity to add
     * @param {string} quality - Equipment quality
     */
    addEquipment(equipmentId, quantity = 1, quality = 'normal') {
        const definition = this.equipmentDefinitions[equipmentId];
        if (!definition) {
            console.error(`Equipment definition not found: ${equipmentId}`);
            return;
        }
        
        for (let i = 0; i < quantity; i++) {
            const equipment = this.createEquipmentInstance(equipmentId, quality);
            
            // Add to inventory through inventory manager
            this.eventSystem.emit('inventory_add_equipment', {
                equipment: equipment
            });
        }
        
        console.log(`⚔️ Added ${quantity}x ${definition.name} (${quality} quality)`);
    }
    
    /**
     * Create an equipment instance with stats
     * @param {string} equipmentId - Equipment ID
     * @param {string} quality - Equipment quality
     * @returns {Object} Equipment instance
     */
    createEquipmentInstance(equipmentId, quality = 'normal') {
        const definition = this.equipmentDefinitions[equipmentId];
        if (!definition) return null;
        
        const qualityMultiplier = this.QUALITY_MULTIPLIERS[quality] || 1.0;
        const finalStats = {};
        
        // Apply quality multiplier to base stats
        for (const [statType, value] of Object.entries(definition.baseStats)) {
            if (statType.includes('chance') || statType.includes('damage')) {
                // Percentage stats don't scale linearly
                finalStats[statType] = value + (value * (qualityMultiplier - 1) * 0.5);
            } else {
                // Regular stats scale normally
                finalStats[statType] = Math.floor(value * qualityMultiplier);
            }
        }
        
        return {
            id: equipmentId,
            uniqueId: this.generateUniqueId(equipmentId),
            name: definition.name,
            description: definition.description,
            type: definition.type,
            slot: definition.slot,
            quality: quality,
            stats: finalStats,
            requirements: definition.requirements,
            value: Math.floor(definition.value * qualityMultiplier),
            consumable: definition.consumable || false,
            equipped: false
        };
    }
    
    /**
     * Equip an item to a specific slot
     * @param {string} equipmentUniqueId - Unique equipment ID
     * @param {string} slot - Equipment slot (optional)
     * @returns {boolean} Success/failure
     */
    equipItem(equipmentUniqueId, slot = null) {
        const currentState = this.stateManager.getState();
        const inventory = currentState.inventory || {};
        const equipment = inventory.equipment || {};
        const equippedItems = currentState.equippedItems || {};
        
        // Find the equipment in inventory
        const item = equipment[equipmentUniqueId];
        if (!item) {
            console.error(`Equipment not found in inventory: ${equipmentUniqueId}`);
            return false;
        }
        
        // Check requirements
        if (!this.meetsRequirements(item)) {
            console.log(`Cannot equip ${item.name}: requirements not met`);
            this.eventSystem.emit('equip_failed', {
                reason: 'requirements_not_met',
                item: item
            });
            return false;
        }
        
        // Determine slot
        const targetSlot = slot || item.slot;
        if (!targetSlot) {
            console.error(`No slot specified for ${item.name}`);
            return false;
        }
        
        // Unequip existing item in slot
        if (equippedItems[targetSlot]) {
            this.unequipItem(targetSlot);
        }
        
        // Equip the new item
        item.equipped = true;
        const newEquippedItems = { ...equippedItems };
        newEquippedItems[targetSlot] = {
            uniqueId: equipmentUniqueId,
            itemData: item
        };
        
        this.stateManager.updateState({
            equippedItems: newEquippedItems,
            inventory: {
                ...inventory,
                equipment: {
                    ...equipment,
                    [equipmentUniqueId]: item
                }
            }
        });
        
        // Recalculate player stats
        this.updatePlayerStats();
        
        console.log(`✅ Equipped ${item.name} to ${targetSlot}`);
        
        this.eventSystem.emit('item_equipped', {
            item: item,
            slot: targetSlot
        });
        
        return true;
    }
    
    /**
     * Unequip an item from a specific slot
     * @param {string} slot - Equipment slot
     * @returns {boolean} Success/failure
     */
    unequipItem(slot) {
        const currentState = this.stateManager.getState();
        const equippedItems = currentState.equippedItems || {};
        const inventory = currentState.inventory || {};
        const equipment = inventory.equipment || {};
        
        if (!equippedItems[slot]) {
            console.log(`No item equipped in slot: ${slot}`);
            return false;
        }
        
        const equippedItem = equippedItems[slot];
        const item = equipment[equippedItem.uniqueId];
        
        if (item) {
            item.equipped = false;
        }
        
        // Remove from equipped items
        const newEquippedItems = { ...equippedItems };
        delete newEquippedItems[slot];
        
        this.stateManager.updateState({
            equippedItems: newEquippedItems,
            inventory: {
                ...inventory,
                equipment: {
                    ...equipment,
                    [equippedItem.uniqueId]: item
                }
            }
        });
        
        // Recalculate player stats
        this.updatePlayerStats();
        
        console.log(`❌ Unequipped item from ${slot}`);
        
        this.eventSystem.emit('item_unequipped', {
            item: item,
            slot: slot
        });
        
        return true;
    }
    
    /**
     * Use a consumable item
     * @param {string} equipmentUniqueId - Unique equipment ID
     * @returns {boolean} Success/failure
     */
    useConsumable(equipmentUniqueId) {
        const currentState = this.stateManager.getState();
        const inventory = currentState.inventory || {};
        const equipment = inventory.equipment || {};
        
        const item = equipment[equipmentUniqueId];
        if (!item || !item.consumable) {
            console.error(`Consumable not found: ${equipmentUniqueId}`);
            return false;
        }
        
        // Apply consumable effects
        this.applyConsumableEffects(item);
        
        // Remove from inventory
        const newEquipment = { ...equipment };
        delete newEquipment[equipmentUniqueId];
        
        this.stateManager.updateState({
            inventory: {
                ...inventory,
                equipment: newEquipment
            }
        });
        
        console.log(`🧪 Used ${item.name}`);
        
        this.eventSystem.emit('consumable_used', {
            item: item
        });
        
        return true;
    }
    
    /**
     * Apply effects from consuming an item
     * @param {Object} item - Consumable item
     */
    applyConsumableEffects(item) {
        const player = this.stateManager.getStateValue('player');
        const updates = {};
        
        // Handle health restoration
        if (item.stats.hp_restore) {
            const newHp = Math.min(player.maxHp, player.hp + item.stats.hp_restore);
            updates.hp = newHp;
            console.log(`💚 Restored ${item.stats.hp_restore} HP (${player.hp} → ${newHp})`);
        }
        
        // Apply other effects as needed...
        
        if (Object.keys(updates).length > 0) {
            this.stateManager.updateState({
                player: {
                    ...player,
                    ...updates
                }
            });
        }
    }
    
    /**
     * Check if player meets equipment requirements
     * @param {Object} item - Equipment item
     * @returns {boolean} Meets requirements
     */
    meetsRequirements(item) {
        if (!item.requirements) return true;
        
        const player = this.stateManager.getStateValue('player');
        
        // Check level requirement
        if (item.requirements.level && player.level < item.requirements.level) {
            return false;
        }
        
        // Add other requirement checks as needed...
        
        return true;
    }
    
    /**
     * Update player stats based on equipped items
     */
    updatePlayerStats() {
        const currentState = this.stateManager.getState();
        const equippedItems = currentState.equippedItems || {};
        const player = currentState.player || {};
        
        // Start with base player stats
        const baseStats = {
            attack: 10,
            defense: 5,
            maxHp: 100,
            crit_chance: 0.05,
            crit_damage: 0.5,
            speed: 0
        };
        
        const totalStats = { ...baseStats };
        
        // Add stats from equipped items
        for (const equippedItem of Object.values(equippedItems)) {
            const item = equippedItem.itemData;
            if (item && item.stats) {
                for (const [statType, value] of Object.entries(item.stats)) {
                    if (totalStats[statType] !== undefined) {
                        totalStats[statType] += value;
                    }
                }
            }
        }
        
        // Ensure HP doesn't exceed max HP
        const currentHp = player.hp || baseStats.maxHp;
        const adjustedHp = Math.min(currentHp, totalStats.maxHp);
        
        // Update player state
        this.stateManager.updateState({
            player: {
                ...player,
                attack: totalStats.attack,
                defense: totalStats.defense,
                maxHp: totalStats.maxHp,
                hp: adjustedHp,
                crit_chance: totalStats.crit_chance,
                crit_damage: totalStats.crit_damage,
                speed: totalStats.speed
            }
        });
        
        console.log('📊 Updated player stats:', totalStats);
        
        this.eventSystem.emit('player_stats_updated', {
            stats: totalStats
        });
    }
    
    /**
     * Get all equipped items
     * @returns {Object} Equipped items by slot
     */
    getEquippedItems() {
        const currentState = this.stateManager.getState();
        return currentState.equippedItems || {};
    }
    
    /**
     * Get equipment definition
     * @param {string} equipmentId - Equipment ID
     * @returns {Object|null} Equipment definition
     */
    getEquipmentDefinition(equipmentId) {
        return this.equipmentDefinitions[equipmentId] || null;
    }
    
    /**
     * Calculate total equipment power
     * @returns {number} Total equipment power score
     */
    calculateEquipmentPower() {
        const equippedItems = this.getEquippedItems();
        let totalPower = 0;
        
        for (const equippedItem of Object.values(equippedItems)) {
            const item = equippedItem.itemData;
            if (item && item.stats) {
                // Simple power calculation based on stat values
                for (const value of Object.values(item.stats)) {
                    totalPower += typeof value === 'number' ? value : 0;
                }
                
                // Bonus for quality
                const qualityMultiplier = this.QUALITY_MULTIPLIERS[item.quality] || 1.0;
                totalPower *= qualityMultiplier;
            }
        }
        
        return Math.floor(totalPower);
    }
    
    /**
     * Generate unique ID for equipment instances
     * @param {string} baseId - Base equipment ID
     * @returns {string} Unique ID
     */
    generateUniqueId(baseId) {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);
        return `${baseId}_${timestamp}_${random}`;
    }
    
    /**
     * Get equipment comparison data
     * @param {string} equipmentId1 - First equipment ID
     * @param {string} equipmentId2 - Second equipment ID
     * @returns {Object} Comparison data
     */
    compareEquipment(equipmentId1, equipmentId2) {
        const item1 = this.getEquipmentDefinition(equipmentId1);
        const item2 = this.getEquipmentDefinition(equipmentId2);
        
        if (!item1 || !item2) return null;
        
        const comparison = {
            item1: item1,
            item2: item2,
            differences: {}
        };
        
        // Compare stats
        const allStats = new Set([
            ...Object.keys(item1.baseStats || {}),
            ...Object.keys(item2.baseStats || {})
        ]);
        
        for (const stat of allStats) {
            const value1 = item1.baseStats[stat] || 0;
            const value2 = item2.baseStats[stat] || 0;
            comparison.differences[stat] = value2 - value1;
        }
        
        return comparison;
    }
}