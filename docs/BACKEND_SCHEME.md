# 🗄️ Backend Scheme, Database Schemas & API Contracts
## Project: Riff • Universal Music Progressive Web App (PWA)
**Document Version:** 1.0.0  
**Status:** Approved / Backend Specification  
**Author:** Senior Staff Backend & Systems Architect  
**Runtime:** Fastify v5, Node.js v20+, TypeScript, IndexedDB Dexie, OPFS  

---

## 1. Backend Architecture & BFF Gateway Overview

The Riff backend is built as a high-throughput, low-overhead **Backend-For-Frontend (BFF)** using **Fastify v5** with native HTTP/2 support:
* **Asynchronous Multi-Provider Aggregator:** Concurrently queries 7 global music APIs (iTunes, Deezer, JioSaavn, YouTube Music Innertube, Audius, Jamendo, Radio Browser).
* **Deterministic Canonical Deduplication:** Normalizes track titles and clusters multi-source duplicates via FNV-1a hashing.
* **Waterfall Stream Resolver:** Cascades through CDNs to guarantee $>99.5\%$ stream resolution reliability.
* **HTTP Range Stream Proxy:** Proxies audio byte ranges (`RFC 7233`) to bypass browser CORS headers and carrier firewalls.
* **In-Flight Deduplication & Memory Cache:** Deduplicates simultaneous stream requests and caches resolved CDN URLs in an in-memory LRU map with a 12-hour TTL.

```
                    +------------------------------------------+
                    |            CLIENT PWA REQUEST            |
                    +--------------------+---------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                            FASTIFY BFF GATEWAY (PORT 3080)                        |
|                                                                                   |
|  [CORS Handler] ---> [In-Memory Cache (12h TTL)] ---> [In-Flight Request Map]     |
|                             |                                  |                  |
|                             v                                  v                  |
|  +--------------------+  +--------------------+  +-----------------------------+  |
|  | /api/v1/search     |  | /api/v1/stream/*   |  | /api/v1/lyrics              |  |
|  | Multi-Provider     |  | Waterfall Cascade  |  | LRCLIB Synced Parser        |  |
|  | Ranking Engine     |  | Resolver Service   |  | In-Memory Cache             |  |
|  +--------------------+  +--------------------+  +-----------------------------+  |
|                             |                                                     |
|                             v                                                     |
|                   [HTTP 206 Range Stream Proxy]                                   |
+-----------------------------------------------------------------------------------+
```

---

## 2. Database Schemas & Data Storage Architecture

### 2.1 Client-Side IndexedDB Schema (Dexie.js)
Database Name: `RiffMusicDB`  
Version: `1`

```typescript
// Client-side transactional database schema definition
export interface DBTrack {
  id: string;                         // Primary Key: 'trk_9b2e4c'
  title: string;
  artist: string;
  album?: string;
  duration: number;                   // In seconds
  coverUrl: string;
  sourceType: 'local' | 'audius' | 'saavn' | 'jamendo' | 'radio' | 'ytdlp' | 'piped' | 'itunes' | 'deezer';
  streamUrl?: string;
  rawUrl?: string;
  hasSyncedLyrics?: boolean;
  isOfflineCached?: boolean;
  bitrateKbps?: number;
  isLiked?: boolean;
  playCount?: number;
  localBlobKey?: string;              // Key pointer for OPFS audio storage
  addedAt: number;                    // Unix timestamp (ms)
}

export interface DBPlaylist {
  id: string;                         // Primary Key: 'pl_favorites'
  title: string;
  description?: string;
  coverUrl: string;
  creator: string;
  isPublic?: boolean;
  trackCount: number;
  trackIds: string[];                 // Relational array of DBTrack IDs
  updatedAt: number;
}

export interface DBLyrics {
  trackId: string;                    // Primary Key: 'trk_9b2e4c'
  syncedLyrics: Array<{ timeMs: number; text: string }>;
  plainLyrics: string;
  cachedAt: number;
}

export interface DBHistory {
  id?: number;                        // Auto-increment Primary Key: ++id
  trackId: string;
  title: string;
  artist: string;
  coverUrl: string;
  listenedAt: number;
  durationSec: number;
  completed: boolean;
}
```

#### Dexie Store Indexes Definition
```typescript
db.version(1).stores({
  tracks: 'id, title, artist, album, genre, sourceType, isOfflineCached, isLiked, addedAt',
  playlists: 'id, title, updatedAt',
  lyrics: 'trackId, cachedAt',
  history: '++id, trackId, artist, listenedAt'
});
```

---

### 2.2 Sandboxed Origin Private File System (OPFS) Hierarchy

User-imported audio files (FLAC, MP3, WAV) and downloaded offline blobs are stored in the browser's high-speed sandboxed file system:

```
/ (OPFS Root Directory)
└── riff_audio/
    ├── trk_queen_bohemianrhapsody.blob   # Direct binary audio chunk
    ├── trk_daftpunk_getlucky.blob        # Direct binary audio chunk
    └── covers/
        ├── trk_queen_bohemianrhapsody.jpg
        └── trk_daftpunk_getlucky.jpg
```

---

### 2.3 Cloud Sync Relational Schema (PostgreSQL / Supabase Optional Sync)

For authenticated users migrating their offline library to the cloud:

```sql
-- 1. Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Playlists Table
CREATE TABLE user_playlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    cover_url TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Playlist Tracks Junction
CREATE TABLE playlist_tracks (
    playlist_id UUID REFERENCES user_playlists(id) ON DELETE CASCADE,
    track_id VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    artist VARCHAR(255) NOT NULL,
    album VARCHAR(255),
    duration INT NOT NULL,
    cover_url TEXT,
    source_type VARCHAR(32) NOT NULL,
    position INT NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (playlist_id, track_id)
);

-- 4. User Favorites / Liked Tracks
CREATE TABLE user_favorites (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    track_id VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    artist VARCHAR(255) NOT NULL,
    duration INT NOT NULL,
    cover_url TEXT,
    source_type VARCHAR(32) NOT NULL,
    liked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, track_id)
);
```

---

## 3. RESTful API Contracts & Endpoint Specifications

Base URL: `/api/v1`

### 3.1 Health & Diagnostics
* **Endpoint:** `GET /api/v1/health`
* **Description:** Returns service status, node runtime uptime, memory metrics, and upstream provider health.
* **Response (200 OK):**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptimeSec": 45820,
  "memoryUsageMB": 48.2,
  "providers": {
    "saavn": "online",
    "innertube": "online",
    "audius": "online",
    "jamendo": "online",
    "lrclib": "online",
    "radioBrowser": "online"
  }
}
```

---

### 3.2 Universal Search & Catalog Federation
* **Endpoint:** `GET /api/v1/search`
* **Query Parameters:**
  * `q` (string, required): Search query string.
  * `type` (string, optional): `all` | `tracks` | `artists` | `albums` | `playlists` | `radio`. Default: `all`.
* **Response (200 OK):**
```json
{
  "query": "The Weeknd Starboy",
  "selectedCategory": "all",
  "topResult": {
    "type": "track",
    "data": {
      "id": "trk_weeknd_starboy",
      "title": "Starboy",
      "artist": "The Weeknd, Daft Punk",
      "album": "Starboy",
      "duration": 230,
      "coverUrl": "https://is1-ssl.mzstatic.com/image/thumb/Music125/...",
      "sourceType": "saavn",
      "hasSyncedLyrics": true,
      "bitrateKbps": 320,
      "availableSources": ["saavn", "ytdlp", "itunes"]
    }
  },
  "tracks": [
    {
      "id": "trk_weeknd_starboy",
      "title": "Starboy",
      "artist": "The Weeknd, Daft Punk",
      "album": "Starboy",
      "duration": 230,
      "coverUrl": "https://is1-ssl.mzstatic.com/image/thumb/Music125/...",
      "sourceType": "saavn",
      "hasSyncedLyrics": true,
      "bitrateKbps": 320
    }
  ],
  "artists": [
    {
      "id": "art_the_weeknd",
      "name": "The Weeknd",
      "avatarUrl": "https://is1-ssl.mzstatic.com/...",
      "genres": ["R&B", "Pop", "Synthwave"]
    }
  ],
  "albums": [],
  "radioStations": []
}
```

---

### 3.3 Audio Stream Resolution
* **Endpoint:** `POST /api/v1/stream/resolve` or `GET /api/v1/stream/resolve`
* **Request Body (POST):**
```json
{
  "trackId": "trk_weeknd_starboy",
  "title": "Starboy",
  "artist": "The Weeknd",
  "duration": 230,
  "rawUrl": "",
  "qualityTier": "high"
}
```
* **Response (200 OK):**
```json
{
  "trackId": "trk_weeknd_starboy",
  "streamUrl": "https://aac.saavncdn.com/284/c814b6044733eecae6e9fc0a3adfdc1c_320.mp4",
  "rawDirectUrl": "https://aac.saavncdn.com/284/c814b6044733eecae6e9fc0a3adfdc1c_320.mp4",
  "resolvedProvider": "saavn-320k",
  "cached": true
}
```
* **Response (502 Bad Gateway - All Tiers Exhausted):**
```json
{
  "error": "All streaming tiers failed to resolve audio stream",
  "trackId": "trk_invalid_query"
}
```

---

### 3.4 HTTP Range Audio Stream Proxy
* **Endpoint:** `GET /api/v1/stream/proxy?url={encodedStreamUrl}`
* **Headers Accepted:**
  * `Range: bytes=0-1048575` (RFC 7233 Byte Range Request)
* **Response Headers:**
  * `HTTP/1.1 206 Partial Content`
  * `Content-Type: audio/mp4` (or `audio/mpeg`)
  * `Content-Range: bytes 0-1048575/8492048`
  * `Content-Length: 1048576`
  * `Accept-Ranges: bytes`
  * `Access-Control-Allow-Origin: *`

---

### 3.5 Synchronized Lyrics Retrieval
* **Endpoint:** `GET /api/v1/lyrics?title={title}&artist={artist}&duration={duration}`
* **Response (200 OK):**
```json
{
  "trackId": "trk_weeknd_starboy",
  "hasSyncedLyrics": true,
  "syncedLyrics": [
    { "timeMs": 0, "text": "♪ Intro ♪" },
    { "timeMs": 14200, "text": "I'm tryna put you in the worst mood, ah" },
    { "timeMs": 17800, "text": "P1 cleaner than your church shoes, ah" },
    { "timeMs": 21500, "text": "Milli point two just to hurt you, ah" }
  ],
  "plainLyrics": "I'm tryna put you in the worst mood, ah\nP1 cleaner than your church shoes, ah...",
  "source": "lrclib"
}
```

---

### 3.6 Trending Global Discover Feed
* **Endpoint:** `GET /api/v1/discover/trending`
* **Response (200 OK):** Array of 30 deduplicated top global tracks with 320kbps streams.

---

## 4. Upstream Provider Integration Specifications

| Provider | Query Protocol | Audio Format & Bitrate | Rate Limits & SLA |
|---|---|---|---|
| **JioSaavn Open Engine** | REST JSON | Direct HTTPS MP3/AAC ($320\text{kbps}$ & $160\text{kbps}$) | High-throughput CDN, zero auth required. |
| **YouTube Music Innertube** | Android Client HTTP JSON | Direct HTTPS MP4/Opus ($160\text{kbps}$) | Decoded through client API session; fallback via proxy. |
| **Audius Catalog** | REST JSON | Direct HTTPS MP3 ($320\text{kbps}$) | Decentralized open API node mesh ($<200\text{ms}$). |
| **Jamendo Free Music** | REST JSON | Direct HTTPS MP3 ($160\text{kbps}$) | CC-licensed catalogue with permanent CDNs. |
| **Radio Browser** | REST JSON | SHOUTcast / Icecast AAC/MP3 ($64\sim320\text{kbps}$) | 30,000+ live broadcast nodes from 190+ countries. |
| **LRCLIB Database** | REST JSON | Timestamped `.LRC` strings | Free community synchronized lyrics database. |
| **Apple Music / iTunes** | REST JSON | Lossless metadata + 30s preview streams | Official global catalog index with rich cover art. |
