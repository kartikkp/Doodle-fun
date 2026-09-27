# Practice medals delivered

The additive ledger keeps best Bronze/Silver/Gold medals by mode, chronological age, practice step and scoring version. It preserves previous completion stores. Gold requires an independent clean set; Silver permits one imperfect round; Bronze recognizes completion. Sets use three to five rounds according to task complexity and content step. A Gold medal suggests the next step without changing it automatically.

Hint and mistake evidence is idempotent, survives retries/reloads and follows the original round. Duplicate completions cannot add credit. Untouched browsing is unpenalized; abandoned hints/mistakes count once even when a child returns and completes that item. Ordinary memory exploration, maze backtracking, partial tracing strokes and sound replay remain unpenalized. Drawing, coloring, free mosaic and beat composition are ungraded.

Finite tracing banks opt out of automatic rollover and can explicitly restart only a completed set. Best medals and older practice records survive that reset. Revealed help can be revoked across every engine without erasing current answers, ink or score evidence.

Commits include `8bb5149`, `31bf249`, `adef754`, `1ca077e`, `cc6928a`. Focused evidence: 12 ledger tests, eight two-engine medal playthrough checks, eight controller hint-revocation checks, plus the finite tracing integration tests. See [integrated QA](../../../docs/creative-play-qa.md) for the complete candidate run and remaining physical acceptance checks.
