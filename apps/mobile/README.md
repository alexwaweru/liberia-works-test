# Liberia Works — Mobile App

React Native app (Expo) for job seekers. Covers job browsing, applications, programs, and profile management.

---

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | 18 or later |
| npm | 9 or later |
| Expo CLI | bundled via `npx` (no global install needed) |
| iOS Simulator | Xcode 14+ (macOS only) |
| Android Emulator | Android Studio with a virtual device, or a physical device with USB debugging |

---

## Setup

```bash
cd apps/mobile
npm install
```

Copy the environment template and set the API URL:

```bash
cp .env.example .env
```

`.env`:

```
EXPO_PUBLIC_API_URL=http://localhost:3001
```

For a physical device on the same network, replace `localhost` with your machine's local IP (e.g. `192.168.1.10`).

---

## Running the app

```bash
# Start Metro bundler (opens Expo Dev Tools in terminal)
npm run dev

# Open directly in iOS Simulator
npm run ios

# Open directly in Android Emulator
npm run android
```

After `npm run dev`, press:
- `i` — open iOS Simulator
- `a` — open Android Emulator
- `w` — open in web browser (limited support)
- `r` — reload app
- `m` — toggle dev menu

---

## Project structure

```
apps/mobile/
├── app/                        # Expo Router file-based routes
│   ├── _layout.tsx             # Root layout: auth guard + QueryClient provider
│   ├── (auth)/
│   │   ├── login.tsx           # Phone + password login
│   │   └── register.tsx        # New account registration + OTP verification
│   └── (tabs)/
│       ├── _layout.tsx         # Bottom tab navigator
│       ├── jobs/
│       │   ├── index.tsx       # Job list with keyword search and type filter
│       │   └── [id].tsx        # Job detail + apply (simple confirm or custom form)
│       ├── applications/
│       │   ├── index.tsx       # My applications list
│       │   └── [id].tsx        # Application detail with status
│       ├── programs/
│       │   └── index.tsx       # Employment program cycles list
│       └── profile/
│           ├── index.tsx       # Profile overview card
│           ├── general.tsx     # Edit name, DOB, gender, NIN
│           ├── education.tsx   # Add / delete education records
│           └── experience.tsx  # Add / delete work history records
├── components/
│   ├── Badge.tsx               # Status / type pill badge
│   ├── LoadingView.tsx         # Full-screen loading spinner
│   └── ErrorView.tsx           # Full-screen error + retry button
├── lib/
│   ├── api.ts                  # All API calls + typed responses
│   └── auth.ts                 # Token storage (SecureStore) + AuthContext
├── assets/                     # App icon, splash image, adaptive icon
├── app.json                    # Expo config (bundle IDs, scheme, plugins)
├── babel.config.js
├── tsconfig.json
└── package.json
```

---

## Authentication

The API uses httpOnly cookies for session tokens. Since React Native's `fetch` does not expose raw `Set-Cookie` response headers, auth endpoints (`/login`, `/register`, `/otp/verify`, `/refresh`) use `XMLHttpRequest` instead, which does expose them in React Native.

The extracted `access_token` and `refresh_token` values are stored in **Expo SecureStore** (encrypted on-device storage). Every authenticated request injects the token as a `Cookie: access_token=<token>` header. On a 401 response, `apiFetch` automatically attempts a token refresh before retrying once.

---

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | `http://localhost:3001` | Base URL for all API calls |

Prefix `EXPO_PUBLIC_` makes the variable available in client-side bundle. Do not put secrets here.

---

## Type checking

```bash
npm run type-check
```

---

## Linting

```bash
npm run lint
```

---

## Building for production

Production builds use [EAS Build](https://docs.expo.dev/build/introduction/). You need an Expo account and the `eas-cli`:

```bash
npm install -g eas-cli
eas login
```

Build for both platforms:

```bash
# Android APK / AAB
npm run build:android

# iOS IPA
npm run build:ios
```

Configure `eas.json` at the root of `apps/mobile/` for build profiles (development, preview, production) before running EAS builds.

---

## Key dependencies

| Package | Purpose |
|---|---|
| `expo ~52` | Expo SDK + native module bindings |
| `expo-router ~4` | File-based routing (similar to Next.js App Router) |
| `expo-secure-store ~14` | Encrypted token storage |
| `@tanstack/react-query ^5` | Server-state fetching and caching |
| `react-native 0.76` | Core React Native runtime |
| `@expo/vector-icons ^14` | Ionicons and other icon sets |
| `react-native-safe-area-context` | Safe area insets for notches / home indicators |
| `react-native-screens` | Native navigation screen containers |
