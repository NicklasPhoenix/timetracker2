/**
 * Inventory Manager - Handle item stacking, sorting, and inventory operations
 * @module InventoryManager
 */

export class InventoryManager {
    constructor(stateManager, eventSystem) {
        this.stateManager = stateManager;
        this.eventSystem = eventSystem;
        
        this.INVENTORY_TYPES = {
            MATERIALS: 'materials',
            EQUIPMENT: 'equipment',
            CONSUMABLES: 'consumables'
        };
        
        this.SORT_TYPES = {
            NAME: 'name',
            RARITY: 'rarity',
            QUANTITY: 'quantity',
            VALUE: 'value',
            TYPE: 'type'
        };
        
        this.SORT_ORDER = {
            ASC: 'asc',
            DESC: 'desc'
        };
        
        this.initializeInventory();
        this.setupEventListeners();
    }
    
    /**
     * Initialize inventory state
     */
    initializeInventory() {
        const currentState = this.stateManager.getState();
        
        // Initialize inventory structure if not exists
        if (!currentState.inventory) {
            this.stateManager.updateState({
                inventory: {
                    materials: {},
                    equipment: {},
                    consumables: {},
                    settings: {
                        sortType: this.SORT_TYPES.RARITY,
                        sortOrder: this.SORT_ORDER.DESC,
                        autoSort: true
                    }
                }
            });
        }
    }
    
    /**
     * Setup event listeners for inventory-related events
     */
    setupEventListeners() {
        // Listen for item additions
        this.eventSystem.on('material_collected', (data) => {
            this.addItem(this.INVENTORY_TYPES.MATERIALS, data.materialId, data.quantity);
        });
        
        this.eventSystem.on('equipment_acquired', (data) => {
            this.addItem(this.INVENTORY_TYPES.EQUIPMENT, data.equipmentId, 1);
        });
        
        this.eventSystem.on('inventory_add_equipment', (data) => {
            this.addEquipment(data.equipment);
        });
        
        // Listen for inventory operations
        this.eventSystem.on('inventory_sort', (data) => {
            this.sortInventory(data.inventoryType, data.sortType, data.sortOrder);
        });
        
        this.eventSystem.on('inventory_stack', (data) => {
            this.stackItems(data.inventoryType);
        });
    }
    
    /**
     * Add item to inventory with stacking logic
     * @param {string} inventoryType - Type of inventory
     * @param {string} itemId - Item identifier
     * @param {number} quantity - Quantity to add
     * @param {Object} itemData - Additional item data
     */
    addItem(inventoryType, itemId, quantity = 1, itemData = null) {
        const currentState = this.stateManager.getState();
        const inventory = currentState.inventory || {};
        
        if (!inventory[inventoryType]) {
            inventory[inventoryType] = {};
        }
        
        // Handle stacking for materials and consumables
        if (inventoryType === this.INVENTORY_TYPES.MATERIALS || 
            inventoryType === this.INVENTORY_TYPES.CONSUMABLES) {
            
            if (!inventory[inventoryType][itemId]) {
                inventory[inventoryType][itemId] = {
                    id: itemId,
                    quantity: 0,
                    data: itemData
                };
            }
            
            inventory[inventoryType][itemId].quantity += quantity;
            
        } else if (inventoryType === this.INVENTORY_TYPES.EQUIPMENT) {
            // Equipment doesn't stack - create unique entries
            const equipmentId = this.generateUniqueEquipmentId(itemId);
            inventory[inventoryType][equipmentId] = {
                id: itemId,
                uniqueId: equipmentId,
                quantity: 1,
                data: itemData
            };
        }
        
        this.stateManager.updateState({ inventory });
        
        // Auto-sort if enabled
        const settings = inventory.settings || {};
        if (settings.autoSort) {
            this.sortInventory(inventoryType);
        }
        
        // Emit inventory update event
        this.eventSystem.emit('inventory_updated', {
            inventoryType,
            itemId,
            quantity,
            operation: 'add'
        });
        
        console.log(`📦 Added ${quantity}x ${itemId} to ${inventoryType} inventory`);
    }
    
    /**
     * Add equipment directly to inventory
     * @param {Object} equipment - Equipment instance from equipment manager
     */
    addEquipment(equipment) {
        const currentState = this.stateManager.getState();
        const inventory = currentState.inventory || {};
        
        if (!inventory.equipment) {
            inventory.equipment = {};
        }
        
        // Store the equipment instance directly using its unique ID
        inventory.equipment[equipment.uniqueId] = equipment;
        
        this.stateManager.updateState({ inventory });
        
        // Emit inventory update event
        this.eventSystem.emit('inventory_updated', {
            inventoryType: 'equipment',
            itemId: equipment.id,
            quantity: 1,
            operation: 'add'
        });
        
        console.log(`⚔️ Added ${equipment.name} to equipment inventory`);
    }
    
    /**
     * Remove item from inventory
     * @param {string} inventoryType - Type of inventory
     * @param {string} itemId - Item identifier
     * @param {number} quantity - Quantity to remove
     * @returns {boolean} Success/failure
     */
    removeItem(inventoryType, itemId, quantity = 1) {
        const currentState = this.stateManager.getState();
        const inventory = currentState.inventory || {};
        
        if (!inventory[inventoryType] || !inventory[inventoryType][itemId]) {
            return false; // Item not found
        }
        
        const item = inventory[inventoryType][itemId];
        
        // Check if enough quantity available
        if (item.quantity < quantity) {
            return false; // Not enough quantity
        }
        
        item.quantity -= quantity;
        
        // Remove item completely if quantity reaches 0
        if (item.quantity <= 0) {
            delete inventory[inventoryType][itemId];
        }
        
        this.stateManager.updateState({ inventory });
        
        // Emit inventory update event
        this.eventSystem.emit('inventory_updated', {
            inventoryType,
            itemId,
            quantity,
            operation: 'remove'
        });
        
        console.log(`📤 Removed ${quantity}x ${itemId} from ${inventoryType} inventory`);
        return true;
    }
    
    /**
     * Get item count in inventory
     * @param {string} inventoryType - Type of inventory
     * @param {string} itemId - Item identifier
     * @returns {number} Current count
     */
    getItemCount(inventoryType, itemId) {
        const currentState = this.stateManager.getState();
        const inventory = currentState.inventory || {};
        
        if (!inventory[inventoryType] || !inventory[inventoryType][itemId]) {
            return 0;
        }
        
        return inventory[inventoryType][itemId].quantity || 0;
    }
    
    /**
     * Get all items from specific inventory type
     * @param {string} inventoryType - Type of inventory
     * @returns {Object} All items in inventory
     */
    getInventory(inventoryType) {
        const currentState = this.stateManager.getState();
        const inventory = currentState.inventory || {};
        return inventory[inventoryType] || {};
    }
    
    /**
     * Get complete inventory state
     * @returns {Object} Complete inventory
     */
    getFullInventory() {
        const currentState = this.stateManager.getState();
        return currentState.inventory || {};
    }
    
    /**
     * Sort inventory by specified criteria
     * @param {string} inventoryType - Type of inventory to sort
     * @param {string} sortType - Sort criteria
     * @param {string} sortOrder - Sort order (asc/desc)
     */
    sortInventory(inventoryType, sortType = null, sortOrder = null) {
        const currentState = this.stateManager.getState();
        const inventory = currentState.inventory || {};
        const settings = inventory.settings || {};
        
        // Use provided sort options or fall back to settings
        const finalSortType = sortType || settings.sortType || this.SORT_TYPES.RARITY;
        const finalSortOrder = sortOrder || settings.sortOrder || this.SORT_ORDER.DESC;
        
        if (!inventory[inventoryType]) {
            return;
        }
        
        const items = Object.values(inventory[inventoryType]);
        
        items.sort((a, b) => {
            let comparison = 0;
            
            switch (finalSortType) {
                case this.SORT_TYPES.NAME:
                    comparison = (a.data?.name || a.id).localeCompare(b.data?.name || b.id);
                    break;
                    
                case this.SORT_TYPES.RARITY:
                    const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
                    const aRarity = a.data?.rarity || 'common';
                    const bRarity = b.data?.rarity || 'common';
                    comparison = rarityOrder.indexOf(aRarity) - rarityOrder.indexOf(bRarity);
                    break;
                    
                case this.SORT_TYPES.QUANTITY:
                    comparison = a.quantity - b.quantity;
                    break;
                    
                case this.SORT_TYPES.VALUE:
                    const aValue = a.data?.value || 0;
                    const bValue = b.data?.value || 0;
                    comparison = aValue - bValue;
                    break;
                    
                case this.SORT_TYPES.TYPE:
                    const aType = a.data?.type || '';
                    const bType = b.data?.type || '';
                    comparison = aType.localeCompare(bType);
                    break;
                    
                default:
                    comparison = 0;
            }
            
            return finalSortOrder === this.SORT_ORDER.DESC ? -comparison : comparison;
        });
        
        // Rebuild inventory with sorted order
        const sortedInventory = {};
        items.forEach(item => {
            const key = item.uniqueId || item.id;
            sortedInventory[key] = item;
        });
        
        inventory[inventoryType] = sortedInventory;
        
        // Update sort settings
        inventory.settings = {
            ...settings,
            sortType: finalSortType,
            sortOrder: finalSortOrder
        };
        
        this.stateManager.updateState({ inventory });
        
        console.log(`🔄 Sorted ${inventoryType} inventory by ${finalSortType} (${finalSortOrder})`);
    }
    
    /**
     * Stack identical items in inventory
     * @param {string} inventoryType - Type of inventory to stack
     */
    stackItems(inventoryType) {
        const currentState = this.stateManager.getState();
        const inventory = currentState.inventory || {};
        
        if (!inventory[inventoryType]) {
            return;
        }
        
        // Only materials and consumables can be stacked
        if (inventoryType !== this.INVENTORY_TYPES.MATERIALS && 
            inventoryType !== this.INVENTORY_TYPES.CONSUMABLES) {
            return;
        }
        
        const items = inventory[inventoryType];
        const stackedItems = {};
        
        for (const [key, item] of Object.entries(items)) {
            if (stackedItems[item.id]) {
                // Merge quantities
                stackedItems[item.id].quantity += item.quantity;
            } else {
                // Create new stack
                stackedItems[item.id] = { ...item };
            }
        }
        
        inventory[inventoryType] = stackedItems;
        this.stateManager.updateState({ inventory });
        
        console.log(`📦 Stacked items in ${inventoryType} inventory`);
    }
    
    /**
     * Calculate total inventory value
     * @param {string} inventoryType - Type of inventory (optional)
     * @returns {number} Total value
     */
    calculateInventoryValue(inventoryType = null) {
        const inventory = this.getFullInventory();
        let totalValue = 0;
        
        const inventoriesToCheck = inventoryType ? 
            [inventoryType] : 
            Object.values(this.INVENTORY_TYPES);
        
        inventoriesToCheck.forEach(type => {
            const typeInventory = inventory[type] || {};
            
            for (const item of Object.values(typeInventory)) {
                const itemValue = item.data?.value || 0;
                totalValue += itemValue * item.quantity;
            }
        });
        
        return totalValue;
    }
    
    /**
     * Get inventory statistics
     * @returns {Object} Inventory statistics
     */
    getInventoryStats() {
        const inventory = this.getFullInventory();
        const stats = {
            totalItems: 0,
            totalValue: 0,
            itemsByRarity: {
                common: 0,
                uncommon: 0,
                rare: 0,
                epic: 0,
                legendary: 0
            },
            itemsByType: {}
        };
        
        for (const [inventoryType, items] of Object.entries(inventory)) {
            if (inventoryType === 'settings') continue;
            
            stats.itemsByType[inventoryType] = Object.keys(items).length;
            
            for (const item of Object.values(items)) {
                stats.totalItems += item.quantity;
                stats.totalValue += (item.data?.value || 0) * item.quantity;
                
                const rarity = item.data?.rarity || 'common';
                if (stats.itemsByRarity[rarity] !== undefined) {
                    stats.itemsByRarity[rarity] += item.quantity;
                }
            }
        }
        
        return stats;
    }
    
    /**
     * Generate unique equipment ID for non-stackable items
     * @param {string} baseId - Base equipment ID
     * @returns {string} Unique equipment ID
     */
    generateUniqueEquipmentId(baseId) {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        return `${baseId}_${timestamp}_${random}`;
    }
    
    /**
     * Search inventory for items matching criteria
     * @param {string} query - Search query
     * @param {string} inventoryType - Type of inventory to search (optional)
     * @returns {Array} Matching items
     */
    searchInventory(query, inventoryType = null) {
        const inventory = this.getFullInventory();
        const results = [];
        const searchTerm = query.toLowerCase();
        
        const inventoriesToSearch = inventoryType ? 
            [inventoryType] : 
            Object.values(this.INVENTORY_TYPES);
        
        inventoriesToSearch.forEach(type => {
            const typeInventory = inventory[type] || {};
            
            for (const [key, item] of Object.entries(typeInventory)) {
                const name = (item.data?.name || item.id).toLowerCase();
                const description = (item.data?.description || '').toLowerCase();
                
                if (name.includes(searchTerm) || description.includes(searchTerm)) {
                    results.push({
                        ...item,
                        inventoryType: type,
                        key: key
                    });
                }
            }
        });
        
        return results;
    }
    
    /**
     * Update inventory settings
     * @param {Object} newSettings - New settings to apply
     */
    updateInventorySettings(newSettings) {
        const currentState = this.stateManager.getState();
        const inventory = currentState.inventory || {};
        
        inventory.settings = {
            ...inventory.settings,
            ...newSettings
        };
        
        this.stateManager.updateState({ inventory });
        
        console.log('⚙️ Updated inventory settings:', newSettings);
    }
}