<!-- @format -->

# Vizier's Vault App

## Goals

-   get all pages to under 14 kB in size because of (this blog post)[https://endtimes.dev/why-your-website-should-be-under-14kb-in-size/]

## To-do List

-   switch all dialogs to the Responsive Dialog example from https://ui.shadcn.com/docs/components/drawer.
    -   This is kidn of a mess, I think.
    -   adding this made /parties go from ~8 kB to ~18 kB, so I need to optimize it somehow.

## Change Log

### 2025/08/28

-   AddPartyDialog is now regular shadcn dialog
-   added icons to items in the navbar that have a different nav element (basically indicating you're going to a different part of the site that behave differently)
-   renamed /philosophy to /about
-   added NameExplanation section to the about page

### 2025/08/27

-   made the delete level button destructive in LevelEditor.tsx
-   moved the theme toggle to Header.tsx

### 2025/08/26

-   added avatar, name, and email to user info
-   switched from header to sidebar

### 2025/08/23

-   added all the generator pages
-   added a header with navbar
-   added loading.tsx and Loader component
