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
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [currentFacingMode, setCurrentFacingMode] = useState(facingMode);

    const startStream = useCallback(
      async (facing: "user" | "environment" = currentFacingMode) => {
        try {
          if (stream) stream.getTracks().forEach((t) => t.stop());

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

          setStream(mediaStream);
          setIsStreaming(true);
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
        }
      },
      [
        currentFacingMode,
        stream,
        onStreamStart,
        onError,
        frameRate,
        width,
        height,
        captureAudio,
      ]
    );

    const stopStream = useCallback(() => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
        setStream(null);
      }
      setIsStreaming(false);
      if (isRecording) stopRecording();
    }, [stream, isRecording]);

    const captureImage = useCallback(() => {
      if (!videoRef.current || !canvasRef.current) return;

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
      if (!stream) return;

      try {
        chunksRef.current = [];
        const mediaRecorder = new MediaRecorder(stream, {
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
    }, [stream, maxVideoDuration, onCapture, onError]);

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
      const newFacing = currentFacingMode === "user" ? "environment" : "user";
      startStream(newFacing);
    }, [currentFacingMode, startStream]);

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
