// ── Behavior plugins barrel file ─────────────────────────────────
//
// Built-in behaviors are registered directly in behaviorRegistry.js.
// This folder is reserved for future external/theory-specific behaviors.
//
// To add a new custom behavior:
//   1. Create a file in this folder (e.g. myBehavior.js)
//   2. Import { registerBehavior } from '../behaviorRegistry'
//   3. Call registerBehavior({ id, label, priority, condition, execute })
//   4. Import your file from the app entry point or a theory config
