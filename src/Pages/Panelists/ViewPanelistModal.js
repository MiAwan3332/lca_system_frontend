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
  Badge,
  Box,
  Image,
  Text,
  VStack,
  HStack,
} from "@chakra-ui/react";
import { Eye } from "lucide-react";
import ActionButton from "../../Components/ActionButton";
import { getMediaUrl } from "../../utlls/useful";

const defaultAvatar =
  "https://images.unsplash.com/photo-1619946794135-5bc917a27793?ixlib=rb-0.3.5&q=80&fm=jpg&crop=faces&fit=crop&h=200&w=200&s=b616b2c5b373a80ffc9636ba24f7a4a9";

function ViewPanelistModal({ panelist }) {
  const [isOpen, setIsOpen] = useState(false);
  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);

  const isActive = panelist?.is_active !== false;

  return (
    <>
      <ActionButton
        variant="slate"
        icon={<Eye size={16} />}
        label="View Details"
        onClick={onOpen}
      />

      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader className="text-xl font-semibold">
            Panelist Details
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="stretch" spacing={5}>
              <HStack spacing={4} align="center">
                <Image
                  src={getMediaUrl(panelist?.photo) || defaultAvatar}
                  alt={panelist?.name || "Panelist"}
                  boxSize="88px"
                  objectFit="cover"
                  borderRadius="full"
                />
                <Box>
                  <Text fontSize="xl" fontWeight="600">
                    {panelist?.name || "—"}
                  </Text>
                  <Badge
                    mt={1}
                    colorScheme={isActive ? "green" : "gray"}
                    borderRadius="md"
                    px={2}
                    py={0.5}
                  >
                    {isActive ? "Active" : "Inactive"}
                  </Badge>
                </Box>
              </HStack>

              <Box>
                <Text fontSize="sm" color="gray.500" mb={1}>
                  Phone No
                </Text>
                <Text fontWeight="500">{panelist?.phone || "—"}</Text>
              </Box>

              <Box>
                <Text fontSize="sm" color="gray.500" mb={1}>
                  Description
                </Text>
                <Text whiteSpace="pre-wrap">
                  {panelist?.description || "—"}
                </Text>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" borderRadius="0.75rem" onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

export default ViewPanelistModal;
