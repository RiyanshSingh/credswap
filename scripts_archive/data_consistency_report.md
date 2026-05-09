# 🔍 Data Consistency Audit Report

After reviewing the architecture of your React Query hooks, Supabase table definitions, and local component states, I have identified **5 critical areas** where the data consistency is actively breaking or highly exposed to race conditions. 

### 1. Dual-Transaction Desyncs (Escrow & Marketplace)
**Location**: `Dashboard.tsx` -> `confirmDelivery` mutation
**The Issue**: The `confirmDelivery` hook fires a destructive `.update()` payload directly to the `marketplace_orders` table to mark it "completed/delivered". Immediately after, it executes a secondary remote procedure call (RPC) `confirm_marketplace_delivery`. 
**Why it breaks consistency**: If the user's network drops between these two API calls, the item will visually mark itself as "completed" but the financial escrow funds will be permanently trapped inside the smart contract RPC since it dropped. 
**The Fix**: You must completely remove the raw `update()` query. The Supabase RPC `confirm_marketplace_delivery` should be designed to handle both the table update *and* the escrow release universally in one atomic Postgres transaction block.

### 2. Orphaned State Deletions (Ghost Data)
**Location**: `Dashboard.tsx` -> `deleteListing` & `deleteTask`
**The Issue**: Sellers and creators can arbitrarily execute `.delete()` queries on their items or tasks. 
**Why it breaks consistency**: The code doesn't verify if these items are currently tied to active orders (`status: pending/reserved`) or have open admin `task_disputes`. If an item is deleted mid-transaction, the buyer will be entirely locked out of their `MarketplaceOrders` page trying to query a `null` item, breaking the frontend routing and permanently hiding the dispute trail.
**The Fix**: Instead of hard-deleting the row, introduce a `is_archived` boolean or block deletions outright if `status !== 'open'`. 

### 3. Denormalized Counter Desync (Community "Likes")
**Location**: `CommunityFeed.tsx` -> `toggleLike` mutation
**The Issue**: When users click "Like", the mutation safely adds/removes a relational row in the `post_likes` linkage table. However, it completely ignores the hardcoded `likes: 0` integer column sitting natively on the `community_posts` table. 
**Why it breaks consistency**: Your UI binds the heart icon directly to `post.likes`. Because the integer isn't being incremented/decremented simultaneously when the `post_likes` table updates, the UI will perpetually render "0 Likes" on the feed regardless of how many users have engaged.
**The Fix**: Use a standard Supabase Postgres Trigger `AFTER INSERT OR DELETE ON post_likes` to automatically augment the `likes` counter on the parent post so the frontend always fetches accurate synced aggregates.

### 4. Cache Invalidation Blindspots (React Query)
**Location**: `CommunityFeed.tsx` (`deletePost`) and `TaskDetails.tsx` (`submitMutation`)
**The Issue**: React Query depends precisely on `invalidateQueries` to know what to visually refresh.
*   In `CommunityFeed.tsx`, deleting a post attempts to invalidate using `['community-posts', post.community_id]`, but because `deletePost` only accepts `(postId)`, the `post.community_id` is often scoped incorrectly or undefined, meaning the screen doesn't refresh.
*   In `TaskDetails.tsx`, submitting a task invalidates `['task-submission']` but misses `['task']`, forcing the user to manually refresh their browser to see the parent task state change.
**The Fix**: Ensure React Query hook parameters accurately target the exact variable dependencies that generated the original `useQuery` hooks.

### 5. Fragmented Task Flow (Missing State Transition)
**Location**: `TaskDetails.tsx` -> `submitMutation`
**The Issue**: When a worker uploads proof of their work, you correctly `insert` a new row into `task_submissions`. However, the root `tasks` entity itself is left permanently in the `"assigned"` status. 
**Why it breaks consistency**: Your global logic expects a fluid pipeline (`open` -> `assigned` -> `in_review` -> `completed`). Because the `in_review` transition is natively bypassed during submission, workers looking at their dashboard will be confused seeing the task identically flagged as "assigned" despite having pending deliverables waiting for creator approval. 
**The Fix**: Append an `.update({ status: 'in_review' })` payload to the root task natively in the submission mutation! 
