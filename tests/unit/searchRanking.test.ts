import { describe, it, expect } from 'vitest';
import { soundex, scoreTrackRelevance, scoreArtistRelevance, rankSearchResults } from '../../src/lib/searchRanking';
import { Track } from '../../src/types';
import { ApiArtist } from '../../src/lib/api';

describe('Russell Soundex Phonetic Hashing Algorithm', () => {
  it('generates identical phonetic codes for common music artist transliterations', () => {
    // "Arijit" vs "Arjit"
    expect(soundex('Arijit')).toBe('A623');
    expect(soundex('Arjit')).toBe('A623');
    expect(soundex('Arijit')).toBe(soundex('Arjit'));

    // "Atif" vs "Aatif"
    expect(soundex('Atif')).toBe('A310');
    expect(soundex('Aatif')).toBe('A310');
    expect(soundex('Atif')).toBe(soundex('Aatif'));

    // "Weeknd" vs "Weekend"
    expect(soundex('Weeknd')).toBe('W253');
    expect(soundex('Weekend')).toBe('W253');
    expect(soundex('Weeknd')).toBe(soundex('Weekend'));

    // "Rahat" vs "Rohat"
    expect(soundex('Rahat')).toBe('R300');
    expect(soundex('Rohat')).toBe('R300');

    // "Shreya" vs "Shriya"
    expect(soundex('Shreya')).toBe('S600');
    expect(soundex('Shriya')).toBe('S600');
  });

  it('pads short words with zeros to maintain 4-character fixed length', () => {
    expect(soundex('Li')).toBe('L000');
    expect(soundex('Jo')).toBe('J000');
    expect(soundex('Beyonce')).toHaveLength(4);
  });

  it('handles empty strings, whitespace, and non-alphabetic characters safely', () => {
    expect(soundex('')).toBe('');
    expect(soundex('   ')).toBe('');
    expect(soundex('12345')).toBe('');
    expect(soundex('AC/DC')).toBe(soundex('ACDC'));
  });
});

describe('Multi-Tier Relevance Scoring System', () => {
  const sampleTrack: Track = {
    id: 'trk_bl',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    duration: 200,
    coverUrl: 'https://img.com/bl.jpg',
    sourceType: 'saavn',
    genre: 'Pop'
  };

  it('strictly orders scores: Exact > Prefix > Token Substring > Fuzzy > Unrelated', () => {
    const exactScore = scoreTrackRelevance(sampleTrack, 'Blinding Lights');
    const prefixScore = scoreTrackRelevance(sampleTrack, 'Blind');
    const tokenScore = scoreTrackRelevance(sampleTrack, 'Lights');
    const fuzzyScore = scoreTrackRelevance(sampleTrack, 'Blnding Lghts');
    const unrelatedScore = scoreTrackRelevance(sampleTrack, 'Despacito');

    expect(exactScore).toBeGreaterThan(prefixScore);
    expect(prefixScore).toBeGreaterThan(tokenScore);
    expect(tokenScore).toBeGreaterThan(fuzzyScore);
    expect(fuzzyScore).toBeGreaterThan(unrelatedScore);
    expect(unrelatedScore).toBe(0);
  });

  it('boosts phonetic transliterations via Soundex', () => {
    const trackAtif: Track = {
      id: 'trk_atif',
      title: 'Aadat',
      artist: 'Atif Aslam',
      duration: 260,
      coverUrl: 'https://img.com/atif.jpg',
      sourceType: 'saavn'
    };

    // User types "Aatif" (transliteration variant of "Atif")
    const phoneticScore = scoreTrackRelevance(trackAtif, 'Aatif');
    const unrelatedScore = scoreTrackRelevance(trackAtif, 'Sonu');

    expect(phoneticScore).toBeGreaterThan(20);
    expect(phoneticScore).toBeGreaterThan(unrelatedScore);
  });

  it('boosts user top affinity artist and genre', () => {
    const neutralScore = scoreTrackRelevance(sampleTrack, 'Lights');
    const affinityScore = scoreTrackRelevance(sampleTrack, 'Lights', 'The Weeknd', 'Pop');

    expect(affinityScore).toBeGreaterThan(neutralScore);
  });

  it('evaluates artist relevance scores with exact, prefix, and phonetic matching', () => {
    const artist: ApiArtist = { id: 'art_1', name: 'Arijit Singh', picture: '' };
    const exact = scoreArtistRelevance(artist, 'Arijit Singh');
    const prefix = scoreArtistRelevance(artist, 'Arijit');
    const phonetic = scoreArtistRelevance(artist, 'Arjit');
    const unrelated = scoreArtistRelevance(artist, 'Metallica');

    expect(exact).toBeGreaterThan(prefix);
    expect(prefix).toBeGreaterThan(unrelated);
    expect(phonetic).toBeGreaterThan(unrelated);
    expect(unrelated).toBe(0);
  });
});

describe('Search Results Ranking & Top Result Disambiguation', () => {
  const tracks: Track[] = [
    {
      id: 'trk_1',
      title: 'Starboy',
      artist: 'The Weeknd',
      duration: 230,
      coverUrl: 'https://img.com/starboy.jpg',
      sourceType: 'saavn'
    },
    {
      id: 'trk_2',
      title: 'Blinding Lights',
      artist: 'The Weeknd',
      duration: 200,
      coverUrl: 'https://img.com/bl.jpg',
      sourceType: 'saavn'
    },
    {
      id: 'trk_3',
      title: 'Save Your Tears',
      artist: 'The Weeknd',
      duration: 215,
      coverUrl: 'https://img.com/syt.jpg',
      sourceType: 'saavn'
    },
    {
      id: 'trk_4',
      title: 'Lights Down Low',
      artist: 'MAX',
      duration: 210,
      coverUrl: 'https://img.com/max.jpg',
      sourceType: 'audius'
    }
  ];

  const artists: ApiArtist[] = [
    {
      id: 'art_weeknd',
      name: 'The Weeknd',
      picture: 'https://img.com/weeknd.jpg'
    },
    {
      id: 'art_arijit',
      name: 'Arijit Singh',
      picture: 'https://img.com/arijit.jpg'
    }
  ];

  it('ranks exact song query to top track and identifies track as top result', () => {
    const res = rankSearchResults('Blinding Lights', tracks, artists);

    expect(res.rankedTracks[0].id).toBe('trk_2');
    expect(res.topResult?.type).toBe('track');
    if (res.topResult?.type === 'track') {
      expect(res.topResult.track.title).toBe('Blinding Lights');
    }
  });

  it('ranks exact artist query and selects artist as top result hero card', () => {
    const res = rankSearchResults('The Weeknd', tracks, artists);

    expect(res.topResult?.type).toBe('artist');
    if (res.topResult?.type === 'artist') {
      expect(res.topResult.artist.name).toBe('The Weeknd');
    }
  });

  it('ranks phonetic transliteration query correctly (e.g. "Arjit" -> "Arijit Singh")', () => {
    const res = rankSearchResults('Arjit', tracks, artists);

    expect(res.topResult?.type).toBe('artist');
    if (res.topResult?.type === 'artist') {
      expect(res.topResult.artist.name).toBe('Arijit Singh');
    }
  });

  it('gracefully handles empty queries and returns original structures', () => {
    const res = rankSearchResults('', tracks, artists);
    expect(res.rankedTracks).toEqual(tracks);
    expect(res.rankedArtists).toEqual(artists);
    expect(res.topResult).toBeNull();
  });
});
