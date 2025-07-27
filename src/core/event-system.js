/**
 * Event System - Custom event dispatcher for game events
 * @module EventSystem
 */

class EventSystem {
    constructor() {
        this.listeners = new Map();
        this.eventQueue = [];
        this.isProcessingQueue = false;
        this.maxQueueSize = 1000;
        this.eventHistory = [];
        this.maxHistorySize = 100;
        this.debugMode = false;
        
        // Define game event types
        this.EVENT_TYPES = {
            // Core game events
            GAME_TICK: 'game_tick',
            GAME_START: 'game_start',
            GAME_PAUSE: 'game_pause',
            GAME_RESUME: 'game_resume',
            
            // Combat events
            COMBAT_START: 'combat_start',
            COMBAT_END: 'combat_end',
            ATTACK: 'attack',
            DEFEND: 'defend',
            DAMAGE_DEALT: 'damage_dealt',
            DAMAGE_RECEIVED: 'damage_received',
            
            // Player events
            PLAYER_LEVEL_UP: 'player_level_up',
            PLAYER_HP_CHANGE: 'player_hp_change',
            PLAYER_DEATH: 'player_death',
            
            // Input events
            CANVAS_CLICK: 'canvas_click',
            CANVAS_TOUCH: 'canvas_touch',
            KEY_DOWN: 'key_down',
            KEY_UP: 'key_up',
            
            // UI events
            UI_UPDATE: 'ui_update',
            BUTTON_CLICK: 'button_click',
            
            // Progression events
            MATERIAL_COLLECTED: 'material_collected',
            ITEM_CRAFTED: 'item_crafted',
            EQUIPMENT_EQUIPPED: 'equipment_equipped',
            STAGE_COMPLETED: 'stage_completed',
            
            // Performance events
            FPS_WARNING: 'fps_warning',
            MEMORY_WARNING: 'memory_warning'
        };
    }
    
    /**
     * Add an event listener
     * @param {string} eventType - Type of event to listen for
     * @param {Function} callback - Callback function
     * @param {Object} options - Optional configuration
     * @returns {Function} Unsubscribe function
     */
    on(eventType, callback, options = {}) {
        if (typeof callback !== 'function') {
            throw new Error('Event callback must be a function');
        }
        
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, new Set());
        }
        
        const listener = {
            callback,
            once: options.once || false,
            priority: options.priority || 0,
            id: this.generateListenerId()
        };
        
        this.listeners.get(eventType).add(listener);
        
        if (this.debugMode) {
            console.log(`📨 Event listener added: ${eventType}`);
        }
        
        // Return unsubscribe function
        return () => this.off(eventType, listener.id);
    }
    
    /**
     * Add a one-time event listener
     * @param {string} eventType - Type of event to listen for
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    once(eventType, callback) {
        return this.on(eventType, callback, { once: true });
    }
    
    /**
     * Remove an event listener
     * @param {string} eventType - Type of event
     * @param {string} listenerId - Listener ID to remove
     */
    off(eventType, listenerId) {
        const listeners = this.listeners.get(eventType);
        if (!listeners) return;
        
        for (const listener of listeners) {
            if (listener.id === listenerId) {
                listeners.delete(listener);
                if (this.debugMode) {
                    console.log(`📭 Event listener removed: ${eventType}`);
                }
                break;
            }
        }
        
        // Clean up empty listener sets
        if (listeners.size === 0) {
            this.listeners.delete(eventType);
        }
    }
    
    /**
     * Emit an event
     * @param {string} eventType - Type of event to emit
     * @param {Object} data - Event data
     * @param {Object} options - Optional configuration
     */
    emit(eventType, data = {}, options = {}) {
        const event = {
            type: eventType,
            data,
            timestamp: performance.now(),
            immediate: options.immediate || false
        };
        
        if (event.immediate) {
            this.processEvent(event);
        } else {
            this.queueEvent(event);
        }
        
        // Add to history for debugging
        this.addToHistory(event);
        
        if (this.debugMode) {
            console.log(`📤 Event emitted: ${eventType}`, data);
        }
    }
    
    /**
     * Queue an event for processing
     * @param {Object} event - Event object
     */
    queueEvent(event) {
        if (this.eventQueue.length >= this.maxQueueSize) {
            console.warn('Event queue is full, dropping oldest events');
            this.eventQueue.shift();
        }
        
        this.eventQueue.push(event);
        
        // Process queue if not already processing
        if (!this.isProcessingQueue) {
            this.processEventQueue();
        }
    }
    
    /**
     * Process the event queue
     */
    async processEventQueue() {
        if (this.isProcessingQueue || this.eventQueue.length === 0) {
            return;
        }
        
        this.isProcessingQueue = true;
        
        while (this.eventQueue.length > 0) {
            const event = this.eventQueue.shift();
            this.processEvent(event);
            
            // Yield control occasionally to prevent blocking
            if (this.eventQueue.length % 10 === 0) {
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }
        
        this.isProcessingQueue = false;
    }
    
    /**
     * Process a single event
     * @param {Object} event - Event object
     */
    processEvent(event) {
        const listeners = this.listeners.get(event.type);
        if (!listeners || listeners.size === 0) {
            return;
        }
        
        // Convert to array and sort by priority
        const sortedListeners = Array.from(listeners).sort((a, b) => b.priority - a.priority);
        
        for (const listener of sortedListeners) {
            try {
                listener.callback(event.data, event);
                
                // Remove one-time listeners
                if (listener.once) {
                    listeners.delete(listener);
                }
            } catch (error) {
                console.error(`Error in event listener for ${event.type}:`, error);
            }
        }
        
        // Clean up empty listener sets
        if (listeners.size === 0) {
            this.listeners.delete(event.type);
        }
    }
    
    /**
     * Generate unique listener ID
     * @returns {string} Unique ID
     */
    generateListenerId() {
        return `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Add event to history for debugging
     * @param {Object} event - Event object
     */
    addToHistory(event) {
        this.eventHistory.push({
            type: event.type,
            timestamp: event.timestamp,
            dataSize: JSON.stringify(event.data).length
        });
        
        // Limit history size
        if (this.eventHistory.length > this.maxHistorySize) {
            this.eventHistory.shift();
        }
    }
    
    /**
     * Get list of active listeners
     * @returns {Array} Array of event types with listener counts
     */
    getActiveListeners() {
        const result = [];
        for (const [eventType, listeners] of this.listeners) {
            result.push({
                eventType,
                listenerCount: listeners.size
            });
        }
        return result.sort((a, b) => b.listenerCount - a.listenerCount);
    }
    
    /**
     * Get event history
     * @param {number} limit - Number of recent events to return
     * @returns {Array} Recent events
     */
    getEventHistory(limit = 20) {
        return this.eventHistory.slice(-limit);
    }
    
    /**
     * Clear all listeners
     */
    clear() {
        this.listeners.clear();
        this.eventQueue.length = 0;
        console.log('🧹 All event listeners cleared');
    }
    
    /**
     * Enable or disable debug mode
     * @param {boolean} enabled - Debug mode state
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
        console.log(`🐛 Event debug mode: ${enabled ? 'ON' : 'OFF'}`);
    }
    
    /**
     * Get performance statistics
     * @returns {Object} Performance stats
     */
    getPerformanceStats() {
        const totalListeners = Array.from(this.listeners.values())
            .reduce((sum, listeners) => sum + listeners.size, 0);
        
        return {
            totalListeners,
            activeEventTypes: this.listeners.size,
            queuedEvents: this.eventQueue.length,
            historySize: this.eventHistory.length,
            isProcessingQueue: this.isProcessingQueue
        };
    }
    
    /**
     * Create event group for batch operations
     * @param {string} groupName - Name of the group
     * @returns {Object} Event group object
     */
    createEventGroup(groupName) {
        return {
            name: groupName,
            listeners: [],
            
            on: (eventType, callback, options) => {
                const unsubscribe = this.on(eventType, callback, options);
                this.listeners.push({ eventType, unsubscribe });
                return unsubscribe;
            },
            
            once: (eventType, callback) => {
                const unsubscribe = this.once(eventType, callback);
                this.listeners.push({ eventType, unsubscribe });
                return unsubscribe;
            },
            
            removeAll: () => {
                this.listeners.forEach(({ unsubscribe }) => unsubscribe());
                this.listeners.length = 0;
                console.log(`📦 Event group '${groupName}' listeners removed`);
            }
        };
    }
    
    /**
     * Emit multiple events in sequence
     * @param {Array} events - Array of event objects
     */
    emitSequence(events) {
        events.forEach(({ type, data, options }) => {
            this.emit(type, data, options);
        });
    }
    
    /**
     * Wait for a specific event to be emitted
     * @param {string} eventType - Event type to wait for
     * @param {number} timeout - Timeout in milliseconds
     * @returns {Promise} Promise that resolves with event data
     */
    waitFor(eventType, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                unsubscribe();
                reject(new Error(`Timeout waiting for event: ${eventType}`));
            }, timeout);
            
            const unsubscribe = this.once(eventType, (data) => {
                clearTimeout(timeoutId);
                resolve(data);
            });
        });
    }
}

export { EventSystem };