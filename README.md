<!-- @format -->

# Vizier's Vault App

## Goals

-   get all pages to under 14 kB in size because of (this blog post)[https://endtimes.dev/why-your-website-should-be-under-14kb-in-size/]

## To-do List

-   moved userProfile creation and user avatar upload to separate server actions
-   see if removing all Shadcn UI components from home page reduces First Load JS
-   finished setting up the Discord server with
    -   [x] a forum for feature requests
    -   [x] a forum for bug reports
    -   [x] a forum for feedback
    -   onboarding
    -   auto-roles
    -   add invite link to discord.tsx
-   we need rate limits
    -   Encounter, Magic Shop, and Spellbook generators use D&D Data, so they have to be on the server to ensure the user only gets what's necessary for the output and it linked according to their settings

## Change Log

### 2025/08/31

#### 15:56

-   all links in the footer are now no longer prefetched
-   got started on the spellbook generator

#### 14:49

-   added a detailed section to the web/pricing
-   review and update the FAQ page at /web/faq
-   the example dashboard has a too wide width when the windows is narrow
-   fixed: logged in dashboard has too much padding on mobile
-   typo on /web/about: should be "An ode".
-   on /web/contact, need to remove the "Built by a..." section

### 2025/08/30

#### 15:22

-   added an action button to Party in the sidebar that navigates to /app/parties/add which opens the AddPartyDialog

#### 14:48

-   in the sidebar, add a badge that says "New" next to those that are new in the current version and make slightly transparent those that are not yet implemented
-   added plan to userProfile in schema

#### 12:21

-   refactored features into one JSON, features.ts, for easy ingestion by pricing, account, benefits, and services. Single source of truth is best
-   refactored plans into one JSON, plans.ts, for easy ingestion by pricing and account

### 2025/08/29

-   added a loading state on /app/parties for useUser
-   added a basic account page at /app/account
-   made the sidebar collapse to icons
-   refactored sidebar to use actual shadcn Sidebar components
-   created a features JSON for use in benefits.tsx and services.tsx, which can also be used in PricingSection in pricing.tsx
-   added a little info icon on the 4-month free trial explaining the reasoning for such a a long trial
-   make the login page show better loading state for better UX
-   removed the icons in the navbar because I think they made it look too busy, therefor confusing

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
