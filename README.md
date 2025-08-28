<!-- @format -->

# Vizier's Vault App

## Goals

-   get all pages to under 14 kB in size because of (this blog post)[https://endtimes.dev/why-your-website-should-be-under-14kb-in-size/]

## To-do List

-   create a features JSOHN for use in benefits.tsx and services.tsx, which can also be used in PricingSection in pricing.tsx

## Change Log

### 2025/08/28

#### 20:35

-   added a premium upsell to /parties when not logged in and/or on free plan
-   gated creating parties behind premium plan

#### 19:29

-   SidebarHeader is now fixed at the bottom of the screen on mobile
-   the links in app-sidebar.tsx now are in the footer of the sidebar on mobile
-   sidebar now closes when you click a link on mobile
-   add party button is now a floating action button on mobile

#### 18:35

-   AddPartyDialog is now regular shadcn dialog
-   added icons to items in the navbar that have a different nav element (basically indicating you're going to a different part of the site that behave differently)
-   renamed /philosophy to /about
-   added NameExplanation section to the about page
-   added plan (free vs premium) to user info in NavUser.tsx

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
