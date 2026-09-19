import { Track } from '../types';
import { parseAudioFileMetadata, ParsedAudioMetadata } from './audioMetadataParser';

export interface IngestedTrackResult {
  track: Track;
  audioBlob: Blob;
}

export class AudioWorkerPool {
  private static instance: AudioWorkerPool;
  private worker: Worker | null = null;
  private pendingTasks: Map<string, {
    resolve: (val: ParsedAudioMetadata) => void;
    reject: (err: any) => void;
  }> = new Map();
  private isWorkerSupported: boolean;

  private constructor() {
    this.isWorkerSupported = typeof window !== 'undefined' && typeof Worker !== 'undefined';
  }

  public static getInstance(): AudioWorkerPool {
    if (!AudioWorkerPool.instance) {
      AudioWorkerPool.instance = new AudioWorkerPool();
    }
    return AudioWorkerPool.instance;
  }

  private initWorker(): Worker | null {
    if (!this.isWorkerSupported) return null;
    if (this.worker) return this.worker;

    try {
      this.worker = new Worker(new URL('../workers/audioIngest.worker.ts', import.meta.url), {
        type: 'module'
      });

      this.worker.onmessage = (e: MessageEvent) => {
        const { taskId, success, metadata, error } = e.data;
        const handler = this.pendingTasks.get(taskId);
        if (handler) {
          this.pendingTasks.delete(taskId);
          if (success && metadata) {
            handler.resolve(metadata);
          } else {
            handler.reject(new Error(error || 'Worker ingestion failure'));
          }
        }
      };

      this.worker.onerror = (err) => {
        console.warn('[AudioWorkerPool] Worker error, falling back to main-thread parser:', err);
        // Reject all pending and terminate worker
        for (const handler of this.pendingTasks.values()) {
          handler.reject(err);
        }
        this.pendingTasks.clear();
        this.terminate();
        this.isWorkerSupported = false;
      };

      return this.worker;
    } catch (e) {
      console.warn('[AudioWorkerPool] Failed to spawn worker, fallback to main thread:', e);
      this.isWorkerSupported = false;
      return null;
    }
  }

  /**
   * Ingests a single audio file off the main thread.
   */
  public async ingestFile(file: File): Promise<IngestedTrackResult> {
    const buffer = await file.arrayBuffer();
    const audioBlob = new Blob([buffer], { type: file.type || 'audio/mpeg' });

    let metadata: ParsedAudioMetadata;
    const worker = this.initWorker();

    if (worker && this.isWorkerSupported) {
      metadata = await new Promise<ParsedAudioMetadata>((resolve, reject) => {
        const taskId = `task_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        this.pendingTasks.set(taskId, { resolve, reject });

        // Zero-copy transfer of slice buffer
        const transferBuffer = buffer.slice(0);
        worker.postMessage(
          {
            taskId,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            buffer: transferBuffer
          },
          [transferBuffer]
        );
      });
    } else {
      // Main-thread fallback (Node or environments without Workers)
      metadata = await parseAudioFileMetadata(
        { name: file.name, size: file.size, type: file.type },
        buffer
      );
    }

    const track: Track = {
      id: metadata.id,
      title: metadata.title,
      artist: metadata.artist,
      album: metadata.album,
      duration: metadata.duration,
      coverUrl: metadata.coverUrl,
      sourceType: 'local',
      genre: metadata.genre,
      releaseYear: metadata.year,
      isOfflineCached: true
    };

    return { track, audioBlob };
  }

  /**
   * Concurrently processes a batch of files with concurrency throttle and progress tracking.
   */
  public async ingestBatch(
    files: File[],
    concurrency = 4,
    onProgress?: (completed: number, total: number) => void
  ): Promise<IngestedTrackResult[]> {
    const total = files.length;
    let completed = 0;
    const results: IngestedTrackResult[] = [];

    // Chunk array by concurrency
    for (let i = 0; i < total; i += concurrency) {
      const slice = files.slice(i, i + concurrency);
      const batchPromises = slice.map(async (file) => {
        try {
          const res = await this.ingestFile(file);
          completed++;
          if (onProgress) onProgress(completed, total);
          return res;
        } catch (err) {
          console.warn(`[AudioWorkerPool] Failed to ingest file ${file.name}:`, err);
          completed++;
          if (onProgress) onProgress(completed, total);
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      for (const res of batchResults) {
        if (res) results.push(res);
      }
    }

    return results;
  }

  public terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.pendingTasks.clear();
  }
}

export const audioWorkerPool = AudioWorkerPool.getInstance();
