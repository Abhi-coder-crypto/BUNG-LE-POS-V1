---
name: Mongo poll-sync claim-before-create pattern
description: Why "process then mark synced" polling sync loops duplicate work on restart, and the atomic-claim fix pattern.
---

A polling sync service that reads unsynced documents, does expensive/side-effecting
work (e.g. creates a downstream order), and only afterward writes a `synced: true`
flag back to the source document has a restart race: if the process dies between
finishing the work and persisting the flag, the next boot's in-memory dedupe state
is empty, so the same document is reprocessed and the side effect (e.g. a duplicate
order/KOT) happens twice.

**Why:** in-memory processed-ID sets only protect against duplicate work within a
single running process — they provide zero protection across process restarts,
deploys, or crashes. The persistent "synced" flag is the only durable dedupe state,
so it must be written *before* the risky work starts, not after.

**How to apply:**
- Atomically claim the document first: `updateOne({_id, synced: {$ne: true}}, {$set: {synced: true, claimedAt: now}})`, and only proceed if `modifiedCount === 1`.
- On failure before the downstream side effect happens, release the claim (`synced: false`) so it can be retried without risk of duplication.
- If the side effect *did* happen but the final "fully linked" write (e.g. saving the created order's ID back) fails, do NOT release the claim — that would let a retry create a second copy of the already-created side effect. Instead flag it (e.g. `linkWriteFailed: true`) for manual reconciliation.
- Add a stale-claim reclaim window (e.g. 2 minutes) for claims that never got a "fully linked" write, so a genuine mid-work crash doesn't strand the document forever — but explicitly exclude `linkWriteFailed` docs from this reclaim (they already produced a real side effect).
- When loading already-synced state into the in-memory guard on startup, only include documents that are *fully* linked (not just claimed) — otherwise claim-only records get permanently skipped and never get a chance to hit the stale-claim reclaim path.
- For nested-array schemas (`{orders: [...]}`), plain dot-path filters like `{'orders._id': X, 'orders.syncedToPOS': false}` can match across *different* array elements and claim the wrong one — use `arrayFilters` keyed on the same element's `_id` to pin the match/update to one element.
