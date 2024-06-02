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

const imageSrc =
  "https://images.unsplash.com/photo-1619946794135-5bc917a27793?ixlib=rb-0.3.5&q=80&fm=jpg&crop=faces&fit=crop&h=200&w=200&s=b616b2c5b373a80ffc9636ba24f7a4a9";

function ChangeAvatarModal() {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [imageSource, setImageSource] = useState(user?.avatar ?? imageSrc);
  const [isLoaded, setIsLoaded] = useState(false);

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

  useEffect(() => {
    setImageSource(user?.avatar ?? imageSrc);
  }, [user]);

  return (
    <>
      <MenuItem onClick={onOpen} className="rounded-lg">
        Change Avatar
      </MenuItem>
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
    </>
  );
}

export default ChangeAvatarModal;
