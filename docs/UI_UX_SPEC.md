# 🎨 Riff UI/UX Specification & Design Tokens

---

## 1. Visual Theme: Deep Obsidian & Neon Ambient Glow

Riff features an OLED pitch-black and deep obsidian background with glassmorphic cards, glowing neon violet/cyan highlights, and GPU-accelerated backdrop blur.

### Color Tokens
* **Obsidian Background:** `#0a0b0f`
* **Elevated Surface:** `#12131a`
* **Glass Surface:** `rgba(18, 19, 26, 0.75)` with `backdrop-filter: blur(20px)`
* **Primary Neon Violet:** `#8b5cf6`
* **Streaming Neon Cyan:** `#06b6d4`
* **Offline Emerald:** `#10b981`
* **Data Saver Amber:** `#f59e0b`

---

## 2. Desktop 3-Panel Layout Wireframe

```
+----------------------------------------------------------------------------------------------------+
| [⚡ RIFF]   [ 🔍 Search tracks, artists, playlists... (Ctrl+K) ]      [📶 4G Saver] [🔔] [👤 Guest] |
+------------------+-------------------------------------------------------------+-------------------+
| SIDEBAR (Left)   | MAIN SCROLLABLE VIEWPORT                                    | RIGHT DOCK (Opt)  |
| ---------------- | ----------------------------------------------------------- | ----------------- |
| 🏠 Home          | [ HERO CAROUSEL: "Jump Back In" / Trending Releases ]       | 📑 CURRENT QUEUE  |
| 🔍 Explore       |                                                             |                   |
| 📁 Your Library  | ─────────────────────────────────────────────────────────── | 1. Blinding Lights|
| ➕ New Playlist  | 🎧 MADE FOR YOU (Personalized Mixes)                        |    The Weeknd     |
| 📥 Upload Audio  | [Mix 1: Synth]  [Mix 2: Lo-Fi]  [Mix 3: Gym Bass]           |                   |
|                  |                                                             | 2. Get Lucky      |
| --- PLAYLISTS -- | ─────────────────────────────────────────────────────────── |    Daft Punk      |
| 💜 Liked (142)   | 🔥 TOP TRENDING TRACKS                                      |                   |
| ⚡ Focus Beats   | #1 Starboy ─── The Weeknd ─── 03:50 ─── [💜] [⋮]            | 3. Midnight City  |
| 🚗 Night Drive   | #2 One More Time ─ Daft Punk ─ 05:20 ─── [💜] [⋮]           |    M83            |
+------------------+-------------------------------------------------------------+-------------------+
| STICKY BOTTOM PLAYER BAR (Fixed 88px)                                                              |
| [Art 60px] Track Name  |   [⏮]   [ ⏯ PLAY/PAUSE ]   [⏭]   [🔀] [🔁]      | [🔊 ───O───] [🎤 Lyrics]|
|            Artist Name |   01:24 [─────────O───────────────────] 03:45 | [📶 Saver: 160k] [📱 Full]|
+----------------------------------------------------------------------------------------------------+
```

---

## 3. Mobile PWA View Wireframe ($< 768\text{px}$)

```
+------------------------------------+
| [⚡ RIFF]   [📶 Saver]  [🔔] [👤]  |
+------------------------------------+
| [ 🔍 Search anything...          ] |
+------------------------------------+
| HERO BANNER                        |
| [ Made For You: Daily Mix 1 🎧 ]   |
|                                    |
| RECENTLY PLAYED                    |
| [Card 1]  [Card 2]  [Card 3]       |
|                                    |
| TRENDING CHARTS                    |
| 1. Song Title - Artist  [▶] [⋮]    |
| 2. Song Title - Artist  [▶] [⋮]    |
| 3. Song Title - Artist  [▶] [⋮]    |
+------------------------------------+
| FLOATING MINI-PLAYER (Swipe up)    |
| [Art] Track Title - Artist [⏯] [⏭]|
+------------------------------------+
| BOTTOM NAVIGATION BAR              |
| [ 🏠 Home ]  [ 🔍 Explore ]  [ 📁 Library ]  [ 📥 Upload ] |
+------------------------------------+
```

---

## 4. Keyboard Navigation Shortcuts

| Key | Action |
|---|---|
| `Space` | Play / Pause active track |
| `Ctrl + K` or `/` | Focus global search input |
| `Arrow Right` / `Arrow Left` | Seek forward / backward 5s |
| `Arrow Up` / `Arrow Down` | Volume up / down (5%) |
| `J` / `L` | Seek backward / forward 10s |
| `N` / `P` | Next / Previous track in queue |
| `M` | Mute / Unmute |
| `L` | Open Fullscreen Lyrics View |
| `Esc` | Close modal or drawer |
