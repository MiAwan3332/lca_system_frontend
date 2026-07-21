import React, { useEffect, useRef, useState } from "react";
import { Box, Button, HStack, Image, Input, Text } from "@chakra-ui/react";
import { Camera, RotateCcw, SwitchCamera, Upload } from "lucide-react";

function CameraCapture({ onCapture, label = "Student Photo" }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const deviceIdRef = useRef(null);

  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [active, setActive] = useState(false);
  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState(null);
  const [facingMode, setFacingMode] = useState("user"); // user = front, environment = back
  const [switching, setSwitching] = useState(false);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setActive(false);
  };

  const refreshDevices = async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return [];
    const all = await navigator.mediaDevices.enumerateDevices();
    const videoInputs = all.filter((d) => d.kind === "videoinput");
    setDevices(videoInputs);
    return videoInputs;
  };

  const openStream = async ({ preferredDeviceId = null, mode = "user" } = {}) => {
    const attempts = [];

    if (preferredDeviceId) {
      attempts.push({ deviceId: { exact: preferredDeviceId } });
      attempts.push({ deviceId: preferredDeviceId });
    }

    attempts.push(
      { facingMode: { exact: mode } },
      { facingMode: { ideal: mode } },
      true
    );

    let lastError;
    for (const video of attempts) {
      try {
        return await navigator.mediaDevices.getUserMedia({
          video,
          audio: false,
        });
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError || new Error("No camera stream");
  };

  const applyStream = async (stream, fallbackMode) => {
    const track = stream.getVideoTracks()[0];
    const settings = track?.getSettings?.() || {};
    const nextDeviceId = settings.deviceId || null;
    const nextFacing =
      settings.facingMode === "environment" || settings.facingMode === "user"
        ? settings.facingMode
        : fallbackMode;

    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = stream;
    deviceIdRef.current = nextDeviceId;
    setDeviceId(nextDeviceId);
    setFacingMode(nextFacing);
    setError("");
    setActive(true);
    await refreshDevices();
  };

  const startCamera = async ({
    preferredDeviceId = deviceIdRef.current,
    mode = facingMode,
  } = {}) => {
    try {
      const stream = await openStream({ preferredDeviceId, mode });
      await applyStream(stream, mode);
      return true;
    } catch {
      setError("Unable to access camera. Use upload photo instead.");
      setActive(false);
      return false;
    }
  };

  const switchCamera = async () => {
    if (switching) return;
    setSwitching(true);
    setError("");

    try {
      const videoInputs = devices.length ? devices : await refreshDevices();

      // External/USB + laptop cameras: cycle by deviceId
      if (videoInputs.length >= 2) {
        const currentId = deviceIdRef.current;
        const currentIndex = Math.max(
          0,
          videoInputs.findIndex((d) => d.deviceId === currentId)
        );
        const nextDevice = videoInputs[(currentIndex + 1) % videoInputs.length];

        try {
          const stream = await openStream({
            preferredDeviceId: nextDevice.deviceId,
            mode: facingMode === "user" ? "environment" : "user",
          });
          await applyStream(
            stream,
            facingMode === "user" ? "environment" : "user"
          );
        } catch {
          setError("Could not switch camera. Keep using the current one.");
        }
        return;
      }

      // Phone: toggle front/back facing mode
      const nextMode = facingMode === "user" ? "environment" : "user";
      try {
        const stream = await openStream({
          preferredDeviceId: null,
          mode: nextMode,
        });
        await applyStream(stream, nextMode);
      } catch {
        setError("Back camera is not available on this device.");
      }
    } finally {
      setSwitching(false);
    }
  };

  useEffect(() => {
    if (!active || !streamRef.current || !videoRef.current) return;

    const video = videoRef.current;
    video.srcObject = streamRef.current;

    const playStream = async () => {
      try {
        await video.play();
      } catch {
        setError("Unable to start camera preview. Try again or upload a photo.");
        stopCamera();
      }
    };

    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
      playStream();
      return;
    }

    video.onloadedmetadata = () => {
      playStream();
    };

    return () => {
      video.onloadedmetadata = null;
    };
  }, [active, deviceId, facingMode]);

  useEffect(() => () => stopCamera(), []);

  const setCapturedFile = (file) => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    onCapture?.(file);
  };

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) {
      setError("Camera is still loading. Wait a moment and try again.");
      return;
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    const mirrorPreview = facingMode === "user" && devices.length < 2;
    if (mirrorPreview) {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError("Could not capture photo. Please try again.");
          return;
        }
        const file = new File([blob], `student-photo-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        setCapturedFile(file);
        stopCamera();
        setError("");
      },
      "image/jpeg",
      0.92
    );
  };

  const handleRetake = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    onCapture?.(null);
    startCamera({
      preferredDeviceId: deviceIdRef.current,
      mode: facingMode,
    });
  };

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setCapturedFile(file);
    stopCamera();
    event.target.value = "";
  };

  const currentDeviceIndex = Math.max(
    0,
    devices.findIndex((d) => d.deviceId === deviceId)
  );
  const currentDeviceLabel =
    devices[currentDeviceIndex]?.label ||
    (facingMode === "environment" ? "Back camera" : "Front camera");

  const switchLabel =
    devices.length >= 2
      ? `Next Camera (${devices.length})`
      : facingMode === "user"
        ? "Back Camera"
        : "Front Camera";

  const mirrorPreview = facingMode === "user" && devices.length < 2;

  return (
    <Box
      border="1px solid"
      borderColor="gray.200"
      borderRadius="xl"
      p={4}
      bg="gray.50"
    >
      <Text fontSize="sm" fontWeight="semibold" mb={2}>
        {label}
      </Text>
      {error ? (
        <Text fontSize="sm" color="red.500" mb={2}>
          {error}
        </Text>
      ) : null}

      {preview ? (
        <>
          <Image
            src={preview}
            alt="Captured student"
            maxH="220px"
            borderRadius="lg"
            objectFit="cover"
            mb={3}
          />
          <Button
            size="sm"
            type="button"
            leftIcon={<RotateCcw size={16} />}
            variant="outline"
            onClick={handleRetake}
          >
            Retake Photo
          </Button>
        </>
      ) : active ? (
        <>
          <HStack justify="space-between" mb={2} align="flex-start">
            <Text fontSize="xs" color="gray.500" noOfLines={2}>
              Using {currentDeviceLabel}
              {devices.length >= 2
                ? ` (${currentDeviceIndex + 1}/${devices.length})`
                : ""}
            </Text>
            <Button
              size="xs"
              type="button"
              variant="outline"
              leftIcon={<SwitchCamera size={14} />}
              onClick={switchCamera}
              isLoading={switching}
              flexShrink={0}
            >
              Switch
            </Button>
          </HStack>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: "100%",
              maxHeight: "240px",
              borderRadius: "12px",
              background: "#111",
              transform: mirrorPreview ? "scaleX(-1)" : "none",
            }}
          />
          <canvas ref={canvasRef} style={{ display: "none" }} />
          <HStack mt={3} spacing={2} flexWrap="wrap">
            <Button
              size="sm"
              type="button"
              colorScheme="yellow"
              leftIcon={<Camera size={16} />}
              onClick={handleCapture}
            >
              Capture Photo
            </Button>
            <Button
              size="sm"
              type="button"
              variant="outline"
              leftIcon={<SwitchCamera size={16} />}
              onClick={switchCamera}
              isLoading={switching}
            >
              {switchLabel}
            </Button>
            <Button size="sm" type="button" variant="outline" onClick={stopCamera}>
              Stop Camera
            </Button>
          </HStack>
        </>
      ) : (
        <HStack spacing={2} flexWrap="wrap">
          <Button
            size="sm"
            type="button"
            leftIcon={<Camera size={16} />}
            onClick={() =>
              startCamera({ preferredDeviceId: null, mode: facingMode })
            }
          >
            Open Camera
          </Button>
          <Button
            size="sm"
            type="button"
            variant="outline"
            leftIcon={<Upload size={16} />}
            onClick={() => fileInputRef.current?.click()}
          >
            Upload Photo
          </Button>
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            display="none"
            onChange={handleFileUpload}
          />
        </HStack>
      )}
    </Box>
  );
}

export default CameraCapture;
