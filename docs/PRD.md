# 📄 Product Requirements Document (PRD)
## Project: Riff • Universal Music Progressive Web App (PWA)
**Document Version:** 1.0.0  
**Status:** Approved / Production Specification  
**Author:** Senior Staff Software Engineer & Product Architect  
**Target Release:** Production v1.0  

---

## 1. Executive Summary & Vision

### 1.1 Problem Statement
Modern music streaming ecosystems (Spotify, Apple Music, YouTube Music) are plagued by several critical pain points:
1. **Aggressive Paywalls & Ad Injection:** Free tiers are heavily restricted (forced shuffle, audio ad interruptions every 2-3 songs, limited skips, low 96kbps-128kbps audio quality).
2. **Heavyweight & Bloated Desktop/Mobile Apps:** Electron-based desktop clients consume $400\text{MB}\sim800\text{MB}$ of RAM on idle and run dozens of background analytics trackers.
3. **Siloed Catalogues & Regional Licensing Bans:** Tracks frequently disappear due to regional geo-restrictions, licensing disputes, or publisher disputes.
4. **Disconnection from Local Audio Libraries:** Users with private collections of unreleased tracks, mixtape FLAC/MP3 files, or DJ sets cannot seamlessly mix local audio with streamed music in a unified interface.
5. **Subscription-Gated Lyrics:** Real-time synchronized lyrics are increasingly locked behind paid premium tiers.

### 1.2 Product Vision
**Riff** is an ultra-fast, zero-bloat, open-catalog Universal Music Progressive Web App (PWA). It provides an uncompromising, studio-quality listening experience by uniting a **Global Multi-Provider Audio Mesh (GMPAM)** with **in-browser sandboxed local storage (OPFS & IndexedDB)** and **real-time Web Audio DSP (5-Band Equalizer & 60 FPS Visualizer)** in an installable, sub-3MB web client with zero advertising, zero login barriers, and zero spyware.

```
+-----------------------------------------------------------------------------+
|                                ⚡ RIFF PWA                                  |
|  [Global Multi-Provider Mesh] + [Studio Web Audio DSP] + [Sandboxed OPFS]   |
|                                                                             |
|  * 100M+ Universal Catalog       * 5-Band Studio Equalizer                  |
|  * Millisecond Synced Lyrics     * Realtime 60 FPS Audio Visualizer         |
|  * 100% Free & Zero-Ad Streams   * Sandboxed Local MP3/FLAC Ingestion       |
|  * Installable Offline PWA       * Zero-Friction Guest-First Onboarding     |
+-----------------------------------------------------------------------------+
```

---

## 2. Target User Personas & Use Cases

### Persona 1: Alex — The Minimalist Audiophile & Student
* **Demographics:** 22, University student & indie developer.
* **Pain Point:** Frustrated by bloated desktop apps lagging his laptop and intrusive audio ads interrupting study focus.
* **Needs:** Lightweight client ($<60\text{MB}$ RAM usage), instant keyboard shortcuts (`Ctrl+K`, `Space`, `J`/`L`), 320kbps high-fidelity playback, customizable 5-band EQ with Bass Boost, and a dynamic audio spectrum visualizer.

### Persona 2: Priya — The Commuter with Limited Mobile Data
* **Demographics:** 28, Daily subway commuter on a 4G/5G tiered mobile data plan.
* **Pain Point:** Video-based streaming services consume gigabytes of bandwidth and buffer constantly in low-reception zones.
* **Needs:** 3-tier adaptive data saver (auto-switching to 96kbps / 160kbps on cellular), 1-tap offline track and playlist caching, native OS lockscreen controls via MediaSession API, and installable PWA icon on Android/iOS.

### Persona 3: Marcus — The DJ & Mixtape Collector
* **Demographics:** 31, Music collector with a 50GB library of FLAC/WAV/MP3 live bootlegs and unreleased edits.
* **Pain Point:** Cloud streaming platforms reject custom audio files or require complex cloud sync subscriptions.
* **Needs:** Instant drag-and-drop local audio ingestion with in-browser ID3 tag extraction, sandboxed high-speed storage via Origin Private File System (OPFS) with zero server upload, and unified playlist creation mixing streaming tracks with local files.

### Persona 4: Maya — The Global & Multilingual Music Fan
* **Demographics:** 26, Listens to Global Pop, Bollywood, Anime OSTs, Latin Hits, and Live Radio Broadcasts.
* **Pain Point:** Mainstream apps often lack foreign language indie tracks or live regional broadcasts.
* **Needs:** Federated search across JioSaavn, Audius, Jamendo, and 30,000+ live worldwide radio stations with millisecond-synced karaoke lyrics (.LRC).

---

## 3. Core Value Propositions & Product Pillars

| Pillar | Description | Architectural Enabler |
|---|---|---|
| **1. Universal Catalog Access** | Access to 100M+ songs, remixes, podcasts, and 30,000+ global radio stations without geographic licensing blackouts. | Global Multi-Provider Audio Mesh + 3-Layer Deduplication Engine. |
| **2. Zero-Bloat Speed & Light Footprint** | Instant startup ($<300\text{ms}$ TTFB), $<3\text{MB}$ total download, and $<60\text{MB}$ RAM consumption. | React 18 + Tailwind v4 + Zustand + Native Web APIs. |
| **3. Studio-Grade Audio Control** | Real-time audio processing directly on the client without server-side transcoding latency. | Web Audio API (BiquadFilterNode EQ, GainNode, AnalyserNode). |
| **4. Offline-First Privacy & Autonomy** | Local files remain 100% on the user's device. Offline streams cached safely in client storage. | Origin Private File System (OPFS) + Dexie IndexedDB + CacheStorage. |
| **5. Frictionless Onboarding** | Open URL $\to$ Click Play. No mandatory sign-up, no credit card, no email confirmation. | Guest-First Local State with optional 1-click cloud sync migration. |

---

## 4. Functional Requirements Matrix

### 4.1 Priority Definitions
* **P0 (Must Have):** Core operational features required for standard user flow and playback.
* **P1 (Should Have):** High-value differentiating capabilities required for production excellence.
* **P2 (Nice to Have):** Advanced enhancements and delightful extensions.

### 4.2 Feature Specifications

#### Epic 1: Search & Discovery Engine
| ID | Priority | Feature Description | Acceptance Criteria |
|---|---|---|---|
| **REQ-1.1** | **P0** | Global Federated Search | Inputting any query returns ranked, deduplicated tracks, artists, albums, playlists, and live radio stations within $<450\text{ms}$. |
| **REQ-1.2** | **P0** | 3-Layer Track Deduplication | Identical tracks across providers (e.g. YouTube, JioSaavn, Audius) are consolidated into a single clean canonical track entry. |
| **REQ-1.3** | **P1** | Hybrid Typo & Phonetic Search Ranking | Supports Levenshtein fuzzy matching and Soundex phonetic scoring to tolerate misspellings (e.g., "Talha Anjum Downers"). |
| **REQ-1.4** | **P1** | Trending Home Feed & Vibe Mixes | Home screen displays trending charts, curated mixes ("Lo-Fi", "Synthwave", "Workout Bass"), and quick genre filters. |
| **REQ-1.5** | **P2** | Worldwide Live Radio Directory | Search and filter 30,000+ live radio broadcasts by country, language, genre, and bitrate. |

#### Epic 2: Audio Playback & Web Audio DSP
| ID | Priority | Feature Description | Acceptance Criteria |
|---|---|---|---|
| **REQ-2.1** | **P0** | Waterfall Multi-Tier Stream Resolution | Client resolves stream URL via 5-tier cascade (Direct CDN $\to$ JioSaavn $\to$ Innertube HTTP $\to$ Audius $\to$ Radio). |
| **REQ-2.2** | **P0** | Continuous Queue & Playback Controls | Play, pause, seek, next, previous, shuffle (Fisher-Yates), repeat (off/all/one), and drag-to-reorder queue. |
| **REQ-2.3** | **P0** | OS Lockscreen & MediaSession Integration | Full integration with native OS media controllers (Windows, macOS, Android, iOS notification drawer) displaying title, artist, and artwork. |
| **REQ-2.4** | **P1** | Studio 5-Band Equalizer | User can adjust 60Hz, 250Hz, 1kHz, 4kHz, and 14kHz bands ($\pm12\text{dB}$) with presets (Bass Boost, Vocal, Rock, Electronic). |
| **REQ-2.5** | **P1** | 60 FPS Audio Spectrum Visualizer | Canvas-based real-time frequency visualizer driven by Web Audio `AnalyserNode` with smooth animation. |
| **REQ-2.6** | **P1** | Synchronized Karaoke Lyrics | Millisecond-accurate .LRC lyrics display with active line highlighting, auto-scroll, and tap-to-seek playback. |
| **REQ-2.7** | **P1** | 3-Tier Adaptive Data Saver | User can toggle between High (320kbps), Standard (160kbps), and Saver (96kbps); automatic degradation on cellular networks. |

#### Epic 3: Local Ingestion & Offline Storage
| ID | Priority | Feature Description | Acceptance Criteria |
|---|---|---|---|
| **REQ-3.1** | **P0** | Sandboxed OPFS File Ingestion | Drag-and-drop MP3/FLAC/WAV files stored in Origin Private File System for high-speed, zero-RAM disk streaming. |
| **REQ-3.2** | **P0** | In-Browser ID3 Tag Extraction | Ingested audio files automatically extract embedded Title, Artist, Album, and Cover Art Blob using `music-metadata-browser`. |
| **REQ-3.3** | **P1** | Offline Library & Playlist Storage | IndexedDB (Dexie) stores liked tracks, custom playlists, listening history, and cached lyrics with persistent storage request. |
| **REQ-3.4** | **P1** | Storage Quota & Metric Inspector | Settings drawer displays used storage in MB, available quota, and 1-click cache purge button. |

#### Epic 4: Application Shell & User Experience
| ID | Priority | Feature Description | Acceptance Criteria |
|---|---|---|---|
| **REQ-4.1** | **P0** | Responsive 3-Panel Desktop & Mobile Layout | Desktop renders 3 floating obsidian cards; mobile displays single-column view with bottom nav and floating mini player. |
| **REQ-4.2** | **P0** | Fullscreen Player Modal | Immersive modal with album art glow, large scrubber, lyrics toggle, visualizer toggle, and queue inspection. |
| **REQ-4.3** | **P1** | PWA Installation & Service Worker | Service Worker caches application shell, fonts, and assets; native "Install App" prompt supported. |
| **REQ-4.4** | **P1** | Keyboard Navigation Suite | Full keyboard accessibility (`Space`, `Ctrl+K`, `ArrowLeft`/`ArrowRight`, `J`/`L`, `N`/`P`, `M`, `L`, `Esc`). |
| **REQ-4.5** | **P2** | Guest-First Auth & Cloud Migration | Start immediately as guest; optional login/signup allows 1-click cloud sync migration of local IndexedDB data. |

---

## 5. Non-Functional Requirements (NFR)

### 5.1 Performance & Latency
* **First Contentful Paint (FCP):** $< 400\text{ms}$ on 4G networks.
* **Time to Interactive (TTI):** $< 650\text{ms}$.
* **Stream Time-to-First-Audio (TTFA):** $< 250\text{ms}$ on cached CDN streams; $< 500\text{ms}$ on dynamic Innertube stream resolution.
* **Frame Rate:** Main UI and Canvas Visualizer must maintain a locked **60 FPS** without main-thread jank.
* **Memory Footprint:** Peak browser tab heap allocation must stay below **$65\text{MB}$** during continuous 4-hour playback.

### 5.2 Reliability & Availability
* **Stream Playback Success Rate:** $\ge 99.5\%$ through automated waterfall fallback across 5 independent provider tiers.
* **Offline Playback Availability:** $100\%$ availability for all tracks stored in OPFS or IndexedDB without network connectivity.
* **Fault Tolerance:** If a primary stream provider fails (e.g., HTTP 403 or network timeout $>2500\text{ms}$), the engine must automatically failover to the next tier within $<300\text{ms}$ without user intervention.

### 5.3 Security & Privacy
* **Zero Telemetry Tracking:** No third-party tracking scripts, cookies, or behavioral advertising pixels.
* **Client-Side Isolation:** Local user audio files are stored in the browser's sandboxed Origin Private File System and never transmitted to external servers.
* **Sanitized Query Ingestion:** All search and stream queries are sanitized against injection attacks and rate-limited at the BFF gateway.
* **Content Security Policy (CSP):** Strict CSP allowing media connections exclusively to authorized streaming domains (`*.saavncdn.com`, `*.audius.co`, `*.jamendo.com`, `*.googlevideo.com`, `*.zeno.fm`).

### 5.4 Accessibility (a11y)
* **Standard:** Compliance with WCAG 2.1 Level AA.
* **Color Contrast:** Minimum 7:1 contrast ratio for all text on obsidian dark backgrounds.
* **Screen Reader Compatibility:** Full ARIA labels for all player controls, volume sliders, and playlist action buttons.
* **Focus Management:** Visible keyboard focus rings and modal focus trapping.

---

## 6. Success Metrics & Key Performance Indicators (KPIs)

| Metric Category | Target KPI | Measurement Method |
|---|---|---|
| **Playback Reliability** | $> 99.5\%$ Stream Resolution Success | BFF Gateway telemetry logs & client error boundary catch rate. |
| **Search Efficiency** | $< 450\text{ms}$ Search Response Time | Server request duration timer & client network performance marks. |
| **User Engagement** | $> 45\text{ mins}$ Average Session Duration | Local IndexedDB listening history aggregation (anonymized). |
| **Offline Utilization** | $> 30\%$ of active users storing $\ge 5$ tracks | Dexie DB record count audit during storage estimate calls. |
| **PWA Install Rate** | $> 25\%$ prompt conversion | `beforeinstallprompt` event acceptance tracking. |

---

## 7. Assumptions & Dependencies
1. **Modern Browser APIs:** The client environment supports standard HTML5 Audio, Web Audio API, IndexedDB v2+, and Origin Private File System (Chromium 86+, Safari 15.2+, Firefox 111+).
2. **Third-Party CDN Stability:** Upstream audio CDNs (JioSaavn, Audius, Jamendo) remain accessible over HTTPS.
3. **BFF Gateway Host:** A Fastify Node.js server acts as the Backend-For-Frontend (BFF) proxy to bypass browser Cross-Origin Resource Sharing (CORS) limits on video/audio streams.
