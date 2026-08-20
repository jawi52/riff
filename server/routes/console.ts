import { FastifyInstance } from 'fastify';

export async function consoleRoutes(fastify: FastifyInstance) {
  const handler = async (_req: any, reply: any) => {
    reply.header('Content-Type', 'text/html; charset=utf-8');
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Riff • Backend Test & Playback Console</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
    code, pre { font-family: 'JetBrains Mono', monospace; }
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: #0b0d14; }
    ::-webkit-scrollbar-thumb { background: #262938; border-radius: 4px; }
    .glass { background: rgba(18, 20, 32, 0.75); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.08); }
    .glow-cyan { box-shadow: 0 0 35px -5px rgba(6, 182, 212, 0.3); }
  </style>
</head>
<body class="bg-[#08090d] text-slate-100 min-h-screen pb-36">

  <!-- Top Navbar -->
  <header class="sticky top-0 z-50 border-b border-white/10 glass px-6 py-4">
    <div class="max-w-7xl mx-auto flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-violet-600 flex items-center justify-center font-black text-white text-lg shadow-lg">
          R
        </div>
        <div>
          <h1 class="text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
            Riff Backend Test & Playback Console
          </h1>
          <p class="text-xs text-slate-400">Spotify-Style Ranking & Precision Streaming Engine</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Gateway :3080 Online
        </span>
      </div>
    </div>
  </header>

  <!-- Main Container -->
  <main class="max-w-7xl mx-auto px-6 py-8 space-y-8">

    <!-- Search Section -->
    <div class="glass rounded-2xl p-6 shadow-xl space-y-4">
      <h2 class="text-sm font-semibold text-slate-300 uppercase tracking-wider">Search Universal Catalog</h2>
      <div class="flex gap-3">
        <input 
          id="searchInput" 
          type="text" 
          placeholder="Search any song or artist (e.g. 'money by lisa', 'the weeknd', 'coldplay')..." 
          value="money by lisa"
          class="flex-1 px-5 py-3.5 rounded-xl bg-slate-900/90 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-sm font-medium transition"
        />
        <button 
          id="searchBtn" 
          class="px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-sm transition shadow-lg flex items-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          Search & Rank
        </button>
      </div>

      <!-- Quick Chips -->
      <div class="flex flex-wrap gap-2 pt-1 text-xs text-slate-400">
        <span>Quick Tests:</span>
        <button onclick="setQuery('money by lisa')" class="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition">MONEY by LISA</button>
        <button onclick="setQuery('blinding lights the weeknd')" class="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition">Blinding Lights</button>
        <button onclick="setQuery('dua lipa levitating')" class="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition">Levitating</button>
        <button onclick="setQuery('kesariya arijit singh')" class="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition">Kesariya</button>
      </div>
    </div>

    <!-- Status / Loading Indicator -->
    <div id="loading" class="hidden text-center py-12 space-y-3">
      <div class="w-8 h-8 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
      <p class="text-sm text-slate-400 font-medium">Aggregating Apple Music, Deezer, and YouTube Music with Spotify Ranking...</p>
    </div>

    <!-- Results Container -->
    <div id="results" class="space-y-8">
      
      <!-- Top Result Hero Card -->
      <div id="topResultSection" class="hidden space-y-3">
        <h3 class="text-xs font-bold uppercase tracking-wider text-cyan-400">Top Result (Highest Views / Best Match)</h3>
        <div id="topResultCard" class="glass rounded-3xl p-6 glow-cyan flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
          <!-- Populated by JS -->
        </div>
      </div>

      <!-- More From Same Artist -->
      <div id="artistTracksSection" class="hidden space-y-3">
        <h3 id="artistTracksTitle" class="text-xs font-bold uppercase tracking-wider text-violet-400">More From Artist</h3>
        <div id="artistTracksGrid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Populated by JS -->
        </div>
      </div>

      <!-- Similar Vibe & Recommendations (Total 20) -->
      <div id="vibeSection" class="hidden space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-xs font-bold uppercase tracking-wider text-emerald-400">Similar Vibe & Recommended Tracks (Curated 20 Tracks)</h3>
          <span id="totalTracksBadge" class="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400"></span>
        </div>
        <div id="vibeGrid" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <!-- Populated by JS -->
        </div>
      </div>

      <!-- Raw API Response & Lyrics Diagnostics -->
      <div class="glass rounded-2xl p-6 space-y-4">
        <div class="flex items-center justify-between border-b border-white/10 pb-3">
          <h3 class="text-sm font-semibold text-slate-300">Live Diagnostics & Synced Lyrics Inspector</h3>
          <div class="flex gap-2">
            <button onclick="toggleTab('lyrics')" id="tabBtnLyrics" class="px-3 py-1 rounded-lg text-xs font-semibold bg-cyan-500/20 text-cyan-300">Synced Lyrics</button>
            <button onclick="toggleTab('json')" id="tabBtnJson" class="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-400">Raw JSON</button>
          </div>
        </div>
        
        <div id="lyricsView" class="space-y-2 max-h-60 overflow-y-auto pr-2 text-xs text-slate-300">
          <p class="text-slate-500 italic">Play a song to view live millisecond-accurate synced lyrics...</p>
        </div>

        <pre id="jsonView" class="hidden max-h-60 overflow-y-auto text-[11px] text-emerald-400 bg-slate-950/80 p-4 rounded-xl"></pre>
      </div>

    </div>

  </main>

  <!-- Sticky Bottom Audio Player -->
  <div id="playerBar" class="fixed bottom-0 left-0 right-0 glass border-t border-white/10 px-6 py-3.5 z-50 flex items-center justify-between gap-6 shadow-2xl">
    <div class="flex items-center gap-4 min-w-[240px]">
      <img id="playerCover" src="/favicon.svg" class="w-12 h-12 rounded-xl object-cover border border-white/10 shadow bg-slate-900" />
      <div class="truncate max-w-xs">
        <div id="playerTitle" class="text-sm font-bold text-white truncate">No track playing</div>
        <div id="playerArtist" class="text-xs text-slate-400 truncate">Select any track to test stream</div>
      </div>
    </div>

    <!-- Center HTML5 Audio Controls -->
    <div class="flex-1 max-w-xl flex flex-col items-center gap-1.5">
      <audio id="audioEl" controls class="w-full h-8 brightness-90 filter invert hue-rotate-180"></audio>
      <div class="flex items-center justify-between w-full text-[11px] text-slate-400 px-1 font-mono">
        <span id="streamStatus">Status: Idle</span>
        <span id="streamProvider">Provider: -</span>
      </div>
    </div>

    <!-- Diagnostic Details -->
    <div class="hidden lg:flex flex-col items-end text-xs text-slate-400 min-w-[200px] font-mono">
      <div id="streamFormat" class="text-emerald-400 font-semibold">Format: M4A / AAC</div>
      <div id="streamLatency">Latency: 0ms</div>
    </div>
  </div>

  <script>
    let currentData = null;
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const loading = document.getElementById('loading');
    const audioEl = document.getElementById('audioEl');

    function setQuery(q) {
      searchInput.value = q;
      performSearch();
    }

    async function performSearch() {
      const q = searchInput.value.trim();
      if (!q) return;

      loading.classList.remove('hidden');
      document.getElementById('topResultSection').classList.add('hidden');
      document.getElementById('artistTracksSection').classList.add('hidden');
      document.getElementById('vibeSection').classList.add('hidden');

      try {
        const res = await fetch('/api/v1/search?q=' + encodeURIComponent(q));
        currentData = await res.json();
        renderResults(currentData);
        document.getElementById('jsonView').textContent = JSON.stringify(currentData, null, 2);

        // Instant Pre-Warm for Top Result & First 2 Tracks
        if (currentData?.topResult) {
          fetch('/api/v1/stream/resolve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              trackId: currentData.topResult.id,
              title: currentData.topResult.title,
              artist: currentData.topResult.artist,
              duration: currentData.topResult.duration,
              rawUrl: currentData.topResult.rawUrl
            })
          }).catch(() => {});
        }
      } catch (err) {
        alert('Search failed: ' + err.message);
      } finally {
        loading.classList.add('hidden');
      }
    }

    function formatTime(secs) {
      if (!secs) return '0:00';
      const m = Math.floor(secs / 60);
      const s = Math.floor(secs % 60);
      return m + ':' + (s < 10 ? '0' : '') + s;
    }

    function renderResults(data) {
      if (!data) return;

      // 1. Top Result
      if (data.topResult) {
        const top = data.topResult;
        document.getElementById('topResultSection').classList.remove('hidden');
        document.getElementById('topResultCard').innerHTML = \`
          <img src="\${top.coverUrl || '/favicon.svg'}" class="w-36 h-36 md:w-44 md:h-44 rounded-2xl object-cover shadow-2xl border border-white/10 flex-shrink-0" />
          <div class="flex-1 space-y-2 text-center md:text-left">
            <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              <span>★ #1 Match</span>
              <span>•</span>
              <span class="uppercase">\${top.sourceType}</span>
            </div>
            <h2 class="text-2xl md:text-3xl font-extrabold tracking-tight text-white">\${top.title}</h2>
            <p class="text-slate-300 font-medium">\${top.artist} <span class="text-slate-500">•</span> \${top.album || 'Single'}</p>
            <div class="flex items-center gap-3 pt-2 justify-center md:justify-start text-xs text-slate-400">
              <span>\${formatTime(top.duration)}</span>
              <span>•</span>
              <span>\${top.genre || 'Pop'}</span>
              <span>•</span>
              <span class="text-emerald-400 font-semibold">\${top.bitrateKbps || 320} kbps</span>
            </div>
            <div class="pt-3">
              <button onclick='playTrack(\${JSON.stringify(top).replace(/'/g, "&apos;")})' class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-lg flex items-center gap-2 transition">
                <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                Play Top Result
              </button>
            </div>
          </div>
        \`;
      }

      // 2. Same Artist Tracks
      if (data.sameArtistTracks && data.sameArtistTracks.length > 0) {
        document.getElementById('artistTracksSection').classList.remove('hidden');
        document.getElementById('artistTracksTitle').textContent = 'More from ' + (data.topResult?.artist || 'Artist');
        document.getElementById('artistTracksGrid').innerHTML = data.sameArtistTracks.map(t => renderTrackCard(t)).join('');
      }

      // 3. Similar Vibe Tracks
      if (data.tracks && data.tracks.length > 0) {
        document.getElementById('vibeSection').classList.remove('hidden');
        document.getElementById('totalTracksBadge').textContent = data.tracks.length + ' tracks';
        document.getElementById('vibeGrid').innerHTML = data.tracks.map((t, idx) => renderTrackCard(t, idx + 1)).join('');
      }
    }

    function prewarmTrack(track) {
      fetch('/api/v1/stream/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackId: track.id,
          title: track.title,
          artist: track.artist,
          duration: track.duration,
          rawUrl: track.rawUrl
        })
      }).catch(() => {});
    }

    function renderTrackCard(track, rank) {
      const trackEsc = JSON.stringify(track).replace(/'/g, "&apos;");
      return \`
        <div onmouseenter='prewarmTrack(\${trackEsc})' class="glass p-3.5 rounded-2xl flex items-center gap-3 group hover:border-cyan-500/40 transition">
          <div class="relative flex-shrink-0">
            <img src="\${track.coverUrl || '/favicon.svg'}" class="w-14 h-14 rounded-xl object-cover border border-white/10" />
            <button onclick='playTrack(\${trackEsc})' class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-xl transition">
              <svg class="w-6 h-6 text-cyan-400 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </button>
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-xs font-bold text-white truncate">\${track.title}</div>
            <div class="text-[11px] text-slate-400 truncate">\${track.artist}</div>
            <div class="text-[10px] text-slate-500 font-mono pt-1">\${formatTime(track.duration)} • \${track.sourceType}</div>
          </div>
          <button onclick='playTrack(\${trackEsc})' class="p-2 rounded-lg bg-slate-800/80 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 transition">
            <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </button>
        </div>
      \`;
    }

    async function playTrack(track) {
      document.getElementById('playerTitle').textContent = track.title;
      document.getElementById('playerArtist').textContent = track.artist;
      document.getElementById('playerCover').src = track.coverUrl || '/favicon.svg';
      document.getElementById('streamStatus').textContent = 'Status: Resolving stream via Precision Resolver...';

      const startTime = performance.now();

      try {
        const res = await fetch('/api/v1/stream/resolve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            trackId: track.id,
            title: track.title,
            artist: track.artist,
            duration: track.duration,
            rawUrl: track.rawUrl
          })
        });

        const data = await res.json();
        const latency = Math.round(performance.now() - startTime);

        if (!data.streamUrl) throw new Error('Stream URL not found');

        document.getElementById('streamProvider').textContent = 'Provider: ' + (data.resolvedProvider || 'ytdlp').toUpperCase();
        document.getElementById('streamLatency').textContent = 'Latency: ' + latency + 'ms';
        document.getElementById('streamStatus').textContent = 'Status: Streaming HTTP 206 M4A Chunks...';

        audioEl.src = data.streamUrl;
        audioEl.play();

        // Fetch Synced Lyrics
        fetchLyrics(track.title, track.artist);
      } catch (err) {
        document.getElementById('streamStatus').textContent = 'Status: Error - ' + err.message;
      }
    }

    async function fetchLyrics(title, artist) {
      const lyricsView = document.getElementById('lyricsView');
      lyricsView.innerHTML = '<p class="text-slate-400">Loading LRCLIB lyrics for ' + title + '...</p>';
      try {
        const res = await fetch('/api/v1/lyrics?title=' + encodeURIComponent(title) + '&artist=' + encodeURIComponent(artist));
        const data = await res.json();
        if (data.syncedLyrics && data.syncedLyrics.length > 0) {
          lyricsView.innerHTML = data.syncedLyrics.map(line => \`
            <div class="py-1 px-2 rounded hover:bg-white/5 flex gap-3">
              <span class="text-cyan-400 font-mono w-12 text-right">[\${formatTime(line.timestampMs / 1000)}]</span>
              <span class="text-slate-200 font-medium">\${line.text}</span>
            </div>
          \`).join('');
        } else if (data.plainLyrics) {
          lyricsView.innerHTML = '<pre class="whitespace-pre-wrap text-slate-300">' + data.plainLyrics + '</pre>';
        } else {
          lyricsView.innerHTML = '<p class="text-slate-500 italic">No synchronized lyrics found for this track.</p>';
        }
      } catch {
        lyricsView.innerHTML = '<p class="text-slate-500 italic">Lyrics lookup unavailable.</p>';
      }
    }

    function toggleTab(tab) {
      if (tab === 'lyrics') {
        document.getElementById('lyricsView').classList.remove('hidden');
        document.getElementById('jsonView').classList.add('hidden');
        document.getElementById('tabBtnLyrics').className = 'px-3 py-1 rounded-lg text-xs font-semibold bg-cyan-500/20 text-cyan-300';
        document.getElementById('tabBtnJson').className = 'px-3 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-400';
      } else {
        document.getElementById('lyricsView').classList.add('hidden');
        document.getElementById('jsonView').classList.remove('hidden');
        document.getElementById('tabBtnJson').className = 'px-3 py-1 rounded-lg text-xs font-semibold bg-cyan-500/20 text-cyan-300';
        document.getElementById('tabBtnLyrics').className = 'px-3 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-400';
      }
    }

    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') performSearch(); });

    // Auto-search on load
    performSearch();
  </script>
</body>
</html>`;
  };

  fastify.get('/test', handler);
  fastify.get('/console', handler);
}
