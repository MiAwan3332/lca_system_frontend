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
  SimpleGrid,
} from "@chakra-ui/react";
import { Eye } from "lucide-react";
import ActionButton from "../../Components/ActionButton";
import { getMediaUrl } from "../../utlls/useful";

const defaultAvatar =
  "https://images.unsplash.com/photo-1619946794135-5bc917a27793?ixlib=rb-0.3.5&q=80&fm=jpg&crop=faces&fit=crop&h=200&w=200&s=b616b2c5b373a80ffc9636ba24f7a4a9";

function DetailItem({ label, value }) {
  return (
    <Box>
      <Text fontSize="sm" color="gray.500" mb={1}>
        {label}
      </Text>
      <Text fontWeight="500" whiteSpace="pre-wrap">
        {value || "—"}
      </Text>
    </Box>
  );
}

function ViewQualifierModal({ qualifier }) {
  const [isOpen, setIsOpen] = useState(false);
  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);

  const isActive = qualifier?.is_active !== false;

  return (
    <>
      <ActionButton
        variant="slate"
        icon={<Eye size={16} />}
        label="View Details"
        onClick={onOpen}
      />

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader className="text-xl font-semibold">
            Qualifier Details
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="stretch" spacing={5}>
              <HStack spacing={4} align="center">
                <Image
                  src={getMediaUrl(qualifier?.photo) || defaultAvatar}
                  alt={qualifier?.name || "Qualifier"}
                  boxSize="88px"
                  objectFit="cover"
                  borderRadius="full"
                />
                <Box>
                  <Text fontSize="xl" fontWeight="600">
                    {qualifier?.name || "—"}
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

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <DetailItem
                  label="Interview Batch"
                  value={qualifier?.batch?.name}
                />
                <DetailItem label="Phone No" value={qualifier?.phone} />
                <DetailItem label="Email" value={qualifier?.email} />
                <DetailItem label="CNIC" value={qualifier?.cnic} />
                <DetailItem label="City" value={qualifier?.city} />
                <DetailItem label="Father Name" value={qualifier?.father_name} />
                <DetailItem
                  label="Father Phone"
                  value={qualifier?.father_phone}
                />
                <DetailItem
                  label="No. of Attempts"
                  value={
                    qualifier?.no_of_attempts != null
                      ? String(qualifier.no_of_attempts)
                      : "0"
                  }
                />
                <DetailItem
                  label="Total Fee"
                  value={
                    qualifier?.total_fee != null
                      ? `${Number(qualifier.total_fee).toLocaleString()} Rs.`
                      : ""
                  }
                />
                <DetailItem
                  label="Discount"
                  value={
                    qualifier?.discount_amount
                      ? `${Number(qualifier.discount_amount).toLocaleString()} Rs.`
                      : "—"
                  }
                />
                <DetailItem
                  label="Paid"
                  value={
                    qualifier?.paid_fee != null
                      ? `${Number(qualifier.paid_fee).toLocaleString()} Rs.`
                      : ""
                  }
                />
                <DetailItem
                  label="Remaining"
                  value={
                    qualifier?.pending_fee != null
                      ? `${Number(qualifier.pending_fee).toLocaleString()} Rs.`
                      : ""
                  }
                />
                <DetailItem
                  label="Payment Method"
                  value={qualifier?.payment_method}
                />
                {qualifier?.discount_amount > 0 ? (
                  <DetailItem
                    label="Discount Reason"
                    value={qualifier?.discount_description}
                  />
                ) : null}
              </SimpleGrid>

              <Box>
                <Text fontSize="sm" color="gray.500" mb={2}>
                  Optional Subjects
                </Text>
                {Array.isArray(qualifier?.optional_subjects) &&
                qualifier.optional_subjects.length ? (
                  <Text fontWeight="500" whiteSpace="pre-wrap">
                    {qualifier.optional_subjects.join(", ")}
                  </Text>
                ) : (
                  <Text fontWeight="500">—</Text>
                )}
              </Box>

              <DetailItem
                label="Notes / Description"
                value={qualifier?.description}
              />
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

export default ViewQualifierModal;
