/**
 * Origin Private File System (OPFS) Manager for ultra-fast local audio file storage
 * Bypasses IndexedDB memory limitations by writing and reading directly from sandboxed disk.
 */

const OPFS_DIR = 'riff_audio_vault';

export async function isOPFSSupported(): Promise<boolean> {
  return typeof navigator !== 'undefined' && 'storage' in navigator && 'getDirectory' in navigator.storage;
}

export async function saveAudioToOPFS(fileId: string, data: Blob | ArrayBuffer): Promise<string> {
  if (!await isOPFSSupported()) {
    throw new Error('OPFS is not supported in this browser');
  }

  const root = await navigator.storage.getDirectory();
  const audioDir = await root.getDirectoryHandle(OPFS_DIR, { create: true });
  const fileHandle = await audioDir.getFileHandle(`${fileId}.bin`, { create: true });
  
  const writable = await fileHandle.createWritable();
  await writable.write(data);
  await writable.close();

  return `opfs://${fileId}`;
}

export async function getAudioFromOPFS(fileId: string): Promise<Blob | null> {
  if (!await isOPFSSupported()) return null;

  try {
    const root = await navigator.storage.getDirectory();
    const audioDir = await root.getDirectoryHandle(OPFS_DIR, { create: false });
    const fileHandle = await audioDir.getFileHandle(`${fileId}.bin`, { create: false });
    return await fileHandle.getFile();
  } catch {
    return null;
  }
}

export async function deleteAudioFromOPFS(fileId: string): Promise<boolean> {
  if (!await isOPFSSupported()) return false;

  try {
    const root = await navigator.storage.getDirectory();
    const audioDir = await root.getDirectoryHandle(OPFS_DIR, { create: false });
    await audioDir.removeEntry(`${fileId}.bin`);
    return true;
  } catch {
    return false;
  }
}
