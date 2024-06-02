import React, { useState } from "react";
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
  Spinner,
  IconButton,
} from "@chakra-ui/react";
import { useDisclosure } from "@chakra-ui/react";
import axios from "axios";
import Cookies from "js-cookie";
import { QrCode } from "lucide-react";
import { config } from "../../../utlls/config";

function QrCodeModal({ student }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [qrCode, setQrCode] = useState(student.qrcode);
  const [isLoading, setIsLoading] = useState(false);

  const BASE_URL = config.BASE_URL;
  const authToken = Cookies.get("authToken");

  const handleQrCodeUpdate = async () => {
    setIsLoading(true);
    await axios
      .get(`${BASE_URL}/students/qrcode/${student._id}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })
      .then((response) => {
        setIsLoading(false);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  return (
    <>
      <IconButton onClick={onOpen} colorScheme="gray">
        <QrCode />
      </IconButton>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader className="text-xl font-semibold">
            Student QR Code
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              {isLoading && <Spinner />}
              {!isLoading && (
                <img
                  src={`data:image/svg+xml;utf8,${encodeURIComponent(qrCode)}`}
                />
              )}
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              borderRadius={"0.75rem"}
              onClick={onClose}
            >
              Close
            </Button>
            <Button
              onClick={handleQrCodeUpdate}
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
              isLoading={isLoading}
            >
              Update
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

export default QrCodeModal;
