<!-- @format -->

# Spellbook Generator Methodology

## Overview

The Spellbook Generator creates randomized spellbooks for D&D 5th Edition characters based on your selected criteria. It follows official rules from the Player's Handbook and other source materials to determine the number and types of spells available at different character levels.

## How It Works

### Step 1: Input Processing

You provide several options when generating a spellbook:

-   **Character Level**: A specific level (1-20) or "random"

    -   If random, a level between 1-20 is selected
    -   The generator uses all spell levels up to and including your character level

-   **Spell Schools**: One or more schools of magic (Abjuration, Conjuration, etc.) or "random"

    -   If random, one or more schools are randomly selected
    -   Only spells from these schools will be included

-   **Character Class**: A single character class or "random"

    -   The generator supports all spellcasting classes (Wizard, Cleric, Bard, etc.)
    -   Only spells available to your selected class will be included

-   **Source Books**: Optional filters to limit spells to specific sourcebooks

    -   Examples: Player's Handbook, Xanathar's Guide, etc.

-   **Exclude Legacy**: Option to filter out spells marked as "Legacy"
    -   Legacy spells are typically older versions replaced by newer editions

### Step 2: Spell Collection

The generator queries the database for spells matching your criteria:

1. **Leveled Spells**: All spells from level 1 through your character level, matching your selected schools and classes
2. **Cantrips**: Level 0 spells matching your selected schools and classes

### Step 3: Filtering

The spell list is refined through several filters:

1. **Class Compatibility**: Only spells that can be cast by your selected class are kept
2. **Legacy Exclusion**: If enabled, spells with the "Legacy" school are removed
3. **Source Filtering**: If specific sourcebooks are selected, only spells from those sources are kept

### Step 4: Spell Selection

The generator uses official class tables to determine how many spells your character should know:

-   **Cantrips**: The number is taken from official class tables (varies by class and level)
-   **Leveled Spells**: The number is determined by:
    -   Official class tables for most classes
    -   Special calculation for Artificers: Intelligence modifier (randomized 1-5) + half your level

**Spell Level Limits**: Each class has a maximum spell level they can learn at any given character level. For example, a 3rd-level Wizard can learn up to 2nd-level spells.

**Deduplication**: Duplicate spells are removed based on their unique identifier.

**Random Selection**: Spells are randomly selected from the filtered pool until the target count is reached. If there aren't enough spells available, you'll get fewer spells rather than relaxing the filters.

### Step 5: Bonus Spells (Premium Users)

Premium users can configure an "Extra Spells" setting that adds bonus spells to their spellbook. This uses a dice expression system:

-   **Fixed Numbers**: `+4` or `-2` adds/subtracts a fixed number
-   **Multiplication**: `*2` multiplies your total spell count
-   **Division**: `/1.5` divides your total spell count
-   **Dice Expressions**: `2d6`, `3d4 + 2`, etc. roll dice and add/subtract the result

The modifier is applied to your total spell count (cantrips + leveled), and the extra spells are proportionally distributed between cantrips and leveled spells.

### Step 6: Organization

Finally, selected spells are sorted:

1. **By Level**: Lowest to highest (cantrips first, then 1st-level, 2nd-level, etc.)
2. **Alphabetically**: Within each level, spells are sorted by name

## Special Rules

### Artificers

Artificers have a unique spell preparation system:

-   They prepare a number of spells equal to their Intelligence modifier + half their Artificer level (rounded down)
-   The Intelligence modifier is randomized between 1-5 for generated spellbooks
-   This differs from other classes which have fixed "spells known" values

### Spell Availability

The generator strictly follows these rules:

-   Only spells your class can learn are included
-   Only spells within your maximum spell level are included
-   The generator will return fewer spells if your filters are too restrictive rather than breaking these rules

## Understanding the Results

Your generated spellbook will include:

-   The exact number of cantrips for your class and level
-   The exact number of leveled spells for your class and level (adjusted for any bonus spells if configured)
-   All spells sorted by level, then alphabetically
-   Spell details including casting time, range, components, and descriptions

## Limitations

-   The generator uses official D&D 5e rules and data
-   Some spell availability may vary by sourcebook edition
-   Multiclass spellcasting rules are not automatically applied (select one primary class)
-   The generator doesn't account for class features that modify spell selection (like Domain spells for Clerics)
