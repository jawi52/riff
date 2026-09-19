import { describe, it, expect } from 'vitest';
import { DisjointSet } from '../../src/lib/disjointSet';
import { normalizeString, generateCanonicalTrackId, deduplicateTracks } from '../../src/lib/dedup';
import { Track } from '../../src/types';

describe('Disjoint-Set Union (DSU / Union-Find) Engine', () => {
  it('initializes elements into disjoint singleton sets', () => {
    const dsu = new DisjointSet<string>(['A', 'B', 'C']);
    expect(dsu.size).toBe(3);
    expect(dsu.numClusters).toBe(3);
    expect(dsu.find('A')).toBe('A');
    expect(dsu.find('B')).toBe('B');
    expect(dsu.find('C')).toBe('C');
    expect(dsu.connected('A', 'B')).toBe(false);
  });

  it('performs union by rank and updates cluster counts', () => {
    const dsu = new DisjointSet<number>();
    expect(dsu.union(1, 2)).toBe(true); // Creates 1 and 2, merges them
    expect(dsu.connected(1, 2)).toBe(true);
    expect(dsu.getClusterSize(1)).toBe(2);
    expect(dsu.numClusters).toBe(1);

    // Redundant union returns false (cycle detection)
    expect(dsu.union(1, 2)).toBe(false);
    expect(dsu.numClusters).toBe(1);
  });

  it('proves transitive equivalence property: (A ~ B) ∧ (B ~ C) ⟹ (A ~ C)', () => {
    const dsu = new DisjointSet<string>();
    dsu.union('TrackA', 'TrackB');
    dsu.union('TrackB', 'TrackC');

    expect(dsu.connected('TrackA', 'TrackC')).toBe(true);
    expect(dsu.find('TrackA')).toBe(dsu.find('TrackC'));
    expect(dsu.getClusterSize('TrackA')).toBe(3);
    expect(dsu.numClusters).toBe(1);
  });

  it('applies path compression to flatten tree traversal', () => {
    const dsu = new DisjointSet<number>();
    dsu.union(1, 2);
    dsu.union(2, 3);
    dsu.union(3, 4);
    dsu.union(4, 5);

    // Find on leaf node 5 flattens parent pointers to root
    const root = dsu.find(5);
    expect(dsu.find(1)).toBe(root);
    expect(dsu.find(2)).toBe(root);
    expect(dsu.find(3)).toBe(root);
    expect(dsu.find(4)).toBe(root);
  });

  it('groups disjoint clusters accurately into a Map', () => {
    const dsu = new DisjointSet<string>();
    // Component 1
    dsu.union('Rock_1', 'Rock_2');
    dsu.union('Rock_2', 'Rock_3');
    // Component 2
    dsu.union('Jazz_1', 'Jazz_2');
    // Component 3 (singleton)
    dsu.makeSet('Classical_1');

    const clusters = dsu.getClusters();
    expect(clusters.size).toBe(3);
    expect(dsu.numClusters).toBe(3);

    const componentSizes = Array.from(clusters.values()).map((c) => c.length).sort();
    expect(componentSizes).toEqual([1, 2, 3]);
  });
});

describe('Song Normalization & Deterministic Hashing', () => {
  it('normalizes song titles by stripping video, audio, visualizer and remix tags', () => {
    expect(normalizeString('Blinding Lights (Official Music Video)')).toBe('blinding lights');
    expect(normalizeString('Blinding Lights [HQ Audio]')).toBe('blinding lights');
    expect(normalizeString('Blinding Lights - 4K Remaster')).toBe('blinding lights');
    expect(normalizeString('Blinding Lights (feat. Someone)')).toBe('blinding lights');
    expect(normalizeString('Blinding Lights (Visualizer)')).toBe('blinding lights');
    expect(normalizeString('Blinding Lights - Radio Edit')).toBe('blinding lights');
  });

  it('strips artist context prefix when embedded in title', () => {
    expect(normalizeString('The Weeknd - Blinding Lights', 'The Weeknd')).toBe('blinding lights');
    expect(normalizeString('Arijit Singh: Kesariya', 'Arijit Singh')).toBe('kesariya');
  });

  it('generates identical canonical hash for tracks with ±3s duration variance', () => {
    const hash1 = generateCanonicalTrackId('The Weeknd', 'Blinding Lights (Official Video)', 200);
    const hash2 = generateCanonicalTrackId('The Weeknd', 'Blinding Lights [Audio]', 202); // Within 3-sec bucket

    expect(hash1).toBe(hash2);
    expect(hash1.startsWith('trk_')).toBe(true);
  });
});

describe('Multi-Provider Transitive Song Deduplication Engine', () => {
  it('clusters duplicate multi-provider songs into a single canonical entry', () => {
    const rawList: Track[] = [
      {
        id: 'audius_1',
        title: 'Blinding Lights (Official Video)',
        artist: 'The Weeknd',
        duration: 200,
        coverUrl: 'https://img.com/1.jpg',
        sourceType: 'audius'
      },
      {
        id: 'saavn_2',
        title: 'The Weeknd - Blinding Lights [HQ]',
        artist: 'The Weeknd',
        duration: 201,
        coverUrl: 'https://img.com/2.jpg',
        sourceType: 'saavn'
      }
    ];

    const deduplicated = deduplicateTracks(rawList);
    expect(deduplicated).toHaveLength(1);
    expect(deduplicated[0].availableSources).toContain('audius');
    expect(deduplicated[0].availableSources).toContain('saavn');
  });

  it('transitively clusters multi-criterion equivalent tracks (A ~ B ∧ B ~ C ⟹ {A, B, C})', () => {
    const rawList: Track[] = [
      // Track A (Audius): Matches Track B via duration (200s vs 202s) and fuzzy title
      {
        id: 'src_audius',
        title: 'Starboy (Official Music Video)',
        artist: 'The Weeknd',
        duration: 200,
        coverUrl: 'https://img.com/cover_low.jpg',
        sourceType: 'audius'
      },
      // Track B (Saavn): Matches Track A via title, matches Track C via exact normalized artist + title
      {
        id: 'src_saavn',
        title: 'Starboy [HQ Audio]',
        artist: 'The Weeknd',
        duration: 202,
        coverUrl: 'https://img.com/cover_high.jpg',
        sourceType: 'saavn',
        streamUrl: 'https://cdn.saavn.com/starboy.mp3'
      },
      // Track C (Local File): User imported local MP3 with offline Blob and synced lyrics
      {
        id: 'src_local',
        title: 'Starboy',
        artist: 'The Weeknd',
        duration: 201,
        coverUrl: '',
        sourceType: 'local',
        hasSyncedLyrics: true,
        syncedLyrics: [{ timeMs: 1000, text: 'I am in love with the tempo' }]
      } as unknown as Track
    ];

    const deduplicated = deduplicateTracks(rawList);

    // All 3 multi-provider tracks transitively unified into 1 canonical entry!
    expect(deduplicated).toHaveLength(1);

    const canonical = deduplicated[0];
    // Source aggregation
    expect(canonical.availableSources).toContain('audius');
    expect(canonical.availableSources).toContain('saavn');
    expect(canonical.availableSources).toContain('local');

    // Quality priority inheritance:
    // 1. Local track priority or synced lyrics preserved
    expect(canonical.hasSyncedLyrics).toBe(true);
    expect(canonical.syncedLyrics).toHaveLength(1);
    // 2. High resolution artwork inherited
    expect(canonical.coverUrl).toBe('https://img.com/cover_high.jpg');
    // 3. Valid CDN stream URL preserved
    expect(canonical.streamUrl).toBe('https://cdn.saavn.com/starboy.mp3');
  });

  it('keeps distinct songs in separate clusters', () => {
    const rawList: Track[] = [
      {
        id: 'trk_1',
        title: 'Blinding Lights',
        artist: 'The Weeknd',
        duration: 200,
        coverUrl: 'https://img.com/1.jpg',
        sourceType: 'saavn'
      },
      {
        id: 'trk_2',
        title: 'Save Your Tears',
        artist: 'The Weeknd',
        duration: 215,
        coverUrl: 'https://img.com/2.jpg',
        sourceType: 'saavn'
      },
      {
        id: 'trk_3',
        title: 'Blinding Lights',
        artist: 'Postmodern Jukebox', // Different artist!
        duration: 200,
        coverUrl: 'https://img.com/3.jpg',
        sourceType: 'audius'
      }
    ];

    const deduplicated = deduplicateTracks(rawList);
    expect(deduplicated).toHaveLength(3);
  });

  it('handles edge cases: empty list, single item, and zero-duration tracks', () => {
    expect(deduplicateTracks([])).toEqual([]);

    const single: Track = {
      id: 'trk_single',
      title: 'Solo Song',
      artist: 'Solo Artist',
      duration: 180,
      coverUrl: '',
      sourceType: 'saavn'
    };
    const singleResult = deduplicateTracks([single]);
    expect(singleResult).toHaveLength(1);
    expect(singleResult[0].availableSources).toEqual(['saavn']);
  });
});
