# TheCelesteTracker Desktop - Feature Roadmap & TODO

This document lists all pending features and implementation goals for **TheCelesteTracker Desktop**.

---

## 1. CORE FEATURES

### 1.1 Celeste + Priority Mod Support Gameplay Statistics
- [ ] **Real-Time Statistics** (per campaign, chapter, room, or global history runs):
  - [ ] Deaths
  - [ ] Dashes
  - [ ] Jumps
  - [ ] Minimum deaths
  - [ ] PlayTime
  - [ ] Content played visualization (Celeste vanilla campaign & mod campaigns with full metadata, icons, screenshots, final screens)
  - [ ] Red Strawberries (collected vs. max pending)
  - [ ] Special Strawberries (collected vs. max pending):
    - [ ] Winged Golden Strawberry
    - [ ] Golden Strawberry / Silver Strawberries
    - [ ] Platinum Strawberry
    - [ ] Moon Strawberry
    - [ ] Timers Strawberries (Bronze, Silver, Gold)
  - [ ] Hearts (collected vs. max pending)
  - [ ] MiniHearts (collected vs. max pending)

### 1.2 Celeste & Priority Mods Support Visualization
- [ ] **Mod Showcase & History** (installed mods & played-at-least-once mods, per campaign and per campaign/chapter):
  - [ ] **Essential (Offline Mode)**:
    - [ ] Statistics display
  - [ ] **Desirable (Online Mode)**:
    - [ ] Cover image (1 or 0 images)
    - [ ] Additional screenshots (0..n images)
    - [ ] Detailed description
    - [ ] Authors info (Name, Avatar Image, list of installed/played mods created by author)

### 1.3 Common Essential Features
- [ ] Search through mods list (offline & online)
- [ ] Installed mods view:
  - [ ] **Essential (Offline Mode)**:
    - [ ] Filter by name
    - [ ] Filter by category
    - [ ] Filter by a specific stat
  - [ ] **Desirable (Online Mode)**:
    - [ ] Filter by author
    - [ ] Gallery view using mod cover images

---

## 2. NON-CORE / UNIQUE FEATURES (Strongly Important)

### 2.1 Free-Canvas (`Wanvas` Custom Library)
- [ ] Canvas pan & zoom system with custom widget system to freely organize stats across persistent canvases.
- [ ] **Generic / Common Widgets**:
  - [ ] Image widget
  - [ ] Text widget
  - [ ] Wiring widget (lines & arrows)
- [ ] **Celeste-Specific Widgets**:
  - [ ] Mod Info widget (with or without stats below)
  - [ ] Mod Only Stats widget
  - [ ] Mod Search Bar widget
- [ ] Responsive design support

### 2.2 Dashboard with Customizable Layouts (`GoldenLayoutWrapper`)
- [ ] Multi-subpage / multi-tab layout system allowing user-customized page splits (e.g., Canvas left, Mod statistics right-top, Installed mods list right-bottom).

---

## 3. LIBRARY ENCAPSULATION & STANDALONE ARCHITECTURE
- [ ] Maintain strict encapsulation for `Wanvas` (Free-Canvas) and `GoldenLayoutWrapper` with generic public APIs, decoupled from Celeste domain logic (designed to be publishable as generic npm packages).
