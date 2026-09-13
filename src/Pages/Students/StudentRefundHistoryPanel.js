import React, { useEffect, useRef, useState } from "react";
import Cookies from "js-cookie";
import moment from "moment";
import {
  Badge,
  Button,
  FormControl,
  HStack,
  Select,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
} from "@chakra-ui/react";
import { Eye, FileX, FilterX } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import TableSearch from "../../Components/TableSearch";
import TableRowLoading from "../../Components/TableRowLoading";
import TablePagination from "../../Components/TablePagination";
import { DataTableShell, FilterStack } from "../../Components/PageHeader";
import ActionMenu from "../../Components/ActionMenu";
import ActionButton from "../../Components/ActionButton";
import {
  clearRefundFilters,
  fetchRefundRequests,
  selectAllRefundRequests,
  setLimitFilter,
  setPageFilter,
  setQueryFilter,
  setStatusFilter,
} from "../../Features/refundRequestSlice";
import ProcessRefundAction from "./ProcessRefundAction";
import RefundRequestDetailModal from "./RefundRequestDetailModal";
import UpdateRefundPayoutAction from "./UpdateRefundPayoutAction";
import { canUpdateRefundPayout } from "../../utlls/refundAccess";

const formatAmount = (amount) =>
  `Rs. ${Number(amount || 0).toLocaleString("en-PK", {
    maximumFractionDigits: 0,
  })}`;

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "Pending", label: "Pending" },
  { value: "Approved", label: "Approved" },
  { value: "AwaitingRefund", label: "Awaiting payout" },
  { value: "Refunded", label: "Refunded" },
  { value: "Rejected", label: "Rejected" },
];

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

/**
 * Separate refund-history table for All Students page toggle.
 */
function StudentRefundHistoryPanel() {
  const tableSearchRef = useRef();
  const [authToken] = useState(Cookies.get("authToken"));
  const [detailRequest, setDetailRequest] = useState(null);
  const dispatch = useDispatch();
  const requests = useSelector(selectAllRefundRequests);
  const {
    fetchStatus,
    pagination,
    filters,
    pendingCount,
    approvedCount,
    rejectedCount,
    refundedCount,
  } = useSelector((state) => state.refundRequests);

  const loadRequests = () => {
    dispatch(fetchRefundRequests({ authToken }));
  };

  useEffect(() => {
    dispatch(clearRefundFilters());
    dispatch(setLimitFilter(20));
    dispatch(fetchRefundRequests({ authToken }));
  }, [authToken, dispatch]);

  const handleStatusChange = (e) => {
    dispatch(setStatusFilter(e.target.value));
    loadRequests();
  };

  const handleClearFilters = () => {
    tableSearchRef.current?.clearSearch?.();
    dispatch(clearRefundFilters());
    dispatch(setLimitFilter(20));
    loadRequests();
  };

  return (
    <>
      <HStack spacing={3} flexWrap="wrap" mb={2} mt={2}>
        <Badge colorScheme="orange" borderRadius="md" px={3} py={1}>
          Pending: {pendingCount || 0}
        </Badge>
        <Badge colorScheme="green" borderRadius="md" px={3} py={1}>
          Approved: {approvedCount || 0}
        </Badge>
        <Badge colorScheme="purple" borderRadius="md" px={3} py={1}>
          Refunded: {refundedCount || 0}
        </Badge>
        <Badge colorScheme="red" borderRadius="md" px={3} py={1}>
          Rejected: {rejectedCount || 0}
        </Badge>
      </HStack>

      <FilterStack className="filter-stack--panel filter-stack--table mb-2">
        <div className="w-full sm:max-w-xs">
          <TableSearch
            ref={tableSearchRef}
            setQueryFilter={setQueryFilter}
            method={fetchRefundRequests}
            placeholder="Search student, phone, roll, reason..."
          />
        </div>
        <FormControl className="responsive-input" w={{ base: "full", md: "12rem" }}>
          <Select
            size="lg"
            borderRadius="xl"
            value={filters.status || ""}
            onChange={handleStatusChange}
          >
            {STATUS_FILTERS.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormControl>
        <Button size="icon" p={4} borderRadius="xl" onClick={handleClearFilters}>
          <FilterX className="h-4 w-4" />
        </Button>
      </FilterStack>

      <DataTableShell>
        <TableContainer>
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th>#</Th>
                <Th>Student</Th>
                <Th>Batch</Th>
                <Th>Amount</Th>
                <Th>Reason</Th>
                <Th>Requested by</Th>
                <Th>Date</Th>
                <Th>Status</Th>
                <Th>Decision / payout</Th>
                <Th isNumeric>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {fetchStatus === "loading" ? (
                <TableRowLoading nOfColumns={10} />
              ) : requests.length === 0 ? (
                <Tr>
                  <Td colSpan={10}>
                    <span className="flex justify-center items-center gap-2 text-[#A1A1A1] py-8">
                      <FileX />
                      No refund history found
                    </span>
                  </Td>
                </Tr>
              ) : (
                requests.map((request, index) => {
                  const statusMeta = getDisplayStatus(request);
                  const studentForAction =
                    request.student && typeof request.student === "object"
                      ? {
                          ...request.student,
                          name: request.student.name || request.student_name,
                          phone: request.student.phone || request.student_phone,
                          roll_number:
                            request.student.roll_number ||
                            request.student_roll_number,
                          approved_refund_request: request.is_refunded
                            ? null
                            : request.status === "Approved"
                              ? request
                              : request.student.approved_refund_request,
                        }
                      : {
                          _id: request.student,
                          name: request.student_name,
                          phone: request.student_phone,
                          roll_number: request.student_roll_number,
                          approved_refund_request:
                            !request.is_refunded && request.status === "Approved"
                              ? request
                              : null,
                        };

                  return (
                    <Tr key={request._id}>
                      <Td>
                        {(pagination.page - 1) * pagination.limit + index + 1}
                      </Td>
                      <Td>
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="600">
                            {request.student_name ||
                              request.student?.name ||
                              "—"}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            {request.student_roll_number ||
                              request.student?.roll_number ||
                              "—"}{" "}
                            ·{" "}
                            {request.student_phone ||
                              request.student?.phone ||
                              "—"}
                          </Text>
                        </VStack>
                      </Td>
                      <Td>{request.batch_name || "—"}</Td>
                      <Td>
                        <Text fontWeight="600">
                          {formatAmount(request.amount)}
                        </Text>
                        {request.requested_amount != null &&
                        Number(request.requested_amount) !==
                          Number(request.amount) ? (
                          <Text fontSize="xs" color="gray.500">
                            Requested: {formatAmount(request.requested_amount)}
                          </Text>
                        ) : null}
                        {request.is_refunded && request.refunded_amount != null ? (
                          <Text fontSize="xs" color="purple.600">
                            Paid out: {formatAmount(request.refunded_amount)}
                          </Text>
                        ) : null}
                      </Td>
                      <Td maxW="220px">
                        <Text noOfLines={2} title={request.reason || ""}>
                          {request.reason || "—"}
                        </Text>
                      </Td>
                      <Td>
                        <Text fontSize="sm">
                          {request.requested_by?.name || "—"}
                        </Text>
                      </Td>
                      <Td>
                        {request.createdAt
                          ? moment(request.createdAt).format(
                              "DD MMM YYYY, hh:mm A"
                            )
                          : "—"}
                      </Td>
                      <Td>
                        <Badge colorScheme={statusMeta.color} borderRadius="md">
                          {statusMeta.label}
                        </Badge>
                      </Td>
                      <Td maxW="200px">
                        {request.approval_comment ||
                        request.rejection_comment ? (
                          <Text fontSize="xs" noOfLines={2}>
                            {request.approval_comment ||
                              request.rejection_comment}
                          </Text>
                        ) : (
                          <Text fontSize="xs" color="gray.400">
                            —
                          </Text>
                        )}
                        {request.is_refunded ? (
                          <Text fontSize="xs" color="gray.500" mt={1}>
                            By {request.refunded_by?.name || "—"}
                            {request.refunded_at
                              ? ` · ${moment(request.refunded_at).format(
                                  "DD MMM YYYY"
                                )}`
                              : ""}
                            {request.refund_payment_method
                              ? ` · ${
                                  request.refund_payment_method ===
                                    "Online Payment" ||
                                  request.refund_payment_method === "Online"
                                    ? "Online"
                                    : "Cash"
                                }`
                              : ""}
                          </Text>
                        ) : null}
                      </Td>
                      <Td isNumeric>
                        <ActionMenu>
                          <ActionButton
                            variant="blue"
                            icon={<Eye size={16} />}
                            label="View Details"
                            onClick={() => setDetailRequest(request)}
                          />
                          {canUpdateRefundPayout() && request.is_refunded ? (
                            <UpdateRefundPayoutAction
                              request={request}
                              onUpdated={(updated) => setDetailRequest(updated)}
                            />
                          ) : null}
                          {!request.is_refunded &&
                          request.status === "Approved" ? (
                            <ProcessRefundAction student={studentForAction} />
                          ) : null}
                        </ActionMenu>
                      </Td>
                    </Tr>
                  );
                })
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

      {detailRequest ? (
        <RefundRequestDetailModal
          request={detailRequest}
          isOpen={Boolean(detailRequest)}
          onClose={() => setDetailRequest(null)}
          onUpdated={(updated) => setDetailRequest(updated)}
        />
      ) : null}
    </>
  );
}

export default StudentRefundHistoryPanel;
