import React from "react";
import {
  Badge,
  Box,
  Button,
  Divider,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import moment from "moment";
import PaymentEvidenceGallery from "../../Components/PaymentEvidenceGallery";
import {
  getResponsiveModalSize,
  responsiveModalContentProps,
  responsiveModalProps,
} from "../../utlls/responsiveModal";

const formatAmount = (amount) =>
  `Rs. ${Number(amount || 0).toLocaleString("en-PK", {
    maximumFractionDigits: 0,
  })}`;

const formatDate = (value) => {
  if (!value) return "—";
  const m = moment(value);
  return m.isValid() ? m.format("DD MMM YYYY, hh:mm A") : String(value);
};

const getDisplayStatus = (request) => {
  if (request?.is_refunded) {
    return { label: "Refunded", color: "purple" };
  }
  if (request?.status === "Approved") {
    return { label: "Awaiting payout", color: "green" };
  }
  if (request?.status === "Rejected") {
    return { label: "Rejected", color: "red" };
  }
  return { label: "Pending", color: "orange" };
};

const DetailRow = ({ label, value }) => (
  <Box>
    <Text fontSize="xs" color="gray.500" mb={0.5}>
      {label}
    </Text>
    <Text fontSize="sm" fontWeight="500">
      {value || "—"}
    </Text>
  </Box>
);

/**
 * Full refund request details including payout method and online screenshot.
 */
function RefundRequestDetailModal({ request, isOpen, onClose }) {
  if (!request) return null;

  const statusMeta = getDisplayStatus(request);
  const method = request.refund_payment_method || "";
  const methodLabel =
    method === "Online Payment" || method === "Online"
      ? "Online"
      : method || (request.is_refunded ? "—" : "Not paid out yet");

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      {...responsiveModalProps}
      {...getResponsiveModalSize("lg")}
    >
      <ModalOverlay />
      <ModalContent {...responsiveModalContentProps}>
        <ModalHeader>
          Refund details
          <Badge ml={2} colorScheme={statusMeta.color} borderRadius="md">
            {statusMeta.label}
          </Badge>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack align="stretch" spacing={4}>
            <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
              <DetailRow
                label="Student"
                value={
                  request.student_name ||
                  request.student?.name ||
                  "—"
                }
              />
              <DetailRow
                label="Roll / Phone"
                value={`${
                  request.student_roll_number ||
                  request.student?.roll_number ||
                  "—"
                } · ${
                  request.student_phone || request.student?.phone || "—"
                }`}
              />
              <DetailRow label="Batch" value={request.batch_name || "—"} />
              <DetailRow
                label="Requested by"
                value={request.requested_by?.name || "—"}
              />
              <DetailRow
                label="Approved amount"
                value={formatAmount(request.amount)}
              />
              <DetailRow
                label="Requested amount"
                value={
                  request.requested_amount != null
                    ? formatAmount(request.requested_amount)
                    : formatAmount(request.amount)
                }
              />
              <DetailRow
                label="Created"
                value={formatDate(request.createdAt)}
              />
              <DetailRow
                label="Reason"
                value={request.reason || "—"}
              />
            </SimpleGrid>

            {(request.approval_comment ||
              request.rejection_comment ||
              request.approved_by ||
              request.rejected_by) && (
              <>
                <Divider />
                <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
                  {request.approved_by ? (
                    <DetailRow
                      label="Approved by"
                      value={`${request.approved_by?.name || "—"}${
                        request.approved_at
                          ? ` · ${formatDate(request.approved_at)}`
                          : ""
                      }`}
                    />
                  ) : null}
                  {request.rejected_by ? (
                    <DetailRow
                      label="Rejected by"
                      value={`${request.rejected_by?.name || "—"}${
                        request.rejected_at
                          ? ` · ${formatDate(request.rejected_at)}`
                          : ""
                      }`}
                    />
                  ) : null}
                  {request.approval_comment ? (
                    <DetailRow
                      label="Approval comment"
                      value={request.approval_comment}
                    />
                  ) : null}
                  {request.rejection_comment ? (
                    <DetailRow
                      label="Rejection comment"
                      value={request.rejection_comment}
                    />
                  ) : null}
                </SimpleGrid>
              </>
            )}

            <Divider />

            <Box
              p={4}
              borderRadius="2xl"
              bg="#FFF8EE"
              border="1px solid"
              borderColor="#F0E2C8"
            >
              <Text fontWeight="600" mb={3} color="#5C4318">
                Payout
              </Text>
              <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
                <DetailRow
                  label="Paid out amount"
                  value={
                    request.is_refunded
                      ? formatAmount(
                          request.refunded_amount ?? request.amount
                        )
                      : "—"
                  }
                />
                <DetailRow label="Refund via" value={methodLabel} />
                <DetailRow
                  label="Refunded by"
                  value={request.refunded_by?.name || "—"}
                />
                <DetailRow
                  label="Refunded at"
                  value={formatDate(request.refunded_at)}
                />
              </SimpleGrid>

              {request.is_refunded ? (
                <PaymentEvidenceGallery
                  value={request.refund_evidence}
                  paymentMethod={methodLabel}
                  title="Refund screenshot"
                />
              ) : (
                <Text fontSize="sm" color="gray.500" mt={3}>
                  Payout not completed yet.
                </Text>
              )}

              {request.is_refunded &&
              (method === "Online Payment" || method === "Online") &&
              !request.refund_evidence ? (
                <Text fontSize="xs" color="orange.600" mt={2}>
                  No screenshot on file for this online refund.
                </Text>
              ) : null}
            </Box>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button borderRadius="xl" onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default RefundRequestDetailModal;
