import React from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Badge,
  Text,
  VStack,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import moment from "moment";

const getCreatorName = (announcement) => {
  const creator = announcement?.created_by;
  if (!creator) return "Unknown";
  if (typeof creator === "object") {
    return creator.name || creator.email || "Unknown";
  }
  return "Unknown";
};

function ViewAnnouncementModal({ isOpen, onClose, announcement }) {
  if (!announcement) return null;

  const batchNames = (announcement.batches || []).map((batch) =>
    typeof batch === "object" ? batch.name : "Batch"
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader className="text-xl font-semibold pr-10">
          {announcement.title}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack align="stretch" spacing={4}>
            <Text fontSize="sm" color="gray.500">
              Created by <Text as="span" fontWeight="semibold" color="gray.700">{getCreatorName(announcement)}</Text>
              {" · "}
              {moment(announcement.createdAt).format("DD MMM YYYY, hh:mm A")}
              {announcement.recipient_count != null &&
                ` · ${announcement.recipient_count} student(s) notified`}
            </Text>

            <Text whiteSpace="pre-wrap" color="gray.700">
              {announcement.message}
            </Text>

            <div>
              <Text fontSize="sm" fontWeight="medium" mb={2}>
                Sent to batches
              </Text>
              <Wrap spacing={2}>
                {batchNames.map((name) => (
                  <WrapItem key={name}>
                    <Badge colorScheme="yellow" borderRadius="md" px={2} py={1}>
                      {name}
                    </Badge>
                  </WrapItem>
                ))}
              </Wrap>
            </div>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

export default ViewAnnouncementModal;
