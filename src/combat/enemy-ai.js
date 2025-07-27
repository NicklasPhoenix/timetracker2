/**
 * Enemy AI - Basic enemy behavior patterns and decision making
 * @module EnemyAI
 */

class EnemyAI {
    constructor() {
        this.AI_TYPES = {
            AGGRESSIVE: 'aggressive',    // Always attacks
            DEFENSIVE: 'defensive',      // Prefers to defend when low HP
            BALANCED: 'balanced',        // Mix of attack and defense
            SMART: 'smart',             // Uses abilities strategically
            BERSERKER: 'berserker',     // Gets more aggressive at low HP
            HEALER: 'healer'            // Focuses on healing/support
        };
        
        this.ACTIONS = {
            ATTACK: 'attack',
            DEFEND: 'defend',
            SPECIAL: 'special',
            HEAL: 'heal',
            FLEE: 'flee'
        };
        
        this.DIFFICULTY_MODIFIERS = {
            EASY: {
                reactionTime: 2000,     // 2 seconds
                mistakeChance: 0.3,     // 30% chance to make suboptimal choice
                abilityUsage: 0.1       // 10% chance to use special abilities
            },
            NORMAL: {
                reactionTime: 1500,     // 1.5 seconds
                mistakeChance: 0.15,    // 15% chance to make suboptimal choice
                abilityUsage: 0.25      // 25% chance to use special abilities
            },
            HARD: {
                reactionTime: 1000,     // 1 second
                mistakeChance: 0.05,    // 5% chance to make suboptimal choice
                abilityUsage: 0.4       // 40% chance to use special abilities
            },
            NIGHTMARE: {
                reactionTime: 500,      // 0.5 seconds
                mistakeChance: 0.0,     // Never makes mistakes
                abilityUsage: 0.6       // 60% chance to use special abilities
            }
        };
    }
    
    /**
     * Decide enemy action based on AI type and current situation
     * @param {Object} enemy - Enemy data
     * @param {Object} player - Player data
     * @param {Object} combatState - Current combat state
     * @returns {Object} AI decision
     */
    decideAction(enemy, player, combatState) {
        const aiType = enemy.aiType || this.AI_TYPES.BALANCED;
        const difficulty = enemy.difficulty || 'NORMAL';
        const modifiers = this.DIFFICULTY_MODIFIERS[difficulty];
        
        // Calculate situation assessment
        const situation = this.assessSituation(enemy, player, combatState);
        
        // Get base decision from AI type
        let decision = this.getBaseDecision(aiType, situation, enemy);
        
        // Apply difficulty modifiers
        decision = this.applyDifficultyModifiers(decision, modifiers, situation);
        
        // Add reaction delay
        decision.delay = modifiers.reactionTime + Math.random() * 500; // Add some variance
        
        return decision;
    }
    
    /**
     * Assess the current combat situation
     * @param {Object} enemy - Enemy data
     * @param {Object} player - Player data
     * @param {Object} combatState - Combat state
     * @returns {Object} Situation assessment
     */
    assessSituation(enemy, player, combatState) {
        const enemyHpPercent = enemy.hp / enemy.maxHp;
        const playerHpPercent = player.hp / player.maxHp;
        
        return {
            enemyHpPercent,
            playerHpPercent,
            enemyIsLowHp: enemyHpPercent < 0.3,
            playerIsLowHp: playerHpPercent < 0.3,
            enemyIsCritical: enemyHpPercent < 0.15,
            playerIsCritical: playerHpPercent < 0.15,
            turnCount: combatState.turnCount || 0,
            playerLastAction: combatState.playerLastAction,
            enemyCanHeal: enemy.abilities && enemy.abilities.some(a => a.type === 'heal'),
            enemyCanSpecial: enemy.abilities && enemy.abilities.length > 0,
            statusEffects: combatState.statusEffects || []
        };
    }
    
    /**
     * Get base decision based on AI type
     * @param {string} aiType - AI behavior type
     * @param {Object} situation - Situation assessment
     * @param {Object} enemy - Enemy data
     * @returns {Object} Base decision
     */
    getBaseDecision(aiType, situation, enemy) {
        switch (aiType) {
            case this.AI_TYPES.AGGRESSIVE:
                return this.getAggressiveDecision(situation, enemy);
                
            case this.AI_TYPES.DEFENSIVE:
                return this.getDefensiveDecision(situation, enemy);
                
            case this.AI_TYPES.BALANCED:
                return this.getBalancedDecision(situation, enemy);
                
            case this.AI_TYPES.SMART:
                return this.getSmartDecision(situation, enemy);
                
            case this.AI_TYPES.BERSERKER:
                return this.getBerserkerDecision(situation, enemy);
                
            case this.AI_TYPES.HEALER:
                return this.getHealerDecision(situation, enemy);
                
            default:
                return this.getBalancedDecision(situation, enemy);
        }
    }
    
    /**
     * Aggressive AI - Always attacks unless critically low HP
     * @param {Object} situation - Situation assessment
     * @param {Object} enemy - Enemy data
     * @returns {Object} Decision
     */
    getAggressiveDecision(situation, enemy) {
        if (situation.enemyIsCritical && situation.enemyCanHeal) {
            return {
                action: this.ACTIONS.HEAL,
                priority: 0.9,
                reasoning: 'Critical HP - emergency heal'
            };
        }
        
        if (situation.enemyCanSpecial && Math.random() < 0.4) {
            return {
                action: this.ACTIONS.SPECIAL,
                priority: 0.8,
                reasoning: 'Use special ability to maximize damage',
                abilityIndex: 0 // Use first available ability
            };
        }
        
        return {
            action: this.ACTIONS.ATTACK,
            priority: 1.0,
            reasoning: 'Aggressive - always attack'
        };
    }
    
    /**
     * Defensive AI - Prefers defense and healing
     * @param {Object} situation - Situation assessment
     * @param {Object} enemy - Enemy data
     * @returns {Object} Decision
     */
    getDefensiveDecision(situation, enemy) {
        if (situation.enemyIsLowHp && situation.enemyCanHeal) {
            return {
                action: this.ACTIONS.HEAL,
                priority: 0.9,
                reasoning: 'Low HP - prioritize healing'
            };
        }
        
        if (situation.playerLastAction === 'attack' && Math.random() < 0.6) {
            return {
                action: this.ACTIONS.DEFEND,
                priority: 0.7,
                reasoning: 'Player attacked last turn - defend'
            };
        }
        
        return {
            action: this.ACTIONS.ATTACK,
            priority: 0.5,
            reasoning: 'Safe to attack'
        };
    }
    
    /**
     * Balanced AI - Mix of strategies
     * @param {Object} situation - Situation assessment
     * @param {Object} enemy - Enemy data
     * @returns {Object} Decision
     */
    getBalancedDecision(situation, enemy) {
        if (situation.enemyIsLowHp && situation.enemyCanHeal) {
            return {
                action: this.ACTIONS.HEAL,
                priority: 0.8,
                reasoning: 'Low HP - heal'
            };
        }
        
        if (situation.playerIsLowHp && Math.random() < 0.7) {
            return {
                action: this.ACTIONS.ATTACK,
                priority: 0.9,
                reasoning: 'Player is vulnerable - attack'
            };
        }
        
        if (situation.enemyCanSpecial && Math.random() < 0.25) {
            return {
                action: this.ACTIONS.SPECIAL,
                priority: 0.6,
                reasoning: 'Good opportunity for special ability',
                abilityIndex: Math.floor(Math.random() * enemy.abilities.length)
            };
        }
        
        // Random choice between attack and defend
        const choice = Math.random();
        if (choice < 0.7) {
            return {
                action: this.ACTIONS.ATTACK,
                priority: 0.7,
                reasoning: 'Standard attack'
            };
        } else {
            return {
                action: this.ACTIONS.DEFEND,
                priority: 0.3,
                reasoning: 'Defensive stance'
            };
        }
    }
    
    /**
     * Smart AI - Uses optimal strategies
     * @param {Object} situation - Situation assessment
     * @param {Object} enemy - Enemy data
     * @returns {Object} Decision
     */
    getSmartDecision(situation, enemy) {
        // Priority 1: Survive if critical
        if (situation.enemyIsCritical && situation.enemyCanHeal) {
            return {
                action: this.ACTIONS.HEAL,
                priority: 1.0,
                reasoning: 'Critical HP - must heal'
            };
        }
        
        // Priority 2: Finish off critical player
        if (situation.playerIsCritical) {
            if (situation.enemyCanSpecial) {
                return {
                    action: this.ACTIONS.SPECIAL,
                    priority: 0.95,
                    reasoning: 'Player critical - use strongest attack',
                    abilityIndex: this.getBestOffensiveAbility(enemy)
                };
            } else {
                return {
                    action: this.ACTIONS.ATTACK,
                    priority: 0.9,
                    reasoning: 'Player critical - finish them'
                };
            }
        }
        
        // Priority 3: Heal if low HP
        if (situation.enemyIsLowHp && situation.enemyCanHeal) {
            return {
                action: this.ACTIONS.HEAL,
                priority: 0.8,
                reasoning: 'Low HP - heal before continuing'
            };
        }
        
        // Priority 4: Use abilities strategically
        if (situation.enemyCanSpecial && this.shouldUseAbility(situation, enemy)) {
            return {
                action: this.ACTIONS.SPECIAL,
                priority: 0.7,
                reasoning: 'Strategic ability use',
                abilityIndex: this.getBestAbility(situation, enemy)
            };
        }
        
        // Priority 5: Defend if player is preparing big attack
        if (situation.playerLastAction === 'special' && Math.random() < 0.8) {
            return {
                action: this.ACTIONS.DEFEND,
                priority: 0.6,
                reasoning: 'Player may use powerful attack - defend'
            };
        }
        
        // Default: Attack
        return {
            action: this.ACTIONS.ATTACK,
            priority: 0.5,
            reasoning: 'Standard attack'
        };
    }
    
    /**
     * Berserker AI - Gets more aggressive as HP decreases
     * @param {Object} situation - Situation assessment
     * @param {Object} enemy - Enemy data
     * @returns {Object} Decision
     */
    getBerserkerDecision(situation, enemy) {
        const aggressionLevel = 1.0 - situation.enemyHpPercent; // More aggressive as HP drops
        
        // Only heal if absolutely critical
        if (situation.enemyHpPercent < 0.1 && situation.enemyCanHeal && Math.random() < 0.3) {
            return {
                action: this.ACTIONS.HEAL,
                priority: 0.6,
                reasoning: 'Last resort heal'
            };
        }
        
        // High chance to use special abilities when berserk
        if (situation.enemyCanSpecial && Math.random() < aggressionLevel) {
            return {
                action: this.ACTIONS.SPECIAL,
                priority: 0.8 + aggressionLevel * 0.2,
                reasoning: `Berserker rage - aggression level ${aggressionLevel.toFixed(2)}`,
                abilityIndex: 0 // Always use first (usually most aggressive) ability
            };
        }
        
        return {
            action: this.ACTIONS.ATTACK,
            priority: 0.8 + aggressionLevel * 0.2,
            reasoning: `Berserker attack - aggression level ${aggressionLevel.toFixed(2)}`
        };
    }
    
    /**
     * Healer AI - Focuses on survival and support
     * @param {Object} situation - Situation assessment
     * @param {Object} enemy - Enemy data
     * @returns {Object} Decision
     */
    getHealerDecision(situation, enemy) {
        // Always heal if below 70% HP
        if (situation.enemyHpPercent < 0.7 && situation.enemyCanHeal) {
            return {
                action: this.ACTIONS.HEAL,
                priority: 0.9,
                reasoning: 'Healer - maintain high HP'
            };
        }
        
        // Use defensive abilities
        if (situation.enemyCanSpecial && Math.random() < 0.4) {
            const defensiveAbility = this.getBestDefensiveAbility(enemy);
            if (defensiveAbility !== -1) {
                return {
                    action: this.ACTIONS.SPECIAL,
                    priority: 0.7,
                    reasoning: 'Use defensive ability',
                    abilityIndex: defensiveAbility
                };
            }
        }
        
        // Prefer defending over attacking
        if (Math.random() < 0.6) {
            return {
                action: this.ACTIONS.DEFEND,
                priority: 0.5,
                reasoning: 'Healer - defensive stance'
            };
        }
        
        return {
            action: this.ACTIONS.ATTACK,
            priority: 0.3,
            reasoning: 'Healer - weak attack'
        };
    }
    
    /**
     * Apply difficulty modifiers to the base decision
     * @param {Object} decision - Base decision
     * @param {Object} modifiers - Difficulty modifiers
     * @param {Object} situation - Situation assessment
     * @returns {Object} Modified decision
     */
    applyDifficultyModifiers(decision, modifiers, situation) {
        // Check if AI makes a mistake
        if (Math.random() < modifiers.mistakeChance) {
            return this.makeMistake(decision, situation);
        }
        
        // Modify special ability usage
        if (decision.action === this.ACTIONS.SPECIAL) {
            if (Math.random() > modifiers.abilityUsage) {
                // Don't use special ability, fall back to attack
                return {
                    action: this.ACTIONS.ATTACK,
                    priority: decision.priority * 0.8,
                    reasoning: 'Difficulty modifier - no special ability'
                };
            }
        }
        
        return decision;
    }
    
    /**
     * Make a suboptimal decision (AI mistake)
     * @param {Object} originalDecision - Original decision
     * @param {Object} situation - Situation assessment
     * @returns {Object} Mistake decision
     */
    makeMistake(originalDecision, situation) {
        const mistakes = [
            {
                action: this.ACTIONS.DEFEND,
                priority: 0.2,
                reasoning: 'AI mistake - unnecessary defend'
            },
            {
                action: this.ACTIONS.ATTACK,
                priority: 0.3,
                reasoning: 'AI mistake - suboptimal attack'
            }
        ];
        
        // Don't make critical mistakes (like not healing when critical)
        if (situation.enemyIsCritical && originalDecision.action === this.ACTIONS.HEAL) {
            return originalDecision;
        }
        
        const mistake = mistakes[Math.floor(Math.random() * mistakes.length)];
        return {
            ...mistake,
            isMistake: true
        };
    }
    
    /**
     * Determine if AI should use an ability
     * @param {Object} situation - Situation assessment
     * @param {Object} enemy - Enemy data
     * @returns {boolean} Should use ability
     */
    shouldUseAbility(situation, enemy) {
        if (!enemy.abilities || enemy.abilities.length === 0) return false;
        
        // Don't spam abilities
        if (situation.turnCount < 2) return false;
        
        // Higher chance if player is low HP
        if (situation.playerIsLowHp) return Math.random() < 0.8;
        
        // Regular chance
        return Math.random() < 0.3;
    }
    
    /**
     * Get the best offensive ability index
     * @param {Object} enemy - Enemy data
     * @returns {number} Ability index
     */
    getBestOffensiveAbility(enemy) {
        if (!enemy.abilities) return 0;
        
        // Find ability with highest damage
        let bestIndex = 0;
        let bestDamage = 0;
        
        enemy.abilities.forEach((ability, index) => {
            if (ability.type === 'attack' && ability.damage > bestDamage) {
                bestDamage = ability.damage;
                bestIndex = index;
            }
        });
        
        return bestIndex;
    }
    
    /**
     * Get the best defensive ability index
     * @param {Object} enemy - Enemy data
     * @returns {number} Ability index or -1 if none
     */
    getBestDefensiveAbility(enemy) {
        if (!enemy.abilities) return -1;
        
        // Find defensive abilities
        for (let i = 0; i < enemy.abilities.length; i++) {
            const ability = enemy.abilities[i];
            if (ability.type === 'defend' || ability.type === 'buff') {
                return i;
            }
        }
        
        return -1;
    }
    
    /**
     * Get the best ability for current situation
     * @param {Object} situation - Situation assessment
     * @param {Object} enemy - Enemy data
     * @returns {number} Ability index
     */
    getBestAbility(situation, enemy) {
        if (!enemy.abilities) return 0;
        
        // If player is low HP, use offensive abilities
        if (situation.playerIsLowHp) {
            return this.getBestOffensiveAbility(enemy);
        }
        
        // If enemy is low HP, use defensive abilities
        if (situation.enemyIsLowHp) {
            const defensiveIndex = this.getBestDefensiveAbility(enemy);
            return defensiveIndex !== -1 ? defensiveIndex : 0;
        }
        
        // Random ability
        return Math.floor(Math.random() * enemy.abilities.length);
    }
    
    /**
     * Get AI behavior description for debugging
     * @param {string} aiType - AI type
     * @returns {string} Description
     */
    getAIDescription(aiType) {
        const descriptions = {
            [this.AI_TYPES.AGGRESSIVE]: 'Focuses on dealing maximum damage',
            [this.AI_TYPES.DEFENSIVE]: 'Prioritizes survival and healing',
            [this.AI_TYPES.BALANCED]: 'Uses a mix of offensive and defensive tactics',
            [this.AI_TYPES.SMART]: 'Makes optimal decisions based on situation',
            [this.AI_TYPES.BERSERKER]: 'Becomes more aggressive as HP decreases',
            [this.AI_TYPES.HEALER]: 'Focuses on healing and support abilities'
        };
        
        return descriptions[aiType] || 'Unknown AI behavior';
    }
}

export { EnemyAI };