# Branch Milestone Summary (Jan 1, 2026 - Feb 16, 2026)

Scope reviewed: commits on `main` from Jan 1, 2026 through Feb 16, 2026.

## 1) Features introduced

- Ticket categories became a full product feature: category-based pricing, quotas, discount support, and category-aware purchase flow.
- Revenue sharing was expanded with dynamic splitter profiles, including distribution profile management for local providers.
- Referral rewards were added to ticket purchases, with on-chain reward tracking and payout support.
- Multi-ticket buying and batch minting were introduced, including order-level metadata and improved ticket display for multiple passes.
- Event and place submission flows were upgraded with per-place event deposits instead of one global deposit rule.
- Master role event moderation expanded: masters can approve, decline, close, and cancel events more directly.
- Unified search was added across key entities (events, users, places, notifications), including reusable search UI.
- User-facing profile capabilities expanded with a dedicated profile page and better identity display across screens.
- Telegram integration was updated to use `@MimiThePresidentBot` for wallet and profile linking flows.
- Map capabilities grew significantly: richer event layers, improved popup detail, better interaction controls, and clearer layer management.
- A systemd-based development workflow with `cvland` CLI was introduced as a modern alternative to legacy tmux flow.

## 2) Improvements

- Purchase UX was streamlined with clearer payment stages, better state handling, and fewer dead-end states.
- Ticketing UI became more polished with responsive layouts, improved card presentation, and cleaner status visibility.
- Money handling was standardized around USDT helper utilities and integer-safe formatting, improving consistency across screens.
- Role and access-control model was modernized from single-role assumptions to multi-role/view-based checks.
- Notification handling improved with “mark all as read” support and cleaner routing behavior.
- Account and navigation UX was simplified (deprecated paths removed, clearer create-entry points, improved mobile navigation).
- Telegram bot reliability improved with better logging, validation, and startup/runtime error handling.
- Indexer and sync reliability improved with snapshot/test updates and more robust handling of contract event variations.
- Deployment and operations tooling matured with stronger validation, health checks, resource templates, and clearer env handling.
- API/schema and generated frontend types were repeatedly aligned, reducing contract drift between backend and client.

## 3) Old bug fixes

- Fixed long-standing map interaction instability (race conditions, stale closures, listener cleanup issues, and inconsistent toggle behavior).
- Resolved repeated path parameter mismatches that caused tx-hash polling and notification actions to fail intermittently.
- Fixed duplicate transaction submission risks in event management by enforcing pending-state protection.
- Corrected date/time inconsistencies across event forms and displays, including timezone confusion and inconsistent helpers.
- Fixed popup-blocker failures in Telegram connect/link flow by changing window-open timing.
- Resolved indexer replay/sync gaps so one-shot indexing can process full historical data from block zero.
- Fixed IPFS connection fragility with retry/resilience behavior in sync and deployment flows.
- Corrected multi-ticket data constraints by removing legacy uniqueness assumptions that blocked valid repeat purchases.
- Fixed contract-side event update overlap false positives that could block legitimate schedule updates.
- Fixed role-mapping and permission mismatches in indexer/backend flows that previously caused missing or incorrect access behavior.
- Resolved launch/startup reliability issues (service readiness, env loading, optional bot startup) that previously caused unstable local runs.
