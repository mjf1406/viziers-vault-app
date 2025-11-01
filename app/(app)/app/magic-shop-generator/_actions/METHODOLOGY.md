<!-- @format -->

# Magic Shop Generator Methodology

## Overview

The Magic Shop Generator creates realistic, balanced inventories for magical shops in your D&D 5e campaigns. It considers multiple factors to determine what items appear in a shop and at what prices, creating a dynamic and believable economy.

## Core Principles

### 1. Settlement Size Matters

The **population** of a settlement directly influences:

-   **How many items** appear in the shop (larger settlements = more stock)
-   **What rarity of items** can appear (population gates prevent tiny villages from having legendary items)

The formula uses a power law: `itemCount = scale × population^beta`, scaled by your stock multiplier setting.

### 2. Wealth Level Adjusts Prices

The **wealth** setting modifies prices across all rarities:

-   **Poor settlements**: Items are cheaper (up to 50% discount by default)
-   **Rich settlements**: Items are more expensive (up to 50% markup by default)
-   Higher rarity items are affected more dramatically than common items

### 3. Magic Level Determines Rarity Distribution

The **magicness** setting controls what rarity of items are likely to appear:

-   **Low magic**: Mostly common/uncommon items
-   **High magic**: More rare, very rare, and legendary items

This is combined with population gating:

-   **Strict gating**: A village of 1,000 people cannot have legendary items (0% chance)
-   **Soft gating**: Rare items might occasionally appear but are heavily penalized
-   **No gating**: Pure magic-level distribution (for high-fantasy settings)

### 4. Stock Categories Are Independent

When you select stock types (weapons, armor, potions, etc.), the generator:

-   Ensures at least one item from each selected category appears
-   Then fills the remaining slots using rarity-weighted selection
-   Handles scrolls and spell components separately with their own pricing

## Pricing System

### Base Prices

Each rarity has a base price tier:

-   **NONE**: Basic items (25-51,000 gp range)
-   **MINOR**: Potions, poisons (50-163,250 gp range)
-   **MAJOR**: Weapons, armor, rods, staves, wands, rings (75-275,500 gp range)
-   **WONDROUS**: Wondrous items (100-500,000 gp range)

### Price Modifiers

Prices are adjusted by:

1. **Wealth influence**: How much settlement wealth affects prices
2. **Max price change**: Maximum percentage adjustment (default 50%)
3. **Rarity progression**: How dramatically prices scale between rarities

### Spell Scroll Pricing

Scroll prices use a fixed base price per spell level, then apply the same rarity-based wealth modifiers. This ensures scrolls follow the same economic rules as other items.

### Spell Component Pricing

Material components with a gold cost are priced using their base cost from the spell description, modified by the same rarity-based wealth modifiers.

## Item Selection Process

### Step 1: Build Candidate Pool

The generator:

1. Fetches all available magic items and spells from the database
2. Filters items by your selected stock types (excluding artifacts)
3. Filters spells to only usable levels (0-9) that match the rarity distribution
4. Builds candidates with calculated prices for gear, scrolls, and components

### Step 2: Guarantee Minimums

At least one item from each selected category is guaranteed:

-   One gear item (if any gear category is selected)
-   One scroll (if scrolls are selected)
-   One component (if components are selected)

### Step 3: Fill Remaining Slots

The remaining slots are filled using rarity-weighted selection:

1. Items are grouped by rarity
2. Each rarity gets a portion of slots proportional to the rarity distribution
3. Items are randomly selected from each rarity pool
4. If slots remain unfilled, items are selected from any remaining pool

### Step 4: Format Results

Selected items are split back into their categories (gear, scrolls, components) for easy display and export.

## Population Gating

Rarity thresholds prevent unrealistic item availability:

-   **Common**: Always available (0 threshold)
-   **Uncommon**: Requires 500+ population
-   **Rare**: Requires 2,500+ population
-   **Very Rare**: Requires 10,000+ population
-   **Legendary**: Requires 100,000+ population

With strict gating, items below the threshold have 0% chance. With soft gating, the chance is reduced exponentially based on how far below the threshold the settlement is.

## Advanced Settings

### Slot Beta

Controls how quickly item count scales with population:

-   **Lower values (0.3-0.5)**: Gentler scaling (better for small settlements)
-   **Higher values (0.6-0.8)**: Aggressive scaling (cities get many more items)

### Slot Scale

Base multiplier for item count calculation. Lower values = fewer items overall.

### Magic Rarity Bias

Controls how magic level affects rarity distribution:

-   **< 1.0**: Gentler shift toward rare items
-   **> 1.0**: More aggressive shift toward rare items
-   **Default 2.0**: Balanced progression

### Rarity Population Gating

Three modes:

-   **strict**: Hard cutoff below population thresholds
-   **soft**: Exponential penalty but still possible
-   **none**: Pure magic-level distribution, ignore population

### Wealth Influence

How much settlement wealth affects prices:

-   **0.0**: Wealth has no effect
-   **1.0**: Full effect (default)
-   **> 1.0**: Exaggerated price differences

### Max Price Change

Maximum percentage price adjustment from wealth:

-   **0.25**: ±25% price variation
-   **0.5**: ±50% price variation (default)
-   **0.75**: ±75% price variation

### Rarity Progression Exponent

Controls price scaling between rarities:

-   **< 1.0**: Compresses price differences (Legendary relatively cheaper)
-   **1.0**: Linear progression
-   **> 1.0**: Amplifies price differences (Legendary much more expensive)

## Understanding the Output

### Item Count

The number of items shown is calculated from population, scaled by your multiplier and settings. This represents a realistic inventory for the settlement size.

### Price Variations

Prices vary based on:

-   Base rarity and type
-   Settlement wealth level
-   Your rarity progression settings

Prices are rounded to 2 decimal places for display.

### Category Balance

The generator ensures diversity:

-   If you select weapons and armor, you'll see both
-   Scrolls and components appear proportionally if selected
-   Rare items appear more often in high-magic, high-population settings

## Tips for Best Results

1. **Match Population to Campaign**: Use realistic population values from your world
2. **Adjust Magic Level**: Higher magic settings create more interesting shops but may be overpowering
3. **Use Stock Multiplier**: Increase for major trading hubs, decrease for small specialty shops
4. **Experiment with Gating**: Try "soft" gating for more variety while maintaining realism
5. **Consider Wealth**: Rich settlements are expensive, poor settlements offer bargains
