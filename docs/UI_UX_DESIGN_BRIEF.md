# 🎨 UI/UX Design Brief & Design System Specification
## Project: Riff • Universal Music Progressive Web App (PWA)
**Document Version:** 1.0.0  
**Status:** Approved / Design System Reference  
**Lead Designer & UI Architect:** Senior Staff Software Engineer  
**Target Environments:** Modern Desktop Browsers, Mobile Web, Installable Standalone PWA  

---

## 1. Visual Philosophy & Design Identity

### 1.1 Core Aesthetic: "Deep Obsidian & Neon Ambient Glow"
Riff is designed around an ultra-modern, high-contrast **Obsidian Cyberpunk & Glassmorphic Studio** aesthetic:
* **OLED Pure Black Foundation (`#000000`):** Saves battery on OLED mobile displays while creating maximum depth.
* **Layered Obsidian Surfaces (`#0a0b0f`, `#12131a`):** Distinct floating card elevations with subtle `border-white/[0.07]`.
* **Ambient Neon Glows:** Glowing accents using Neon Violet (`#8b5cf6`), Streaming Cyan (`#06b6d4`), and Offline Emerald (`#10b981`).
* **GPU-Accelerated Glassmorphism:** Real-time backdrop blur (`backdrop-filter: blur(24px)`) creating layered spatial depth behind modals, header bars, and mini players.

---

## 2. Design System Tokens & Color Palette

### 2.1 Color Tokens

| Token Name | Hex / RGBA | Role / Usage |
|---|---|---|
| `--color-bg-base` | `#000000` | Fullscreen OLED black root canvas. |
| `--color-surface-obsidian` | `#0a0b0f` | Level 1 floating panels (Sidebar, Main View, Now Playing). |
| `--color-surface-elevated` | `#12131a` | Level 2 interactive cards, track rows, and dropdown menus. |
| `--color-surface-glass` | `rgba(18, 19, 26, 0.82)` | Modals, sticky headers, and mini player glass backgrounds. |
| `--color-border-subtle` | `rgba(255, 255, 255, 0.08)` | 1px clean container and card dividers. |
| `--color-primary-violet` | `#8b5cf6` | Brand accent, active play button, scrubber thumb, liked heart icon. |
| `--color-stream-cyan` | `#06b6d4` | Live streaming indicators, high-fidelity badges, spectrum visualizer. |
| `--color-offline-emerald` | `#10b981` | OPFS offline cached badges, storage health indicator. |
| `--color-saver-amber` | `#f59e0b` | Cellular Data Saver active badge, warning alerts. |
| `--color-text-primary` | `#ffffff` | Headings, active track titles, high-emphasis text. |
| `--color-text-secondary` | `#94a3b8` | Artist names, durations, subheadings, secondary labels. |
| `--color-text-tertiary` | `#64748b` | Timestamps, file formats, disabled items. |

### 2.2 Typography Scale
Font Family: `-apple-system, BlinkMacSystemFont, "Inter", "SF Pro Display", Roboto, sans-serif`

| Scale | Size | Line Height | Weight | Tracking | Usage |
|---|---|---|---|---|---|
| **Display Large** | `32px` (`2rem`) | `38px` | `800 Bold` | `-0.03em` | Hero carousel titles, artist header. |
| **Title Medium** | `20px` (`1.25rem`) | `26px` | `700 Bold` | `-0.02em` | Section titles ("Made For You", "Trending"). |
| **Body Prominent** | `15px` (`0.938rem`) | `20px` | `600 SemiBold` | `-0.01em` | Track titles in rows, modal headers. |
| **Body Regular** | `13px` (`0.813rem`) | `18px` | `400 Regular` | `0em` | Artist names, album titles, sidebar links. |
| **Caption / Badge** | `11px` (`0.688rem`) | `14px` | `600 SemiBold` | `+0.04em` | Bitrate badges, duration, quality tags. |

---

## 3. Responsive Layout Schemas & Wireframes

### 3.1 Desktop 3-Panel Studio Layout ($\ge 1024\text{px}$)

```
+--------------------------------------------------------------------------------------------------------------------------+
|  [⚡ RIFF]   [ 🔍 Search 100M+ tracks, artists, radio... (Ctrl+K) ]        [📶 4G Saver: Auto]  [🔔 Notifications] [👤 Guest] |
+----------------------+--------------------------------------------------------------------+------------------------------+
| LEFT PANEL (240px)   | CENTER MAIN CONTENT VIEWPORT (Fluid)                               | RIGHT NOW PLAYING (320px)    |
| (Sidebar Vault)      | (Custom Scrollbar, Rounded-2xl, Glassmorphic Border)               | (Audio Studio Hub)           |
| ──────────────────── | ────────────────────────────────────────────────────────────────── | ──────────────────────────── |
| 🏠 Home Feed         | ⚡ HERO CAROUSEL: "Jump Back In" / Trending Releases                | 🖼️ LARGE ALBUM ART (280px)  |
| 🔍 Search Explorer   | [ Daily Mix 1: Neon Synthwave ]    [ Daily Mix 2: Deep Lo-Fi ]     |                              |
| 📁 Your Library      |                                                                    | 🎵 Song Title: Starboy       |
| ➕ New Playlist      | ────────────────────────────────────────────────────────────────── | 👤 Artist: The Weeknd        |
| 📥 Upload Audio      | 🔥 GLOBAL TRENDING TRACKS                                          |                              |
|                      | #1  [▶] Starboy ─────────── The Weeknd ─── 03:50 ─── [💜] [⋮]       | 🎛️ 5-BAND EQUALIZER         |
| ── OFFLINE VAULT ──  | #2  [▶] Blinding Lights ─── The Weeknd ─── 03:20 ─── [💜] [⋮]       | ───O─── 60Hz: +4dB (Bass)    |
| 💜 Liked Songs (142) | #3  [▶] One More Time ───── Daft Punk ──── 05:20 ─── [💜] [⋮]       | ──────O 250Hz: +2dB          |
| ⚡ Focus EDM (45)    | #4  [▶] Midnight City ───── M83 ────────── 04:03 ─── [💜] [⋮]       | ───O─── 1kHz: 0dB            |
| 🚗 Night Drive (28)  |                                                                    | ──────O 4kHz: +3dB           |
| 💾 Local FLACs (84)  | 📻 30,000+ LIVE WORLDWIDE RADIO STATIONS                           | ────────O 14kHz: +5dB        |
|                      | [BBC Radio 1]  [KEXP 90.3 FM]  [Ibiza Chillout]  [SomaFM Groove]   |                              |
| ── STORAGE METRIC ── |                                                                    | 📊 REALTIME SPECTRUM CANV.   |
| [████░░░░] 342MB/2GB | 📥 DRAG & DROP LOCAL AUDIO ZONE                                    |  ||||||||||||||||||||||||    |
+----------------------+--------------------------------------------------------------------+------------------------------+
| PERSISTENT BOTTOM MINI PLAYER BAR (Fixed 88px, Backdrop Blur, Border-t)                                                  |
| [Art 60px] Track Name       |   [🔀]   [⏮]   [ ⏯ PLAY/PAUSE ]   [⏭]   [🔁]               | [🔊 ───O───] [🎤 Lyrics]     |
|            Artist Name      |   01:24 [───────────────O─────────────────────────] 03:50  | [📶 320k] [🎛️ EQ] [📱 Full]  |
+--------------------------------------------------------------------------------------------------------------------------+
```

---

### 3.2 Mobile PWA Viewport Schematic ($< 768\text{px}$)

```
+-----------------------------------------------------+
| [⚡ RIFF]                [📶 4G Saver] [🔔] [👤 Guest] |
+-----------------------------------------------------+
| [ 🔍 Search 100M+ songs, artists, radio...        ] |
+-----------------------------------------------------+
| ⚡ HERO SPOTLIGHT                                    |
| [ Made For You: Daily Mix 1 • Synthwave Neon 🎧 ]   |
|                                                     |
| 📁 RECENTLY PLAYED & QUICK ACCESS                   |
| [💜 Liked Songs]   [💾 Local Files]   [⚡ Focus]     |
|                                                     |
| 🔥 TOP TRENDING TRACKS                              |
| 1. [Art] Starboy ────────── The Weeknd   [▶] [⋮]    |
| 2. [Art] Blinding Lights ── The Weeknd   [▶] [⋮]    |
| 3. [Art] One More Time ──── Daft Punk    [▶] [⋮]    |
| 4. [Art] Midnight City ──── M83          [▶] [⋮]    |
+-----------------------------------------------------+
| FLOATING GLASS MINI PLAYER PILL (Swipe Up For Full) |
| [Art] Starboy • The Weeknd            [⏯] [⏭] [💜] |
| 01:24 [─────────────────O─────────────────] 03:50   |
+-----------------------------------------------------+
| FIXED BOTTOM NAVIGATION BAR (64px)                  |
| [ 🏠 Home ]   [ 🔍 Search ]   [ 📁 Library ]   [ 📥 ]|
+-----------------------------------------------------+
```

---

## 4. Key Interactive Components Specification

### 4.1 Mini Player Bar
* **Position:** Fixed sticky bottom bar on Desktop; floating rounded pill on Mobile.
* **Left Segment:** Album thumbnail ($60\times60\text{px}$ with rounded-xl corners), track title, artist name, and 1-tap like heart button.
* **Center Segment:** Audio transport controls (`Shuffle`, `Previous`, large glowing circular `Play/Pause`, `Next`, `Repeat`), paired with an interactive range scrubber tracking elapsed time ($00:00$) and remaining duration.
* **Right Segment:** Master volume slider, Synced Lyrics toggle button (`[🎤]`), Equalizer toggle, Bitrate indicator badge (`320k` / `160k` / `Saver`), and Fullscreen Player expander.

### 4.2 Fullscreen Immersive Player Modal
* **Background:** Dynamic radial gradient extracted from active album artwork blended with `rgba(0,0,0,0.85)` and 40px GPU blur.
* **Hero Section:** High-resolution $400\times400\text{px}$ artwork card with smooth vinyl tilt shadow.
* **Interactive Lyrics Mode:** Replaces album art with millisecond-synced karaoke lyrics stream:
  * Active line is magnified ($1.15\times$ scale) with glowing Neon Violet text shadow.
  * Inactive lines remain at $40\%$ opacity.
  * Tapping any line immediately seeks playback to that exact millisecond timestamp.
* **Spectrum Visualizer Mode:** Real-time 60 FPS Canvas spectrum analyzer rendering 64 neon cyan frequency bars with smooth height dampening.

### 4.3 Studio 5-Band Equalizer Drawer
* **Sliders:** 5 vertical faders corresponding to $60\text{Hz}$ (Sub-Bass), $250\text{Hz}$ (Bass), $1\text{kHz}$ (Midrange), $4\text{kHz}$ (Upper Mid), and $14\text{kHz}$ (Treble).
* **Adjustment Range:** $-12\text{dB}$ to $+12\text{dB}$ with center detent at $0\text{dB}$.
* **One-Click Presets:**
  * **Bass Boost:** `[+6dB, +4dB, 0dB, +1dB, +2dB]`
  * **Vocal Clarity:** `[-2dB, 0dB, +4dB, +5dB, +2dB]`
  * **Electronic / Club:** `[+5dB, +3dB, 0dB, +3dB, +5dB]`
  * **Rock / Metal:** `[+4dB, +2dB, -1dB, +3dB, +4dB]`
  * **Flat / Studio Reference:** `[0dB, 0dB, 0dB, 0dB, 0dB]`

### 4.4 Local Audio Drag-and-Drop DropZone
* **Visual State:** Dashed border container with Neon Cyan hover pulse.
* **File Acceptance:** `.mp3`, `.flac`, `.wav`, `.aac`, `.m4a`, `.ogg`.
* **Progress Feedback:** In-browser progress bar showing ID3 tag extraction and OPFS write status with zero network bandwidth consumption.

---

## 5. Keyboard Navigation & Accessibility (WCAG 2.1 AA)

### 5.1 Keyboard Shortcuts Matrix

| Key Combo | Target Action | Scope |
|---|---|---|
| `Space` | Play / Pause active stream | Global |
| `Ctrl + K` or `/` | Focus global search input | Global |
| `Arrow Right` / `Arrow Left` | Seek forward / backward 5 seconds | Global |
| `J` / `L` | Fast seek backward / forward 10 seconds | Global |
| `Arrow Up` / `Arrow Down` | Increase / decrease volume by 5% | Global |
| `N` / `P` | Skip to next / previous track in queue | Global |
| `M` | Mute / Unmute audio | Global |
| `S` | Toggle Shuffle mode | Global |
| `R` | Cycle Repeat mode (Off $\to$ All $\to$ One) | Global |
| `L` | Toggle Fullscreen Synced Lyrics | Player |
| `Esc` | Close active modal, drawer, or search view | Modals |

### 5.2 Accessibility Guidelines
1. **Focus Traps:** All modals (Fullscreen Player, Settings Drawer, Auth Modal) trap tab focus within the modal container.
2. **Screen Reader ARIA:** Every slider contains `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, and `aria-label` ("Scrubber", "Volume", "60Hz Equalizer").
3. **Contrast Compliance:** All text-to-background contrast ratios exceed **7.2:1** (AAA standard for normal text).
