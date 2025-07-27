/**
 * Boss Manager - Handles boss encounters, mechanics, and rewards
 * Phase 8 Implementation: Boss System & Special Events
 */

class BossManager {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.bosses = new Map();
        this.currentBoss = null;
        this.bossPhase = 0;
        this.bossDefeated = new Set();
        this.eventEmitter = null;
        
        this.initializeBosses();
        console.log('👑 Boss Manager initialized');
    }

    initializeBosses() {
        // Stage 1 Boss: Forest Guardian
        this.bosses.set(1, {
            id: 'forest_guardian',
            name: 'Forest Guardian',
            description: 'Ancient protector of the Forest Outskirts',
            level: 5,
            baseHp: 150,
            baseDamage: 18,
            defense: 8,
            phases: [
                {
                    name: 'Guardian Mode',
                    hpThreshold: 1.0,
                    abilities: ['slash', 'root_bind'],
                    damageMultiplier: 1.0
                },
                {
                    name: 'Enraged Mode',
                    hpThreshold: 0.4,
                    abilities: ['fury_swipe', 'thorn_storm'],
                    damageMultiplier: 1.5
                }
            ],
            rewards: {
                experience: 250,
                materials: [
                    { type: 'rare_wood', amount: 3, chance: 1.0 },
                    { type: 'guardian_essence', amount: 1, chance: 0.8 }
                ],
                equipment: [
                    { type: 'Guardian\'s Sword', chance: 0.3 },
                    { type: 'Forest Cloak', chance: 0.2 }
                ]
            },
            unlockRequirement: { stage: 1, victories: 7 }
        });

        // Stage 2 Boss: Mountain King
        this.bosses.set(2, {
            id: 'mountain_king',
            name: 'Mountain King',
            description: 'Ruler of the rocky highlands',
            level: 10,
            baseHp: 300,
            baseDamage: 25,
            defense: 15,
            phases: [
                {
                    name: 'Stone Form',
                    hpThreshold: 1.0,
                    abilities: ['boulder_throw', 'stone_shield'],
                    damageMultiplier: 1.0
                },
                {
                    name: 'Earthquake Rage',
                    hpThreshold: 0.5,
                    abilities: ['earthquake', 'rock_avalanche'],
                    damageMultiplier: 1.3
                }
            ],
            rewards: {
                experience: 500,
                materials: [
                    { type: 'mountain_stone', amount: 5, chance: 1.0 },
                    { type: 'king_crown_fragment', amount: 1, chance: 0.6 }
                ],
                equipment: [
                    { type: 'Mountain Hammer', chance: 0.4 },
                    { type: 'Stone Armor', chance: 0.25 }
                ]
            },
            unlockRequirement: { stage: 2, victories: 10 }
        });

        // Stage 3 Boss: Desert Pharaoh
        this.bosses.set(3, {
            id: 'desert_pharaoh',
            name: 'Desert Pharaoh',
            description: 'Ancient ruler awakened from eternal slumber',
            level: 15,
            baseHp: 450,
            baseDamage: 32,
            defense: 20,
            phases: [
                {
                    name: 'Awakening',
                    hpThreshold: 1.0,
                    abilities: ['sand_blast', 'mummy_summon'],
                    damageMultiplier: 1.0
                },
                {
                    name: 'Divine Wrath',
                    hpThreshold: 0.6,
                    abilities: ['solar_beam', 'sand_storm'],
                    damageMultiplier: 1.4
                },
                {
                    name: 'Final Curse',
                    hpThreshold: 0.2,
                    abilities: ['death_curse', 'pharaoh_resurrection'],
                    damageMultiplier: 1.8
                }
            ],
            rewards: {
                experience: 750,
                materials: [
                    { type: 'golden_scarab', amount: 2, chance: 1.0 },
                    { type: 'pharaoh_seal', amount: 1, chance: 0.7 }
                ],
                equipment: [
                    { type: 'Pharaoh\'s Staff', chance: 0.5 },
                    { type: 'Golden Ankh', chance: 0.3 }
                ]
            },
            unlockRequirement: { stage: 3, victories: 12 }
        });

        // Stage 4 Boss: Ice Empress
        this.bosses.set(4, {
            id: 'ice_empress',
            name: 'Ice Empress',
            description: 'Eternal ruler of the frozen wastes',
            level: 20,
            baseHp: 600,
            baseDamage: 38,
            defense: 25,
            phases: [
                {
                    name: 'Frozen Heart',
                    hpThreshold: 1.0,
                    abilities: ['ice_shard', 'frost_armor'],
                    damageMultiplier: 1.0
                },
                {
                    name: 'Blizzard Form',
                    hpThreshold: 0.5,
                    abilities: ['blizzard', 'ice_prison'],
                    damageMultiplier: 1.6
                },
                {
                    name: 'Absolute Zero',
                    hpThreshold: 0.15,
                    abilities: ['absolute_zero', 'ice_resurrection'],
                    damageMultiplier: 2.0
                }
            ],
            rewards: {
                experience: 1000,
                materials: [
                    { type: 'eternal_ice', amount: 3, chance: 1.0 },
                    { type: 'empress_crown', amount: 1, chance: 0.5 }
                ],
                equipment: [
                    { type: 'Frost Blade', chance: 0.6 },
                    { type: 'Ice Empress Robes', chance: 0.4 }
                ]
            },
            unlockRequirement: { stage: 4, victories: 15 }
        });

        // Stage 5 Boss: Crystal Dragon
        this.bosses.set(5, {
            id: 'crystal_dragon',
            name: 'Crystal Dragon',
            description: 'Guardian of the sacred Crystal Sanctum',
            level: 25,
            baseHp: 800,
            baseDamage: 45,
            defense: 30,
            phases: [
                {
                    name: 'Crystal Scales',
                    hpThreshold: 1.0,
                    abilities: ['crystal_breath', 'wing_buffet'],
                    damageMultiplier: 1.0
                },
                {
                    name: 'Prism Fury',
                    hpThreshold: 0.7,
                    abilities: ['prism_beam', 'crystal_storm'],
                    damageMultiplier: 1.5
                },
                {
                    name: 'Dragon\'s Wrath',
                    hpThreshold: 0.4,
                    abilities: ['flame_crystal_breath', 'tail_smash'],
                    damageMultiplier: 1.8
                },
                {
                    name: 'Final Ascension',
                    hpThreshold: 0.1,
                    abilities: ['dragon_nova', 'crystal_rebirth'],
                    damageMultiplier: 2.5
                }
            ],
            rewards: {
                experience: 1500,
                materials: [
                    { type: 'dragon_crystal', amount: 5, chance: 1.0 },
                    { type: 'dragon_heart', amount: 1, chance: 0.8 }
                ],
                equipment: [
                    { type: 'Dragonscale Armor', chance: 0.7 },
                    { type: 'Crystal Dragon Sword', chance: 0.5 },
                    { type: 'Dragon\'s Eye Amulet', chance: 0.3 }
                ]
            },
            unlockRequirement: { stage: 5, victories: 20 }
        });
    }

    setEventEmitter(eventEmitter) {
        this.eventEmitter = eventEmitter;
        
        // Listen for state loaded event
        this.eventEmitter.on('stateLoaded', () => this.onStateLoaded());
    }

    onStateLoaded() {
        // Load boss state from the game state
        const gameState = this.stateManager.getState();
        if (gameState && gameState.bosses) {
            this.loadState(gameState.bosses);
        } else {
            // Initialize boss state if it doesn't exist
            this.stateManager.setState({
                bosses: {
                    bossesDefeated: []
                }
            });
        }
        console.log('👑 Boss system loaded');
    }

    // Check if a boss is unlocked for a specific stage
    isBossUnlocked(stageId, stageVictories) {
        const boss = this.bosses.get(stageId);
        if (!boss) return false;
        
        return stageVictories >= boss.unlockRequirement.victories;
    }

    // Get boss data for a specific stage
    getBoss(stageId) {
        return this.bosses.get(stageId);
    }

    // Check if a boss has been defeated
    isBossDefeated(stageId) {
        return this.bossDefeated.has(stageId);
    }

    // Start a boss encounter
    startBossEncounter(stageId, playerLevel = 1) {
        const boss = this.bosses.get(stageId);
        if (!boss) {
            console.error(`Boss not found for stage ${stageId}`);
            return null;
        }

        // Scale boss stats based on player level
        const levelMultiplier = 1 + (playerLevel - 1) * 0.1;
        
        this.currentBoss = {
            ...boss,
            currentHp: Math.floor(boss.baseHp * levelMultiplier),
            maxHp: Math.floor(boss.baseHp * levelMultiplier),
            damage: Math.floor(boss.baseDamage * levelMultiplier),
            currentPhase: 0,
            abilities: [...boss.phases[0].abilities],
            damageMultiplier: boss.phases[0].damageMultiplier
        };

        this.bossPhase = 0;
        
        if (this.eventEmitter) {
            this.eventEmitter.emit('bossEncounterStart', {
                boss: this.currentBoss,
                stage: stageId
            });
        }

        console.log(`👑 Boss encounter started: ${boss.name} (Stage ${stageId})`);
        return this.currentBoss;
    }

    // Update boss phase based on current HP
    updateBossPhase() {
        if (!this.currentBoss) return;

        const hpPercentage = this.currentBoss.currentHp / this.currentBoss.maxHp;
        const phases = this.bosses.get(this.getCurrentBossStage()).phases;
        
        for (let i = phases.length - 1; i >= 0; i--) {
            if (hpPercentage <= phases[i].hpThreshold && i > this.bossPhase) {
                this.bossPhase = i;
                this.currentBoss.abilities = [...phases[i].abilities];
                this.currentBoss.damageMultiplier = phases[i].damageMultiplier;
                
                if (this.eventEmitter) {
                    this.eventEmitter.emit('bossPhaseChange', {
                        phase: i,
                        phaseName: phases[i].name,
                        boss: this.currentBoss
                    });
                }
                
                console.log(`👑 Boss entered phase ${i + 1}: ${phases[i].name}`);
                break;
            }
        }
    }

    // Get current boss stage ID
    getCurrentBossStage() {
        if (!this.currentBoss) return null;
        
        for (const [stageId, boss] of this.bosses) {
            if (boss.id === this.currentBoss.id) {
                return stageId;
            }
        }
        return null;
    }

    // Deal damage to boss
    damageBoss(damage) {
        if (!this.currentBoss) return false;

        const actualDamage = Math.max(1, damage - this.currentBoss.defense);
        this.currentBoss.currentHp = Math.max(0, this.currentBoss.currentHp - actualDamage);
        
        this.updateBossPhase();
        
        if (this.eventEmitter) {
            this.eventEmitter.emit('bossDamaged', {
                damage: actualDamage,
                boss: this.currentBoss,
                defeated: this.currentBoss.currentHp <= 0
            });
        }

        if (this.currentBoss.currentHp <= 0) {
            return this.defeatBoss();
        }

        return { damaged: true, hp: this.currentBoss.currentHp };
    }

    // Handle boss defeat
    defeatBoss() {
        if (!this.currentBoss) return null;

        const stageId = this.getCurrentBossStage();
        const boss = this.bosses.get(stageId);
        
        this.bossDefeated.add(stageId);
        
        // Calculate rewards
        const rewards = this.calculateBossRewards(boss);
        
        if (this.eventEmitter) {
            this.eventEmitter.emit('bossDefeated', {
                boss: this.currentBoss,
                stage: stageId,
                rewards: rewards
            });
        }

        // Save state after boss defeat
        this.saveState();

        console.log(`👑 Boss defeated: ${this.currentBoss.name}`);
        
        const result = {
            defeated: true,
            boss: this.currentBoss,
            rewards: rewards
        };

        this.currentBoss = null;
        this.bossPhase = 0;

        return result;
    }

    // Calculate boss rewards
    calculateBossRewards(boss) {
        const rewards = {
            experience: boss.rewards.experience,
            materials: [],
            equipment: []
        };

        // Roll for materials
        boss.rewards.materials.forEach(materialReward => {
            if (Math.random() < materialReward.chance) {
                rewards.materials.push({
                    type: materialReward.type,
                    amount: materialReward.amount
                });
            }
        });

        // Roll for equipment
        boss.rewards.equipment.forEach(equipmentReward => {
            if (Math.random() < equipmentReward.chance) {
                rewards.equipment.push(equipmentReward.type);
            }
        });

        return rewards;
    }

    // Get boss AI action
    getBossAction() {
        if (!this.currentBoss || !this.currentBoss.abilities) {
            return { action: 'attack', damage: 10 };
        }

        // Random ability selection from current phase
        const randomAbility = this.currentBoss.abilities[
            Math.floor(Math.random() * this.currentBoss.abilities.length)
        ];

        const baseDamage = this.currentBoss.damage * this.currentBoss.damageMultiplier;
        
        // Define ability effects
        const abilityEffects = {
            // Forest Guardian abilities
            'slash': { damage: baseDamage * 1.0, description: 'slashes with vine-covered claws' },
            'root_bind': { damage: baseDamage * 0.7, description: 'binds you with roots, reducing damage' },
            'fury_swipe': { damage: baseDamage * 1.3, description: 'swipes in fury' },
            'thorn_storm': { damage: baseDamage * 1.5, description: 'summons a storm of thorns' },
            
            // Mountain King abilities
            'boulder_throw': { damage: baseDamage * 1.2, description: 'hurls a massive boulder' },
            'stone_shield': { damage: baseDamage * 0.5, description: 'blocks with stone shield' },
            'earthquake': { damage: baseDamage * 1.6, description: 'causes the ground to shake' },
            'rock_avalanche': { damage: baseDamage * 1.8, description: 'triggers a rock avalanche' },
            
            // Desert Pharaoh abilities
            'sand_blast': { damage: baseDamage * 1.1, description: 'blasts with sand' },
            'mummy_summon': { damage: baseDamage * 0.8, description: 'summons mummy minions' },
            'solar_beam': { damage: baseDamage * 1.7, description: 'fires a concentrated solar beam' },
            'sand_storm': { damage: baseDamage * 1.4, description: 'creates a blinding sandstorm' },
            'death_curse': { damage: baseDamage * 2.0, description: 'casts a deadly curse' },
            'pharaoh_resurrection': { damage: baseDamage * 0.3, description: 'attempts resurrection magic' },
            
            // Ice Empress abilities
            'ice_shard': { damage: baseDamage * 1.0, description: 'fires ice shards' },
            'frost_armor': { damage: baseDamage * 0.6, description: 'strengthens frost armor' },
            'blizzard': { damage: baseDamage * 1.5, description: 'summons a fierce blizzard' },
            'ice_prison': { damage: baseDamage * 1.2, description: 'traps you in ice' },
            'absolute_zero': { damage: baseDamage * 2.2, description: 'unleashes absolute zero' },
            'ice_resurrection': { damage: baseDamage * 0.4, description: 'attempts ice resurrection' },
            
            // Crystal Dragon abilities
            'crystal_breath': { damage: baseDamage * 1.3, description: 'breathes crystal shards' },
            'wing_buffet': { damage: baseDamage * 1.0, description: 'attacks with powerful wings' },
            'prism_beam': { damage: baseDamage * 1.6, description: 'fires a prism beam' },
            'crystal_storm': { damage: baseDamage * 1.8, description: 'creates a crystal storm' },
            'flame_crystal_breath': { damage: baseDamage * 2.0, description: 'breathes flaming crystals' },
            'tail_smash': { damage: baseDamage * 1.7, description: 'smashes with crystal tail' },
            'dragon_nova': { damage: baseDamage * 2.8, description: 'unleashes dragon nova' },
            'crystal_rebirth': { damage: baseDamage * 0.5, description: 'attempts crystal rebirth' }
        };

        const effect = abilityEffects[randomAbility] || { 
            damage: baseDamage, 
            description: 'attacks' 
        };

        return {
            action: randomAbility,
            damage: Math.floor(effect.damage),
            description: effect.description
        };
    }

    // Get all bosses status
    getAllBossesStatus() {
        const status = {};
        
        for (const [stageId, boss] of this.bosses) {
            status[stageId] = {
                boss: boss,
                defeated: this.bossDefeated.has(stageId),
                unlocked: false // Will be set by stage manager
            };
        }
        
        return status;
    }

    // Save state
    saveState() {
        const bossState = {
            bossesDefeated: Array.from(this.bossDefeated)
        };
        
        this.stateManager.setState({
            bosses: bossState
        });
        
        return bossState;
    }

    // Load state
    loadState(state) {
        if (state && state.bossesDefeated) {
            this.bossDefeated = new Set(state.bossesDefeated);
            console.log(`👑 Loaded boss state: ${this.bossDefeated.size} bosses defeated`);
        }
    }
}

export default BossManager;