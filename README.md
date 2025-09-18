<!-- @format -->

# Vizier's Vault App

## Goals

-   get all pages to under 14 kB in size because of (this blog post)[https://endtimes.dev/why-your-website-should-be-under-14kb-in-size/]

## To-do List

-   see if removing all Shadcn UI components from home page reduces First Load JS
-   finished setting up the Discord server with
    -   [x] a forum for feature requests
    -   [x] a forum for bug reports
    -   [x] a forum for feedback
    -   onboarding
    -   auto-roles
    -   add invite link to discord.tsx
-   Template is done and ready for the other sites requires
    -   account page
        -   [x] update name
        -   [ ] update subscription
        -   [x] update avatar
    -   payment integration with subscriptions
        -   (Paddle)[https://www.paddle.com/]
        -   (Coda)[https://www.coda.co/merchant-of-record/]
        -   (LemonSqueezy)[https://www.lemonsqueezy.com/]
    -   [x] rate limiting with Upstash Redis
    -   [x] need Obsidian markdown to HTML function for the blog and docs
        -   [x] set up basic blog and docs
    -   need to implement spellbook generator so that free users can use it, but the data is not saved and so that premium members get their own url that they can share with others if they want.

## Change Log

### 2025/09/18

#### 12:49

-   updated how the upsell cards work

#### 12:13

-   just fixed boby in body by removing body tag from loading.tsx
-   minified react error in prod is now gone everywhere
-

#### 11:47

-   attempted fix of minified react error in prod. Let's see if it worked.
    -   minified react error is sitll present in prod. It's likely the hydration error I'm getting in dev.
-   fixed typo on /web/contact page
-   adjusted verbiage in FeaturesExplainerSection

### 2025/09/14

#### 14:05

-   security updates to auth and cookies, primarily for rate limiting security

### 2025/09/13

#### 19:26

-   all headers are the same expect search is present on /docs and /blog

#### 19:03

-   massive metadata and seo update done
-   moved rate limits into plans.ts and they are now shown on the /web/pricing in both sets of cards.
-   Obsidian as CMS blog and docs complete. There may be some Obsidian markdown that doesn't work yet, as only testest latex, images, and checkboxes. Might need to check codeblocks and others on the list at [Remark Obsidian](https://github.com/heavycircle/remark-obsidian)

#### 15:07

-   basic blog and docs. Still need layout.tsx with sidebar and header
-   made /docs and /blog static and not dynamic

#### 13:27

-   implemented rate limiting via middleware and upstash redis

### 2025/09/06

-   user can now update their avatar and display name
-   moved userProfile creation and initial avatar upload to the server using the admin sdk

### 2025/09/03

-   useUser() now integrated with db.useUser() and properly sets user to null on logout
-   login now no longer redirects to /app/dashboard, instead redirects back to referrer

### 2025/09/02

#### 21:18

-   added min height to magic shop
-   added items to know when the template is ready for my other sites

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
