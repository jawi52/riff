/**
 * RIFF MASTER AUDIO ENGINE - INTERACTIVE CLI TEST TOOL
 * Run with: npx tsx scripts/test_engine_cli.ts
 */

import readline from 'readline';
import { searchMasterCatalog, resolveMasterStream, fetchSyncedLyrics } from '../src/lib/masterAudioEngine';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.clear();
console.log('\x1b[36m%s\x1b[0m', '=======================================================');
console.log('\x1b[1m\x1b[35m%s\x1b[0m', '       🎵 RIFF MASTER AUDIO ENGINE - CLI LAB 🎵        ');
console.log('\x1b[36m%s\x1b[0m', '=======================================================');
console.log('Type any song name (e.g., "12 Saal", "Money Lisa", "Amplifier")');
console.log('Type "exit" to quit.\n');

async function promptUser() {
  rl.question('\x1b[33mEnter Song Name > \x1b[0m', async (query) => {
    const trimmed = query.trim();
    if (!trimmed) {
      promptUser();
      return;
    }

    if (trimmed.toLowerCase() === 'exit') {
      console.log('\n👋 Exiting CLI Lab. Goodbye!\n');
      rl.close();
      process.exit(0);
    }

    console.log(`\n⏳ Searching for: "\x1b[1m${trimmed}\x1b[0m"...`);
    const start = performance.now();

    try {
      const result = await searchMasterCatalog(trimmed);
      const latency = Math.round(performance.now() - start);

      if (!result.topResult && result.tracks.length === 0) {
        console.log('\x1b[31m%s\x1b[0m', '❌ No verified tracks found.\n');
        promptUser();
        return;
      }

      const top = result.topResult || result.tracks[0];
      console.log('\n\x1b[32m%s\x1b[0m', '----------------- 👑 TOP VERIFIED RESULT -----------------');
      console.log(`🎵 Title:    \x1b[1m${top.title}\x1b[0m`);
      console.log(`🎤 Artist:   \x1b[36m${top.artist}\x1b[0m`);
      console.log(`💿 Album:    ${top.album || 'Official Studio Master'}`);
      console.log(`⏱️ Duration: ${Math.floor(top.duration / 60)}:${(top.duration % 60).toString().padStart(2, '0')}`);
      console.log(`🎧 Bitrate:  \x1b[35m${top.bitrateKbps || 320} kbps (CD Quality)\x1b[0m`);
      console.log(`⚡ Speed:    \x1b[33m${latency} ms\x1b[0m`);
      console.log(`🖼️ Artwork:  ${top.coverUrl}`);

      // Resolve direct stream URL
      const streamUrl = await resolveMasterStream(top);
      console.log(`🔗 Stream:   \x1b[34m${streamUrl.substring(0, 75)}...\x1b[0m`);

      // Fetch sample lyrics
      const lyrics = await fetchSyncedLyrics(top.artist, top.title);
      if (lyrics.length > 0) {
        console.log('\n📜 \x1b[1mSynced Karaoke Lyrics (First 3 lines):\x1b[0m');
        lyrics.slice(0, 3).forEach((line) => {
          const sec = (line.timeMs / 1000).toFixed(1);
          console.log(`   [${sec}s] ${line.text}`);
        });
      } else {
        console.log('\n📜 Synced Lyrics: Instrumental / Ingesting');
      }

      // Show other verified versions if available (Disambiguation)
      if (result.tracks.length > 1) {
        console.log('\n\x1b[36m%s\x1b[0m', '📋 Other Verified Matches:');
        result.tracks.slice(1, 5).forEach((t, i) => {
          console.log(`   ${i + 2}. ${t.title} - \x1b[36m${t.artist}\x1b[0m (${t.album || 'Single'})`);
        });
      }

      console.log('\x1b[32m%s\x1b[0m', '----------------------------------------------------------\n');
    } catch (err: any) {
      console.log('\x1b[31m%s\x1b[0m', `❌ Error: ${err.message}\n`);
    }

    promptUser();
  });
}

promptUser();
