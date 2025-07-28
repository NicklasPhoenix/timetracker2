/**
 * State Manager - Centralized state management with save/load functionality
 * @module StateManager
 */

class StateManager {
    constructor() {
        this.state = {};
        this.listeners = new Map();
        this.saveKey = 'incremental-combat-game-save';
        this.autoSaveInterval = 30000; // 30 seconds
        this.autoSaveTimer = null;
        
        this.setupAutoSave();
    }
    
    /**
     * Set the complete game state
     * @param {Object} newState - New state object
     */
    setState(newState) {
        const oldState = { ...this.state };
        this.state = this.validateState(newState);
        this.notifyListeners(oldState, this.state);
        
        console.log('📊 State updated:', this.state);
    }
    
    /**
     * Update partial state (deep merge)
     * @param {Object} updates - Partial state updates
     */
    updateState(updates) {
        const oldState = { ...this.state };
        this.state = this.deepMerge(this.state, updates);
        this.notifyListeners(oldState, this.state);
    }
    
    /**
     * Get the current state
     * @returns {Object} Current state
     */
    getState() {
        return { ...this.state };
    }
    
    /**
     * Get a specific part of the state
     * @param {string} path - Dot notation path (e.g., 'player.hp')
     * @returns {*} Value at path
     */
    getStateValue(path) {
        return this.getNestedValue(this.state, path);
    }
    
    /**
     * Subscribe to state changes
     * @param {string} event - Event name or path to watch
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    subscribe(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        
        this.listeners.get(event).add(callback);
        
        // Return unsubscribe function
        return () => {
            const eventListeners = this.listeners.get(event);
            if (eventListeners) {
                eventListeners.delete(callback);
                if (eventListeners.size === 0) {
                    this.listeners.delete(event);
                }
            }
        };
    }
    
    /**
     * Notify all listeners of state changes
     * @param {Object} oldState - Previous state
     * @param {Object} newState - New state
     */
    notifyListeners(oldState, newState) {
        // Notify global listeners
        const globalListeners = this.listeners.get('*');
        if (globalListeners) {
            globalListeners.forEach(callback => {
                try {
                    callback(newState, oldState);
                } catch (error) {
                    console.error('Error in state listener:', error);
                }
            });
        }
        
        // Notify specific path listeners
        this.listeners.forEach((listeners, path) => {
            if (path === '*') return;
            
            const oldValue = this.getNestedValue(oldState, path);
            const newValue = this.getNestedValue(newState, path);
            
            if (oldValue !== newValue) {
                listeners.forEach(callback => {
                    try {
                        callback(newValue, oldValue, path);
                    } catch (error) {
                        console.error(`Error in state listener for ${path}:`, error);
                    }
                });
            }
        });
    }
    
    /**
     * Validate state object structure
     * @param {Object} state - State to validate
     * @returns {Object} Validated state
     */
    validateState(state) {
        // Basic validation - ensure required top-level properties exist
        const requiredProperties = ['player', 'game', 'performance'];
        const validatedState = { ...state };
        
        requiredProperties.forEach(prop => {
            if (!(prop in validatedState)) {
                console.warn(`Missing required state property: ${prop}`);
                validatedState[prop] = {};
            }
        });
        
        // Validate player state
        if (validatedState.player) {
            const player = validatedState.player;
            if (typeof player.hp === 'number' && player.hp < 0) {
                player.hp = 0;
            }
            if (typeof player.maxHp === 'number' && player.hp > player.maxHp) {
                player.hp = player.maxHp;
            }
        }
        
        return validatedState;
    }
    
    /**
     * Deep merge two objects
     * @param {Object} target - Target object
     * @param {Object} source - Source object
     * @returns {Object} Merged object
     */
    deepMerge(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (this.isObject(source[key]) && this.isObject(result[key])) {
                    result[key] = this.deepMerge(result[key], source[key]);
                } else {
                    result[key] = source[key];
                }
            }
        }
        
        return result;
    }
    
    /**
     * Get nested value from object using dot notation
     * @param {Object} obj - Object to search
     * @param {string} path - Dot notation path
     * @returns {*} Value at path
     */
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);
    }
    
    /**
     * Check if value is an object
     * @param {*} value - Value to check
     * @returns {boolean} True if object
     */
    isObject(value) {
        return value !== null && typeof value === 'object' && !Array.isArray(value);
    }
    
    /**
     * Save state to localStorage
     * @returns {boolean} Success status
     */
    saveToStorage() {
        try {
            const saveData = {
                state: this.state,
                timestamp: Date.now(),
                version: '1.0.0'
            };
            
            localStorage.setItem(this.saveKey, JSON.stringify(saveData));
            console.log('💾 Game saved to localStorage');
            return true;
        } catch (error) {
            console.error('Failed to save game:', error);
            return false;
        }
    }
    
    /**
     * Load state from localStorage
     * @returns {boolean} Success status
     */
    loadFromStorage() {
        try {
            const savedData = localStorage.getItem(this.saveKey);
            if (!savedData) {
                console.log('📁 No save data found');
                return false;
            }
            
            const saveData = JSON.parse(savedData);
            
            // Validate save data structure
            if (!saveData.state || !saveData.timestamp) {
                console.warn('Invalid save data structure');
                return false;
            }
            
            // Check version compatibility (future feature)
            if (saveData.version && saveData.version !== '1.0.0') {
                console.warn(`Save version mismatch: ${saveData.version}`);
                // Could implement migration logic here
            }
            
            this.setState(saveData.state);
            console.log(`📂 Game loaded from save (${new Date(saveData.timestamp).toLocaleString()})`);
            return true;
        } catch (error) {
            console.error('Failed to load game:', error);
            return false;
        }
    }
    
    /**
     * Delete save data
     */
    deleteSave() {
        try {
            localStorage.removeItem(this.saveKey);
            console.log('🗑️ Save data deleted');
        } catch (error) {
            console.error('Failed to delete save:', error);
        }
    }
    
    /**
     * Export save data as JSON string
     * @returns {string} JSON save data
     */
    exportSave() {
        const saveData = {
            state: this.state,
            timestamp: Date.now(),
            version: '1.0.0'
        };
        
        return JSON.stringify(saveData, null, 2);
    }
    
    /**
     * Import save data from JSON string
     * @param {string} jsonData - JSON save data
     * @returns {boolean} Success status
     */
    importSave(jsonData) {
        try {
            const saveData = JSON.parse(jsonData);
            
            if (!saveData.state) {
                throw new Error('Invalid save data format');
            }
            
            this.setState(saveData.state);
            console.log('📥 Save data imported successfully');
            return true;
        } catch (error) {
            console.error('Failed to import save:', error);
            return false;
        }
    }
    
    /**
     * Setup automatic saving
     */
    setupAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }
        
        this.autoSaveTimer = setInterval(() => {
            this.saveToStorage();
        }, this.autoSaveInterval);
        
        // Save before page unload
        window.addEventListener('beforeunload', () => {
            this.saveToStorage();
        });
    }
    
    /**
     * Reset state to default values
     */
    resetState() {
        const defaultState = {
            player: {
                hp: 100,
                maxHp: 100,
                level: 1,
                exp: 0,
                attack: 10,
                defense: 5
            },
            game: {
                currentStage: 1,
                isPaused: false,
                isInCombat: false
            },
            performance: {
                fps: 60,
                frameTime: 16.67
            }
        };
        
        this.setState(defaultState);
        console.log('🔄 State reset to defaults');
    }
    
    /**
     * Get save file info
     * @returns {Object|null} Save info or null if no save exists
     */
    getSaveInfo() {
        try {
            const savedData = localStorage.getItem(this.saveKey);
            if (!savedData) return null;
            
            const saveData = JSON.parse(savedData);
            return {
                timestamp: saveData.timestamp,
                version: saveData.version || '1.0.0',
                size: savedData.length,
                hasValidStructure: !!(saveData.state && saveData.timestamp)
            };
        } catch (error) {
            console.error('Failed to get save info:', error);
            return null;
        }
    }
}

export { StateManager };