import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Flex,
  HStack,
  Image,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Camera, Paperclip, Trash2, Upload, X } from "lucide-react";
import CameraCapture from "./CameraCapture";

const isImageFile = (file) =>
  file && String(file.type || "").startsWith("image/");

/**
 * Upload and/or capture payment receipt photos for Online Payment.
 * Supports multiple images/PDFs.
 */
function PaymentEvidenceUploader({
  files = [],
  onChange,
  error = "",
  label = "Online Payment Evidence",
}) {
  const fileInputRef = useRef(null);
  const [showCamera, setShowCamera] = useState(false);
  const [previews, setPreviews] = useState([]);

  const list = useMemo(
    () => (Array.isArray(files) ? files.filter(Boolean) : []),
    [files]
  );

  useEffect(() => {
    const next = list.map((file) => {
      if (isImageFile(file)) {
        return {
          name: file.name,
          type: file.type,
          url: URL.createObjectURL(file),
          revoke: true,
        };
      }
      return {
        name: file.name,
        type: file.type || "application/pdf",
        url: null,
        revoke: false,
      };
    });
    setPreviews(next);
    return () => {
      next.forEach((item) => {
        if (item.revoke && item.url) URL.revokeObjectURL(item.url);
      });
    };
  }, [list]);

  const emit = (nextFiles) => {
    onChange?.(nextFiles);
  };

  const handleUpload = (event) => {
    const incoming = Array.from(event.target.files || []);
    if (!incoming.length) return;
    emit([...list, ...incoming]);
    event.target.value = "";
    setShowCamera(false);
  };

  const handleCapture = (file) => {
    if (!file) return;
    const named =
      file instanceof File
        ? file
        : new File([file], `payment-evidence-${Date.now()}.jpg`, {
            type: "image/jpeg",
          });
    emit([...list, named]);
    setShowCamera(false);
  };

  const removeAt = (index) => {
    emit(list.filter((_, i) => i !== index));
  };

  const clearAll = () => emit([]);

  return (
    <Box position="relative">
      <Text fontSize="sm" fontWeight="600" mb={2}>
        {label}{" "}
        <Text as="span" color="red.500">
          *
        </Text>
      </Text>
      <Text fontSize="xs" color="gray.500" mb={3}>
        Required for Online Payment. Upload receipt screenshots or capture a
        photo with the camera.
      </Text>

      <HStack spacing={2} flexWrap="wrap" mb={3}>
        <Button
          type="button"
          size="sm"
          variant="outline"
          leftIcon={<Upload size={14} />}
          onClick={() => fileInputRef.current?.click()}
        >
          Upload files
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          leftIcon={<Camera size={14} />}
          onClick={() => setShowCamera((v) => !v)}
        >
          {showCamera ? "Hide camera" : "Capture photo"}
        </Button>
        {list.length > 0 ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            colorScheme="red"
            leftIcon={<X size={14} />}
            onClick={clearAll}
          >
            Clear
          </Button>
        ) : null}
      </HStack>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif,image/*,application/pdf"
        // Native hidden input — must NOT be HTML-required (browser can't focus it)
        tabIndex={-1}
        aria-hidden="true"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clip: "rect(0, 0, 0, 0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
        onChange={handleUpload}
      />

      {showCamera ? (
        <Box
          mb={3}
          p={3}
          borderWidth="1px"
          borderColor="#E0E8EC"
          borderRadius="lg"
          bg="#FAFBFC"
        >
          <CameraCapture
            label="Payment receipt photo"
            onCapture={handleCapture}
          />
        </Box>
      ) : null}

      {previews.length > 0 ? (
        <Flex gap={2} flexWrap="wrap">
          {previews.map((item, index) => (
            <Box
              key={`${item.name}-${index}`}
              position="relative"
              w="88px"
              borderWidth="1px"
              borderColor="gray.200"
              borderRadius="md"
              overflow="hidden"
              bg="white"
            >
              {item.url ? (
                <Image
                  src={item.url}
                  alt={item.name}
                  w="88px"
                  h="88px"
                  objectFit="cover"
                />
              ) : (
                <VStack
                  w="88px"
                  h="88px"
                  justify="center"
                  spacing={1}
                  px={1}
                  bg="gray.50"
                >
                  <Paperclip size={18} color="#2D4185" />
                  <Text fontSize="9px" noOfLines={2} textAlign="center">
                    {item.name}
                  </Text>
                </VStack>
              )}
              <Button
                type="button"
                size="xs"
                position="absolute"
                top="2px"
                right="2px"
                colorScheme="red"
                variant="solid"
                minW="auto"
                h="22px"
                px={1}
                onClick={() => removeAt(index)}
                aria-label="Remove evidence"
              >
                <Trash2 size={12} />
              </Button>
            </Box>
          ))}
        </Flex>
      ) : (
        <Text fontSize="sm" color="gray.500">
          No evidence selected yet.
        </Text>
      )}

      {error ? (
        <Text color="red.500" fontSize="sm" mt={2}>
          {error}
        </Text>
      ) : null}
    </Box>
  );
}

export default PaymentEvidenceUploader;
