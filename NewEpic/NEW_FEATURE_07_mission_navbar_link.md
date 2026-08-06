# Feature 07 — Navbar Missions link

| Field | Value |
|-------|-------|
| **Feature #** | 07 |
| **Title** | Add "Missions" link to AppNavbar |
| **Depends on** | 06 |
| **Blocks** | 08, 09 |

---

## 1. Objective

Surface the new Mission Planner top-level via the existing navbar, matching the style of existing links (Home, Scan History, Settings, About).

---

## 2. Files

### Modify
- `app/components/AppNavbar.vue`

---

## 3. Implementation Steps

### Step 1 — Append Missions link to `navLinks`

In `app/components/AppNavbar.vue`, add:

```ts
const navLinks = [
  { label: 'Home', to: '/', icon: 'lucide:home' },
  { label: 'Scan History', to: '/history', icon: 'lucide:history' },
  { label: 'Missions', to: '/missions', icon: 'lucide:rocket' },
  { label: 'Settings', to: '/settings', icon: 'lucide:settings' },
  { label: 'About', to: '/about', icon: 'lucide:info' }
]
```

### Step 2 — Ensure active-state works for nested routes

The existing `isActive` function already covers this because `/missions/create`, `/missions/[id]`, and `/missions/[id]/locations/*` all start with `/missions`. No change needed to `isActive`.

---

## 4. Definition of Done

- [ ] AppNavbar shows a **Missions** link between Scan History and Settings.
- [ ] `/missions` route is highlighted when on any `/missions/*` path.
- [ ] No regressions on other pages.
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm build` green.
- [ ] Commit message: `feat(mission-planner): add Missions link to navbar (#07)`

---

## 5. Commit Message

```
feat(mission-planner): add Missions link to navbar (#07)

- Append Missions link (icon: lucide:rocket) to navLinks in AppNavbar
- Route /missions is active for all /missions/* nested routes
```