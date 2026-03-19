# Campus Green Care Platform — Frontend Planning

> **Project**: CSE 496 Graduation Project  
> **Authors**: Ahmet Baha Çepni & Rabia Çerçi  
> **Advisor**: Assoc. Prof. Dr. Habil Kalkan  
> **Tech Stack**: React Native (TypeScript) + Mapbox + Firebase Messaging  
> **Scope of this document**: Frontend-only development plan

---

## 1. Project Overview

**Campus Green Care Platform** is a mobile application that digitally tracks campus trees and enables students to **adopt and maintain them through GPS-verified watering actions.**

### Core Concepts
| Concept | Detail |
|---|---|
| Tree Adoption | Max 4 volunteers per tree; max 10 trees per user |
| Watering Validation | GPS-based: user must be within 5–10 m of the tree |
| Map | Interactive campus map (Mapbox) with color-coded tree markers |
| Notifications | Push notifications for watering reminders (Firebase Cloud Messaging) |
| Gamification | Optional leaderboard (most watered, most consistent) |
| Admin Panel | Tree CRUD, watering reports, volunteer management |

---

## 2. Design System

### 2.1 Color Palette
| Token | Value | Usage |
|---|---|---|
| `--green-primary` | `#4CAF50` | CTAs, icons, active nav |
| `--green-light` | `#E8F5E9` | Tag backgrounds, cards |
| `--green-dark` | `#2E7D32` | Headers, badges |
| `--status-ok` | `#4CAF50` 🟢 | Watered tree marker |
| `--status-due` | `#F44336` 🔴 | Needs water marker |
| `--status-warning` | `#FF9800` 🟠 | Watering due soon |
| `--neutral-bg` | `#F9F9F9` | Screen background |
| `--neutral-dark` | `#1C1C1E` | Primary text |
| `--neutral-mid` | `#6E6E73` | Secondary text |
| `--white` | `#FFFFFF` | Cards, modals |

### 2.2 Typography
- **Font Family**: `Inter` (via expo-google-fonts or bundled)
- **Heading 1**: 24px / Bold
- **Heading 2**: 20px / SemiBold
- **Body**: 15px / Regular
- **Caption/Label**: 12px / Regular, `--neutral-mid`
- **Button text**: 16px / SemiBold

### 2.3 Spacing & Shape
- **Base Unit**: 8px
- **Card Border Radius**: 16px
- **Button Border Radius**: 12px
- **Tag/Badge Border Radius**: 20px (pill)
- **Shadow**: `0 2px 8px rgba(0,0,0,0.08)`

### 2.4 Icon Set
- Use `react-native-vector-icons` (MaterialIcons or Ionicons)
- Custom SVG icons for: watering can, leaf, tree pin on map

---

## 3. Navigation Architecture

```
Root Navigator (Stack)
├── Auth Stack
│   ├── SplashScreen
│   ├── LoginScreen
│   ├── RegisterScreen
│   └── ForgotPasswordScreen
│
└── Main App (Bottom Tab Navigator)
    ├── Tab: Map
    │   └── MapScreen  ←── (default landing)
    │       └── [modal] TreeQuickPreview (bottom sheet)
    │
    ├── Tab: My Trees
    │   ├── MyTreesScreen
    │   └── TreeDetailScreen  (shared, also reachable from Map)
    │       ├── [sub] WateringScreen
    │       ├── [sub] AdoptionScreen
    │       ├── [sub] ChatScreen (volunteer group chat)
    │       └── [sub] NotesScreen
    │
    └── Tab: Profile
        ├── ProfileScreen
        ├── EditProfileScreen
        ├── LeaderboardScreen (optional)
        └── NotificationSettingsScreen

Admin Stack (role-gated, replaces Main App for ADMIN role)
├── AdminDashboardScreen
├── AdminTreeListScreen
├── AdminAddEditTreeScreen
├── AdminReportsScreen
└── AdminUserManagementScreen
```

---

## 4. Screen Inventory & Wireframe Descriptions

### 4.1 Auth Screens

#### SplashScreen
- Full-screen green gradient with animated logo (leaf icon)
- Auto-navigate after 2 s: `→ LoginScreen` (if not logged in) or `→ MapScreen`

#### LoginScreen
- Logo + App name at top
- Input: GTU university email (`@gtu.edu.tr` validation)
- Input: Password (with eye-toggle)
- "Forgot Password?" link
- Primary CTA: **"Giriş Yap"** button
- Link: "Hesabın yok mu? Kayıt Ol"

#### RegisterScreen
- Inputs: Full Name, GTU Email, Password, Confirm Password
- Email domain validation on blur: must end in `@gtu.edu.tr`
- Password strength indicator
- CTA: **"Kayıt Ol"** button → backend sends verification email
- Info banner: "GTU mail adresinize doğrulama maili gönderdik."

#### ForgotPasswordScreen
- Single email input
- CTA: **"Şifre Sıfırla"** → sends reset link

---

### 4.2 Map Screen *(See reference screenshot: Map View)*

**Top Bar**
- App logo (Tree icon) + "Tree Tracker" title
- Layer/filter icon (top-right) → filter sheet (by status, species)

**User Avatar Row** (horizontal scroll)
- Circular avatar bubbles of volunteers nearby or "My Trees" owners

**Search Bar**
- Placeholder: "Find a tree near you…"
- Triggers text search over tree names/IDs

**Map Area (Mapbox)**
- Full-screen interactive map centered on campus
- Tree markers:
  - 🟢 Custom green pin → `status: watered`
  - 🔴 Custom red pin → `status: needs_water`
  - 🟠 Custom orange pin → `status: due_soon`
- Tap a marker → opens **TreeQuickPreview** bottom sheet (300 px)
- My location button (top-right of map)
- Info button (shows map legend)
- List view toggle FAB (green, bottom-right) → switches to list view

**TreeQuickPreview Bottom Sheet**
- Thumbnail photo, Tree name + ID, Distance ("20m Away")
- Location label (e.g., "Central Quad, Sector A")
- Status chip: "Needs Water" / "OK"
- "→" arrow → navigate to `TreeDetailScreen`

**Bottom Tab Bar**
- 3 tabs: Map (active, green), My Trees, Profile

---

### 4.3 Tree Detail Screen *(See reference screenshot: Output screen)*

**Header** (back arrow, tree ID "#402", overflow menu "…")

**Hero Image** — full-width, rounded bottom corners
- Badge overlay: `🌿 Doğal Anıt` (Natural Monument tag, conditional)

**Title Row**
- Tree name (e.g., "Ak Meşe") — large bold
- Health status chip: `Sağlıklı` / `Hasta` / `Kritik` (colored pill)

**Location Row**
- Pin icon + location text (e.g., "Yıldız Parkı, Beşiktaş")

**Last Watering Card** (green-tinted background)
- Calendar icon
- Label: "SON SULANMA" + date (bold, large)
- Relative time: "3 gün önce"

**Info Grid** (2 columns)
- Estimated Age: `15 Yıl`
- Height: `12 Metre`
- (Expandable: Species, Planting Date, Watering Period)

**Last Caretaker Section**
- Avatar + name + badge ("Sertifikalı Gönüllü")
- "Profil →" link

**Primary CTA** — full-width green button
- 🚿 **"Ağacı Sula"** (Water the Tree) → opens `WateringScreen`
- Disabled + tooltip if not adopted or too far away (GPS check)

**Secondary Actions Row**
- ⚠️ "Sorun Bildir" (Report Issue)
- 📝 "Not Ekle" (Add Note)

**Eco Info Banner** (bottom)
- Subtle info text about the tree's ecosystem role

**Tab Bar** below (or separate screens): Volunteers | Chat | Notes

---

### 4.4 Watering Screen

**Pre-watering**
- Current GPS status indicator ("Konumunuz alınıyor…" with spinner)
- Distance to tree display: "Ağaca uzaklığınız: 4.2 m" ✅ or ❌
- If within range: green **"Sulamayı Onayla"** button enables
- If out of range: button disabled, error text "Ağacın yanında olmanız gerekiyor"

**Post-watering Success**
- Animated checkmark + confetti burst
- "Teşekkürler! Ağacı suladınız 🌱"
- Points earned badge (if gamification enabled)
- "Geri Dön" button

---

### 4.5 Adoption Screen

- Tree name + current volunteer slots: `2 / 4`
- Volunteer avatar list (up to 4 slots, empty slots shown as dashed circles)
- "Bu Ağacı Sahiplen" CTA (disabled if full or user already adopted)
- Info: "Sahiplendiğinizde sulama hatırlatmaları alacaksınız."
- If first adopter → modal: "Bu ağaca bir isim ver!" (optional name input)

---

### 4.6 My Trees Screen

- Section header: "Benim Ağaçlarım (x/10)"
- Vertical card list, each card:
  - Tree thumbnail, name, location
  - Status chip
  - Last watered: relative time
  - "→" navigate to `TreeDetailScreen`
- Empty state: friendly illustration + "Henüz bir ağaç sahiplenmediniz"

---

### 4.7 Chat Screen (Volunteer Group Chat)

- Header: "Ak Meşe — Gönüllü Sohbeti"
- Message bubbles (own = right/green, others = left/white)
- Avatar + name above each sender's first message in a sequence
- Text input + send button
- Real-time via WebSocket or REST polling (MVP: polling every 10 s)

---

### 4.8 Notes Screen

- Chronological note list
  - Each note: author avatar, date, note text
- "+ Not Ekle" FAB → modal with textarea + Save/Cancel

---

### 4.9 Profile Screen

- Avatar (initials or photo) + name + GTU email
- Stats row: Trees Adopted | Waterings Done | Points
- Section: "Benim Ağaçlarım" (mini card list, max 3 shown → "Tümünü Gör")
- Menu items: Edit Profile, Notification Settings, Leaderboard, Logout
- Volunteer badge if certified

---

### 4.10 Leaderboard Screen *(Optional, Gamification)*

- Tabs: "En Çok Sulama" | "En Düzenli"
- Ranked list: rank number, avatar, name, score
- Current user's rank highlighted

---

### 4.11 Admin Screens

#### AdminDashboardScreen
- Stats cards: Total Trees, Active Volunteers, Waterings Today, Issues Reported
- Quick actions: Add Tree, View Reports

#### AdminTreeListScreen
- Searchable, filterable table/list of all trees
- Each row: ID, Name, Species, Location, Status, Last Watered
- Edit / Delete actions per row
- FAB: "+" → add new tree

#### AdminAddEditTreeScreen
- Form fields: Tree Type (dropdown), Species (text), Location (map picker for coordinates), Watering Amount, Watering Period (days), Planting Date, Photo Upload
- Map picker: tap campus map to drop a pin → captures lat/lng
- Save / Cancel

#### AdminReportsScreen
- Date range picker
- Table: Watering History (tree, user, timestamp, GPS verified ✅/❌)
- Export button (CSV, future feature)

#### AdminUserManagementScreen
- List of registered users
- View watering score, adopted trees
- Revoke adoption / ban user (future)

---

## 5. Component Library

| Component | Description |
|---|---|
| `TreeCard` | Compact card used in My Trees, Search, Admin list |
| `TreeMarker` | Custom Mapbox annotation component (SVG pin, status-colored) |
| `StatusChip` | Pill badge: Sağlıklı / Hasta / Kritik / Sulanmış / Sulanacak |
| `VolunteerAvatar` | Circular avatar with online indicator dot |
| `WateringButton` | Large CTA, GPS-aware disabled state + animation |
| `BottomSheet` | Reusable slide-up panel (used in map preview, filters) |
| `InfoGrid` | 2-column label/value grid for tree metadata |
| `NoteCard` | Author + date + text for the notes list |
| `ChatBubble` | Message bubble with alignment prop (own/other) |
| `EmptyState` | Illustration + message for empty lists |
| `FormInput` | Styled text input with label, error, and eye-toggle |
| `SkeletonLoader` | Animated placeholder for loading states |
| `Toast / Snackbar` | Non-blocking feedback messages |
| `ConfirmModal` | Reusable confirm/cancel dialog |

---

## 6. State Management

| Layer | Tool |
|---|---|
| Global auth state (user, token) | **Zustand** store |
| Tree data, adoption, watering | **React Query** (server-state caching) |
| Map state (selected tree, filters) | **Zustand** store |
| Chat messages | **React Query** (polling or WS) |
| Navigation state | **React Navigation** (built-in) |

---

## 7. API Integration Layer (Frontend Side)

All API calls go through a centralized `src/api/` layer. Axios instance with:
- Base URL from `.env`
- JWT token injected via request interceptor
- 401 → auto-logout + redirect to LoginScreen

```
src/api/
├── axios.ts          ← Axios instance + interceptors
├── auth.api.ts       ← login, register, forgotPassword
├── trees.api.ts      ← getAll, getById, adopt, water, report
├── volunteers.api.ts ← getVolunteers, getProfile
├── chat.api.ts       ← getMessages, sendMessage
├── notes.api.ts      ← getNotes, addNote
├── admin.api.ts      ← CRUD trees, reports, users
└── notifications.api.ts ← getHistory, markRead
```

---

## 8. GPS / Location Module

```typescript
// src/services/location.service.ts
import * as Location from 'expo-location';
import { haversineDistance } from '../utils/geo';

export async function verifyProximity(
  treeLat: number,
  treeLng: number,
  thresholdMeters = 10
): Promise<{ isNearby: boolean; distanceM: number }> {
  const { coords } = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });
  const dist = haversineDistance(coords.latitude, coords.longitude, treeLat, treeLng);
  return { isNearby: dist <= thresholdMeters, distanceM: Math.round(dist) };
}
```

- **Frontend**: reads GPS → displays distance → enables/disables watering button
- **Backend validation**: coordinates also sent to backend, which does its own verification (cannot be bypassed from frontend)

---

## 9. Push Notifications (Frontend)

- Library: `@react-native-firebase/messaging`
- On app launch (after auth): request permission → get FCM token → send to backend
- `onMessage` handler: foreground notifications → show in-app `Toast`
- `onNotificationOpenedApp`: background tap → navigate to relevant tree screen
- `getInitialNotification`: app killed → opened via notification → same navigation

---

## 10. Project File Structure

```
CampusGreenCarePlatform/
├── app.json / app.config.ts
├── package.json
├── tsconfig.json
├── .env                          ← API URL, Mapbox token, Firebase config
│
└── src/
    ├── api/                      ← all API calls (see §7)
    ├── assets/                   ← images, fonts, icons
    ├── components/               ← shared UI components (see §5)
    │   ├── common/
    │   ├── map/
    │   └── tree/
    ├── navigation/
    │   ├── RootNavigator.tsx
    │   ├── AuthStack.tsx
    │   ├── MainTabs.tsx
    │   └── AdminStack.tsx
    ├── screens/
    │   ├── auth/
    │   │   ├── SplashScreen.tsx
    │   │   ├── LoginScreen.tsx
    │   │   ├── RegisterScreen.tsx
    │   │   └── ForgotPasswordScreen.tsx
    │   ├── map/
    │   │   └── MapScreen.tsx
    │   ├── tree/
    │   │   ├── TreeDetailScreen.tsx
    │   │   ├── WateringScreen.tsx
    │   │   ├── AdoptionScreen.tsx
    │   │   ├── ChatScreen.tsx
    │   │   └── NotesScreen.tsx
    │   ├── myTrees/
    │   │   └── MyTreesScreen.tsx
    │   ├── profile/
    │   │   ├── ProfileScreen.tsx
    │   │   ├── EditProfileScreen.tsx
    │   │   ├── LeaderboardScreen.tsx
    │   │   └── NotificationSettingsScreen.tsx
    │   └── admin/
    │       ├── AdminDashboardScreen.tsx
    │       ├── AdminTreeListScreen.tsx
    │       ├── AdminAddEditTreeScreen.tsx
    │       ├── AdminReportsScreen.tsx
    │       └── AdminUserManagementScreen.tsx
    ├── services/
    │   ├── location.service.ts   ← GPS (see §8)
    │   └── notifications.service.ts
    ├── store/
    │   ├── auth.store.ts         ← Zustand auth store
    │   └── map.store.ts          ← Zustand map/filter store
    ├── hooks/                    ← custom React hooks
    │   ├── useTreeDetail.ts
    │   ├── useWatering.ts
    │   └── useLocation.ts
    ├── utils/
    │   ├── geo.ts                ← haversineDistance
    │   ├── validators.ts         ← email, password validation
    │   └── formatters.ts         ← date, distance formatting
    └── theme/
        ├── colors.ts
        ├── typography.ts
        └── spacing.ts
```

---

## 11. Phased Frontend Development Timeline

### Phase 1 — Foundation (Week 1–2) 🏗️
- [ ] Initialize React Native project with TypeScript (`npx create-expo-app`)
- [ ] Configure navigation (React Navigation: stack + bottom tabs)
- [ ] Set up theme (colors, typography, spacing)
- [ ] Create base component stubs for all major components
- [ ] Configure Axios + Zustand + React Query
- [ ] Set up Mapbox SDK

**Deliverable**: App skeleton with all screens navigable, mock data only

---

### Phase 2 — Auth Screens (Week 3) 🔐
- [ ] `SplashScreen` with animated logo
- [ ] `LoginScreen` — form validation, API call, JWT storage
- [ ] `RegisterScreen` — GTU email validation, password strength
- [ ] `ForgotPasswordScreen`
- [ ] Protected route guard (redirect to Login if no token)
- [ ] Role-based routing: USER → MainTabs, ADMIN → AdminStack

**Deliverable**: Complete auth flow (with real or mocked backend)

---

### Phase 3 — Map Screen (Week 4) 🗺️
- [ ] Mapbox map integration + campus bounds
- [ ] Custom `TreeMarker` components (SVG, status-colored)
- [ ] Render trees from API on map
- [ ] `TreeQuickPreview` bottom sheet on marker tap
- [ ] Search bar with filter
- [ ] User avatar row (nearby volunteers)
- [ ] My location button + centering
- [ ] Map legend modal
- [ ] List view toggle

**Deliverable**: Fully interactive map with live tree markers

---

### Phase 4 — Tree Detail & Watering (Week 5–6) 🌳💧
- [ ] `TreeDetailScreen` — all sections per wireframe above
- [ ] `WateringScreen` — GPS proximity check → enable/disable button → success animation
- [ ] `AdoptionScreen` — volunteer slots, adopt action, first-adopter name modal
- [ ] `ChatScreen` — message list, polling, send message
- [ ] `NotesScreen` — notes list, add note modal
- [ ] Back-navigation from map → tree detail

**Deliverable**: Full tree lifecycle (view, adopt, water, chat, note)

---

### Phase 5 — My Trees & Profile (Week 7) 👤
- [ ] `MyTreesScreen` — card list, empty state
- [ ] `ProfileScreen` — stats, mini tree list, menu
- [ ] `EditProfileScreen`
- [ ] `LeaderboardScreen` — ranked list, tabs
- [ ] `NotificationSettingsScreen`

**Deliverable**: Complete user profile section

---

### Phase 6 — Push Notifications (Week 8) 🔔
- [ ] Firebase Messaging setup (Android + iOS config)
- [ ] FCM token registration on login → send to backend
- [ ] Foreground notification → in-app toast
- [ ] Background/killed tap → deep-link to tree screen

**Deliverable**: End-to-end push notification flow

---

### Phase 7 — Admin Screens (Week 9) ⚙️
- [ ] `AdminDashboardScreen` — stats + quick actions
- [ ] `AdminTreeListScreen` — search, filter, edit/delete
- [ ] `AdminAddEditTreeScreen` — form + map picker for coordinates
- [ ] `AdminReportsScreen` — watering history table
- [ ] `AdminUserManagementScreen`

**Deliverable**: Full admin panel accessible via role-gated route

---

### Phase 8 — Polish & QA (Week 10–12) ✨
- [ ] Loading skeleton screens for all data-fetching states
- [ ] Empty states for all lists
- [ ] Error handling (no network, API errors) with retry
- [ ] Accessibility (a11y labels, contrast ratios)
- [ ] Performance: image lazy loading, map clustering for dense markers
- [ ] Gamification leaderboard (if time permits)
- [ ] UI consistency audit across all screens
- [ ] Integration testing with real backend

---

## 12. Key Dependencies

| Package | Purpose |
|---|---|
| `expo` | Managed workflow, device APIs |
| `react-native` | Core framework |
| `typescript` | Type safety |
| `@react-navigation/native` | Navigation |
| `@react-navigation/stack` | Stack navigator |
| `@react-navigation/bottom-tabs` | Bottom tab navigator |
| `@rnmapbox/maps` | Mapbox map SDK |
| `expo-location` | GPS access |
| `@react-native-firebase/app` | Firebase base |
| `@react-native-firebase/messaging` | Push notifications |
| `axios` | HTTP client |
| `@tanstack/react-query` | Server-state management |
| `zustand` | Client-state management |
| `react-hook-form` | Form management |
| `zod` | Schema validation |
| `expo-image` | Optimized image loading |
| `@gorhom/bottom-sheet` | Bottom sheet component |
| `react-native-reanimated` | Animations |
| `react-native-gesture-handler` | Gesture support |
| `expo-notifications` | Local notifications |
| `async-storage` | Token persistence |

---

## 13. Reference Screens

![Map View Screen](/Users/rabiacerci/.gemini/antigravity/brain/503c7b44-fe25-4900-a91a-dbce59ce0c48/map_view_screen.png)

*Map View: Mapbox map with tree markers, search bar, user avatar row, bottom tree preview card, and 3-tab navigation*

![Tree Detail Screen](/Users/rabiacerci/.gemini/antigravity/brain/503c7b44-fe25-4900-a91a-dbce59ce0c48/tree_detail_screen.png)

*Tree Detail: Hero image, health badge, last watering card, info grid, caretaker section, and action buttons*
