# Release and Version Control

This repository uses Semantic Versioning, Git tags, GitHub Actions, and Expo Application Services (EAS).

## Version scheme

The Expo app version in `app.json` is the public app version. Keep `package.json`'s version aligned with it. Release tags must match that version exactly:

- `v0.1.0`: first tracked preview release
- `v0.1.1`: backward-compatible bug fix
- `v0.2.0`: backward-compatible feature
- `v1.0.0`: first stable release, when the app is ready

Do not move or reuse a release tag after publishing it.

## Branching workflow

- `main`: reviewed, releasable code
- `develop`: optional integration branch
- `feature/<short-name>`: new feature
- `fix/<short-name>`: bug fix

Create a feature/fix branch, commit changes with meaningful messages, then open a pull request into `main`. GitHub Actions runs `npm ci`, TypeScript type-checking, and `expo-doctor` for pull requests and pushes to `main`/ `develop`.

## One-time EAS setup

Complete these steps locally before the first GitHub tag release:

1. Create or sign in to an Expo account and install the app dependencies with `npm ci`.
2. Run `npx eas-cli@latest login`.
3. From the repository root, run `npx eas-cli@latest init` and link this source repository to the correct Expo project. Commit the resulting `extra.eas.projectId` in `app.json`.
4. Run `npx eas-cli@latest build:configure` if needed, keeping the `eas.json` profiles in this repository.
5. Configure Android build credentials using an interactive first preview build: `npx eas-cli@latest build --platform android --profile preview`. Confirm the APK installs and launches on a real device.
6. Set the EAS environment variable `EXPO_PUBLIC_API_BASE_URL` for the `preview` environment to the deployed **HTTPS** API base URL (the backend host, without `/api/v1` if the code appends that path). Do not use a laptop LAN IP for a release build. This value is bundled into the client, so it is not a place for secrets.
7. Create an Expo access token and add it to this GitHub repository under **Settings → Secrets and variables → Actions** as `EXPO_TOKEN`. Never commit the token.
8. Confirm the Actions workflow can complete before announcing a release.

The first EAS build initializes the remote Android version and signing credentials. Review the EAS build settings and signing credentials carefully; keep the same application ID and preserve the production signing setup for later Play Store releases.

### Existing npm peer-dependency conflict

The current dependency tree triggers an npm `ERESOLVE` because npm selects `react-dom@19.3.0` while the app pins `react@19.2.3`. The workflows use `npm ci --legacy-peer-deps`, and `.npmrc` makes the same resolver choice apply to EAS cloud builds. Treat this as a compatibility workaround, not the final dependency fix.

Expo Doctor currently reports 20 of 21 checks passing, with the only failed check being three SDK 57 patch-level advisories (`expo`, `expo-router`, and `expo-splash-screen`). CI allows that specific advisory with a warning, but still fails other Expo Doctor errors. Resolve the React / React DOM conflict and update the Expo packages by running `npx expo install --fix` locally, then commit the updated `package.json` and `package-lock.json`. Remove the `.npmrc` workaround after the dependency tree installs cleanly without it.

## Publish a versioned preview release

1. Update the Node package metadata with `npm version --no-git-tag-version 0.1.1` (replace the example version with the one you want). This updates both `package.json` and the root version in `package-lock.json`.
2. Update `app.json` (`expo.version`) to the exact same version. The release workflow checks that the tag, `app.json`, `package.json`, and `package-lock.json` all match.
3. Commit and merge the release-ready changes to `main`; verify CI is green for that exact commit.
4. Create and push a matching annotated tag:

   ```bash
   git checkout main
   git pull origin main
   git tag -a v0.1.0 -m "InPockets v0.1.0"
   git push origin v0.1.0
   ```

5. The `Android Release` workflow checks the version, runs validation, builds an internal-distribution APK on EAS, downloads the APK, and creates a GitHub Release with generated notes and the APK attached.
6. Test the exact APK that was attached to the release before sharing it widely.

Replace `0.1.0` in the example with the release version you are actually publishing. The tag and both version fields must match.

## Google Play later

The tag-driven workflow intentionally creates an internal preview APK, not a Play Store upload. When Play Console access is granted, use the `production` profile to create an Android App Bundle (`.aab`), then introduce an explicitly authorized submission step. Do not add Google Play service-account credentials to the repository.

Before any public production release:
- verify the app points to the deployed HTTPS backend;
- remove the development-only cleartext HTTP allowance from the Expo config/plugin;
- complete device testing, especially onboarding, authentication, identity capture, and network failure handling;
- verify Play policy, privacy, financial-product, and data-handling requirements with the app owner;
- review npm's reported audit findings before production. A CI install during setup reported 25 audit findings (11 moderate and 14 high); run `npm audit` and distinguish reachable production dependencies from development tooling before deciding fixes.

## Recovery and traceability

A Git tag pins the exact source commit. A GitHub Release records the human-readable change notes and APK for that tag. If a build fails, inspect the failed GitHub Actions run and the corresponding EAS build logs; fix the source or configuration, then create a new version tag rather than reusing the existing one.
