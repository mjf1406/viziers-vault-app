# Spellbook Generator - Developer Documentation

## File Structure

The spellbook generator is located in `app/(app)/app/spellbook-generator/_actions/generateSpellbook.ts`. This file contains all server-side logic for generating spellbooks.

## Function Flow

### Entry Points

1. **`generateSpellsOnly(formData: FormData)`**
   - Client-side preview generation (doesn't save to database)
   - Returns: `{ spells: Dnd5eSpell[], options: {...} }`

2. **`generateSpellbook(formData: FormData)`** (default export)
   - Full generation with optional database persistence
   - Returns: Spellbook ID (string) if saved, or spellbook payload object

### Core Generation Logic

**`buildSpellbookFromOptions(formData, requireAuth, uid?)`**
- Main orchestration function shared by both entry points
- Flow:
  1. Parse form data → `parseFormDataToOptions`
  2. Resolve random selections → `resolveOptions`
  3. Fetch and filter spells → `fetchAndFilterSpells`
  4. Calculate character level → `calculateCharacterLevel`
  5. Get user overrides → `getUserOverrides`
  6. Select spells → `selectSpellsForSpellbook`
  7. Return formatted result

### Input Processing

**`parseFormDataToOptions(formData: FormData)`**
- Extracts and normalizes form inputs
- Returns: `{ level, schools, classes, sourceShorts, excludeLegacy, name }`

**`resolveOptions(level, schools, classes)`**
- Converts "random" selections to concrete values
- Uses `resolveLevel` from `@/lib/5e-utils`
- Uses `resolveSelections` from `@/lib/utils`
- Returns: `{ levels: number[], schools: string[], classes: string[] }`

### Database Queries

**`fetchSpells(levels, schools, sourceShorts?)`**
- Queries `dnd5e_spells` table for leveled spells (1-9)
- Filters by level range, schools, and optional sourcebooks

**`fetchCantrips(schools, sourceShorts?)`**
- Queries `dnd5e_spells` table for level 0 spells
- Filters by schools and optional sourcebooks

**`fetchUserExtraDice(uid)`**
- Fetches user's spellbook extra spells dice expression from database
- Returns: dice expression string (e.g., "2d6 + 3")

**`dbQuery<T>(q)`**
- Generic database query wrapper using InstantDB

### Spell Filtering

**`filterSpellsByClasses(spells, classes)`**
- Filters spells to only those available to selected classes
- Matches by class name prefix (case-insensitive)

**`filterLegacySpells(spells)`**
- Removes spells with school === "legacy"

**`fetchAndFilterSpells(resolved, sourceShorts?, excludeLegacy?)`**
- Orchestrates fetching and filtering
- Calls `fetchSpells` and `fetchCantrips` in parallel
- Applies class filtering and optional legacy exclusion
- Returns: `{ leveled: Dnd5eSpell[], cantrips: Dnd5eSpell[] }`

### Spell Selection Logic

**`selectSpellsForSpellbook(cantrips, leveledSpells, playerClass, characterLevel, overrides?)`**
- Main spell selection function
- Flow:
  1. Get class-specific targets → `getClassSpellTargets`
  2. Prepare spell pools → `prepareSpellPools`
  3. Select and sort → `selectAndSortSpells`

**`getClassSpellTargets(playerClass, characterLevel, overrides?)`**
- Looks up class in `SPELLS_PER_LEVEL` table
- Calculates cantrips target from table
- Calculates spells target (handles Artificer special case)
- Gets max spell level for class/level
- Applies user overrides if provided
- Returns: `{ cantripsTarget, spellsTarget, maxSpellLevel }` or `null`

**`prepareSpellPools(cantrips, leveledSpells, maxSpellLevel)`**
- Deduplicates spells by unique ID
- Filters leveled spells to max spell level
- Separates cantrips (level 0) from leveled spells
- Returns: `{ cantripsPool, leveledPool }`

**`selectAndSortSpells(pools, targets)`**
- Randomly selects spells from pools using `takeRandom`
- Combines cantrips and leveled spells
- Sorts by level (ascending), then by name (ascending)
- Returns: final spellbook array

### User Override System

**`getUserOverrides(uid, playerClass, characterLevel, requireAuth)`**
- Attempts to fetch user's extra spells setting
- Calls `computeAdjustedTargets` to apply modifier
- Returns: `{ cantripsTarget?, spellsTarget? }` or empty object

**`computeAdjustedTargets(playerClass, characterLevel, modifier)`**
- Calculates base targets → `calculateBaseTargets`
- Parses modifier expression → `parseModifier`
- Distributes adjusted total → `distributeTargets`
- Returns: adjusted `{ cantripsTarget, spellsTarget }`

**`calculateBaseTargets(playerClass, characterLevel)`**
- Gets base cantrip and spell counts from `SPELLS_PER_LEVEL`
- Handles Artificer special case (null spells → calculated value)
- Returns: `{ cantrips, spells, total }`

**`parseModifier(raw, baseTotal)`**
- Parses modifier string:
  - `*N` or `/N`: multiply or divide
  - `+N` or `-N`: add or subtract fixed number
  - Dice expression: `2d6 + 3` (uses `rollDiceExpression`)
- Returns: adjusted total count

**`distributeTargets(base, targetTotal)`**
- Distributes total across cantrips and spells proportionally
- Maintains ratio between cantrips and spells
- Returns: `{ cantripsTarget, spellsTarget }`

### Utility Functions

**`calculateCharacterLevel(levels)`**
- Determines character level from array of available levels
- Takes maximum level from array
- Clamps to 1-20 range using `clampNumber`

**`logGenerationDebug(auth, result)`**
- Logs debug information when `VV_DEBUG` env var is set
- Includes resolved options and spell counts

**`pickExtraSpells(...)`**
- Utility for selecting additional spells from remaining pool
- Excludes already-selected spells
- Respects max spell level for class

### Database Persistence

**`saveSpellbookRecord(args)`**
- Creates spellbook record in database
- Generates UUID for spellbook ID
- Links spellbook to user via `dbServer.transact`
- Returns: spellbook ID string

## Data Structures

### `Dnd5eSpell`
- Contains all spell metadata from D&D Beyond
- Key fields: `dndbeyondId`, `name`, `level`, `school`, `classes`, `sourceShort`

### `GenerateOpts`
- Input options type
- Fields: `level`, `schools`, `classes`, `sourceShorts?`, `excludeLegacy?`

### `SpellbookGenerateResponse`
- Return type for `generateSpellbook`
- Either spellbook ID (string) or spellbook payload object

## Key Dependencies

- `@/lib/utils`: `resolveSelections`, `takeRandom`, `dedupeBy`, `toNumber`, `clampNumber`, `rollDiceExpression`, `toTitleCase`
- `@/lib/5e-utils`: `resolveLevel`
- `@/lib/5e-data`: `CLASSES`, `SCHOOLS`, `SPELLS_PER_LEVEL`
- `@/server/db-server`: Database connection
- `@/server/auth`: `getAuthAndSaveEligibility`

## Error Handling

- Try-catch blocks in entry points log errors when `VV_DEBUG` is set
- Database queries may return empty arrays if no spells match
- Functions handle missing data gracefully (default to empty arrays/objects)

## Debugging Tips

1. Enable `VV_DEBUG` environment variable to see detailed logs
2. Check `logGenerationDebug` output for resolved options
3. Verify `SPELLS_PER_LEVEL` table matches expected class/level combinations
4. Test with known spell combinations to verify filtering logic
5. Check database queries return expected results for given filters

## Common Modification Points

- **Adding new classes**: Update `SPELLS_PER_LEVEL` in `@/lib/5e-data`
- **Changing selection logic**: Modify `selectSpellsForSpellbook` or `getClassSpellTargets`
- **Adjusting filtering**: Modify `filterSpellsByClasses` or `filterLegacySpells`
- **Modifying user overrides**: Update `computeAdjustedTargets` or `parseModifier`
- **Adding new spell sources**: Update database queries in `fetchSpells`/`fetchCantrips`

