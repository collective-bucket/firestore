# firestore

Firestore rules and indexes for every Collective Bucket app. The
`collective-bucket` Firebase project has one Firestore database and one rule
set; this repo is the only place that deploys it. App repos (mindset, pano,
payback, budget, yildirimlar) deploy hosting only.

## Layout

| File | Collections |
| --- | --- |
| `rules/00-header.rules`, `rules/99-footer.rules` | `rules_version`, `service`, database match |
| `rules/10-shared.rules` | `ads` (pano), `trips` (payback) |
| `rules/20-mindset.rules` | mindset collections |
| `rules/30-budget.rules` | `budgets/{uid}` |
| `rules/40-yildirimlar.rules` | `apps/yildirimlar/**` |

`firestore.rules` is generated: edit a fragment, then `npm run build` and commit
both. CI fails if they differ. New apps put their data under `apps/<app>/` and
add their own fragment.

`firestore.indexes.json` holds every app's composite indexes.

## Local

```bash
npm ci
npm run build        # rules/*.rules -> firestore.rules
npm run check        # generated file is up to date
npm run test:rules   # emulator tests (needs Java 21); also runs ../mindset tests
```

`test:rules` runs `tests/*.emulator.js` and mindset's `tests/rules.test.js`,
`tests/rules.emulator.js`
and `tests/sim.emulator.js` from a sibling checkout (`MINDSET_DIR`, default
`../mindset`).

## Deploy

Pushing `main` runs the tests and deploys rules and indexes through GitHub
Actions (Workload Identity, service account `github-actions-deployer`).
By hand: `npm run deploy`.
