# 🏛️ Riff System Architecture & Technical Specification

## 1. Executive Architecture Overview
**Riff** is an installable, high-performance Progressive Web App (PWA) tailored for global song streaming and offline music playback. It bridges client-side Web Audio DSP, sandboxed Origin Private File System (OPFS) storage, and a Global Multi-Provider Audio Mesh (GMPAM) into a seamless, low-latency audio experience.

---

## 2. High-Level Architecture Topology

```mermaid
graph TB
    subgraph Client Layer [PWA Frontend (React 18 + Tailwind v4 + Zustand)]
        UI[UI Component Tree (AppShell, MiniPlayer, FullscreenModal)]
        AudioCore[RiffAudioEngine: HTML5 Audio + Web Audio DSP]
        IDB[(Dexie IndexedDB: Metadata, Playlists, Likes)]
        OPFS[(Origin Private File System: Sandboxed Local Audio)]
        SW[Service Worker: CacheStorage & Web Push]
    end

    subgraph BFF Gateway Layer [Fastify HTTP/2 Server]
        Gateway[Fastify Routing & CORS Injection]
        Resolver[Waterfall Cascade Stream Resolver]
        Dedup[Song Deduplication & Clustering Engine]
    end

    subgraph Global Multi-Provider Audio Mesh
        Audius[Audius Catalog API]
        Saavn[JioSaavn Open Engine]
        Jamendo[Jamendo Free Music API]
        Radio[Radio Browser Worldwide API]
        LRCLIB[LRCLIB Synced Lyrics API]
        YTDLP[Local yt-dlp Extractor Daemon]
    end

    UI --> AudioCore
    UI --> IDB
    UI --> OPFS
    UI <--> SW
    UI <-->|REST & Range Stream| Gateway

    Gateway --> Resolver
    Gateway --> Dedup
    Resolver --> Audius
    Resolver --> Saavn
    Resolver --> Jamendo
    Resolver --> Radio
    Resolver --> LRCLIB
    Resolver --> YTDLP
```

---

## 3. Core Subsystems

### 3.1 Web Audio DSP Graph
Audio flows from the `<audio>` stream through a real-time Web Audio API node graph:
1. `MediaElementAudioSourceNode`: Bridges audio stream with cross-origin safety.
2. `5-Band BiquadFilter Equalizer`: Frequency bands at 60Hz, 250Hz, 1kHz, 4kHz, 14kHz.
3. `GainNode`: High-precision master volume and mute controls.
4. `AnalyserNode`: Fast Fourier Transform (FFT) frequency bin analysis feeding the 60 FPS Canvas spectrum visualizer.

### 3.2 3-Layer Deduplication Engine (SDCCE)
1. **String Normalization:** Strips video tags `(Official Music Video)`, `[HQ Audio]`, `4K Remaster`, and `feat.` patterns.
2. **Duration Bucketing:** Clusters tracks within $\pm 3\text{ seconds}$ duration variance.
3. **Canonical Hash Generation:** `SHA-256(norm_artist + norm_title + duration_bucket)`.

### 3.3 Storage Tiering
* **OPFS (Origin Private File System):** Direct disk streaming of local MP3/FLAC files ($0\text{ RAM}$ overhead).
* **IndexedDB (Dexie.js):** Transactional storage for liked songs, custom playlists, and offline metadata.
* **CacheStorage (Workbox):** PWA static shell caching and dynamic API network-first caching.
