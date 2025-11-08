## Overview

The Spellbook Generator creates randomized spellbooks for D&D 5th Edition characters based on your selected criteria. It follows official rules from the Player's Handbook and other source materials to determine the number and types of spells available at different character levels.
## How It Works

### Step 1: Input Processing

You provide several options when generating a spellbook:

-   **Character Level**: A specific level (1-20) or "random"
    -   If random, a level between 1-20 is selected
    -   This determines the available spell levels for generation
-   **Spell Schools**: One or more schools of magic (Abjuration, Conjuration, etc.) or "random"
    -   If random, one or more schools are randomly selected
    -   Only spells from these schools will be included
-   **Character Class**: A single character class or "random"
    -   Only spells available to your selected class will be included
-   **Source Books**: Optional filters to limit spells to specific sourcebooks
-   **Exclude Legacy**: Option to filter out spells marked as "Legacy"
    -   Legacy spells are spells that were published in version older than the 2024 version of D&D 5e.
### Step 2: Filtering

The spell list is refined through several filters:
1. **Class Compatibility**: Only spells that can be cast by your selected class are kept
2. **Legacy Exclusion**: If enabled, spells with the "Legacy" school are removed
3. **Source Filtering**: If specific sourcebooks are selected, only spells from those sources are kept
### Step 3: Spell Selection

The generator uses official class tables to determine how many spells the spellbook should have:
-   **Cantrips**: The number is taken from official class tables (varies by class and level)
-   **Leveled Spells**: The number is determined by:
    -   Official class tables for most classes
    -   Special calculation for Artificers: Intelligence modifier (randomized 1-5) + half your level

**Spell Level Limits**: Each class has a maximum spell level they can learn at any given character level. For example, a 3rd-level Wizard can learn up to 2nd-level spells.

**Random Selection**: Spells are randomly selected from the filtered pool until the target count is reached. If there aren't enough spells available, you'll get fewer spells rather than relaxing the filters.
### Step 4: Bonus Spells (Premium Users)

Premium users can configure an "Extra Spells" setting that adds bonus spells to their spellbook. This uses a dice expression system:
-   **Fixed Numbers**: `+4` or `-2` adds/subtracts a fixed number
-   **Multiplication**: `*2` multiplies your total spell count
-   **Division**: `/1.5` divides your total spell count
-   **Dice Expressions**: `2d6`, `3d4 + 2`, etc. roll dice and add/subtract the result

The modifier is applied to your total spell count (cantrips + leveled), and the extra spells are proportionally distributed between cantrips and leveled spells.
## Special Rules

### Artificers

Artificers have a unique spell preparation system:

-   They prepare a number of spells equal to their Intelligence modifier + half their Artificer level (rounded down)
-   The Intelligence modifier is randomized between 1-5 for generated spellbooks
-   This differs from other classes which have fixed "spells known" values
### Spell Availability

The generator strictly follows these rules:

-   Only spells your class can learn are included
-   Only spells within your maximum spell level are included
-   The generator will return fewer spells if your filters are too restrictive rather than breaking these rules
## Understanding the Results

Your generated spellbook will include:

-   The exact number of cantrips for your class and level
-   The exact number of leveled spells for your class and level (adjusted for any bonus spells if configured)
-   All spells sorted by level, then alphabetically
-   Spell details including casting time, range, components, and descriptions
## Limitations

-   The generator uses official D&D 5e rules and data
-   Some spell availability may vary by sourcebook edition
-   Multiclass spellcasting rules are not automatically applied (select one primary class)
-   The generator doesn't account for class features that modify spell selection (like Domain spells for Clerics)