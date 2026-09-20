import React, { useCallback, useEffect, useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Box,
  Text,
  VStack,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
} from "@chakra-ui/react";
import Cropper from "react-easy-crop";
import { getCroppedImageFile } from "../utlls/cropImage";

/**
 * Square crop dialog used after camera capture or gallery pick.
 */
function ImageCropModal({
  isOpen,
  imageSrc,
  onClose,
  onCropped,
  title = "Crop Photo",
  fileNamePrefix = "photo",
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setError("");
    setSaving(false);
  }, [isOpen, imageSrc]);

  const onCropComplete = useCallback((_area, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleApply = async () => {
    if (!imageSrc || !croppedAreaPixels) {
      setError("Adjust the crop area, then apply.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const file = await getCroppedImageFile(
        imageSrc,
        croppedAreaPixels,
        `${fileNamePrefix}-${Date.now()}.jpg`
      );
      onCropped?.(file);
      onClose?.();
    } catch (err) {
      setError(err?.message || "Could not crop image. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      isCentered
      closeOnOverlayClick={!saving}
    >
      <ModalOverlay />
      <ModalContent borderRadius="xl" mx={3}>
        <ModalHeader className="text-xl font-semibold">{title}</ModalHeader>
        <ModalCloseButton isDisabled={saving} />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <Text fontSize="sm" color="gray.500">
              Drag to reposition and use zoom to crop a clear square photo.
            </Text>
            <Box
              position="relative"
              w="100%"
              h="280px"
              bg="gray.900"
              borderRadius="lg"
              overflow="hidden"
            >
              {imageSrc ? (
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              ) : null}
            </Box>
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={2}>
                Zoom
              </Text>
              <Slider
                aria-label="Zoom"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={setZoom}
                colorScheme="yellow"
              >
                <SliderTrack>
                  <SliderFilledTrack bg="#FFCB82" />
                </SliderTrack>
                <SliderThumb boxSize={4} />
              </Slider>
            </Box>
            {error ? (
              <Text fontSize="sm" color="red.500">
                {error}
              </Text>
            ) : null}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="ghost"
            mr={3}
            borderRadius="0.75rem"
            onClick={onClose}
            isDisabled={saving}
          >
            Cancel
          </Button>
          <Button
            borderRadius="0.75rem"
            backgroundColor="#FFCB82"
            color="#85652D"
            _hover={{ backgroundColor: "#E3B574", color: "#654E26" }}
            fontWeight="500"
            onClick={handleApply}
            isLoading={saving}
            loadingText="Cropping"
          >
            Apply Crop
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default ImageCropModal;
