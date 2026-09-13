import React, { useState } from "react";
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
import { Pencil } from "lucide-react";
import PaymentEvidenceGallery from "../../Components/PaymentEvidenceGallery";
import UpdateRefundPayoutAction from "./UpdateRefundPayoutAction";
import { canUpdateRefundPayout } from "../../utlls/refundAccess";
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
 * Super Admin can update Cash/Online + screenshot from here.
 */
function RefundRequestDetailModal({ request, isOpen, onClose, onUpdated }) {
  const [editOpen, setEditOpen] = useState(false);
  const [localRequest, setLocalRequest] = useState(request);

  React.useEffect(() => {
    setLocalRequest(request);
  }, [request]);

  if (!localRequest) return null;

  const statusMeta = getDisplayStatus(localRequest);
  const method = localRequest.refund_payment_method || "";
  const methodLabel =
    method === "Online Payment" || method === "Online"
      ? "Online"
      : method || (localRequest.is_refunded ? "—" : "Not paid out yet");
  const canEdit =
    canUpdateRefundPayout() && Boolean(localRequest.is_refunded);

  return (
    <>
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
                    localRequest.student_name ||
                    localRequest.student?.name ||
                    "—"
                  }
                />
                <DetailRow
                  label="Roll / Phone"
                  value={`${
                    localRequest.student_roll_number ||
                    localRequest.student?.roll_number ||
                    "—"
                  } · ${
                    localRequest.student_phone ||
                    localRequest.student?.phone ||
                    "—"
                  }`}
                />
                <DetailRow
                  label="Batch"
                  value={localRequest.batch_name || "—"}
                />
                <DetailRow
                  label="Requested by"
                  value={localRequest.requested_by?.name || "—"}
                />
                <DetailRow
                  label="Approved amount"
                  value={formatAmount(localRequest.amount)}
                />
                <DetailRow
                  label="Requested amount"
                  value={
                    localRequest.requested_amount != null
                      ? formatAmount(localRequest.requested_amount)
                      : formatAmount(localRequest.amount)
                  }
                />
                <DetailRow
                  label="Created"
                  value={formatDate(localRequest.createdAt)}
                />
                <DetailRow
                  label="Reason"
                  value={localRequest.reason || "—"}
                />
              </SimpleGrid>

              {(localRequest.approval_comment ||
                localRequest.rejection_comment ||
                localRequest.approved_by ||
                localRequest.rejected_by) && (
                <>
                  <Divider />
                  <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
                    {localRequest.approved_by ? (
                      <DetailRow
                        label="Approved by"
                        value={`${localRequest.approved_by?.name || "—"}${
                          localRequest.approved_at
                            ? ` · ${formatDate(localRequest.approved_at)}`
                            : ""
                        }`}
                      />
                    ) : null}
                    {localRequest.rejected_by ? (
                      <DetailRow
                        label="Rejected by"
                        value={`${localRequest.rejected_by?.name || "—"}${
                          localRequest.rejected_at
                            ? ` · ${formatDate(localRequest.rejected_at)}`
                            : ""
                        }`}
                      />
                    ) : null}
                    {localRequest.approval_comment ? (
                      <DetailRow
                        label="Approval comment"
                        value={localRequest.approval_comment}
                      />
                    ) : null}
                    {localRequest.rejection_comment ? (
                      <DetailRow
                        label="Rejection comment"
                        value={localRequest.rejection_comment}
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
                      localRequest.is_refunded
                        ? formatAmount(
                            localRequest.refunded_amount ?? localRequest.amount
                          )
                        : "—"
                    }
                  />
                  <DetailRow label="Refund via" value={methodLabel} />
                  <DetailRow
                    label="Refunded by"
                    value={localRequest.refunded_by?.name || "—"}
                  />
                  <DetailRow
                    label="Refunded at"
                    value={formatDate(localRequest.refunded_at)}
                  />
                </SimpleGrid>

                {localRequest.is_refunded ? (
                  <PaymentEvidenceGallery
                    value={localRequest.refund_evidence}
                    paymentMethod={methodLabel}
                    title="Refund screenshot"
                  />
                ) : (
                  <Text fontSize="sm" color="gray.500" mt={3}>
                    Payout not completed yet.
                  </Text>
                )}

                {localRequest.is_refunded &&
                (method === "Online Payment" || method === "Online") &&
                !localRequest.refund_evidence ? (
                  <Text fontSize="xs" color="orange.600" mt={2}>
                    No screenshot on file for this online refund.
                  </Text>
                ) : null}
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter gap={2}>
            {canEdit ? (
              <Button
                leftIcon={<Pencil size={16} />}
                borderRadius="xl"
                bg="#FFCB82"
                color="#654E26"
                _hover={{ bg: "#E3B574" }}
                onClick={() => setEditOpen(true)}
              >
                Update Cash / Online
              </Button>
            ) : null}
            <Button borderRadius="xl" onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {canEdit ? (
        <UpdateRefundPayoutAction
          request={localRequest}
          asButton={false}
          isOpen={editOpen}
          onClose={() => setEditOpen(false)}
          onUpdated={(updated) => {
            setLocalRequest(updated);
            onUpdated?.(updated);
          }}
        />
      ) : null}
    </>
  );
}

export default RefundRequestDetailModal;
