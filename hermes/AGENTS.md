This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npm test                    # unit and app tests
npm run check               # lint + typecheck + tests; run before every PR
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

# How this codebase is split

Several people and their agents work here at once. The UI is already built and runs on mock data.
**Most work is replacing a mock with real logic, without touching screens.**

```
src/
  app/         Routes only. A few lines each; no logic, no styles.
  features/    One folder per feature: screens, its components, its use-*.ts hook.
  services/    Where data comes from. contract.ts (interface), mock.ts, index.ts (which one is used).
  state/       Shared app state: session, trips, preferences.
  domain/      Types for the app's data. One file per thing.
  ui/          Generic components. Know nothing about travel.
  theme/       Colors, type, spacing.
  navigation/  routes.ts: every destination. Screens never type paths.
  utils/       Dates, formatting, useAsync.
```

Imports go one way: `app -> features -> state -> services -> domain`. Features, state and app use `ui`
and `theme`. Features import each other only through `@/features/<name>`. Lint enforces the main rules.

## Where your use case goes

| Use case | Put logic in | UI (already built) |
| --- | --- | --- |
| UC-01 Create account, UC-02 Log in | `services/auth/`, `features/auth/validation.ts` | `features/auth/` |
| UC-03 Manage profile (name only for now) | `services/profile/` | `features/account/` |
| UC-04 Search | `services/places/` | `features/explore/` |
| UC-05 Filter | `features/things-to-do/filter-activities.ts`, `features/stays/filter-stays.ts` | `ui/filter-*.tsx` |
| UC-06 View destination / lodging | `services/activities/`, `services/stays/` | `features/activity/`, `features/stays/` |
| UC-07 Weather | `services/weather/` | `features/weather/`, `features/dates/` |
| UC-08 Create trip | `state/trips/trip-logic.ts`, `services/trips/` | `features/destination/`, `features/trips/` |
| UC-10 Build itinerary | `state/trips/trip-logic.ts`, `services/trips/` | `features/trips/` |
| UC-11 Trip cost | `services/costs/` | `features/trips/components/cost-card.tsx` |
| UC-12 Share trip | `services/sharing/` | `features/shared-trip/`, `features/trips/` |

### Replacing a mock

1. Add `services/<name>/live.ts` that implements the interface in `contract.ts`.
2. Point `services/<name>/index.ts` at it. That is the only line that switches.
3. To fail, reject with an `Error` whose message can be shown to people. Screens already draw loading,
   error and empty states.
4. Keep `mock.ts`: tests and teammates rely on it.
5. Need more data? Add an **optional** field to the type in `domain/`. Changing or removing a field
   affects other people, so ask first.

### Adding tests

- Put them in a `__tests__/` folder beside the code, named `*-test.ts(x)`. Never inside `src/app/`.
- Mock trips are reset before every test (`jest.setup.ts`). If your mock keeps data, reset it there too.
- Tests fail on navigation errors ("not handled by any navigator"), even if the right screen shows.
- Use one test file per use case so people don't edit the same one.
- `src/__tests__/app-test.tsx` shows how to drive the whole app. Find things by `testID` or label.
  Treat existing `testID`s as public: don't rename them.

## Rules that keep merges easy

- **Stay in your folders.** Don't reformat, rename or tidy files outside your use case.
- **`ui/`, `theme/`, `app/`, `navigation/` and screen layout belong to the UI team.** If you need a
  UI change, ask them; don't restyle inside a feature.
- No shared catch-all files: no global `types.ts`, `constants.ts`, or `index.ts` that re-exports a folder.
  (`theme/index.ts` is the one exception.) Import UI directly: `@/ui/button`.
- Don't add a dependency without telling the team. It changes `package-lock.json` for everyone.

## UI rules

- Colors, spacing and type come from `@/theme`. No hex values or font sizes elsewhere.
- Use `Text`, `Button`, `Chip`, `Tappable`, `Photo`, `Icon`, ... from `@/ui`, not the React Native ones.
- A piece used by one feature stays in that feature. Move it to `ui/` when a second one needs it.
- Change how something looks by changing its one component, not by overriding styles where it's used.
- Black is structure and blue is action: if it's blue, you can tap it.
- Missing data is hidden, never filled in. Dates are always optional.
- Touch targets are at least 44pt, and icon-only buttons need a `label`.
- If it looks draggable, make it draggable, and keep tapping working too. Gestures use
  `usePanGesture`, animations use Reanimated with the springs in `ui/motion.ts`. Let vertical drags scroll.
  Write gesture options out in full (no spreads: the worklets compiler rejects them, and only a bundle
  build such as `npx expo export -p ios` shows it), and ignore taps that were part of a drag.
- Filters: common ones show first; mark rare ones `advanced` so they sit behind "More options".
- Light and dark follow the device, or the choice in Account (`useThemeMode`). Styles with colors use `createStyles((colors) => ({ ... }))` and
  `const styles = useStyles()`; one-off values use `useColors()`. There is no static `colors` import.
- Pick colors by purpose: fill with `action`, but write and draw with `actionText`. Use `selected` for
  chosen things, `frame` for the dark blocks around a place, `raised` for things that float.
- A new color goes in **both** palettes in `theme/colors.ts`, plus a row in `contrast-test.ts` if text
  sits on it. Never check for dark mode in a feature.

## Navigation

- Routes in `app/(tabs)/(explore,trips)/` exist in both tabs, so opening a place keeps you in the current
  tab and back works. Don't move them into one tab.
- Go to the plan with `useShowTrips()`, not `router.push(routes.trips)`.
- Screens with a text field use `Screen`, and sheets use `BottomSheet`: both avoid the keyboard.

## Accounts

- People can search, browse, check weather and pick dates **without an account**.
- Actions that need one are listed in `state/session/access.ts` and go through `useAccountGate()`.
  This only decides when to show sign-in. It is not security; the backend must check too.
- "Skip with a demo account" is controlled by `config.demoSignIn`. Turn it off once sign-in is real.

## What is fake right now

Sign-in accepts anything, all data is sample data held in memory, share links only work until the app
restarts, and the map is a placeholder (`ui/map-view.tsx`). Notifications are out of scope.
A trip may hold several places, and several trips may include the same place. Saves go to the active
trip when it includes the place (`findTripForPlace`).
