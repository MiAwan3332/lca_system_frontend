import React, { useEffect, useRef, useState } from "react";
import { Box, Button, HStack, Image, Input, Text } from "@chakra-ui/react";
import { Camera, RotateCcw, SwitchCamera, Upload } from "lucide-react";
import ImageCropModal from "./ImageCropModal";

function CameraCapture({
  onCapture,
  label = "Photo",
  enableCrop = true,
  initialPreviewUrl = "",
  fileNamePrefix = "photo",
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const galleryInputRef = useRef(null);
  const deviceIdRef = useRef(null);

  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [active, setActive] = useState(false);
  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState(null);
  const [facingMode, setFacingMode] = useState("user"); // user = front, environment = back
  const [switching, setSwitching] = useState(false);
  const [cropSrc, setCropSrc] = useState(null);
  const [cropOpen, setCropOpen] = useState(false);

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
      setError("Unable to access camera. Use gallery upload instead.");
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

  useEffect(() => {
    if (preview || !initialPreviewUrl) return;
    setPreview(initialPreviewUrl);
  }, [initialPreviewUrl, preview]);

  const setCapturedFile = (file) => {
    if (preview && preview.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    onCapture?.(file);
  };

  const beginCropFromFile = async (file) => {
    if (!file) return;
    stopCamera();
    if (cropSrc?.startsWith("blob:")) {
      URL.revokeObjectURL(cropSrc);
    }
    const url = URL.createObjectURL(file);
    setCropSrc(url);
    setCropOpen(true);
    setError("");
  };

  const normalizeImageFile = async (file) => {
    if (!file) return null;
    if (file.type === "image/jpeg" || file.type === "image/jpg") {
      return file;
    }

    try {
      const objectUrl = URL.createObjectURL(file);
      const img = await new Promise((resolve, reject) => {
        const image = new window.Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = objectUrl;
      });
      URL.revokeObjectURL(objectUrl);

      const canvas = document.createElement("canvas");
      canvas.width = img.width || 1;
      canvas.height = img.height || 1;
      const ctx = canvas.getContext("2d");
      if (!ctx) return file;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.92)
      );
      if (!blob) return file;
      return new File([blob], `${fileNamePrefix}-${Date.now()}.jpg`, {
        type: "image/jpeg",
      });
    } catch {
      return file;
    }
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
      async (blob) => {
        if (!blob) {
          setError("Could not capture photo. Please try again.");
          return;
        }
        const file = new File([blob], `${fileNamePrefix}-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        stopCamera();
        if (enableCrop) {
          await beginCropFromFile(file);
        } else {
          setCapturedFile(file);
        }
        setError("");
      },
      "image/jpeg",
      0.92
    );
  };

  const handleRetake = () => {
    if (preview && preview.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    onCapture?.(null);
    startCamera({
      preferredDeviceId: deviceIdRef.current,
      mode: facingMode,
    });
  };

  const handleGalleryUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const normalized = await normalizeImageFile(file);
    if (enableCrop) {
      await beginCropFromFile(normalized);
    } else {
      setCapturedFile(normalized);
      stopCamera();
    }
    event.target.value = "";
  };

  const handleCropClose = () => {
    setCropOpen(false);
    if (cropSrc?.startsWith("blob:")) {
      URL.revokeObjectURL(cropSrc);
    }
    setCropSrc(null);
  };

  const handleCropped = (file) => {
    setCapturedFile(file);
    handleCropClose();
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
  const displayPreview =
    preview || (!preview && initialPreviewUrl ? initialPreviewUrl : null);

  return (
    <Box
      border="1px solid"
      borderColor="gray.200"
      borderRadius="xl"
      p={{ base: 3, md: 4 }}
      bg="gray.50"
    >
      <Text fontSize="sm" fontWeight="semibold" mb={2}>
        {label}
      </Text>
      <Text fontSize="xs" color="gray.500" mb={2}>
        Capture from camera or choose from gallery
        {enableCrop ? ", then crop before saving." : "."}
      </Text>
      {error ? (
        <Text fontSize="sm" color="red.500" mb={2}>
          {error}
        </Text>
      ) : null}

      {displayPreview && !active ? (
        <>
          <Image
            src={displayPreview}
            alt="Selected photo"
            maxH="220px"
            borderRadius="lg"
            objectFit="cover"
            mb={3}
          />
          <HStack spacing={2} flexWrap="wrap">
            <Button
              size="sm"
              type="button"
              leftIcon={<RotateCcw size={16} />}
              variant="outline"
              onClick={handleRetake}
            >
              Retake / Change
            </Button>
            <Button
              size="sm"
              type="button"
              variant="outline"
              leftIcon={<Upload size={16} />}
              onClick={() => galleryInputRef.current?.click()}
            >
              From Gallery
            </Button>
          </HStack>
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
          <HStack mt={3} spacing={2} flexWrap="wrap" align="stretch">
            <Button
              size="sm"
              type="button"
              colorScheme="yellow"
              leftIcon={<Camera size={16} />}
              onClick={handleCapture}
              w={{ base: "full", sm: "auto" }}
              minH="40px"
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
              w={{ base: "full", sm: "auto" }}
              minH="40px"
            >
              {switchLabel}
            </Button>
            <Button
              size="sm"
              type="button"
              variant="outline"
              leftIcon={<Upload size={16} />}
              onClick={() => galleryInputRef.current?.click()}
              w={{ base: "full", sm: "auto" }}
              minH="40px"
            >
              From Gallery
            </Button>
            <Button
              size="sm"
              type="button"
              variant="outline"
              onClick={stopCamera}
              w={{ base: "full", sm: "auto" }}
              minH="40px"
            >
              Stop Camera
            </Button>
          </HStack>
        </>
      ) : (
        <HStack spacing={2} flexWrap="wrap" align="stretch">
          <Button
            size="sm"
            type="button"
            leftIcon={<Camera size={16} />}
            onClick={() =>
              startCamera({ preferredDeviceId: null, mode: facingMode })
            }
            w={{ base: "full", sm: "auto" }}
            minH="40px"
          >
            Open Camera
          </Button>
          <Button
            size="sm"
            type="button"
            variant="outline"
            leftIcon={<Upload size={16} />}
            onClick={() => galleryInputRef.current?.click()}
            w={{ base: "full", sm: "auto" }}
            minH="40px"
          >
            From Gallery
          </Button>
        </HStack>
      )}

      <Input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        display="none"
        onChange={handleGalleryUpload}
      />

      <ImageCropModal
        isOpen={cropOpen}
        imageSrc={cropSrc}
        onClose={handleCropClose}
        onCropped={handleCropped}
        title="Crop Photo"
        fileNamePrefix={fileNamePrefix}
      />
    </Box>
  );
}

export default CameraCapture;
