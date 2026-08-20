# 📡 Riff API Reference & Global Provider Mesh

Base URL: `/api/v1`

---

## 1. Global Multi-Provider Search Federation

Riff searches across **7 parallel global providers** covering **every song, artist, album, live broadcast, and soundtrack in existence**:

1. 🍎 **iTunes / Apple Music Search:** 100M+ official global catalog (Western, Pop, Rock, Hip-Hop, Latin, K-Pop, Classical).
2. 💿 **Deezer Public API:** 90M+ catalog with lossless metadata and cover art.
3. 🪕 **JioSaavn Open Engine:** 50M+ tracks across Global Pop, Bollywood, Punjabi, Tamil, and Asian hits with direct 320kbps MP3 CDN links.
4. ▶️ **YouTube Music / Invidious:** Universal catalog covering every remix, unreleased track, live concert, and soundtrack on Earth.
5. 🎵 **Audius API:** Millions of electronic, EDM, and indie tracks with direct 320kbps streams.
6. 🎸 **Jamendo Catalog:** 600,000+ Creative Commons & royalty-free tracks.
7. 📻 **Radio Browser API:** 30,000+ live streaming FM/AM/Web radio stations from 190+ countries.

---

## 2. API Endpoints

### `GET /api/v1/search`
* **Query Parameters:**
  * `q` (string, required): Search query (e.g., `Taylor Swift`, `Drake`, `Coldplay`, `Arijit Singh`)
  * `type` (enum, optional): `all` | `tracks` | `artists` | `playlists` | `albums` | `radio`
* **Response (200 OK):**
```json
{
  "query": "Coldplay",
  "selectedCategory": "all",
  "tracks": [
    {
      "id": "trk_9b2e4c",
      "title": "Viva La Vida",
      "artist": "Coldplay",
      "album": "Viva la Vida or Death and All His Friends",
      "duration": 242,
      "coverUrl": "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/...",
      "sourceType": "saavn",
      "hasSyncedLyrics": true,
      "bitrateKbps": 320
    }
  ],
  "artists": [...],
  "albums": [...],
  "radioStations": [...]
}
```

---

### `POST /api/v1/stream/resolve`
Resolves direct media streams across our 5-tier failover cascade:
1. **Tier 1 (JioSaavn Direct CDN):** 320kbps & 160kbps MP3 ($< 180\text{ms}$).
2. **Tier 2 (Audius Direct CDN):** 320kbps AAC ($< 200\text{ms}$).
3. **Tier 3 (Jamendo Direct CDN):** 160kbps MP3 ($< 250\text{ms}$).
4. **Tier 4 (YouTube Music / Piped / yt-dlp):** Direct Audio Stream (~$800\text{ms}$).
5. **Tier 5 (Apple / Deezer Preview):** Zero-fail preview audio buffer.

* **Request Body:**
```json
{
  "trackId": "trk_9b2e4c",
  "title": "Viva La Vida",
  "artist": "Coldplay",
  "qualityTier": "standard"
}
```
* **Response (200 OK):**
```json
{
  "trackId": "trk_9b2e4c",
  "streamUrl": "https://...",
  "resolvedProvider": "saavn",
  "cached": true
}
```
