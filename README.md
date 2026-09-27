# Mindspace Mobile App (React Native · iOS & Android)

A high-fidelity React Native mobile application for **Mindspace**, built with Expo, TypeScript, and native mobile components.

---

## 🏛️ Architecture & Backend Connection

> **IMPORTANT:**
> This mobile app **does NOT** connect directly to the Supabase database.
> All network interactions (authentication, token refresh, bookmark CRUD, metadata scraping, reader mode, and AI context extraction) are executed **strictly through the Node.js Express backend** (`node-backend`).

### Key Implementation Principles:
- **Authentication**: JWT-based session management using `@react-native-async-storage/async-storage`.
- **Proactive & Reactive Token Keep-Alive**: Background keep-alive checking JWT expiration (`isTokenExpired`), refreshing proactively before expiry, and single-flight retry upon 401 status.
- **Client-Side Deduplication**: URL normalization and instant duplicate detection with a floating animated `"Link already exists"` badge.
- **Optimistic UI**: Skeleton card displayed immediately when saving a bookmark while backend metadata extraction runs in under 500ms.
- **Decoupled AI Pipeline**: Asynchronous AI context synthesis with credit check and `"No credits left"` badge.

---

## 🎨 Design & Design System

The mobile application replicates the exact **Organic Sand Dune / Amber Luxury** aesthetic of the web platform:

- **Color Palette**:
  - Light: `#FAF8F5` background, `#FFFFFF` cards, `#B5814C` primary amber, `#D99F50` accent.
  - Dark: `#0B0907` background, `#161310` cards, `#C88E3E` primary amber, `#D99F50` accent.
- **Adaptive Theme**: Toggle between Light and Dark mode seamlessly, or follow system appearance.
- **Social Card Engine**:
  - **X / Twitter**: Profile avatar, verified badge, tweet body, metrics (replies, reposts, likes, views), media previews.
  - **Instagram**: Feed cards with images, author info, likes, and comment counts.
  - **LinkedIn**: Professional cards with document/slide previews, reactions, and reposts.
  - **YouTube**: Video thumbnails with red play overlay, channel metadata, and view count.
  - **Reddit**: Subreddit icons, author usernames, upvotes, and comments.
  - **Facebook & Pinterest**: Platform-specific styling.
  - **Generic / Web**: Favicon integration, snapshot preview, article indicator, and tags.
- **Reader Mode**: Distraction-free article reader with warm/dark/light theme switch, font size controls (`sm`, `base`, `lg`, `xl`), and reading metrics.
- **AI Context Bottom Sheet**: Full taxonomy breakdown, conceptual tags, visual entities, OCR text, and copy-to-clipboard.

---

## 🚀 Getting Started

### 1. Configure the Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Set `EXPO_PUBLIC_API_URL` to your Node backend:

- **iOS Simulator**: `http://localhost:3000/api/v1`
- **Android Emulator**: `http://10.0.2.2:3000/api/v1` *(Note: `config.ts` automatically maps `localhost` to `10.0.2.2` when running on Android)*
- **Physical Device**: `http://<YOUR_LAN_IP>:3000/api/v1` (e.g. `http://192.168.1.50:3000/api/v1`)
- **Hosted Production**: `https://mindspace-link-web-scrapper.onrender.com/api/v1`

*(You can also change or test the backend URL directly inside the mobile app via **Settings ➔ Backend Node Server URL**).*

### 2. Start the Backend

Make sure the Node backend is running:

```bash
cd ../node-backend
npm run dev
```

### 3. Launch the Mobile App

Navigate into `mindspace-app`:

```bash
cd mindspace-app
```

- Run on iOS Simulator:
  ```bash
  npm run ios
  ```

- Run on Android Emulator or Device:
  ```bash
  npm run android
  ```

- Start Expo dev server (scan QR with Expo Go on your phone):
  ```bash
  npm start
  ```

---

## 📁 Directory Structure

```
mindspace-app/
├── App.tsx                        # Root app with ThemeProvider, AuthProvider, Safe Area
├── app.json                       # Expo configuration (iOS bundleId & Android package)
├── .env                           # Environment variables
├── src/
│   ├── types/
│   │   └── bookmark.ts            # Strongly-typed data models matching web frontend
│   ├── constants/
│   │   ├── theme.ts               # Light & Dark color tokens & typography
│   │   └── config.ts              # Dynamic API base URL & platform fallback
│   ├── services/
│   │   └── api.ts                 # Pure Node backend client with AsyncStorage & refresh
│   ├── utils/
│   │   └── helpers.ts             # Card resolution, platform filtering, date formatting
│   ├── context/
│   │   ├── AuthContext.tsx        # Session state, login, signup, token keep-alive
│   │   └── ThemeContext.tsx       # Dark/light theme mode with persistence
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Header.tsx         # Brand logo, credits status, theme & settings buttons
│   │   │   ├── SearchBar.tsx      # "Search your mind..." italic serif search
│   │   │   ├── FilterPills.tsx    # Scrollable platform filter tabs
│   │   │   ├── ToastHud.tsx       # Floating pill notification capsule
│   │   │   ├── FloatingBadge.tsx  # "No credits left" & "Link already exists" badges
│   │   │   └── SkeletonCard.tsx   # Optimistic metadata extraction placeholder
│   │   ├── cards/
│   │   │   ├── BookmarkCard.tsx   # Card dispatcher
│   │   │   ├── GenericCard.tsx    # Web & article cards
│   │   │   ├── TwitterCard.tsx    # X/Twitter styling
│   │   │   ├── InstagramCard.tsx  # Instagram styling
│   │   │   ├── LinkedInCard.tsx   # LinkedIn styling
│   │   │   ├── YouTubeCard.tsx    # YouTube video styling
│   │   │   ├── RedditCard.tsx     # Reddit post styling
│   │   │   ├── FacebookCard.tsx   # Facebook post styling
│   │   │   └── PinterestCard.tsx  # Pinterest pin styling
│   │   └── modals/
│   │       ├── AddBookmarkModal.tsx    # Save link modal with paste & auto-AI switch
│   │       ├── CardActionSheet.tsx     # 3-dots action sheet for cards
│   │       ├── AiContextModal.tsx      # AI synthesis & taxonomy viewer
│   │       ├── ReaderModal.tsx         # Distraction-free article reader
│   │       ├── DeleteConfirmModal.tsx  # Deletion confirmation
│   │       └── SettingsModal.tsx       # Credits, auto-AI switch, backend URL config
│   └── screens/
│       ├── AuthScreen.tsx         # Sign in, Sign up, OTP verification, Forgot password
│       └── DashboardScreen.tsx    # Bookmark feed, search, filter, pull-to-refresh
```
