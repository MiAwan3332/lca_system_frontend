import React, { useEffect, useState } from "react";
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, Button, Box, Text, Badge, SimpleGrid, VStack, HStack, Divider, Table, Thead, Tbody, Tr, Th, Td, TableContainer } from "@chakra-ui/react";
import moment from "moment";
import { useDispatch, useSelector } from "react-redux";
import Cookies from "js-cookie";
import {
  clearDeletionArchiveDetail,
  fetchDeletionArchiveDetail,
  selectDeletionArchiveDetail,
} from "../../Features/batchSlice";
import LcaLogoLoading from "../../Components/LcaLogoLoading";
import {
  getResponsiveModalSize,
  responsiveModalContentProps,
  responsiveModalProps,
} from "../../utlls/responsiveModal";

const formatRs = (value) =>
  `Rs. ${Number(value || 0).toLocaleString("en-PK", {
    maximumFractionDigits: 0,
  })}`;

const formatDate = (value) => {
  if (!value) return "—";
  const m = moment(value);
  return m.isValid() ? m.format("DD MMM YYYY, hh:mm A") : String(value);
};

const StatCard = ({ label, value, hint }) => (
  <Box
    p={4}
    borderRadius="2xl"
    bg="#FFF8EE"
    border="1px solid"
    borderColor="#F0E2C8"
  >
    <Text fontSize="xs" color="gray.500" mb={1}>
      {label}
    </Text>
    <Text fontSize="lg" fontWeight="700" color="#5C4318">
      {value}
    </Text>
    {hint ? (
      <Text fontSize="xs" color="gray.500" mt={1}>
        {hint}
      </Text>
    ) : null}
  </Box>
);

function DeletedBatchDetailModal({ archiveId, isOpen, onClose }) {
  const dispatch = useDispatch();
  const [authToken] = useState(Cookies.get("authToken"));
  const archive = useSelector(selectDeletionArchiveDetail);
  const { fetchDeletionArchiveDetailStatus } = useSelector(
    (state) => state.batches
  );
  const isLoading = fetchDeletionArchiveDetailStatus === "loading";

  useEffect(() => {
    if (isOpen && archiveId) {
      dispatch(fetchDeletionArchiveDetail({ authToken, archiveId }));
    }
    return () => {
      dispatch(clearDeletionArchiveDetail());
    };
  }, [isOpen, archiveId, authToken, dispatch]);

  const batch = archive?.batch || {};
  const summary = archive?.summary || {};
  const students = archive?.students || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      {...responsiveModalProps}
      {...getResponsiveModalSize("4xl")}
    >
      <ModalOverlay />
      <ModalContent {...responsiveModalContentProps}>
        <ModalHeader>
          Deleted batch
          {batch.name ? (
            <Text as="span" fontWeight="400" color="gray.600">
              {" "}
              — {batch.name}
            </Text>
          ) : null}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {isLoading || !archive ? (
            <Box py={10} textAlign="center">
              <LcaLogoLoading size="sm" />
            </Box>
          ) : (
            <VStack spacing={5} align="stretch">
              <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>
                <StatCard
                  label="Students"
                  value={summary.students_count ?? students.length}
                />
                <StatCard label="Total fee" value={formatRs(summary.total_fee)} />
                <StatCard label="Paid" value={formatRs(summary.paid_fee)} />
                <StatCard
                  label="Remaining"
                  value={formatRs(summary.pending_fee)}
                />
              </SimpleGrid>

              <Box>
                <Text fontWeight="600" mb={2}>
                  Batch details
                </Text>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2} fontSize="sm">
                  <Text>
                    <Text as="span" color="gray.500">
                      Type:{" "}
                    </Text>
                    {batch.batch_type || "—"}
                  </Text>
                  <Text>
                    <Text as="span" color="gray.500">
                      Fee:{" "}
                    </Text>
                    {batch.is_paid_batch === false
                      ? "Unpaid"
                      : batch.batch_fee
                        ? `${batch.batch_fee} Rs.`
                        : "—"}
                  </Text>
                  <Text>
                    <Text as="span" color="gray.500">
                      Dates:{" "}
                    </Text>
                    {batch.startdate || "—"} → {batch.enddate || "—"}
                  </Text>
                  <Text>
                    <Text as="span" color="gray.500">
                      Description:{" "}
                    </Text>
                    {batch.description || "—"}
                  </Text>
                </SimpleGrid>
                <HStack mt={3} spacing={2} flexWrap="wrap">
                  {batch.is_interview_batch ? (
                    <Badge colorScheme="blue">Interview</Badge>
                  ) : null}
                  {batch.is_special_batch ? (
                    <Badge colorScheme="purple">Special</Badge>
                  ) : null}
                </HStack>
              </Box>

              <Divider />

              <Box>
                <Text fontWeight="600" mb={1}>
                  Deleted by
                </Text>
                <Text fontSize="sm">
                  {archive.deleted_by_name || archive.deleted_by?.name || "—"}
                  {archive.deleted_by_role
                    ? ` (${archive.deleted_by_role})`
                    : ""}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  {formatDate(archive.deleted_at)}
                </Text>
              </Box>

              <Box>
                <Text fontWeight="600" mb={2}>
                  Students in this batch ({students.length})
                </Text>
                <TableContainer maxH="320px" overflowY="auto">
                  <Table size="sm" variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Name</Th>
                        <Th>Roll</Th>
                        <Th>Phone</Th>
                        <Th isNumeric>Total</Th>
                        <Th isNumeric>Paid</Th>
                        <Th isNumeric>Remaining</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {students.length === 0 ? (
                        <Tr>
                          <Td colSpan={6}>
                            <Text color="gray.500" textAlign="center" py={4}>
                              No students were enrolled.
                            </Text>
                          </Td>
                        </Tr>
                      ) : (
                        students.map((student) => (
                          <Tr key={String(student._id || student.phone)}>
                            <Td fontWeight="500">{student.name || "—"}</Td>
                            <Td>{student.roll_number || "—"}</Td>
                            <Td>{student.phone || "—"}</Td>
                            <Td isNumeric>{formatRs(student.total_fee)}</Td>
                            <Td isNumeric>{formatRs(student.paid_fee)}</Td>
                            <Td isNumeric>{formatRs(student.pending_fee)}</Td>
                          </Tr>
                        ))
                      )}
                    </Tbody>
                  </Table>
                </TableContainer>
              </Box>
            </VStack>
          )}
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

export default DeletedBatchDetailModal;
