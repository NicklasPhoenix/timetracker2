# Copilot Instructions for Incremental Combat Game

## Development Approach
- **One feature per commit**: Break down each task into atomic commits
- **Performance first**: Optimize for 60fps on mobile devices
- **Clean architecture**: Modular, reusable components
- **Progressive enhancement**: Build core mechanics first, add polish later

## Code Style Guidelines
- Use ES6+ modules with clear imports/exports
- Implement pure functions where possible for game calculations
- Use TypeScript-style JSDoc comments for better intellisense
- Prefix DOM manipulation functions with `dom_`
- Prefix game logic functions with `game_`
- Prefix data structures with their type (e.g., `playerData`, `stageConfig`)

## Naming Conventions
- Files: kebab-case (e.g., `combat-system.js`)
- Functions: camelCase with clear action verbs (e.g., `calculateDamage`)
- Constants: UPPER_SNAKE_CASE (e.g., `MAX_STAGE_COUNT`)
- Classes: PascalCase (e.g., `CombatManager`)

## File Structure Guidelines
- Keep files under 300 lines
- One main export per file
- Group related functions in modules
- Separate game logic from UI rendering

## Performance Guidelines
- Use object pooling for frequently created/destroyed objects
- Batch DOM updates using DocumentFragment
- Implement efficient collision detection
- Cache expensive calculations
- Use requestAnimationFrame for animations

## Testing Approach
- Write unit tests for pure game logic functions
- Create integration tests for combat system
- Test on mobile devices early and often
- Performance test with 1000+ game objects

## Common Patterns to Use
- State management through immutable updates
- Event-driven architecture for game events
- Factory pattern for creating game entities
- Observer pattern for UI updates