import { parseAudioFileMetadata, ParsedAudioMetadata } from '../lib/audioMetadataParser';

export interface IngestWorkerRequest {
  taskId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  buffer: ArrayBuffer;
}

export interface IngestWorkerResponse {
  taskId: string;
  success: boolean;
  metadata?: ParsedAudioMetadata;
  error?: string;
}

self.onmessage = async (e: MessageEvent<IngestWorkerRequest>) => {
  const { taskId, fileName, fileSize, fileType, buffer } = e.data;

  try {
    const metadata = await parseAudioFileMetadata(
      { name: fileName, size: fileSize, type: fileType },
      buffer
    );

    const response: IngestWorkerResponse = {
      taskId,
      success: true,
      metadata
    };

    self.postMessage(response);
  } catch (err: any) {
    self.postMessage({
      taskId,
      success: false,
      error: err?.message || 'Failed to parse audio file in worker'
    });
  }
};
