# 🔄 Application Flow & State Machine Architecture (APP FLOW)
## Project: Riff • Universal Music Progressive Web App (PWA)
**Document Version:** 1.0.0  
**Status:** Approved / State Machine Specification  
**Author:** Senior Staff Software Engineer  
**Target Systems:** Client React State, Web Audio Pipeline, BFF Gateway Cascades  

---

## 1. Global User Journey Workflows

```mermaid
journey
    title User Journey: From Zero-Install Discovery to Studio Playback & Offline Ingestion
    section Onboarding & First Impression
      Open Riff URL: 5: User
      Instant 0-login guest session init: 5: System
      Load trending feed & cached library: 5: System
    section Search & Discovery
      Press Ctrl+K or tap search bar: 5: User
      Type query e.g. 'Starboy': 5: User
      Multi-provider search + deduplication: 5: System
      Display clean canonical song cards: 5: User
    section Playback & DSP Immersion
      Tap song to play: 5: User
      Waterfall stream resolution (<180ms): 5: System
      Web Audio DSP graph connects: 5: System
      Canvas visualizer fires at 60 FPS: 5: User
      Open synced karaoke lyrics: 5: User
    section Local & Offline Mastery
      Drag-and-drop local FLAC file: 5: User
      In-browser ID3 extraction: 5: System
      Write audio blob to OPFS: 5: System
      Play local lossless track in offline mode: 5: User
```

---

## 2. Detailed Mermaid Sequence Diagrams

### 2.1 Workflow 1: Application Cold Boot & Guest Ingestion

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Browser as Browser Client
    participant AppShell as AppShell Component
    participant AuthStore as useAuthStore (Zustand)
    participant LibStore as useLibraryStore (Zustand)
    participant PlayerStore as usePlayerStore (Zustand)
    participant IDB as Dexie IndexedDB
    participant BFF as Fastify Gateway (/api/v1)

    User->>Browser: Navigate to Riff PWA
    Browser->>AppShell: Mount AppShell Root
    par Parallel Subsystem Initialization
        AppShell->>PlayerStore: initAudioListeners() (bind HTML5 Audio & MediaSession)
        AppShell->>LibStore: loadLibrary() (fetch liked tracks & playlists)
        AppShell->>AuthStore: initGuestSession()
        AppShell->>Browser: requestPersistentStorage()
    end
    LibStore->>IDB: Query db.tracks.toArray() & db.playlists.toArray()
    IDB-->>LibStore: Return stored offline tracks & playlists
    AppShell->>BFF: GET /api/v1/discover/trending
    BFF-->>AppShell: Return 30 deduplicated global trending tracks
    AppShell-->>User: Render HomeFeed with personalized cards & active library
```

---

### 2.2 Workflow 2: Search, 3-Layer Deduplication & Hybrid Ranking

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant SearchUI as SearchExplorer Component
    participant BFF as Fastify BFF Gateway
    participant Cache as In-Memory Cache (15m TTL)
    participant Ranking as Spotify Ranking Engine
    participant Providers as Multi-Provider Mesh (Apple, Deezer, Saavn)
    participant Dedup as 3-Layer Deduplication (SDCCE)

    User->>SearchUI: Types "Coldplay Viva La Vida" (debounced 300ms)
    SearchUI->>BFF: GET /api/v1/search?q=Coldplay+Viva+La+Vida
    BFF->>Cache: Check query cache key
    alt Cache Hit
        Cache-->>BFF: Return pre-computed JSON response
    else Cache Miss
        BFF->>Providers: Parallel fetch (iTunes, Deezer, JioSaavn)
        Providers-->>BFF: Return raw track arrays (with video tags & variations)
        BFF->>Dedup: Run deduplicateTracks(rawTracks)
        Note over Dedup: 1. Clean video tags<br/>2. Cluster by duration ±3s<br/>3. Compute FNV-1a hash (trk_9b2e4c)
        Dedup-->>BFF: Return unified canonical track list
        BFF->>Ranking: Score track relevance (Levenshtein + Soundex + token match)
        Ranking-->>BFF: Return ranked SearchResults object
        BFF->>Cache: Save to memory cache
    end
    BFF-->>SearchUI: Return HTTP 200 OK (JSON)
    SearchUI-->>User: Render Top Result card + categorized track/artist lists
```

---

### 2.3 Workflow 3: Track Playback & Waterfall Stream Resolution

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant UI as Track Card / MiniPlayer
    participant PlayerStore as usePlayerStore
    participant AudioEngine as RiffAudioEngine
    participant BFF as Fastify BFF (/api/v1/stream/resolve)
    participant StreamProxy as Stream Proxy (/stream/proxy)
    participant CDN as Upstream Audio CDN

    User->>UI: Clicks "Play" on Track
    UI->>PlayerStore: playTrack(track, queue)
    PlayerStore->>PlayerStore: setPlaybackState('resolving')
    PlayerStore->>AudioEngine: initWebAudio() (build DSP graph)
    
    alt Local OPFS Track
        PlayerStore->>AudioEngine: playTrack(blobUrl)
    else Cloud Streaming Track
        PlayerStore->>BFF: POST /api/v1/stream/resolve { title, artist, duration, rawUrl }
        Note over BFF: Waterfall Cascade:<br/>1. Memory Cache (<1ms)<br/>2. Saavn Direct CDN (~120ms)<br/>3. Innertube Android HTTP (~180ms)<br/>4. Audius / Radio fallback
        BFF-->>PlayerStore: Return { streamUrl: "https://...", resolvedProvider: "saavn-320k" }
        
        alt Needs Proxy (e.g. YouTube googlevideo URL)
            PlayerStore->>AudioEngine: playTrack('/api/v1/stream/proxy?url=' + streamUrl)
            AudioEngine->>StreamProxy: GET /api/v1/stream/proxy (Range: bytes=0-)
            StreamProxy->>CDN: Stream audio chunks
            StreamProxy-->>AudioEngine: HTTP 206 Partial Content (audio/mp4)
        else Direct CDN URL
            PlayerStore->>AudioEngine: playTrack(streamUrl)
            AudioEngine->>CDN: HTTP GET Range: bytes=0-
            CDN-->>AudioEngine: Audio bytes stream
        end
    end

    AudioEngine->>AudioEngine: Connect MediaElementAudioSource -> EQ -> Gain -> Analyser -> Output
    AudioEngine-->>PlayerStore: On 'playing' event -> setPlaybackState('playing')
    PlayerStore->>AudioEngine: syncMediaSession(track) (update OS lockscreen)
    PlayerStore-->>UI: Update MiniPlayer, Scrubber & Fullscreen Player
```

---

### 2.4 Workflow 4: Synchronized Karaoke Lyrics & Tap-to-Seek Loop

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant LyricsUI as FullscreenPlayer Lyrics Panel
    participant PlayerStore as usePlayerStore
    participant AudioEngine as RiffAudioEngine
    participant IDB as Dexie IndexedDB
    participant BFF as Fastify BFF (/api/v1/lyrics)
    participant LRCLIB as LRCLIB API

    User->>LyricsUI: Toggles Lyrics View [🎤]
    LyricsUI->>PlayerStore: Request lyrics for currentTrack.id
    PlayerStore->>IDB: Check db.lyrics.get(currentTrack.id)
    alt Cached in IndexedDB
        IDB-->>PlayerStore: Return cached synced & plain lyrics
    else Not in DB
        PlayerStore->>BFF: GET /api/v1/lyrics?title=...&artist=...&duration=...
        BFF->>LRCLIB: Query synced .LRC file
        LRCLIB-->>BFF: Return raw LRC string
        BFF->>BFF: Parse into SyncedLyricLine[] ({ timeMs, text })
        BFF-->>PlayerStore: Return parsed JSON lyrics
        PlayerStore->>IDB: Cache in db.lyrics table
    end
    PlayerStore-->>LyricsUI: Render scrollable lyric lines
    
    loop Every 100ms during playback
        AudioEngine->>PlayerStore: currentTime updated (e.g. 84.3s)
        PlayerStore->>LyricsUI: Active line index = binarySearch(lyrics, 84300ms)
        LyricsUI->>LyricsUI: Smooth scroll active line into center + apply Neon Violet Glow
    end

    User->>LyricsUI: Taps on Lyric Line at [02:15.40]
    LyricsUI->>PlayerStore: seek(135.4)
    PlayerStore->>AudioEngine: seek(135.4)
    AudioEngine-->>PlayerStore: Playback jumps to 02:15.40 instantly
```

---

### 2.5 Workflow 5: Sandboxed Local Audio Ingestion (OPFS + ID3 Parsing)

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant DropZone as Library DropZone / FilePicker
    participant Parser as music-metadata-browser
    participant OPFS as Origin Private File System
    participant IDB as Dexie IndexedDB (db.tracks)
    participant LibStore as useLibraryStore

    User->>DropZone: Drags and drops "Bohemian_Rhapsody.flac" (45MB)
    DropZone->>Parser: parseBlob(file)
    Parser->>Parser: Extract ID3/FLAC metadata: Title, Artist, Album, Picture Blob
    Parser-->>DropZone: Return { title: "Bohemian Rhapsody", artist: "Queen", album: "A Night at the Opera", picture }
    
    Note over DropZone: Compute Canonical ID: trk_queen_bohemianrhapsody
    DropZone->>OPFS: saveAudioToOPFS('trk_queen_bohemianrhapsody.blob', file)
    OPFS-->>DropZone: File stored safely in sandboxed root directory
    
    DropZone->>IDB: db.tracks.put({ id, title, artist, sourceType: 'local', isOfflineCached: true, addedAt: Date.now() })
    IDB-->>LibStore: Transaction complete
    LibStore->>LibStore: Update localTracks state array
    LibStore-->>User: Display track in "Local Files" & "Liked Tracks" with offline badge
```

---

## 3. Finite State Machines (FSM)

### 3.1 Audio Player Lifecycle State Machine

```mermaid
stateDiagram-v2
    [*] --> IDLE

    IDLE --> RESOLVING : playTrack(track)
    
    RESOLVING --> BUFFERING : streamUrl resolved & audio.load()
    RESOLVING --> ERROR : all cascade tiers fail

    BUFFERING --> PLAYING : audio 'canplay' / 'playing' event
    BUFFERING --> ERROR : network abort / decode error

    PLAYING --> PAUSED : togglePlay() / audio.pause()
    PLAYING --> BUFFERING : network starvation (waiting event)
    PLAYING --> RESOLVING : nextTrack() / user selects new track
    PLAYING --> ENDED : audio 'ended' event

    PAUSED --> PLAYING : togglePlay() / audio.play()
    PAUSED --> RESOLVING : user selects new track

    ENDED --> RESOLVING : auto-advance next in queue / repeat all
    ENDED --> PLAYING : repeat one (currentTime = 0)
    ENDED --> IDLE : queue finished & repeat off

    ERROR --> RESOLVING : retryStreamResolution()
    ERROR --> IDLE : user dismisses error
```

#### Audio Player State Transition Matrix

| Current State | Event Trigger | Next State | System Actions Executed |
|---|---|---|---|
| `IDLE` | `playTrack(track)` | `RESOLVING` | Save active track, show loader skeleton, initiate waterfall resolver. |
| `RESOLVING` | `RESOLVE_SUCCESS(url)` | `BUFFERING` | Assign `audio.src = url`, call `audio.load()`, resume `AudioContext`. |
| `RESOLVING` | `RESOLVE_FAILURE` | `ERROR` | Set error message, trigger toast alert, allow retry. |
| `BUFFERING` | `audio.onplaying` | `PLAYING` | Start timer ticker, sync `MediaSession`, trigger Canvas visualizer. |
| `PLAYING` | `USER_PAUSE` | `PAUSED` | Call `audio.pause()`, freeze visualizer canvas, update OS lockscreen. |
| `PLAYING` | `audio.onwaiting` | `BUFFERING` | Show subtle buffer spinner over play button, keep audio context warm. |
| `PLAYING` | `audio.onended` | `ENDED` | Log listening history to Dexie, check repeat mode, advance queue. |
| `PAUSED` | `USER_RESUME` | `PLAYING` | Call `audio.play()`, resume audio context, start visualizer animation loop. |

---

### 3.2 Waterfall Stream Resolver State Machine

```mermaid
stateDiagram-v2
    [*] --> CHECK_MEMORY_CACHE

    CHECK_MEMORY_CACHE --> RETURN_STREAM : Cache Hit (TTL < 12h)
    CHECK_MEMORY_CACHE --> CHECK_IN_FLIGHT : Cache Miss

    CHECK_IN_FLIGHT --> ATTACH_PROMISE : In-flight promise exists
    CHECK_IN_FLIGHT --> TIER_1_SAAVN : No active resolution

    TIER_1_SAAVN --> CACHE_AND_RETURN : Saavn 320k match found
    TIER_1_SAAVN --> TIER_2_INNERTUBE : Saavn empty / error

    TIER_2_INNERTUBE --> CACHE_AND_RETURN : Innertube audio URL extracted
    TIER_2_INNERTUBE --> TIER_3_AUDIUS : Innertube blocked / empty

    TIER_3_AUDIUS --> CACHE_AND_RETURN : Audius / Jamendo match found
    TIER_3_AUDIUS --> TIER_4_RADIO_FALLBACK : All catalogue tiers fail

    TIER_4_RADIO_FALLBACK --> RETURN_FALLBACK : Radio backup assigned
    TIER_4_RADIO_FALLBACK --> RESOLUTION_FAILED : Total network failure

    CACHE_AND_RETURN --> [*]
    RETURN_STREAM --> [*]
    ATTACH_PROMISE --> [*]
    RETURN_FALLBACK --> [*]
    RESOLUTION_FAILED --> [*]
```

---

## 4. Edge Cases & Fault Tolerance Matrix

| Edge Case | Root Cause | System Detection | Graceful Recovery Action |
|---|---|---|---|
| **AudioContext Autoplay Block** | Browser policy blocks audio without prior user gesture. | `audio.play()` rejects with `NotAllowedError`. | Display unobtrusive glowing "Tap to Resume" overlay; resume on next interaction. |
| **CORS Audio Blocking on Canvas** | Third-party CDN omits `Access-Control-Allow-Origin: *`. | MediaElementSource fails to connect to DSP. | Bypass Web Audio DSP gracefully to ensure direct `<audio>` playback continues smoothly; switch Visualizer to synthetic waveform. |
| **Network Disconnection Mid-Stream** | Subway tunnel / mobile signal drop. | `audio.onerror` fires with `MEDIA_ERR_NETWORK`. | Buffer current chunk, pause playback state, show "Offline - Reconnecting" badge, auto-resume upon `navigator.onLine = true`. |
| **Origin Storage Quota Full** | User downloads dozens of offline FLAC albums. | `navigator.storage.estimate()` returns $>90\%$ usage. | Prompt user with storage drawer, show storage bar, provide 1-tap "Purge Unused Cache" button. |
| **Background Tab Throttling** | Mobile browser suspends requestAnimationFrame. | Canvas visualizer paused by OS. | Visualizer loop automatically throttles to $0\text{ FPS}$ to conserve battery; audio playback continues uninterrupted via native Audio thread. |
| **Typo in Search Query** | User searches "Weknd Blnding Lghts". | Exact match query returns 0 hits. | Multi-tier ranker fires Soundex phonetic match and Levenshtein distance $\le 2$, returning "The Weeknd - Blinding Lights" as top result. |
