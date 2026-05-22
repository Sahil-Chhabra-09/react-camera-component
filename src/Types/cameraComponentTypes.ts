export interface StreamInfo {
  width: number;
  height: number;
}

export interface CapturedMedia {
  type: "image" | "video";
  url: string;
  timestamp: number;
  blob: Blob;
}

export interface CameraComponentHandles {
  startStream: (facing?: "user" | "environment") => Promise<void>;
  stopStream: () => void;
  captureImage: () => void;
  startRecording: () => void;
  stopRecording: () => void;
  toggleRecording: () => void;
  switchCamera: () => void;
  isStreaming: boolean;
  isRecording: boolean;
  videoElement?: HTMLVideoElement | null;
}

export interface CameraComponentProps {
  autoPlayOnStart?: boolean;
  facingMode?: "user" | "environment";
  maxVideoDuration?: number;
  imageFormat?: "image/png" | "image/jpeg" | "image/webp";
  imageQuality?: number;
  displayStream?: boolean;
  captureAudio?: boolean;
  containerClassName?: string;
  frameRate?: number;
  width?: number;
  height?: number;
  onStreamStart?: (info: StreamInfo) => void;
  onCapture?: (media: CapturedMedia) => void;
  onError?: (error: Error) => void;
}
