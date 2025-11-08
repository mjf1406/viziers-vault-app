## Overview

The Encounter Generator creates balanced combat encounters and generates non-combat encounters for D&D 5th Edition based on your party composition and selected criteria. Combat encounters follow official rules from the Dungeon Master's Guide to calculate encounter difficulty using Experience Point (XP) thresholds and multipliers. Non-combat encounters provide narrative and exploration opportunities without requiring combat resolution.

## How It Works

### Step 1: Input Processing

You provide several options when generating a combat encounter:

- **Party**: Your party composition with character levels and quantities
  - The generator calculates the average party level and effective party size (capped at 6)
  - If no party is specified, defaults to a single level 1 character
- **Difficulty Level**: The desired encounter difficulty (Trivial, Easy, Medium, Hard, Deadly, or Absurd)
  - If not specified in "guaranteed mode", difficulty is randomly rolled based on probability tables
- **Biome**: The environment where the encounter occurs (Forest, Desert, Arctic, etc.)
  - Used to filter monsters by habitat compatibility
- **Time of Day**: Day or Night
  - Affects which monsters are available (some monsters only appear at specific times)
- **Travel Medium**: Ground, Air, or Sea
  - Filters monsters based on their movement capabilities
- **Road Type**: Whether the party is traveling on a road or not
  - Modifies encounter probabilities (roads are generally safer)
- **Travel Pace**: Normal, Fast, or Slow
  - Modifies encounter probabilities (faster travel increases encounter chance)

### Step 2: Party Statistics Calculation

The generator calculates two key statistics from your party:

- **Average Level**: Weighted average of all character levels based on quantity
  - Example: 2 level 5 characters + 1 level 3 character = (5×2 + 3×1) / 3 = 4.33 average level
- **Party Size**: Total number of characters, capped at 6
  - Parties larger than 6 are treated as size 6 for XP calculations

### Step 3: XP Bounds Calculation

Based on the party's average level and the selected difficulty, the generator calculates XP bounds:

- **XP Lower Bound**: The minimum adjusted XP for the selected difficulty
  - Uses official XP thresholds from the Dungeon Master's Guide
  - Multiplied by party size
- **XP Upper Bound**: The maximum adjusted XP before reaching the next difficulty level
  - For "Absurd" difficulty, the upper bound is 100× the lower bound
  - For other difficulties, it's the threshold for the next difficulty level

**Example**: A party of 4 level 5 characters requesting a "Hard" encounter:
- Hard threshold for level 5: 750 XP per character
- Lower bound: 750 × 4 = 3,000 XP
- Upper bound: 1,100 (Deadly) × 4 = 4,400 XP

### Step 4: Monster Filtering

The monster list is filtered through several criteria:

1. **XP Limit**: Only monsters whose base XP is within the upper bound are considered
2. **Habitat/Biome**: Monsters must be compatible with the selected biome
   - Biomes are mapped to D&D habitats (e.g., "Tundra" → "Arctic", "Forest" → "Forest")
   - Monsters must have the matching habitat or biome tag
3. **Time of Day**: Monsters must be available during the selected time
   - Monsters with "all" time availability are always included
4. **Travel Medium**: Monsters must be compatible with the travel medium
   - Ground travel filters for land-based creatures
   - Air travel filters for flying creatures
   - Sea travel filters for aquatic creatures

If filtering results in no monsters, the XP limit filter is relaxed to ensure at least some monsters are available.

### Step 5: Encounter Generation

The generator uses one of two methods to create the encounter:

#### Method A: Leader-Follower Encounter (Preferred)

If monsters with relationship data are available, the generator creates a more complex encounter:

1. **Leader Selection**: 
   - Finds monsters with relationship data (FOLLOWERS, LIEUTENANTS, SERGEANTS, or MINIONS)
   - Selects a leader whose CR is appropriate for the party level (within 80-120% of average level)
   - If multiple candidates exist, prefers monsters with relationship data

2. **Follower Addition**:
   - Adds lieutenants, sergeants, minions, and followers from the leader's relationship lists
   - Each follower type is added until the encounter reaches the XP bounds
   - Followers are added one at a time, checking adjusted XP after each addition
   - Stops when the encounter reaches the target XP range

3. **Relationship Resolution**:
   - If the leader has LEADERS, LIEUTENANTS, or SERGEANTS in its relationship data, one may be randomly selected as the actual leader
   - This allows for more varied encounter compositions

#### Method B: Simple Encounter

If no relationship data is available, the generator creates a simple encounter:

1. **Monster Selection**: Randomly selects a monster from the filtered list
2. **Quantity Calculation**: 
   - Starts with 1 monster
   - Adds more of the same monster until the encounter reaches the XP lower bound
   - Stops before exceeding the XP upper bound
   - Maximum of 15 monsters of the same type

### Step 6: Adjusted XP Calculation

The generator calculates the encounter's adjusted XP using official D&D 5e multipliers:

- **Base XP**: Sum of all monsters' individual XP values
- **Adjusted XP**: Base XP multiplied by a factor based on:
  - Number of monsters in the encounter
  - Party size
- **Multiplier Table**: Uses official multipliers from the Dungeon Master's Guide
  - More monsters = higher multiplier (up to 5× for 15+ monsters)
  - The multiplier accounts for action economy advantages

The adjusted XP determines the actual difficulty of the encounter, not the base XP.

## Special Rules

### Encounter Modes

The generator operates in two distinct modes:

#### Guaranteed Mode (Generate Encounter Dialog)

- Used when encounter type is explicitly specified
- For combat encounters: requires both encounter type and difficulty to be specified
- For non-combat encounters: only requires encounter type (difficulty is not needed)
- Generates the exact number of encounters requested
- Skips probability calculations
- Guarantees encounters match your criteria

#### Probability Mode (Roll Encounter Dialog)

- Used when rolling for random encounters during travel
- Calculates encounter probabilities based on:
  - Biome and time of day (base probabilities)
  - Road type (modifier)
  - Travel pace (modifier)
- Each roll may result in 0, 1, or multiple encounters
- Difficulty is randomly determined from probability tables if not specified

### Party Size Cap

- Parties larger than 6 characters are treated as size 6 for XP calculations
- This follows D&D 5e guidelines for very large parties
- The actual number of characters still affects average level calculation

### Monster Quantity Limits

- Simple encounters are limited to 15 monsters of the same type
- Leader-follower encounters can exceed this if using different monster types
- The adjusted XP multiplier caps at 15 monsters for calculation purposes

## Understanding the Results

Your generated combat encounter will include:

- **Monsters**: List of creatures with:
  - Name and Challenge Rating (CR)
  - Quantity of each monster type
  - Role labels (leader, lieutenant, sergeant, minion) for relationship-based encounters
  - Links to monster stat blocks (if available)
- **XP Information**:
  - **Total XP**: Sum of base XP from all monsters
  - **Adjusted XP**: Total XP multiplied by encounter multiplier
  - **XP per PC**: Total XP divided by party size
  - **XP Bounds**: The target range the encounter was designed to fit
- **Encounter Statistics**:
  - Total number of creatures
  - Difficulty level
  - Encounter type (combat)

The adjusted XP should fall within the XP bounds for your selected difficulty level, ensuring the encounter matches the intended challenge.

## Limitations

- The generator uses official D&D 5e rules and data
- Monster availability depends on the completeness of relationship data in the database
- Very restrictive filters (e.g., specific biome + time + travel medium) may result in limited monster options
- The generator prioritizes balanced encounters over strict adherence to filters if no suitable monsters are found
- Multiclass characters are treated as their primary level only
- The generator doesn't account for party composition advantages (e.g., all spellcasters vs. all melee fighters)
- Environmental factors beyond biome (e.g., weather, elevation) are not considered in monster filtering

---

## Non-Combat Encounters

Non-combat encounters provide narrative, social, and exploration opportunities that don't require combat resolution. These encounters add flavor to your travel and exploration sequences.

### How Non-Combat Encounters Work

Non-combat encounters are generated differently from combat encounters:

- **No Difficulty Required**: Unlike combat encounters, non-combat encounters don't require a difficulty level. They are generated directly when the encounter type is specified.
- **No Party Balancing**: Non-combat encounters don't need to be balanced against party level or size, as they don't involve combat.
- **Biome-Based Selection**: Encounters are selected from tables specific to the biome or environment.

### Encounter Table Selection

The generator selects encounters from specialized tables based on your criteria:

1. **Road Encounters**: If traveling on a highway, byway, royalway, or bridleway, encounters are drawn from the road-specific table, which contains encounters common to well-traveled paths.

2. **Sea Travel**: If the travel medium is "sea", encounters are drawn from the open water table, which includes maritime encounters like ships, islands, and sea creatures.

3. **Biome-Specific**: For other situations, encounters are selected from tables matching your biome:
   - Arctic/Tundra → Arctic encounters
   - Desert → Desert encounters
   - Forest → Forest encounters
   - Grassland/Savanna → Grassland encounters
   - Mountain → Mountain encounters
   - Swamp/Mangrove → Swamp encounters
   - Coastal/Flooded → Coastal encounters
   - And more...

4. **Fallback**: If no specific table is found for a biome, the generator falls back to the forest encounter table.

### Special Encounter Types

Some encounters in the open water table trigger special generation:

- **Random Ship**: Generates a detailed ship encounter with crew, purpose, and disposition
- **Mysterious Island**: Creates an island with theme, inhabitants, and story hooks
- **Blue Hole**: Generates a mysterious underwater feature with dimensions and contents
- **Shipwreck**: Creates a shipwreck with condition, cargo, and potential survivors

These special encounters use placeholder generation that can be expanded with more detailed tables in the future.

### Encounter Modes for Non-Combat

Non-combat encounters work in both modes:

#### Guaranteed Mode
- When `encounterType` is set to "non-combat", encounters are generated directly
- No difficulty level is required
- Generates the exact quantity specified
- Skips probability calculations

#### Probability Mode
- Non-combat encounters can occur based on probability tables
- Probability is modified by road type and travel pace
- Roads generally increase non-combat encounter probability
- Each roll may result in 0 or more non-combat encounters

### Understanding Non-Combat Results

A generated non-combat encounter includes:

- **Type**: Always "non-combat"
- **Description**: The narrative text describing what the party encounters
- **Biome**: The biome where the encounter occurs (for reference)
- **Road**: The road type if applicable (for road encounters)

Non-combat encounters are designed to be flexible and can be:
- Social interactions with NPCs
- Environmental discoveries
- Mysterious locations
- Travel complications
- World-building moments

The DM can use these encounters as written or adapt them to fit their campaign's needs.

