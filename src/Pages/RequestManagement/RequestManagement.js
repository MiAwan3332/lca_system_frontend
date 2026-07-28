import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import moment from "moment";
import {
  Badge,
  Button,
  FormControl,
  HStack,
  Select,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useDisclosure,
} from "@chakra-ui/react";
import {
  Check,
  CheckCircle,
  Clock,
  FileX,
  FilterX,
  X,
  XCircle,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import TableSearch from "../../Components/TableSearch";
import TableRowLoading from "../../Components/TableRowLoading";
import TablePagination from "../../Components/TablePagination";
import PageHeader, { DataTableShell, FilterStack } from "../../Components/PageHeader";
import DecisionModal from "./DecisionModal";
import {
  approveRefundRequest,
  clearRefundFilters,
  fetchRefundRequests,
  rejectRefundRequest,
  selectAllRefundRequests,
  setLimitFilter,
  setPageFilter,
  setQueryFilter,
  setStatusFilter,
} from "../../Features/refundRequestSlice";
import { canAccessRequestManagement } from "../../utlls/refundAccess";

const STATUS_OPTIONS = ["Pending", "Approved", "Rejected"];

const getStatusColor = (status) => {
  if (status === "Approved") return "green";
  if (status === "Rejected") return "red";
  return "orange";
};

const formatAmount = (amount) =>
  `Rs. ${Number(amount || 0).toLocaleString("en-PK", {
    maximumFractionDigits: 0,
  })}`;

function RequestManagement() {
  const [authToken] = useState(Cookies.get("authToken"));
  const dispatch = useDispatch();
  const requests = useSelector(selectAllRefundRequests);
  const {
    fetchStatus,
    pagination,
    filters,
    pendingCount,
    approvedCount,
    rejectedCount,
    decisionStatus,
  } = useSelector((state) => state.refundRequests);

  const approveDisclosure = useDisclosure();
  const rejectDisclosure = useDisclosure();
  const [selectedRequest, setSelectedRequest] = useState(null);

  const loadRequests = () => {
    dispatch(fetchRefundRequests({ authToken }));
  };

  useEffect(() => {
    if (canAccessRequestManagement()) {
      dispatch(fetchRefundRequests({ authToken }));
    }
  }, [authToken, dispatch]);

  if (!canAccessRequestManagement()) {
    return (
      <Text color="gray.500" py={10} textAlign="center">
        You do not have access to Request Management.
      </Text>
    );
  }

  const handleStatusChange = (e) => {
    dispatch(setStatusFilter(e.target.value));
    loadRequests();
  };

  const handleClearFilters = () => {
    dispatch(clearRefundFilters());
    loadRequests();
  };

  const openApprove = (request) => {
    setSelectedRequest(request);
    approveDisclosure.onOpen();
  };

  const openReject = (request) => {
    setSelectedRequest(request);
    rejectDisclosure.onOpen();
  };

  const handleApprove = ({ comment, amount }) => {
    if (!selectedRequest) return;
    dispatch(
      approveRefundRequest({
        authToken,
        requestId: selectedRequest._id,
        comment,
        amount,
      })
    )
      .unwrap()
      .then(() => {
        approveDisclosure.onClose();
        setSelectedRequest(null);
        loadRequests();
      })
      .catch(() => {});
  };

  const handleReject = ({ comment }) => {
    if (!selectedRequest) return;
    dispatch(
      rejectRefundRequest({
        authToken,
        requestId: selectedRequest._id,
        comment,
      })
    )
      .unwrap()
      .then(() => {
        rejectDisclosure.onClose();
        setSelectedRequest(null);
        loadRequests();
      })
      .catch(() => {});
  };

  return (
    <>
      <PageHeader
        title="Request Management"
        subtitle="Review and decide student refund requests"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Stat p={4} bg="white" borderRadius="xl" border="1px solid #E0E8EC">
          <StatLabel>Pending</StatLabel>
          <StatNumber color="orange.500">{pendingCount}</StatNumber>
          <StatHelpText>
            <Clock size={14} style={{ display: "inline", marginRight: 4 }} />
            Awaiting decision
          </StatHelpText>
        </Stat>
        <Stat p={4} bg="white" borderRadius="xl" border="1px solid #E0E8EC">
          <StatLabel>Approved</StatLabel>
          <StatNumber color="green.500">{approvedCount}</StatNumber>
          <StatHelpText>
            <CheckCircle size={14} style={{ display: "inline", marginRight: 4 }} />
            Approved refunds
          </StatHelpText>
        </Stat>
        <Stat p={4} bg="white" borderRadius="xl" border="1px solid #E0E8EC">
          <StatLabel>Rejected</StatLabel>
          <StatNumber color="red.500">{rejectedCount}</StatNumber>
          <StatHelpText>
            <XCircle size={14} style={{ display: "inline", marginRight: 4 }} />
            Rejected refunds
          </StatHelpText>
        </Stat>
      </div>

      <DataTableShell>
        <FilterStack>
          <TableSearch
            placeholder="Search student, roll no, reason..."
            setQueryFilter={setQueryFilter}
            method={fetchRefundRequests}
          />
          <FormControl maxW="180px">
            <Select
              value={filters.status || ""}
              onChange={handleStatusChange}
              borderRadius="lg"
            >
              <option value="">All Status</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>
          </FormControl>
          <Button
            leftIcon={<FilterX size={16} />}
            variant="outline"
            borderRadius="lg"
            onClick={handleClearFilters}
          >
            Clear
          </Button>
        </FilterStack>

        <TableContainer>
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th>#</Th>
                <Th>Student</Th>
                <Th>Batch</Th>
                <Th>Amount</Th>
                <Th>Reason</Th>
                <Th>Requested By</Th>
                <Th>Date</Th>
                <Th>Status</Th>
                <Th>Decision</Th>
                <Th isNumeric>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {fetchStatus === "loading" ? (
                <TableRowLoading colSpan={10} />
              ) : requests.length === 0 ? (
                <Tr>
                  <Td colSpan={10}>
                    <div className="flex flex-col items-center py-10 text-gray-400">
                      <FileX size={36} />
                      <Text mt={2}>No refund requests found</Text>
                    </div>
                  </Td>
                </Tr>
              ) : (
                requests.map((request, index) => (
                  <Tr key={request._id}>
                    <Td>
                      {(pagination.page - 1) * pagination.limit + index + 1}
                    </Td>
                    <Td>
                      <Text fontWeight="600">{request.student_name || "—"}</Text>
                      <Text fontSize="xs" color="gray.500">
                        {request.student_roll_number || "No roll"} ·{" "}
                        {request.student_phone || "N/A"}
                      </Text>
                    </Td>
                    <Td>{request.batch_name || "—"}</Td>
                    <Td fontWeight="600">
                      <Text>{formatAmount(request.amount)}</Text>
                      {request.requested_amount != null &&
                      Number(request.requested_amount) !== Number(request.amount) ? (
                        <Text fontSize="xs" color="gray.500">
                          Requested: {formatAmount(request.requested_amount)}
                        </Text>
                      ) : null}
                      {request.is_refunded ? (
                        <Text fontSize="xs" color="gray.500">
                          Refunded:{" "}
                          {formatAmount(request.refunded_amount ?? request.amount)}
                        </Text>
                      ) : null}
                    </Td>
                    <Td maxW="220px">
                      <Text noOfLines={2}>{request.reason}</Text>
                    </Td>
                    <Td>{request.requested_by?.name || "—"}</Td>
                    <Td>
                      {request.createdAt
                        ? moment(request.createdAt).format("DD MMM YYYY")
                        : "—"}
                    </Td>
                    <Td>
                      <Badge colorScheme={getStatusColor(request.status)}>
                        {request.status}
                      </Badge>
                      {request.status === "Approved" && request.is_refunded ? (
                        <Badge colorScheme="purple" ml={1}>
                          Refunded
                        </Badge>
                      ) : null}
                      {request.status === "Approved" && !request.is_refunded ? (
                        <Badge colorScheme="orange" ml={1}>
                          Awaiting Refund
                        </Badge>
                      ) : null}
                    </Td>
                    <Td maxW="200px">
                      {request.status === "Approved" ? (
                        <Text fontSize="xs" noOfLines={2}>
                          {request.approval_comment || "—"}
                          {request.approved_by?.name
                            ? ` — ${request.approved_by.name}`
                            : ""}
                        </Text>
                      ) : request.status === "Rejected" ? (
                        <Text fontSize="xs" noOfLines={2}>
                          {request.rejection_comment || "—"}
                          {request.rejected_by?.name
                            ? ` — ${request.rejected_by.name}`
                            : ""}
                        </Text>
                      ) : (
                        <Text fontSize="xs" color="gray.400">
                          —
                        </Text>
                      )}
                    </Td>
                    <Td isNumeric>
                      {request.status === "Pending" ? (
                        <HStack justify="flex-end" spacing={1}>
                          <Button
                            size="sm"
                            borderRadius="lg"
                            backgroundColor="#82FFCB"
                            color="#1F6D4A"
                            _hover={{ backgroundColor: "#74E3B5" }}
                            leftIcon={<Check size={14} />}
                            onClick={() => openApprove(request)}
                            isLoading={decisionStatus === "loading"}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            borderRadius="lg"
                            backgroundColor="#FF8A8A"
                            color="#6D1F1F"
                            _hover={{ backgroundColor: "#E48080" }}
                            leftIcon={<X size={14} />}
                            onClick={() => openReject(request)}
                            isLoading={decisionStatus === "loading"}
                          >
                            Reject
                          </Button>
                        </HStack>
                      ) : request.status === "Approved" && !request.is_refunded ? (
                        <Text fontSize="xs" color="orange.500">
                          Use Students → Refund
                        </Text>
                      ) : (
                        <Text fontSize="xs" color="gray.400">
                          Done
                        </Text>
                      )}
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </TableContainer>
      </DataTableShell>

      {fetchStatus !== "loading" && (
        <TablePagination
          pagination={pagination}
          setLimitFilter={setLimitFilter}
          setPageFilter={setPageFilter}
          method={fetchRefundRequests}
        />
      )}

      <DecisionModal
        isOpen={approveDisclosure.isOpen}
        onClose={approveDisclosure.onClose}
        onConfirm={handleApprove}
        isLoading={decisionStatus === "loading"}
        mode="approve"
        initialAmount={selectedRequest?.amount ?? ""}
      />
      <DecisionModal
        isOpen={rejectDisclosure.isOpen}
        onClose={rejectDisclosure.onClose}
        onConfirm={handleReject}
        isLoading={decisionStatus === "loading"}
        mode="reject"
      />
    </>
  );
}

export default RequestManagement;
