# React Camera Capture

A lightweight, headless React camera component for capturing images and recording videos. Built with TypeScript and designed for maximum flexibility.

## Features

- 📸 **Image Capture** - High-quality photo capture with configurable format and quality
- 🎥 **Video Recording** - Record videos with optional audio support
- 🔄 **Camera Switching** - Toggle between front and rear cameras
- 🎯 **Headless Design** - Build your own UI with full control
- ⚡ **Lightweight** - Minimal dependencies, maximum performance
- 📱 **Mobile Ready** - Works seamlessly across all devices
- 🔧 **TypeScript** - Full type safety and IntelliSense support
- 🎛️ **Highly Configurable** - Control resolution, frame rate, quality, and more

## Installation

```bash
npm install react-camera-component
```

## Quick Start

```tsx
import { CameraComponent } from "react-camera-component";

function App() {
  const handleCapture = (media) => {
    console.log("Captured:", media);
  };

  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <CameraComponent onCapture={handleCapture} />
    </div>
  );
}
```

## API Reference

### Props

| Prop                 | Type                                          | Default       | Description                                |
| -------------------- | --------------------------------------------- | ------------- | ------------------------------------------ |
| `autoPlayOnStart`    | `boolean`                                     | `true`        | Start camera stream automatically on mount |
| `facingMode`         | `"user" \| "environment"`                     | `"user"`      | Initial camera facing mode                 |
| `maxVideoDuration`   | `number`                                      | `60000`       | Maximum video recording duration (ms)      |
| `imageFormat`        | `"image/png" \| "image/jpeg" \| "image/webp"` | `"image/png"` | Format for captured images                 |
| `imageQuality`       | `number`                                      | `1`           | Image quality between 0 and 1              |
| `displayStream`      | `boolean`                                     | `true`        | Show/hide video stream                     |
| `captureAudio`       | `boolean`                                     | `false`       | Enable audio capture for videos            |
| `containerClassName` | `string`                                      | `undefined`   | CSS class for container div                |
| `frameRate`          | `number`                                      | `30`          | Video frame rate                           |
| `width`              | `number`                                      | `1280`        | Ideal video width                          |
| `height`             | `number`                                      | `720`         | Ideal video height                         |
| `onCapture`          | `(media: CapturedMedia) => void`              | `undefined`   | Callback when media is captured            |
| `onStreamStart`      | `(dimensions: Dimensions) => void`            | `undefined`   | Callback when stream starts                |
| `onError`            | `(error: Error) => void`                      | `undefined`   | Error handler callback                     |

### Ref Methods

Access camera methods using a ref:

```tsx
import { useRef } from "react";
import {
  CameraComponent,
  CameraComponentHandles,
} from "react-camera-component";

function App() {
  const cameraRef = useRef<CameraComponentHandles>(null);

  return (
    <>
      <CameraComponent ref={cameraRef} autoPlayOnStart={false} />
      <button onClick={() => cameraRef.current?.startStream()}>
        Start Camera
      </button>
      <button onClick={() => cameraRef.current?.captureImage()}>
        Take Photo
      </button>
      <button onClick={() => cameraRef.current?.toggleRecording()}>
        Record Video
      </button>
    </>
  );
}
```

#### Available Methods

- `startStream(facingMode?: "user" | "environment"): Promise<void>` - Start camera stream
- `stopStream(): void` - Stop camera stream
- `captureImage(): void` - Capture a photo
- `startRecording(): void` - Start video recording
- `stopRecording(): void` - Stop video recording
- `toggleRecording(): void` - Toggle recording state
- `switchCamera(): void` - Switch between front/rear cameras
- `isStreaming: boolean` - Current streaming state
- `isRecording: boolean` - Current recording state
- `videoElement: HTMLVideoElement | null` - Access to video element

### Types

```typescript
interface CapturedMedia {
  type: "image" | "video";
  url: string; // Blob URL for preview/download
  timestamp: number; // Capture timestamp (Date.now())
  blob: Blob; // Raw media data
}

interface Dimensions {
  width: number;
  height: number;
}
```

## Usage Examples

### Building Custom Controls

```tsx
import { useRef, useState } from "react";
import {
  CameraComponent,
  CameraComponentHandles,
  CapturedMedia,
} from "react-camera-component";

function CustomCamera() {
  const cameraRef = useRef<CameraComponentHandles>(null);
  const [media, setMedia] = useState<CapturedMedia[]>([]);

  const handleCapture = (captured: CapturedMedia) => {
    setMedia((prev) => [...prev, captured]);
  };

  return (
    <div>
      <CameraComponent
        ref={cameraRef}
        onCapture={handleCapture}
        captureAudio={true}
      />

      <div className="controls">
        <button onClick={() => cameraRef.current?.captureImage()}>
          📷 Photo
        </button>
        <button onClick={() => cameraRef.current?.toggleRecording()}>
          🎥 {cameraRef.current?.isRecording ? "Stop" : "Record"}
        </button>
        <button onClick={() => cameraRef.current?.switchCamera()}>
          🔄 Flip
        </button>
      </div>

      <div className="gallery">
        {media.map((item, i) => (
          <img key={i} src={item.url} alt={`Capture ${i}`} />
        ))}
      </div>
    </div>
  );
}
```

### Upload to Server

```tsx
const handleCapture = async (media: CapturedMedia) => {
  const formData = new FormData();
  const filename = `${media.type}-${media.timestamp}.${
    media.type === "image" ? "png" : "webm"
  }`;

  formData.append("file", media.blob, filename);

  await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });
};

<CameraComponent onCapture={handleCapture} />;
```

### High-Quality Images

```tsx
<CameraComponent
  imageFormat="image/jpeg"
  imageQuality={0.95}
  width={1920}
  height={1080}
  onCapture={handleCapture}
/>
```

### Rear Camera with Audio

```tsx
<CameraComponent
  facingMode="environment"
  captureAudio={true}
  maxVideoDuration={120000}
  onCapture={handleCapture}
/>
```

### Programmatic Control

```tsx
function ControlledCamera() {
  const cameraRef = useRef<CameraComponentHandles>(null);
  const [isActive, setIsActive] = useState(false);

  const toggleCamera = async () => {
    if (isActive) {
      cameraRef.current?.stopStream();
    } else {
      await cameraRef.current?.startStream();
    }
    setIsActive(!isActive);
  };

  return (
    <>
      <CameraComponent ref={cameraRef} autoPlayOnStart={false} />
      <button onClick={toggleCamera}>
        {isActive ? "Stop" : "Start"} Camera
      </button>
    </>
  );
}
```

### Error Handling

```tsx
const handleError = (error: Error) => {
  switch (error.name) {
    case "NotAllowedError":
      alert("Camera permission denied");
      break;
    case "NotFoundError":
      alert("No camera found");
      break;
    case "NotReadableError":
      alert("Camera is already in use");
      break;
    default:
      console.error("Camera error:", error);
  }
};

<CameraComponent onError={handleError} />;
```

## Browser Compatibility

| Feature       | Chrome | Firefox | Safari | Edge |
| ------------- | ------ | ------- | ------ | ---- |
| getUserMedia  | 53+    | 49+     | 11+    | 79+  |
| MediaRecorder | 47+    | 25+     | 14.1+  | 79+  |

**Requirements:**

- HTTPS (or localhost for development)
- Camera and microphone permissions
- Modern browser with WebRTC support

## Performance Tips

1. **Clean up blob URLs** when no longer needed:

```tsx
useEffect(() => {
  return () => {
    media.forEach((item) => URL.revokeObjectURL(item.url));
  };
}, [media]);
```

2. **Limit stored media** to prevent memory issues:

```tsx
const handleCapture = (media: CapturedMedia) => {
  setMediaList((prev) => [...prev, media].slice(-10)); // Keep last 10
};
```

3. **Stop stream when unmounting** to free resources (handled automatically).

## Styling

The component renders a simple container with a video element. Style it however you like:

```css
.container {
  position: relative;
  width: 100%;
  height: 100%;
  background: #000;
}

.stream {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

Or use inline styles:

```tsx
<CameraComponent
  containerClassName="my-camera"
  style={{ borderRadius: "12px" }}
/>
```

## Common Issues

**Camera won't start**

- Ensure you're using HTTPS
- Check browser console for permission errors
- Verify camera is not in use by another application

**Poor video quality**

- Increase `width` and `height` props
- Check lighting conditions
- Verify camera capabilities

**Recording fails**

- Check `MediaRecorder` browser support
- Ensure microphone permissions (if `captureAudio` is true)
- Try different `mimeType` if needed

## Contributing

Contributions welcome! Please open an issue or submit a PR.

## License

MIT

## Support

- 📖 **Documentation** — _coming soon_
- 🐛 **Report Bug** — _coming soon_
- 💡 **Request Feature** — _coming soon_

---

Made with ❤️
