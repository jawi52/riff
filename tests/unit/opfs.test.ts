import { describe, it, expect, beforeEach } from 'vitest';
import {
  isOPFSSupported,
  requestPersistentStorage,
  getStorageQuota,
  saveAudioToOPFS,
  getAudioBlobFromOPFS,
  getAudioUrlFromOPFS,
  listOPFSFiles,
  deleteAudioFromOPFS,
  clearOPFSVault
} from '../../src/lib/opfs';

describe('Sandboxed Origin Private File System (OPFS) Audio Vault', () => {
  beforeEach(async () => {
    await clearOPFSVault();
  });

  describe('Storage Feature Detection & Quota Negotiation', () => {
    it('detects OPFS support safely without throwing', async () => {
      const supported = await isOPFSSupported();
      expect(typeof supported).toBe('boolean');
    });

    it('negotiates durable persistent storage without crashing', async () => {
      const persisted = await requestPersistentStorage();
      expect(typeof persisted).toBe('boolean');
    });

    it('estimates available storage quota and disk usage percentage', async () => {
      const quotaInfo = await getStorageQuota();
      expect(quotaInfo).toBeDefined();
      expect(typeof quotaInfo.quota).toBe('number');
      expect(typeof quotaInfo.usage).toBe('number');
      expect(typeof quotaInfo.percentage).toBe('number');
      expect(typeof quotaInfo.isPersisted).toBe('boolean');
      expect(quotaInfo.quota).toBeGreaterThan(0);
      expect(quotaInfo.percentage).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Audio File Vault Ingestion & Streaming Retrieval', () => {
    it('saves audio blob and invokes progress callback', async () => {
      let progressReported = -1;
      const audioData = new Blob(['mock audio byte stream 1234567890'], { type: 'audio/mp3' });

      const uri = await saveAudioToOPFS('test_track_1', audioData, (pct) => {
        progressReported = pct;
      });

      expect(uri).toBe('opfs://test_track_1');
      expect(progressReported).toBe(100);
    });

    it('accepts ArrayBuffer binary data for low-level audio writers', async () => {
      const buffer = new Uint8Array([0x49, 0x44, 0x33, 0x03, 0x00, 0x00]).buffer; // "ID3" header
      const uri = await saveAudioToOPFS('test_track_buffer', buffer);

      expect(uri).toBe('opfs://test_track_buffer');
      const retrieved = await getAudioBlobFromOPFS('test_track_buffer');
      expect(retrieved).not.toBeNull();
      expect(retrieved?.size).toBe(6);
    });

    it('retrieves saved audio blob and returns null for non-existent assets', async () => {
      const sampleBlob = new Blob(['sample high fidelity audio stream'], { type: 'audio/mpeg' });
      await saveAudioToOPFS('track_exist', sampleBlob);

      const found = await getAudioBlobFromOPFS('track_exist');
      expect(found).not.toBeNull();
      expect(found?.size).toBe(sampleBlob.size);

      const notFound = await getAudioBlobFromOPFS('track_missing_999');
      expect(notFound).toBeNull();
    });

    it('generates direct streaming URL or handles environment gracefully', async () => {
      const sampleBlob = new Blob(['audio stream bytes'], { type: 'audio/mpeg' });
      await saveAudioToOPFS('track_url_test', sampleBlob);

      const url = await getAudioUrlFromOPFS('track_url_test');
      // In browser/jsdom with createObjectURL, it produces a blob: URL
      if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
        expect(typeof url).toBe('string');
      }

      const missingUrl = await getAudioUrlFromOPFS('track_url_missing');
      expect(missingUrl).toBeNull();
    });

    it('rejects invalid or empty file IDs', async () => {
      const data = new Blob(['data'], { type: 'audio/mp3' });
      await expect(saveAudioToOPFS('', data)).rejects.toThrow();
    });
  });

  describe('Directory Enumeration, Deletion & Vault Purging', () => {
    it('lists all stored file IDs in the audio vault', async () => {
      await saveAudioToOPFS('track_alpha', new Blob(['alpha']));
      await saveAudioToOPFS('track_beta', new Blob(['beta']));
      await saveAudioToOPFS('track_gamma', new Blob(['gamma']));

      const files = await listOPFSFiles();
      expect(files).toContain('track_alpha');
      expect(files).toContain('track_beta');
      expect(files).toContain('track_gamma');
      expect(files.length).toBeGreaterThanOrEqual(3);
    });

    it('deletes specific audio files cleanly', async () => {
      await saveAudioToOPFS('track_to_delete', new Blob(['delete me']));
      expect(await getAudioBlobFromOPFS('track_to_delete')).not.toBeNull();

      const deleted = await deleteAudioFromOPFS('track_to_delete');
      expect(deleted).toBe(true);
      expect(await getAudioBlobFromOPFS('track_to_delete')).toBeNull();

      // Deleting already-deleted file returns false
      const nonExistent = await deleteAudioFromOPFS('track_never_existed');
      expect(nonExistent).toBe(false);
    });

    it('clears all assets in the vault on purge', async () => {
      await saveAudioToOPFS('purge_1', new Blob(['1']));
      await saveAudioToOPFS('purge_2', new Blob(['2']));

      const clearedCount = await clearOPFSVault();
      expect(clearedCount).toBeGreaterThanOrEqual(2);

      const files = await listOPFSFiles();
      expect(files).toHaveLength(0);
    });
  });
});
