import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Box,
  Flex,
  Text,
  Badge,
  SimpleGrid,
  Spinner,
  VStack,
  HStack,
  Divider,
} from "@chakra-ui/react";
import moment from "moment";
import { useDispatch, useSelector } from "react-redux";
import Cookies from "js-cookie";
import {
  clearDeletionArchiveDetail,
  fetchDeletionArchiveDetail,
  selectDeletionArchiveDetail,
} from "../../Features/studentSlice";
import PaymentEvidenceGallery from "../../Components/PaymentEvidenceGallery";
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

const ACTION_STYLES = {
  Created: { color: "blue", label: "Created" },
  Paid: { color: "green", label: "Paid" },
  Discounted: { color: "orange", label: "Discounted" },
  Deleted: { color: "red", label: "Deleted" },
  Refund: { color: "purple", label: "Refunded" },
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

function DeletedStudentDetailModal({ archiveId, isOpen, onClose }) {
  const dispatch = useDispatch();
  const [authToken] = useState(Cookies.get("authToken"));
  const archive = useSelector(selectDeletionArchiveDetail);
  const { fetchDeletionArchiveDetailStatus } = useSelector(
    (state) => state.students
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

  const student = archive?.student || {};
  const finance = archive?.finance || {};
  const summary = finance.summary || {};
  const feeLogs = useMemo(
    () => (Array.isArray(finance.fee_logs) ? finance.fee_logs : []),
    [finance.fee_logs]
  );
  const fees = useMemo(
    () => (Array.isArray(finance.fees) ? finance.fees : []),
    [finance.fees]
  );
  const refunds = useMemo(
    () =>
      Array.isArray(finance.refund_requests) ? finance.refund_requests : [],
    [finance.refund_requests]
  );
  const slips = useMemo(
    () =>
      Array.isArray(finance.pending_fee_slips)
        ? finance.pending_fee_slips
        : [],
    [finance.pending_fee_slips]
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={getResponsiveModalSize("5xl")}
      {...responsiveModalProps}
    >
      <ModalOverlay />
      <ModalContent {...responsiveModalContentProps}>
        <ModalHeader>
          Deleted student archive
          {student?.name ? ` — ${student.name}` : ""}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          {isLoading || !archive ? (
            <Flex justify="center" py={10}>
              <Spinner />
            </Flex>
          ) : (
            <VStack align="stretch" spacing={5}>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                <Box>
                  <Text fontSize="sm" color="gray.500">
                    Deleted by
                  </Text>
                  <Text fontWeight="600">
                    {archive.deleted_by_name ||
                      archive.deleted_by?.name ||
                      "Unknown"}
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    {archive.deleted_by_email ||
                      archive.deleted_by?.email ||
                      ""}
                    {archive.deleted_by_role
                      ? ` · ${archive.deleted_by_role}`
                      : ""}
                  </Text>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.500">
                    Deleted at
                  </Text>
                  <Text fontWeight="600">{formatDate(archive.deleted_at)}</Text>
                  <Badge mt={1} colorScheme="red">
                    {archive.deletion_source === "batch_delete"
                      ? "Batch delete"
                      : "Student delete"}
                  </Badge>
                </Box>
              </SimpleGrid>

              {archive.deletion_reason ? (
                <Text fontSize="sm" color="gray.600">
                  Reason: {archive.deletion_reason}
                </Text>
              ) : null}

              <SimpleGrid columns={{ base: 2, md: 5 }} spacing={3}>
                <StatCard label="Total" value={formatRs(summary.total_fee)} />
                <StatCard label="Paid" value={formatRs(summary.paid_fee)} />
                <StatCard
                  label="Remaining"
                  value={formatRs(summary.pending_fee)}
                />
                <StatCard label="Cash" value={formatRs(summary.cash_amount)} />
                <StatCard
                  label="Online"
                  value={formatRs(summary.online_amount)}
                />
              </SimpleGrid>

              <Tabs colorScheme="orange" isLazy>
                <TabList flexWrap="wrap">
                  <Tab>Profile</Tab>
                  <Tab>Payments ({feeLogs.length})</Tab>
                  <Tab>Fees ({fees.length})</Tab>
                  <Tab>Refunds ({refunds.length})</Tab>
                  <Tab>Slips ({slips.length})</Tab>
                </TabList>
                <TabPanels>
                  <TabPanel px={0}>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                      <Text>
                        <b>Roll:</b> {student.roll_number || "—"}
                      </Text>
                      <Text>
                        <b>Phone:</b> {student.phone || "—"}
                      </Text>
                      <Text>
                        <b>Email:</b> {student.email || "—"}
                      </Text>
                      <Text>
                        <b>CNIC:</b> {student.cnic || "—"}
                      </Text>
                      <Text>
                        <b>Batch:</b>{" "}
                        {archive.batch_snapshot?.name || "—"}
                      </Text>
                      <Text>
                        <b>Admission:</b> {student.admission_date || "—"}
                      </Text>
                      <Text>
                        <b>City:</b> {student.city || "—"}
                      </Text>
                      <Text>
                        <b>Father:</b> {student.father_name || "—"}
                      </Text>
                    </SimpleGrid>
                  </TabPanel>

                  <TabPanel px={0}>
                    <VStack align="stretch" spacing={3}>
                      {feeLogs.length === 0 ? (
                        <Text color="gray.500">No payment logs archived.</Text>
                      ) : (
                        feeLogs.map((log) => {
                          const style =
                            ACTION_STYLES[log.action_type] || {
                              color: "gray",
                              label: log.action_type || "—",
                            };
                          return (
                            <Box
                              key={String(log._id)}
                              p={3}
                              borderWidth="1px"
                              borderRadius="xl"
                            >
                              <Flex justify="space-between" gap={3} wrap="wrap">
                                <HStack>
                                  <Badge colorScheme={style.color}>
                                    {style.label}
                                  </Badge>
                                  <Text fontWeight="600">
                                    {formatRs(
                                      log.action_amount ?? log.amount
                                    )}
                                  </Text>
                                </HStack>
                                <Text fontSize="sm" color="gray.500">
                                  {formatDate(log.action_date)}
                                </Text>
                              </Flex>
                              <Text fontSize="sm" mt={1}>
                                {log.description || "—"}
                              </Text>
                              <Text fontSize="xs" color="gray.500" mt={1}>
                                Method: {log.payment_method || "—"} · By:{" "}
                                {log.action_by?.name || "—"}
                              </Text>
                              {log.payment_evidence ? (
                                <Box mt={2}>
                                  <PaymentEvidenceGallery
                                    value={log.payment_evidence}
                                    paymentMethod={log.payment_method}
                                  />
                                </Box>
                              ) : null}
                            </Box>
                          );
                        })
                      )}
                    </VStack>
                  </TabPanel>

                  <TabPanel px={0}>
                    <VStack align="stretch" spacing={3}>
                      {fees.length === 0 ? (
                        <Text color="gray.500">No fee rows archived.</Text>
                      ) : (
                        fees.map((fee) => (
                          <Flex
                            key={String(fee._id)}
                            justify="space-between"
                            p={3}
                            borderWidth="1px"
                            borderRadius="xl"
                            wrap="wrap"
                            gap={2}
                          >
                            <Box>
                              <Text fontWeight="600">
                                {formatRs(fee.amount)}
                              </Text>
                              <Text fontSize="sm" color="gray.500">
                                Due: {fee.due_date || "—"} · Batch:{" "}
                                {fee.batch?.name || "—"}
                              </Text>
                            </Box>
                            <Badge
                              colorScheme={
                                fee.status === "Paid" ? "green" : "orange"
                              }
                            >
                              {fee.status || "—"}
                            </Badge>
                          </Flex>
                        ))
                      )}
                    </VStack>
                  </TabPanel>

                  <TabPanel px={0}>
                    <VStack align="stretch" spacing={3}>
                      {refunds.length === 0 ? (
                        <Text color="gray.500">No refund requests.</Text>
                      ) : (
                        refunds.map((row) => (
                          <Box
                            key={String(row._id)}
                            p={3}
                            borderWidth="1px"
                            borderRadius="xl"
                          >
                            <Flex justify="space-between" wrap="wrap" gap={2}>
                              <Text fontWeight="600">
                                {formatRs(row.amount || row.requested_amount)}
                              </Text>
                              <Badge>{row.status}</Badge>
                            </Flex>
                            <Text fontSize="sm" mt={1}>
                              {row.reason || "—"}
                            </Text>
                            <Text fontSize="xs" color="gray.500" mt={1}>
                              Requested by: {row.requested_by?.name || "—"} ·{" "}
                              {formatDate(row.createdAt)}
                            </Text>
                          </Box>
                        ))
                      )}
                    </VStack>
                  </TabPanel>

                  <TabPanel px={0}>
                    <VStack align="stretch" spacing={3}>
                      {slips.length === 0 ? (
                        <Text color="gray.500">No pending fee slips.</Text>
                      ) : (
                        slips.map((slip) => (
                          <Box
                            key={String(slip._id)}
                            p={3}
                            borderWidth="1px"
                            borderRadius="xl"
                          >
                            <Text fontWeight="600">
                              {formatRs(slip.pending_amount)}
                            </Text>
                            <Text fontSize="sm" color="gray.500">
                              Generated by: {slip.generated_by?.name || "—"} ·{" "}
                              {formatDate(slip.createdAt)}
                            </Text>
                            {slip.slip_url ? (
                              <Button
                                as="a"
                                href={slip.slip_url}
                                target="_blank"
                                rel="noreferrer"
                                size="sm"
                                mt={2}
                                variant="outline"
                              >
                                Open slip
                              </Button>
                            ) : null}
                          </Box>
                        ))
                      )}
                    </VStack>
                  </TabPanel>
                </TabPanels>
              </Tabs>

              <Divider />
              <Text fontSize="xs" color="gray.500">
                Archive ID: {archive._id} · Original student ID:{" "}
                {String(archive.original_student_id || "")}
              </Text>
            </VStack>
          )}
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default DeletedStudentDetailModal;
