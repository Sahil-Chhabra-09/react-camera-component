import { CameraComponentHandles, CapturedMedia } from "../..";
import { CameraComponentProps } from "../../Types/cameraComponentTypes";
import "./index.css";
import {
  useRef,
  useState,
  useEffect,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from "react";

export const CameraComponent = forwardRef<
  CameraComponentHandles,
  CameraComponentProps
>(
  (
    {
      autoPlayOnStart = true,
      facingMode = "user",
      maxVideoDuration = 60000,
      imageFormat = "image/png",
      imageQuality = 1,
      displayStream = true,
      captureAudio = false,
      containerClassName,
      frameRate = 30,
      width = 1280,
      height = 720,
      onCapture,
      onStreamStart,
      onError,
    },
    ref
  ) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    // Keep stream in both a ref (for synchronous access inside callbacks) and
    // state (so the video element visibility re-renders correctly).
    const streamRef = useRef<MediaStream | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    // Keep facingMode in a ref so switchCamera always reads the current value
    // without needing to be a useCallback dependency (which would cause stale
    // closures after multiple switches).
    const facingRef = useRef<"user" | "environment">(facingMode);
    const [currentFacingMode, setCurrentFacingMode] = useState(facingMode);
    // Guard against concurrent getUserMedia calls (rapid camera switches).
    const isStartingRef = useRef(false);

    const startStream = useCallback(
      async (facing: "user" | "environment" = facingRef.current) => {
        // Prevent concurrent getUserMedia calls from racing each other.
        if (isStartingRef.current) return;
        isStartingRef.current = true;

        try {
          // Always read the live stream from the ref, not a stale closure.
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
          }

          const mediaStream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: facing,
              frameRate,
              width: {
                ideal: width,
              },
              height: {
                ideal: height,
              },
            },
            audio: captureAudio,
          });

          streamRef.current = mediaStream;
          setStream(mediaStream);
          setIsStreaming(true);
          facingRef.current = facing;
          setCurrentFacingMode(facing);

          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
            await videoRef.current.play();

            const settings = mediaStream.getVideoTracks()[0].getSettings();
            const actualWidth = settings.width || videoRef.current.videoWidth;
            const actualHeight =
              settings.height || videoRef.current.videoHeight;
            onStreamStart?.({ width: actualWidth, height: actualHeight });
          }
        } catch (error) {
          const err =
            error instanceof Error
              ? error
              : new Error("Failed to access camera");
          console.error("Error accessing camera:", err);
          onError?.(err);
        } finally {
          isStartingRef.current = false;
        }
      },
      // Remove `stream` and `currentFacingMode` from deps — they are now read
      // from refs synchronously, so callbacks never go stale after switches.
      [onStreamStart, onError, frameRate, width, height, captureAudio]
    );

    const stopStream = useCallback(() => {
      // Read from ref so this always stops the actual current stream.
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setStream(null);
      }
      setIsStreaming(false);
      if (isRecording) stopRecording();
    }, [isRecording]);

    const captureImage = useCallback(() => {
      if (!videoRef.current || !canvasRef.current) return;

      if (imageFormat === "image/png" && imageQuality < 1) {
        console.warn(
          "[react-camera-component] imageQuality has no effect when imageFormat is \"image/png\". " +
          "PNG is a lossless format — the quality parameter is ignored by the browser. " +
          "Use \"image/jpeg\" or \"image/webp\" to control output size via imageQuality."
        );
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const media: CapturedMedia = {
            type: "image",
            url,
            timestamp: Date.now(),
            blob,
          };
          onCapture?.(media);
        },
        imageFormat,
        imageQuality
      );
    }, [imageFormat, imageQuality, onCapture]);

    const startRecording = useCallback(() => {
      if (!streamRef.current) return;

      try {
        chunksRef.current = [];
        const mediaRecorder = new MediaRecorder(streamRef.current!, {
          mimeType: "video/webm",
        });

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: "video/webm" });
          const url = URL.createObjectURL(blob);
          const media: CapturedMedia = {
            type: "video",
            url,
            timestamp: Date.now(),
            blob,
          };
          onCapture?.(media);
        };

        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.start();
        setIsRecording(true);

        setTimeout(() => {
          if (mediaRecorder.state === "recording") stopRecording();
        }, maxVideoDuration);
      } catch (error) {
        const err =
          error instanceof Error
            ? error
            : new Error("Failed to start recording");
        console.error(err);
        onError?.(err);
      }
    }, [maxVideoDuration, onCapture, onError]);

    const stopRecording = useCallback(() => {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      }
    }, []);

    const toggleRecording = useCallback(() => {
      if (isRecording) stopRecording();
      else startRecording();
    }, [isRecording, startRecording, stopRecording]);

    const switchCamera = useCallback(() => {
      // Read facingRef synchronously — no stale closure risk.
      const newFacing = facingRef.current === "user" ? "environment" : "user";
      startStream(newFacing);
    }, [startStream]);

    useEffect(() => {
      if (autoPlayOnStart) startStream();
      return () => stopStream();
    }, []);

    useImperativeHandle(ref, () => ({
      startStream,
      stopStream,
      captureImage,
      startRecording,
      stopRecording,
      toggleRecording,
      switchCamera,
      isStreaming,
      isRecording,
      videoElement: videoRef.current,
    }));

    return (
      <div className={`container ${containerClassName || ""}`}>
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{ display: displayStream && isStreaming ? "block" : "none" }}
          className="stream"
        />
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>
    );
  }
);

CameraComponent.displayName = "CameraComponent";
