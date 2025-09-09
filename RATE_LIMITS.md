<!-- @format -->

I'll analyze your app to identify areas where rate limiting would be beneficial. Let me start by examining the current codebase structure and understanding how Instant DB is being used.

Search files...
Search files...
Search files...
Now let me examine the specific generator pages and API endpoints to understand the data generation patterns:

Search files...
Ran tool
Ran tool
Ran tool
Now let me look for any existing API routes and examine the authentication patterns:

Ran tool
Search files...
Ran tool
Based on my analysis of your Vizier's Vault app, I can identify several areas where rate limiting would be beneficial. Let me create a comprehensive assessment:

Ran tool

## Rate Limiting Analysis for Vizier's Vault

After analyzing your app, I've identified several areas where rate limiting would be beneficial, especially considering you're using Instant DB which has its own transaction limits. Here are the key areas:

### **Critical Areas for Rate Limiting:**

#### 1. **Data Generation Endpoints** (High Priority)

-   **Spellbook Generator**: The `generateSpellbook` server action performs complex database queries on `dnd5e_spells` table
-   **Magic Shop Generator**: Likely involves complex data generation and database operations
-   **World/Encounter/Battle Map Generators**: These are computationally expensive operations

**Recommendation**: Implement per-user rate limits (e.g., 10 generations per hour for free users, 50 for premium)

#### 2. **Database Transaction Operations** (High Priority)

-   **Party Management**: `buildCreatePartyOps` and `buildUpdatePartyOps` functions
-   **User Profile Updates**: Avatar uploads and profile modifications
-   **File Upload Operations**: Avatar and party icon uploads

**Recommendation**: Rate limit based on operation type (e.g., 20 party updates per hour, 5 avatar uploads per day)

#### 3. **Authentication & User Management** (Medium Priority)

-   **Magic Link Requests**: Prevent email spam
-   **Profile Creation**: `createUserProfile` and `createUserProfileIfMissing` functions
-   **Token Verification**: `verifyToken` calls in server actions

**Recommendation**: Standard auth rate limits (5 magic link requests per hour, 3 profile updates per hour)

#### 4. **API Endpoints** (Medium Priority)

Your dashboard makes multiple API calls:

-   `/api/tools`
-   `/api/generations/recent`
-   `/api/tools/{id}/recent`

**Recommendation**: Rate limit API calls (100 requests per hour per user)

### **Implementation Strategy:**

#### **1. User-Based Rate Limiting**

```typescript
// Example rate limiting by user plan
const rateLimits = {
    free: {
        generations: { limit: 10, window: "1h" },
        partyUpdates: { limit: 20, window: "1h" },
        avatarUploads: { limit: 5, window: "24h" },
    },
    premium: {
        generations: { limit: 50, window: "1h" },
        partyUpdates: { limit: 100, window: "1h" },
        avatarUploads: { limit: 20, window: "24h" },
    },
};
```

#### **2. Operation-Specific Limits**

-   **Heavy Operations**: Spellbook/World generation (stricter limits)
-   **Medium Operations**: Party management, profile updates
-   **Light Operations**: Simple queries, dashboard data

#### **3. Instant DB Considerations**

Since Instant DB has its own limits, your rate limiting should be more conservative:

-   **Transaction Rate**: Limit to 30-50 transactions per minute per user
-   **Query Rate**: Limit complex queries (like spellbook generation) to 1-2 per minute
-   **File Operations**: Limit file uploads to prevent storage abuse

### **Recommended Rate Limiting Library:**

Consider using `@upstash/ratelimit` with Redis for distributed rate limiting, or `rate-limiter-flexible` for in-memory solutions.

### **Priority Implementation Order:**

1. **Data Generation Functions** (spellbook, world, etc.)
2. **File Upload Operations** (avatars, party icons)
3. **Database Transaction Operations** (party management)
4. **Authentication Operations** (magic links, profile creation)
5. **API Endpoints** (dashboard data fetching)

Ran tool
The most critical areas to implement rate limiting first are your **data generation functions** (especially the spellbook generator) and **file upload operations**, as these are both computationally expensive and could easily overwhelm your Instant DB transaction limits if abused.
