# AGENTS

- Never edit `firestore.rules` directly. Edit `rules/*.rules`, run `npm run build`, commit both.
- App repos must not deploy `firestore:rules` or `firestore:indexes`; rule changes for any app go through a PR here.
- When a mindset rule changes, the matching client/test change lands in mindset; CI here runs mindset's emulator tests from `main`, so merge the mindset side first or together.
- `firebase` is the local `firebase-tools` devDependency: use `npm run deploy` or `npx firebase`, not a global `firebase`.
