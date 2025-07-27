/**
 * Damage Calculator - Advanced damage calculation system
 * @module DamageCalculator
 */

class DamageCalculator {
    constructor() {
        this.DAMAGE_TYPES = {
            PHYSICAL: 'physical',
            MAGICAL: 'magical',
            TRUE: 'true'
        };
        
        this.CRITICAL_HIT_CHANCE = 0.1; // 10% base crit chance
        this.CRITICAL_HIT_MULTIPLIER = 2.0;
        
        this.ELEMENT_TYPES = {
            FIRE: 'fire',
            ICE: 'ice',
            LIGHTNING: 'lightning',
            DARK: 'dark',
            LIGHT: 'light',
            PHYSICAL: 'physical'
        };
        
        // Element effectiveness matrix (attacker -> defender)
        this.ELEMENT_EFFECTIVENESS = {
            [this.ELEMENT_TYPES.FIRE]: {
                [this.ELEMENT_TYPES.ICE]: 2.0,    // Fire strong vs Ice
                [this.ELEMENT_TYPES.FIRE]: 0.5,   // Fire weak vs Fire
                [this.ELEMENT_TYPES.LIGHTNING]: 1.0,
                [this.ELEMENT_TYPES.DARK]: 1.0,
                [this.ELEMENT_TYPES.LIGHT]: 1.0,
                [this.ELEMENT_TYPES.PHYSICAL]: 1.0
            },
            [this.ELEMENT_TYPES.ICE]: {
                [this.ELEMENT_TYPES.FIRE]: 0.5,   // Ice weak vs Fire
                [this.ELEMENT_TYPES.ICE]: 0.5,    // Ice weak vs Ice
                [this.ELEMENT_TYPES.LIGHTNING]: 2.0, // Ice strong vs Lightning
                [this.ELEMENT_TYPES.DARK]: 1.0,
                [this.ELEMENT_TYPES.LIGHT]: 1.0,
                [this.ELEMENT_TYPES.PHYSICAL]: 1.0
            },
            [this.ELEMENT_TYPES.LIGHTNING]: {
                [this.ELEMENT_TYPES.FIRE]: 1.0,
                [this.ELEMENT_TYPES.ICE]: 0.5,    // Lightning weak vs Ice
                [this.ELEMENT_TYPES.LIGHTNING]: 0.5,
                [this.ELEMENT_TYPES.DARK]: 2.0,   // Lightning strong vs Dark
                [this.ELEMENT_TYPES.LIGHT]: 1.0,
                [this.ELEMENT_TYPES.PHYSICAL]: 1.0
            },
            [this.ELEMENT_TYPES.DARK]: {
                [this.ELEMENT_TYPES.FIRE]: 1.0,
                [this.ELEMENT_TYPES.ICE]: 1.0,
                [this.ELEMENT_TYPES.LIGHTNING]: 0.5, // Dark weak vs Lightning
                [this.ELEMENT_TYPES.DARK]: 1.0,
                [this.ELEMENT_TYPES.LIGHT]: 0.5,  // Dark weak vs Light
                [this.ELEMENT_TYPES.PHYSICAL]: 1.0
            },
            [this.ELEMENT_TYPES.LIGHT]: {
                [this.ELEMENT_TYPES.FIRE]: 1.0,
                [this.ELEMENT_TYPES.ICE]: 1.0,
                [this.ELEMENT_TYPES.LIGHTNING]: 1.0,
                [this.ELEMENT_TYPES.DARK]: 2.0,   // Light strong vs Dark
                [this.ELEMENT_TYPES.LIGHT]: 1.0,
                [this.ELEMENT_TYPES.PHYSICAL]: 1.0
            },
            [this.ELEMENT_TYPES.PHYSICAL]: {
                [this.ELEMENT_TYPES.FIRE]: 1.0,
                [this.ELEMENT_TYPES.ICE]: 1.0,
                [this.ELEMENT_TYPES.LIGHTNING]: 1.0,
                [this.ELEMENT_TYPES.DARK]: 1.0,
                [this.ELEMENT_TYPES.LIGHT]: 1.0,
                [this.ELEMENT_TYPES.PHYSICAL]: 1.0
            }
        };
    }
    
    /**
     * Calculate damage with all modifiers
     * @param {Object} attackData - Attack data
     * @param {Object} defenderData - Defender data
     * @returns {Object} Damage result
     */
    calculateDamage(attackData, defenderData) {
        const {
            attack = 10,
            damageType = this.DAMAGE_TYPES.PHYSICAL,
            element = this.ELEMENT_TYPES.PHYSICAL,
            critChance = this.CRITICAL_HIT_CHANCE,
            critMultiplier = this.CRITICAL_HIT_MULTIPLIER,
            level = 1,
            accuracy = 0.9
        } = attackData;
        
        const {
            defense = 5,
            magicDefense = 5,
            element: defenderElement = this.ELEMENT_TYPES.PHYSICAL,
            level: defenderLevel = 1,
            evasion = 0.1
        } = defenderData;
        
        // Check if attack hits
        const hitChance = Math.max(0.05, accuracy - evasion);
        const isHit = Math.random() < hitChance;
        
        if (!isHit) {
            return {
                damage: 0,
                isCritical: false,
                isMiss: true,
                damageType,
                element,
                effectiveness: 1.0
            };
        }
        
        // Determine defense to use based on damage type
        let effectiveDefense;
        switch (damageType) {
            case this.DAMAGE_TYPES.PHYSICAL:
                effectiveDefense = defense;
                break;
            case this.DAMAGE_TYPES.MAGICAL:
                effectiveDefense = magicDefense;
                break;
            case this.DAMAGE_TYPES.TRUE:
                effectiveDefense = 0; // True damage ignores defense
                break;
            default:
                effectiveDefense = defense;
        }
        
        // Calculate base damage
        let baseDamage = this.calculateBaseDamage(attack, effectiveDefense, level, defenderLevel);
        
        // Apply element effectiveness
        const effectiveness = this.getElementEffectiveness(element, defenderElement);
        baseDamage = Math.floor(baseDamage * effectiveness);
        
        // Check for critical hit
        const isCritical = Math.random() < critChance;
        if (isCritical) {
            baseDamage = Math.floor(baseDamage * critMultiplier);
        }
        
        // Apply random variance (±10%)
        const variance = Math.floor(baseDamage * 0.1);
        const randomVariance = Math.floor(Math.random() * (variance * 2 + 1)) - variance;
        baseDamage += randomVariance;
        
        // Ensure minimum damage
        const finalDamage = Math.max(1, baseDamage);
        
        return {
            damage: finalDamage,
            isCritical,
            isMiss: false,
            damageType,
            element,
            effectiveness,
            baseDamage: baseDamage - randomVariance,
            variance: randomVariance
        };
    }
    
    /**
     * Calculate base damage using attack and defense
     * @param {number} attack - Attack value
     * @param {number} defense - Defense value
     * @param {number} attackerLevel - Attacker level
     * @param {number} defenderLevel - Defender level
     * @returns {number} Base damage
     */
    calculateBaseDamage(attack, defense, attackerLevel, defenderLevel) {
        // Level difference modifier
        const levelDifference = attackerLevel - defenderLevel;
        const levelModifier = 1.0 + (levelDifference * 0.1); // 10% per level difference
        
        // Base damage formula: (attack * 2 - defense) * level_modifier
        const baseDamage = Math.max(1, (attack * 2 - defense) * levelModifier);
        
        return Math.floor(baseDamage);
    }
    
    /**
     * Get element effectiveness multiplier
     * @param {string} attackElement - Attacking element
     * @param {string} defendElement - Defending element
     * @returns {number} Effectiveness multiplier
     */
    getElementEffectiveness(attackElement, defendElement) {
        if (!this.ELEMENT_EFFECTIVENESS[attackElement]) {
            return 1.0;
        }
        
        return this.ELEMENT_EFFECTIVENESS[attackElement][defendElement] || 1.0;
    }
    
    /**
     * Calculate healing amount
     * @param {Object} healData - Healing data
     * @param {Object} targetData - Target data
     * @returns {Object} Healing result
     */
    calculateHealing(healData, targetData) {
        const {
            healPower = 10,
            level = 1,
            isPercentage = false
        } = healData;
        
        const {
            maxHp = 100,
            currentHp = 50
        } = targetData;
        
        let healAmount;
        
        if (isPercentage) {
            // Percentage-based healing
            healAmount = Math.floor(maxHp * (healPower / 100));
        } else {
            // Fixed healing with level scaling
            const levelMultiplier = 1.0 + (level - 1) * 0.1;
            healAmount = Math.floor(healPower * levelMultiplier);
        }
        
        // Apply random variance (±5%)
        const variance = Math.floor(healAmount * 0.05);
        const randomVariance = Math.floor(Math.random() * (variance * 2 + 1)) - variance;
        healAmount += randomVariance;
        
        // Calculate actual healing (can't exceed max HP)
        const actualHeal = Math.min(healAmount, maxHp - currentHp);
        const newHp = currentHp + actualHeal;
        
        return {
            healAmount: actualHeal,
            newHp,
            isOverheal: healAmount > actualHeal,
            overhealAmount: healAmount - actualHeal
        };
    }
    
    /**
     * Calculate status effect damage (DoT, poison, etc.)
     * @param {Object} effectData - Status effect data
     * @param {Object} targetData - Target data
     * @returns {Object} Status damage result
     */
    calculateStatusDamage(effectData, targetData) {
        const {
            baseDamage = 5,
            damageType = this.DAMAGE_TYPES.MAGICAL,
            duration = 3,
            stackCount = 1,
            level = 1
        } = effectData;
        
        // Calculate damage per tick
        let tickDamage = baseDamage * stackCount;
        
        // Level scaling
        const levelMultiplier = 1.0 + (level - 1) * 0.05; // 5% per level
        tickDamage = Math.floor(tickDamage * levelMultiplier);
        
        // Apply defense if it's not true damage
        if (damageType !== this.DAMAGE_TYPES.TRUE) {
            const defense = damageType === this.DAMAGE_TYPES.PHYSICAL ? 
                (targetData.defense || 0) : (targetData.magicDefense || 0);
            tickDamage = Math.max(1, tickDamage - Math.floor(defense / 4));
        }
        
        return {
            tickDamage,
            totalDamage: tickDamage * duration,
            damageType,
            duration,
            stackCount
        };
    }
    
    /**
     * Calculate experience gain from combat
     * @param {Object} victimData - Defeated enemy data
     * @param {Object} victorData - Victorious player data
     * @returns {number} Experience gained
     */
    calculateExpGain(victimData, victorData) {
        const {
            level: enemyLevel = 1,
            baseExpReward = 10
        } = victimData;
        
        const {
            level: playerLevel = 1
        } = victorData;
        
        // Base experience
        let expGain = baseExpReward * enemyLevel;
        
        // Level difference modifier
        const levelDifference = enemyLevel - playerLevel;
        if (levelDifference > 0) {
            // Bonus XP for defeating higher level enemies
            expGain = Math.floor(expGain * (1.0 + levelDifference * 0.2));
        } else if (levelDifference < -5) {
            // Reduced XP for defeating much lower level enemies
            expGain = Math.floor(expGain * 0.5);
        }
        
        return Math.max(1, expGain);
    }
    
    /**
     * Calculate material drop chance and quantity
     * @param {Object} enemyData - Enemy data
     * @param {Object} playerData - Player data  
     * @returns {Array} Array of dropped materials
     */
    calculateMaterialDrop(enemyData, playerData) {
        const {
            dropTable = [],
            level: enemyLevel = 1
        } = enemyData;
        
        const {
            level: playerLevel = 1,
            luck = 0
        } = playerData;
        
        const drops = [];
        
        for (const dropData of dropTable) {
            const {
                materialId,
                baseChance = 0.1,
                minQuantity = 1,
                maxQuantity = 1,
                rarity = 'common'
            } = dropData;
            
            // Calculate drop chance with luck modifier
            const luckBonus = luck * 0.01; // 1% per luck point
            const dropChance = Math.min(0.95, baseChance + luckBonus);
            
            if (Math.random() < dropChance) {
                // Calculate quantity
                const quantity = Math.floor(
                    Math.random() * (maxQuantity - minQuantity + 1) + minQuantity
                );
                
                drops.push({
                    materialId,
                    quantity,
                    rarity
                });
            }
        }
        
        return drops;
    }
    
    /**
     * Get damage description for UI display
     * @param {Object} damageResult - Result from calculateDamage
     * @returns {string} Formatted damage description
     */
    getDamageDescription(damageResult) {
        const { damage, isCritical, isMiss, effectiveness, element } = damageResult;
        
        if (isMiss) {
            return 'Miss!';
        }
        
        let description = `${damage}`;
        
        if (isCritical) {
            description += ' (Critical!)';
        }
        
        if (effectiveness > 1.0) {
            description += ' (Super Effective!)';
        } else if (effectiveness < 1.0) {
            description += ' (Not Very Effective...)';
        }
        
        return description;
    }
    
    /**
     * Get element color for UI display
     * @param {string} element - Element type
     * @returns {string} CSS color code
     */
    getElementColor(element) {
        const colors = {
            [this.ELEMENT_TYPES.FIRE]: '#ff6b6b',
            [this.ELEMENT_TYPES.ICE]: '#74c0fc',
            [this.ELEMENT_TYPES.LIGHTNING]: '#ffd43b',
            [this.ELEMENT_TYPES.DARK]: '#6c5ce7',
            [this.ELEMENT_TYPES.LIGHT]: '#fdcb6e',
            [this.ELEMENT_TYPES.PHYSICAL]: '#ffffff'
        };
        
        return colors[element] || '#ffffff';
    }
}

export { DamageCalculator };