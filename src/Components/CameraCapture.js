import React, { useEffect, useRef, useState } from "react";
import { Box, Button, HStack, Image, Input, Text } from "@chakra-ui/react";
import { Camera, RotateCcw, Upload } from "lucide-react";

function CameraCapture({ onCapture, label = "Student Photo" }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [active, setActive] = useState(false);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setActive(false);
  };

  const startCamera = async () => {
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      setError("");
      setActive(true);
    } catch {
      setError("Unable to access camera. Use upload photo instead.");
      setActive(false);
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
  }, [active]);

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
    startCamera();
  };

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setCapturedFile(file);
    stopCamera();
    event.target.value = "";
  };

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
            onClick={startCamera}
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
