import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  MenuItem,
  Input,
  FormControl,
  FormLabel,
  Box,
  Text,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Image,
  useToast,
} from "@chakra-ui/react";
import { useDisclosure } from "@chakra-ui/react";
import Cropper from "react-easy-crop";
import axios from "axios";
import Cookies from "js-cookie";
import { useSelector, useDispatch } from "react-redux";
import { selectUser, fetchUserById } from "../../../Features/authSlice";
import { config } from "../../../utlls/config";
import { getMediaUrl } from "../../../utlls/useful.js";
import { getCroppedImageFile } from "../../../utlls/cropImage";

const FALLBACK_AVATAR =
  "https://images.unsplash.com/photo-1619946794135-5bc917a27793?ixlib=rb-0.3.5&q=80&fm=jpg&crop=faces&fit=crop&h=200&w=200&s=b616b2c5b373a80ffc9636ba24f7a4a9";

function ChangeAvatarModal() {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const toast = useToast();
  const fileInputRef = useRef(null);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isPasswordOpen,
    onOpen: onPasswordOpen,
    onClose: onPasswordClose,
  } = useDisclosure();

  const [currentAvatar, setCurrentAvatar] = useState(
    getMediaUrl(user?.avatar) ?? FALLBACK_AVATAR
  );
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const [email, setEmail] = useState(user?.email ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const BASE_URL = config.BASE_URL;
  const authToken = Cookies.get("authToken");

  const resetCropState = useCallback(() => {
    if (imageSrc?.startsWith("blob:")) {
      URL.revokeObjectURL(imageSrc);
    }
    setImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [imageSrc]);

  const handleCloseAvatarModal = () => {
    resetCropState();
    onClose();
  };

  const onCropComplete = useCallback((_croppedArea, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleSelectImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please select an image file.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (imageSrc?.startsWith("blob:")) {
      URL.revokeObjectURL(imageSrc);
    }

    const objectUrl = URL.createObjectURL(file);
    setImageSrc(objectUrl);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  };

  const handleChangeAvatar = async () => {
    if (!imageSrc || !croppedAreaPixels) {
      toast({
        title: "Select and crop an image",
        description: "Choose a photo, adjust the crop, then save.",
        status: "warning",
        duration: 3500,
        isClosable: true,
      });
      return;
    }

    setIsLoaded(true);
    try {
      const croppedFile = await getCroppedImageFile(
        imageSrc,
        croppedAreaPixels,
        `avatar-${user._id}-${Date.now()}.jpg`
      );

      const formData = new FormData();
      formData.append("id", user._id);
      formData.append("avatar", croppedFile);

      const response = await axios.post(`${BASE_URL}/users/avatar`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${authToken}`,
        },
      });

      const nextAvatar = getMediaUrl(response.data.avatar) ?? response.data.avatar;
      setCurrentAvatar(nextAvatar);
      dispatch(fetchUserById({ userId: user._id, authToken }));
      toast({
        title: "Avatar updated",
        status: "success",
        duration: 2500,
        isClosable: true,
      });
      handleCloseAvatarModal();
    } catch (error) {
      toast({
        title: "Could not update avatar",
        description: error?.response?.data?.message || error.message || "Please try again.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsLoaded(false);
    }
  };

  const handleChangePassword = async () => {
    setIsLoaded(true);
    const passwordData = {
      email,
      currentPassword,
      newPassword,
    };
    try {
      await axios.post(`${BASE_URL}/users/changePassword`, passwordData, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      setCurrentPassword("");
      setNewPassword("");
      onPasswordClose();
      toast({
        title: "Password updated",
        status: "success",
        duration: 2500,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Could not change password",
        description: error?.response?.data?.message || error.message || "Please try again.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsLoaded(false);
    }
  };

  useEffect(() => {
    setCurrentAvatar(getMediaUrl(user?.avatar) ?? FALLBACK_AVATAR);
    setEmail(user?.email ?? "");
  }, [user]);

  useEffect(() => {
    return () => {
      if (imageSrc?.startsWith("blob:")) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [imageSrc]);

  return (
    <>
      <MenuItem onClick={onOpen} className="rounded-lg">
        Change Avatar
      </MenuItem>

      <MenuItem onClick={onPasswordOpen} className="rounded-lg">
        Change Password
      </MenuItem>

      {/* Avatar Modal */}
      <Modal isOpen={isOpen} onClose={handleCloseAvatarModal} size="md" isCentered>
        <ModalOverlay />
        <ModalContent borderRadius="xl">
          <ModalHeader className="text-xl font-semibold">Change Avatar</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              {!imageSrc ? (
                <VStack spacing={3}>
                  <Image
                    src={currentAvatar}
                    alt="Current avatar"
                    boxSize="120px"
                    borderRadius="full"
                    objectFit="cover"
                    border="3px solid"
                    borderColor="#FFCB82"
                  />
                  <Text fontSize="sm" color="gray.500" textAlign="center">
                    Select a photo, then crop it to a square before saving.
                  </Text>
                  <Button
                    borderRadius="0.75rem"
                    backgroundColor="#FFCB82"
                    color="#85652D"
                    _hover={{ backgroundColor: "#E3B574", color: "#654E26" }}
                    fontWeight="500"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Select Image
                  </Button>
                </VStack>
              ) : (
                <VStack spacing={4} align="stretch">
                  <Box
                    position="relative"
                    w="100%"
                    h="280px"
                    bg="gray.900"
                    borderRadius="lg"
                    overflow="hidden"
                  >
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

                  <HStack justify="space-between">
                    <Button
                      size="sm"
                      variant="outline"
                      borderRadius="0.75rem"
                      onClick={resetCropState}
                    >
                      Choose another
                    </Button>
                    <Text fontSize="xs" color="gray.500">
                      Drag to reposition
                    </Text>
                  </HStack>
                </VStack>
              )}

              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                display="none"
                onChange={handleSelectImage}
              />
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              borderRadius="0.75rem"
              onClick={handleCloseAvatarModal}
            >
              Close
            </Button>
            <Button
              onClick={handleChangeAvatar}
              borderRadius="0.75rem"
              backgroundColor="#FFCB82"
              color="#85652D"
              _hover={{
                backgroundColor: "#E3B574",
                color: "#654E26",
              }}
              fontWeight="500"
              type="button"
              loadingText="Saving"
              isLoading={isLoaded}
              isDisabled={!imageSrc}
            >
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Change Password Modal */}
      <Modal isOpen={isPasswordOpen} onClose={onPasswordClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader className="text-xl font-semibold">Change Password</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Email</FormLabel>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  isReadOnly
                />
              </FormControl>
              <FormControl>
                <FormLabel>Current Password</FormLabel>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </FormControl>
              <FormControl>
                <FormLabel>New Password</FormLabel>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              borderRadius="0.75rem"
              onClick={onPasswordClose}
            >
              Close
            </Button>
            <Button
              onClick={handleChangePassword}
              borderRadius="0.75rem"
              backgroundColor="#FFCB82"
              color="#85652D"
              _hover={{
                backgroundColor: "#E3B574",
                color: "#654E26",
              }}
              fontWeight="500"
              type="submit"
              loadingText="Saving"
              isLoading={isLoaded}
            >
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

export default ChangeAvatarModal;
