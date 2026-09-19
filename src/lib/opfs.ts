/**
 * Origin Private File System (OPFS) Manager for ultra-fast local audio file storage
 * Bypasses IndexedDB memory limitations by writing and reading directly from sandboxed disk.
 */

const OPFS_DIR = 'riff_audio_vault';

// In-memory fallback vault for environments without native OPFS (e.g. Node.js, Vitest, insecure origins)
const fallbackMemoryVault = new Map<string, Blob>();

export interface StorageQuotaInfo {
  quota: number;
  usage: number;
  percentage: number;
  isPersisted: boolean;
}

export async function isOPFSSupported(): Promise<boolean> {
  return (
    typeof navigator !== 'undefined' &&
    'storage' in navigator &&
    typeof navigator.storage.getDirectory === 'function'
  );
}

/**
 * Requests persistent storage from the browser to prevent eviction under disk pressure.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (
    typeof navigator !== 'undefined' &&
    'storage' in navigator &&
    typeof navigator.storage.persist === 'function'
  ) {
    try {
      return await navigator.storage.persist();
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Returns current disk quota and usage statistics.
 */
export async function getStorageQuota(): Promise<StorageQuotaInfo> {
  let isPersisted = false;
  if (
    typeof navigator !== 'undefined' &&
    'storage' in navigator &&
    typeof navigator.storage.persisted === 'function'
  ) {
    try {
      isPersisted = await navigator.storage.persisted();
    } catch {}
  }

  if (
    typeof navigator !== 'undefined' &&
    'storage' in navigator &&
    typeof navigator.storage.estimate === 'function'
  ) {
    try {
      const est = await navigator.storage.estimate();
      const quota = est.quota || 0;
      const usage = est.usage || 0;
      const percentage = quota > 0 ? (usage / quota) * 100 : 0;
      return { quota, usage, percentage, isPersisted };
    } catch {}
  }

  // Fallback estimation based on memory vault
  let memUsage = 0;
  for (const blob of fallbackMemoryVault.values()) {
    memUsage += blob.size;
  }
  return {
    quota: 1024 * 1024 * 1024 * 10, // 10 GB nominal
    usage: memUsage,
    percentage: (memUsage / (1024 * 1024 * 1024 * 10)) * 100,
    isPersisted
  };
}

/**
 * Saves an audio file directly into the sandboxed OPFS vault.
 */
export async function saveAudioToOPFS(
  fileId: string,
  data: Blob | ArrayBuffer,
  onProgress?: (percent: number) => void
): Promise<string> {
  if (!fileId) throw new Error('Invalid file ID for OPFS write');

  const blob = data instanceof Blob ? data : new Blob([data], { type: 'audio/mpeg' });

  if (await isOPFSSupported()) {
    try {
      const root = await navigator.storage.getDirectory();
      const audioDir = await root.getDirectoryHandle(OPFS_DIR, { create: true });
      const fileHandle = await audioDir.getFileHandle(`${fileId}.bin`, { create: true });

      const writable = await fileHandle.createWritable();

      if (typeof writable.write === 'function') {
        await writable.write(blob);
        onProgress?.(100);
      }
      await writable.close();
      return `opfs://${fileId}`;
    } catch (err) {
      console.warn('Native OPFS write failed, falling back to memory vault:', err);
    }
  }

  // Fallback to in-memory storage
  fallbackMemoryVault.set(fileId, blob);
  onProgress?.(100);
  return `opfs://${fileId}`;
}

/**
 * Retrieves the raw Blob for a stored audio asset from OPFS.
 */
export async function getAudioBlobFromOPFS(fileId: string): Promise<Blob | null> {
  if (!fileId) return null;

  if (await isOPFSSupported()) {
    try {
      const root = await navigator.storage.getDirectory();
      const audioDir = await root.getDirectoryHandle(OPFS_DIR, { create: false });
      const fileHandle = await audioDir.getFileHandle(`${fileId}.bin`, { create: false });
      return await fileHandle.getFile();
    } catch {
      // Fall through to fallback check
    }
  }

  return fallbackMemoryVault.get(fileId) || null;
}

// Backwards-compatibility alias
export const getAudioFromOPFS = getAudioBlobFromOPFS;

/**
 * Instantiates an immediate streaming URL (blob: Object URL) for an OPFS asset.
 */
export async function getAudioUrlFromOPFS(fileId: string): Promise<string | null> {
  const blob = await getAudioBlobFromOPFS(fileId);
  if (!blob) return null;

  if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
    return URL.createObjectURL(blob);
  }
  return null;
}

/**
 * Enumerates all stored audio file IDs in the OPFS vault.
 */
export async function listOPFSFiles(): Promise<string[]> {
  if (await isOPFSSupported()) {
    try {
      const root = await navigator.storage.getDirectory();
      const audioDir = await root.getDirectoryHandle(OPFS_DIR, { create: false });
      const fileIds: string[] = [];

      const iterator = (audioDir as any).keys?.() || (audioDir as any).values?.();
      if (iterator && Symbol.asyncIterator in iterator) {
        for await (const entry of iterator) {
          const name = typeof entry === 'string' ? entry : entry.name;
          if (name && name.endsWith('.bin')) {
            fileIds.push(name.replace(/\.bin$/, ''));
          }
        }
        return fileIds;
      }
    } catch {
      // Fall through to fallback check
    }
  }

  return Array.from(fallbackMemoryVault.keys());
}

/**
 * Deletes an audio asset from the OPFS vault.
 */
export async function deleteAudioFromOPFS(fileId: string): Promise<boolean> {
  if (!fileId) return false;

  let deleted = false;
  if (await isOPFSSupported()) {
    try {
      const root = await navigator.storage.getDirectory();
      const audioDir = await root.getDirectoryHandle(OPFS_DIR, { create: false });
      await audioDir.removeEntry(`${fileId}.bin`);
      deleted = true;
    } catch {}
  }

  if (fallbackMemoryVault.has(fileId)) {
    fallbackMemoryVault.delete(fileId);
    deleted = true;
  }

  return deleted;
}

/**
 * Clears all assets in the OPFS vault.
 */
export async function clearOPFSVault(): Promise<number> {
  let count = 0;
  const files = await listOPFSFiles();

  for (const id of files) {
    if (await deleteAudioFromOPFS(id)) {
      count++;
    }
  }

  fallbackMemoryVault.clear();
  return count;
}
