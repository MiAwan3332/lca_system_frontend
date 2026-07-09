import React, { useState, useEffect } from "react";
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
  MenuItem,
  Input,
  FormControl,
  FormLabel,
} from "@chakra-ui/react";
import { Avatar } from "@files-ui/react";
import { useDisclosure } from "@chakra-ui/react";
import axios from "axios";
import Cookies from "js-cookie";
import { useSelector } from "react-redux";
import { selectUser } from "../../../Features/authSlice";
import { fetchUserById } from "../../../Features/authSlice";
import { useDispatch } from "react-redux";
import { config } from "../../../utlls/config";
import { getMediaUrl } from "../../../utlls/useful.js";

const imageSrc =
  "https://images.unsplash.com/photo-1619946794135-5bc917a27793?ixlib=rb-0.3.5&q=80&fm=jpg&crop=faces&fit=crop&h=200&w=200&s=b616b2c5b373a80ffc9636ba24f7a4a9";

function ChangeAvatarModal() {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isPasswordOpen,
    onOpen: onPasswordOpen,
    onClose: onPasswordClose,
  } = useDisclosure();
  const [imageSource, setImageSource] = useState(getMediaUrl(user?.avatar) ?? imageSrc);
  const [isLoaded, setIsLoaded] = useState(false);

  const [email, setEmail] = useState(user?.email ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const BASE_URL = config.BASE_URL;
  const authToken = Cookies.get("authToken");

  const handleChangeSource = async (selectedFile) => {
    setImageSource(selectedFile);
  };

  const handleChangeAvatar = async () => {
    setIsLoaded(true);
    const formData = new FormData();
    formData.append("id", user._id);
    formData.append("avatar", imageSource);
    await axios
      .post(`${BASE_URL}/users/avatar`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${authToken}`,
        },
      })
      .then((response) => {
        setImageSource(response.data.avatar);
        dispatch(fetchUserById({ userId: user._id, authToken }));
        setIsLoaded(false);
        onClose();
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const handleChangePassword = async () => {
    setIsLoaded(true);
    const passwordData = {
      email,
      currentPassword,
      newPassword,
    };
    await axios
      .post(`${BASE_URL}/users/changePassword`, passwordData, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })
      .then((response) => {
        setIsLoaded(false);
        onPasswordClose();
      })
      .catch((error) => {
        console.log(error);
        setIsLoaded(false);
      });
  };

  useEffect(() => {
    setImageSource(getMediaUrl(user?.avatar) ?? imageSrc);
    setEmail(user?.email ?? "");
  }, [user]);

  return (
    <>
      <MenuItem onClick={onOpen} className="rounded-lg">
        Change Avatar
      </MenuItem>

      <MenuItem onClick={onPasswordOpen} className="rounded-lg">
        Change Password
      </MenuItem>

      {/* Avatar Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader className="text-xl font-semibold">Change Avatar</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Avatar
                src={imageSource}
                alt="Avatar"
                changeLabel="Select Image"
                onChange={handleChangeSource}
              />
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} borderRadius={"0.75rem"} onClick={onClose}>
              Close
            </Button>
            <Button
              onClick={handleChangeAvatar}
              borderRadius={"0.75rem"}
              backgroundColor={"#FFCB82"}
              color={"#85652D"}
              _hover={{
                backgroundColor: "#E3B574",
                color: "#654E26",
              }}
              fontWeight={"500"}
              type="submit"
              loadingText="Saving"
              isLoading={isLoaded}
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
            <Button variant="ghost" mr={3} borderRadius={"0.75rem"} onClick={onPasswordClose}>
              Close
            </Button>
            <Button
              onClick={handleChangePassword}
              borderRadius={"0.75rem"}
              backgroundColor={"#FFCB82"}
              color={"#85652D"}
              _hover={{
                backgroundColor: "#E3B574",
                color: "#654E26",
              }}
              fontWeight={"500"}
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
