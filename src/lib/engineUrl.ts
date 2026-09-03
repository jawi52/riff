// Production Azure App Service backend endpoint for Riff
export const RIFF_ENGINE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_RIFF_ENGINE_URL) ||
  'https://riff-engine-b9e4b3g5hshba2g9.uaenorth-01.azurewebsites.net';
