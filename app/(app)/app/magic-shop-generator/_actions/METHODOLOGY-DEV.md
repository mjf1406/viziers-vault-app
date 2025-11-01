# Magic Shop Generator - Developer Methodology

## Architecture Overview

The magic shop generator uses a modular, step-by-step approach to build shop inventories. Functions are organized by responsibility to make debugging and modification straightforward.

## Main Entry Point

### `generateMagicShop(input, _user?)`
**Location**: Line ~221  
**Purpose**: Main server action that orchestrates shop generation

**Flow**:
1. Authenticates user and checks save eligibility (`getAuthAndSaveEligibility`)
2. Validates and normalizes input (`buildOptions`)
3. Generates rarity distribution (`generateRarityDistribution`)
4. Creates shop inventory (`generateUnified`)
5. Saves to database or returns payload

**Key Data Structures**:
- Input: `GenerateMagicShopInput` (name, options, quantity)
- Output: `GenerateMagicShopResponse` (array of IDs or shop objects)

## Option Building Pipeline

### `buildOptions(opts: GenerateMagicShopOpts)`
**Location**: Line ~120  
**Purpose**: Normalizes and validates user input, resolves references

**Calls**:
- `resolvePopulationFromSettlement()` - Resolves population from settlement ID
- `expandStockTypes()` - Maps stock categories to item types
- `resolveWorldNames()` - Gets world/settlement names for display

**Returns**: Normalized options object with resolved values

### `resolvePopulationFromSettlement(settlementId, worldId, worlds)`
**Location**: Line ~24  
**Purpose**: Extracts population from settlement data

**Logic**:
- Handles premade settlements (format: `worldId:settlementName`)
- Handles database settlements from worlds snapshot
- Returns `null` if not found

### `expandStockTypes(stockTypes)`
**Location**: Line ~49  
**Purpose**: Maps user-friendly categories to database item types

**Category Mapping**:
- `items` → `["ring", "rod", "staff", "wand", "wondrous item"]`
- `weapons` → `["weapon"]`
- `armor` → `["armor"]`
- `potions` → `["potion"]`
- `poisons` → `["poison"]`

**Also extracts**: `wantsScrolls`, `wantsSpellComponents` flags

### `resolveWorldNames(inputMode, settlementId, worldId, worlds)`
**Location**: Line ~84  
**Purpose**: Resolves display names for world and settlement

**Handles**: Premade worlds, database worlds, settlement references

## Rarity Distribution

### `generateRarityDistribution(population, magicLevel, settings?)`
**Location**: Line ~729  
**Purpose**: Calculates probability distribution across rarity tiers

**Algorithm**:
1. Calculates base weight from magic level (higher magic = more rare items)
2. Applies population gating penalty based on `rarityPopulationGating` setting
3. Normalizes weights to percentages

**Settings Used**:
- `magicRarityBias` (default: 2.0)
- `rarityPopulationGating` ("strict" | "soft" | "none")

**Population Thresholds** (from `RARITY_THRESHOLDS`):
- Uncommon: 500
- Rare: 2,500
- Very Rare: 10,000
- Legendary: 100,000

## Item Generation Pipeline

### `generateUnified(options, rarityDistribution)`
**Location**: Line ~519  
**Purpose**: Orchestrates the entire item selection and pricing process

**Flow**:
1. Calculates item count and pricing context
2. Fetches game data (`fetchGameData`)
3. Filters and prepares candidates for each category
4. Selects items using rarity weighting
5. Splits results into categories

**Calls**:
- `calculateItemCount()` - Determines how many items to generate
- `calculatePriceModifiers()` - Calculates wealth-based price adjustments
- `calculatePrices()` - Applies modifiers to base prices
- `fetchGameData()` - Gets items and spells from database
- `filterAndPrepareGear()` - Creates gear candidates
- `filterUsableSpells()` - Filters spells by level/rarity
- `buildScrollCandidates()` - Creates scroll candidates with prices
- `buildComponentCandidates()` - Creates component candidates with prices
- `selectItemsByRarity()` - Selects items using rarity distribution
- `splitIntoCategories()` - Organizes results

### `fetchGameData()`
**Location**: Line ~292  
**Purpose**: Fetches all items and spells in parallel

**Returns**: `{ allItems: any[], allSpells: any[] }`

### `filterUsableSpells(allSpells, rarityDistribution)`
**Location**: Line ~307  
**Purpose**: Filters spells to usable levels that match rarity distribution

**Filters**: Level 0-9, excludes if rarity has 0% weight in distribution

### `filterAndPrepareGear(allItems, selectedTypes, prices)`
**Location**: Line ~323  
**Purpose**: Filters items and calculates prices for gear candidates

**Filters Out**:
- Artifacts (always)
- Scroll items (handled separately)
- Items not in selected types

**Returns**: Array of gear candidates with `kind: "gear"` and computed `priceGp`

### `buildScrollCandidates(usableSpells, priceModifier)`
**Location**: Line ~356  
**Purpose**: Creates scroll candidates with adjusted prices

**Process**:
1. Maps each spell to scroll candidate
2. Gets base price from `SPELL_SCROLL_PRICES_GP`
3. Applies rarity-based price modifier
4. Returns candidates with `kind: "scroll"`

### `buildComponentCandidates(usableSpells, priceModifier)`
**Location**: Line ~387  
**Purpose**: Creates material component candidates with adjusted prices

**Filters**: Only spells with `componentCost > 0`

**Process**:
1. Gets component cost from spell data
2. Applies rarity-based price modifier
3. Returns candidates with `kind: "component"`

### `selectItemsByRarity(pool, itemCount, rarityDistribution, forced)`
**Location**: Line ~423  
**Purpose**: Selects items using rarity-weighted distribution

**Algorithm**:
1. Groups pool by rarity
2. For each rarity (in order), calculates target count based on distribution weight
3. Selects items from rarity bucket using `pickRandom()`
4. If slots remain, fills from any remaining pool (avoiding duplicates)

**Uses**: `pickRandom()`, `groupBy()`, `clamp01()`, `keyOf()`

### `splitIntoCategories(chosen)`
**Location**: Line ~473  
**Purpose**: Splits unified candidate list into gear/scrolls/components arrays

**Returns**: `{ gear: any[], scrolls: any[], components: any[] }`

## Pricing System

### `calculateItemCount(population, stockMultiplier, settings?)`
**Location**: Line ~617  
**Purpose**: Calculates how many items to generate

**Formula**: `baseCount = max(1, round(SLOT_SCALE × population^SLOT_BETA))`  
**Final**: `round(baseCount × stockMultiplier)`

**Settings**:
- `slotBeta` (default: 0.5)
- `slotScale` (default: 0.08)

### `calculatePriceModifiers(wealth, settings?)`
**Location**: Line ~631  
**Purpose**: Calculates price multipliers for each rarity based on wealth

**Algorithm**:
1. Calculates base multiplier from wealth (0 = poor, 1 = rich)
2. For each rarity, applies rarity progression exponent
3. Returns multipliers per rarity

**Settings**:
- `wealthInfluence` (default: 1)
- `maxPriceChange` (default: 0.5)
- `rarityProgressionExponent` (default: 0.5)

### `calculatePrices(priceModifiers)`
**Location**: Line ~669  
**Purpose**: Applies modifiers to base prices

**Process**: Multiplies each base price in `BASE_PRICES` by corresponding modifier

**Returns**: Modified price structure matching `BASE_PRICES` format

### `BASE_PRICES`
**Location**: Line ~688  
**Purpose**: Base price tiers for each rarity and item type

**Structure**:
```
{
  Common: { NONE: 25, MINOR: 50, MAJOR: 75, WONDROUS: 100 },
  Uncommon: { NONE: 110, MINOR: 208, MAJOR: 305, WONDROUS: 500 },
  // ... etc
}
```

### `priceTierForType(type: string)`
**Location**: Line ~866  
**Purpose**: Maps item type to price tier

**Mapping**:
- `weapon`, `armor`, `rod`, `staff`, `wand`, `ring` → `MAJOR`
- `potion`, `poison` → `MINOR`
- `wondrous item` → `WONDROUS`
- Everything else → `NONE`

### `priceScroll(level: number)`
**Location**: Line ~886  
**Purpose**: Gets base price for spell scroll by level

**Uses**: `SPELL_SCROLL_PRICES_GP` constant

## Utility Functions

### `pickRandom<T>(arr, count, seen?)`
**Location**: Line ~787  
**Purpose**: Randomly selects items without replacement

**Algorithm**: Fisher-Yates shuffle, then take first N items (skipping seen)

### `groupBy<T>(arr, keyFn)`
**Location**: Line ~843  
**Purpose**: Groups array elements by key function

**Returns**: `Map<string, T[]>`

### `normalizeRarity(raw)`
**Location**: Line ~854  
**Purpose**: Converts various rarity string formats to standard form

**Returns**: `"Common" | "Uncommon" | "Rare" | "Very Rare" | "Legendary"`

### `keyOf(it)`
**Location**: Line ~875  
**Purpose**: Extracts unique identifier from item

**Priority**: `dndbeyondId` → `id` → `slug` → `name` → `null`

### `clamp01(n)`
**Location**: Line ~879  
**Purpose**: Clamps number to [0, 1] range

### `normalizeWealth(wealth)`
**Location**: Line ~20  
**Purpose**: Normalizes wealth index (0-based) to 0-1 range

**Formula**: `(wealth - 1) / (WEALTH_LEVELS.length - 1)`

## Legacy Functions

### `generateItems(options, rarityDistribution)`
**Location**: Line ~594  
**Purpose**: Legacy item generation (gears-only, simpler logic)

**Note**: Still present for backwards compatibility but `generateUnified` is preferred

### `fetchItems(stockTypes)`
**Location**: Line ~602  
**Purpose**: Legacy database query for filtered items

**Note**: Not used by `generateUnified`, which uses `fetchGameData` instead

## Debugging Tips

### Enable Debug Logging
Set `process.env.VV_DEBUG = true` to see:
- Item count calculations
- Category candidate counts
- Final selection counts

### Common Issues

1. **No items generated**: Check `selectedTypes` array, ensure stock types are selected
2. **Prices seem wrong**: Check `calculatePriceModifiers` output, verify wealth normalization
3. **Wrong rarity distribution**: Inspect `generateRarityDistribution` weights, check population gating
4. **Missing scrolls/components**: Verify `includeScrolls`/`includeSpellComponents` flags in options

### Key Data Flow Points

1. **Input Validation**: `buildOptions` - validates population resolution
2. **Distribution**: `generateRarityDistribution` - sets probability weights
3. **Candidates**: `filterAndPrepareGear`, `buildScrollCandidates`, `buildComponentCandidates` - creates pools
4. **Selection**: `selectItemsByRarity` - chooses final items
5. **Formatting**: `splitIntoCategories` - organizes output

### Testing Functions Individually

All helper functions are pure (except DB calls). You can test:
- `calculateItemCount` with various populations
- `calculatePriceModifiers` with different wealth values
- `generateRarityDistribution` with different magic levels
- `selectItemsByRarity` with mock pools and distributions

