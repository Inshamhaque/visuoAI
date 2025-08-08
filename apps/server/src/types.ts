export type MediaType = "video" | "audio" | "image" | "unknown";
export interface MediaFile {
  id: string;
  fileName: string;
  fileId: string;
  type: MediaType;
  startTime: number; // within the source video
  src?: string;
  endTime: number;
  positionStart: number; // position in the final video
  positionEnd: number;
  includeInMerge: boolean;
  playbackSpeed: number;
  volume: number;
  zIndex: number;

  // Optional visual settings
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  opacity?: number;

  // Effects
  crop?: { x: number; y: number; width: number; height: number };
}