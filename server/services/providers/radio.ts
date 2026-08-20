import axios from 'axios';

const RADIO_SERVERS = [
  'https://de1.api.radio-browser.info/json/stations',
  'https://nl1.api.radio-browser.info/json/stations',
  'https://at1.api.radio-browser.info/json/stations'
];

export async function searchRadioStations(query: string) {
  for (const host of RADIO_SERVERS) {
    try {
      const res = await axios.get(`${host}/byname/${encodeURIComponent(query)}`, {
        params: { limit: 15, hidebroken: true, order: 'votes', reverse: true },
        timeout: 3000
      });

      if (Array.isArray(res.data) && res.data.length > 0) {
        return res.data.map((station: any) => ({
          id: `radio_${station.stationuuid}`,
          name: station.name,
          url: station.url_resolved || station.url,
          favicon: station.favicon || 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=300&q=80',
          country: station.country || 'Global',
          language: station.language || 'Multi',
          tags: station.tags ? station.tags.split(',').slice(0, 3) : ['Live Radio'],
          bitrate: station.bitrate || 128,
          votes: station.votes || 0
        }));
      }
    } catch {}
  }
  return [];
}
