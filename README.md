# InPockets — React Native (Expo) port of the Flutter app

Rewrite of `inpocketsV2-main/lib` (Flutter + Riverpod + go_router + Dio) in
Expo SDK 57 / React Native 0.86 / TypeScript. It talks to the **same FastAPI backend**
(`/api/v1/...`) with the same contracts, so the backend does not change.

## Run it on your rooted phone (no emulator)

1. Phone and computer on the **same Wi-Fi**. Install **Expo Go** on the phone.
2. Start the backend listening on all interfaces:
   `uvicorn app.main:app --host 0.0.0.0 --port 8000`
   (allow port 8000 through your computer's firewall).
3. In this folder:
   ```
   npm install
   npx expo start
   ```
   Scan the QR code with Expo Go. The app derives the API URL from the Metro host
   (`http://<your-laptop-ip>:8000`), so no config is normally needed.
4. Alternatives if Wi-Fi isolation blocks you: USB debugging + `adb reverse tcp:8000 tcp:8000 &&
   adb reverse tcp:8081 tcp:8081`, then set `EXPO_PUBLIC_API_BASE_URL=http://localhost:8000`.
   (Root is not required for any of this.)

Cleartext `http://` is enabled for development (`expo-build-properties`). Remove it and use HTTPS for production builds.

## If the app crashes on launch ("undefined is not a function" at expo-router)

```
rmdir /s /q node_modules      (Windows)   |   rm -rf node_modules
npm install                   # if npm reports ERESOLVE: npm install --legacy-peer-deps
npx expo-doctor               # reports any SDK/package version mismatch
npx expo start -c             # -c clears the Metro cache
```
Make sure Expo Go is the latest Play Store version and lists SDK 57 as supported.

## Flutter → React Native map

| Flutter | React Native |
|---|---|
| go_router + `_redirect` | expo-router + `src/core/routing/gate.ts` (`resolveRedirect`, same rules) |
| Riverpod providers | zustand (`authStore`, `otpFlowStore`) + TanStack Query (onboarding, loans, documents, journey) |
| Dio + interceptors | axios in `src/core/api/client.ts` (single-flight 401 → refresh → retry, `ApiException`) |
| flutter_secure_storage | expo-secure-store |
| `AppTheme` / `AppMotion` | `core/theme/*` (palette, Sora + Inter, motion tokens from the spec) |
| image_picker (front camera) | expo-image-picker |
| animations | react-native-reanimated (reduced-motion aware) |

Screens: splash, loading/retry, login, OTP, profile, PAN, KYC, identity (selfie), complete,
home / loans / documents / profile tabs, loan apply + detail, offer, KFS, e-sign, bank account,
disbursement, repayment, sessions, settings (new).

## Theme

`#3B82F6`, `#60A5FA`, `#1F2937`, `#F0F9FF` are the brand colours (`core/theme/colors.ts`).
Light: background `#F0F9FF`, text `#1F2937`, primary `#3B82F6`. Dark: surface `#1F2937`,
text `#F0F9FF`, primary `#60A5FA`. Borders, alt surfaces, secondary text and status colours are derived.
Settings → **Dark mode** switch and **Match device** switch (persisted).

## Intentional differences from the Flutter app

- Identity → Complete: the gate sends the user to the "You're all set" screen when onboarding flips to COMPLETED (Flutter relied on listener ordering).
- Logout signs out locally even if `/auth/logout` fails.
- Splash holds ≥1.1 s (brand intro per the motion spec).
- Default API host is auto-detected (Flutter's `10.0.2.2` only works on the Android emulator).
- Camera: expo-image-picker opens the system camera; Flutter's `maxWidth/maxHeight` downscale is not applied (quality 0.85 only).

## Known gaps / next steps

- Loan lifecycle (offer → repayment) is the same in-memory **mock** as in Flutter; rates are placeholders (banner shown).
- No iProov/liveness SDK yet (backend issue #3). That needs a **development build**, not Expo Go.
- Not tested on a physical device from here: I verified `tsc --noEmit` and a full Android Metro bundle only.
- No automated tests yet.
