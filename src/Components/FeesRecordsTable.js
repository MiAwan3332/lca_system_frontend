import React from "react";
import {
  Badge,
  Box,
  Flex,
  HStack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  TableContainer,
  ButtonGroup,
  Avatar,
} from "@chakra-ui/react";
import { FileX, Receipt } from "lucide-react";
import TableRowLoading from "./TableRowLoading";
import FeeHistoryModal from "../Pages/Fees/FeeHistoryModal";
import PayFeeModal from "../Pages/Fees/PayFeeModal";
import DeleteFeeModal from "../Pages/Fees/DeleteFeeModal";
import DiscountFeeModal from "../Pages/Fees/DiscountFeeModal";
import ActionMenu from "./ActionMenu";
import { DueDateCell } from "./OverdueFeeAlert";
import { isFeeOverdue } from "../utlls/feeDueDate";

const formatRs = (value) =>
  `Rs. ${Number(value || 0).toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;

function FeesRecordsTable({ fees, fetchStatus, viewOnly, pagination }) {
  const totalDocs = pagination?.totalDocs ?? fees.length;

  return (
    <Box>
      <Flex
        align={{ base: "flex-start", sm: "center" }}
        justify="space-between"
        mb={3}
        px={1}
        gap={3}
        flexWrap="wrap"
      >
        <HStack spacing={3}>
          <Box p={2} borderRadius="xl" bg="#F0F6FF" color="#2D4185">
            <Receipt size={20} />
          </Box>
          <Box>
            <Text fontSize="lg" fontWeight="semibold" color="#2D3748">
              {viewOnly ? "My Fee Records" : "Fee Records"}
            </Text>
            <Text fontSize="sm" color="#718096">
              {viewOnly
                ? "Your payment history and due dates"
                : "Manage payments, discounts, and fee history"}
            </Text>
          </Box>
        </HStack>
        <Badge
          px={3}
          py={1}
          borderRadius="full"
          bg="#FFFBF5"
          color="#85652D"
          border="1px solid #FFCB82"
          fontSize="sm"
        >
          {totalDocs} record{totalDocs === 1 ? "" : "s"}
        </Badge>
      </Flex>

      <Box
        bg="white"
        border="1px solid"
        borderColor="#E0E8EC"
        borderRadius="2xl"
        overflow="hidden"
        boxShadow="sm"
      >
        <TableContainer>
          <Table variant="simple" size="md">
            <Thead>
              <Tr bg="#F7FAFC">
                <Th borderColor="#E0E8EC" color="#4A5568" w="50px">
                  #
                </Th>
                <Th borderColor="#E0E8EC" color="#4A5568" w="70px">
                  History
                </Th>
                <Th borderColor="#E0E8EC" color="#4A5568">
                  Student
                </Th>
                <Th borderColor="#E0E8EC" color="#4A5568">
                  Batch
                </Th>
                <Th borderColor="#E0E8EC" color="#4A5568" isNumeric>
                  Amount
                </Th>
                <Th borderColor="#E0E8EC" color="#4A5568">
                  Due Date
                </Th>
                <Th borderColor="#E0E8EC" color="#4A5568">
                  Status
                </Th>
                {!viewOnly && (
                  <Th borderColor="#E0E8EC" color="#4A5568" isNumeric>
                    Actions
                  </Th>
                )}
              </Tr>
            </Thead>
            <Tbody>
              {fetchStatus === "loading" ? (
                <TableRowLoading
                  nOfColumns={viewOnly ? 7 : 8}
                  actions={["w-10", "w-10", "w-10", "w-10", "w-10", "w-10", "w-10", "w-20"]}
                />
              ) : Array.isArray(fees) && fees.length > 0 ? (
                fees.map((fee, index) => {
                  const isPaid = fee.status === "Paid";
                  const overdue = isFeeOverdue(fee.status, fee.due_date);
                  const studentName = fee.student?.name || "Unknown";
                  return (
                    <Tr
                      key={fee._id}
                      bg={overdue ? "#FFF5F5" : undefined}
                      _hover={{ bg: overdue ? "#FEE2E2" : "#FFFBF5" }}
                      transition="background 0.15s ease"
                    >
                      <Td borderColor="#EDF2F7" color="#718096" fontSize="sm">
                        {index + 1}
                      </Td>
                      <Td borderColor="#EDF2F7">
                        <ButtonGroup variant="outline" size="sm">
                          <FeeHistoryModal fee={fee} />
                        </ButtonGroup>
                      </Td>
                      <Td borderColor="#EDF2F7">
                        <HStack spacing={3}>
                          <Avatar
                            size="sm"
                            name={studentName}
                            bg="#82B4FF"
                            color="#2D4185"
                            fontSize="xs"
                            fontWeight="bold"
                          />
                          <Text fontWeight="medium" color="#2D3748">
                            {studentName}
                          </Text>
                        </HStack>
                      </Td>
                      <Td borderColor="#EDF2F7">
                        <Badge
                          variant="subtle"
                          colorScheme="gray"
                          borderRadius="md"
                          px={2}
                        >
                          {fee.batch?.name || "N/A"}
                        </Badge>
                      </Td>
                      <Td
                        borderColor="#EDF2F7"
                        isNumeric
                        fontWeight="semibold"
                        color="#2D3748"
                      >
                        {formatRs(fee.amount)}
                      </Td>
                      <Td borderColor="#EDF2F7">
                        <DueDateCell status={fee.status} dueDate={fee.due_date} />
                      </Td>
                      <Td borderColor="#EDF2F7">
                        <Badge
                          borderRadius="full"
                          px={3}
                          py={0.5}
                          colorScheme={isPaid ? "green" : overdue ? "red" : "orange"}
                          variant={overdue && !isPaid ? "solid" : "subtle"}
                        >
                          {isPaid ? fee.status : overdue ? "Overdue" : fee.status}
                        </Badge>
                      </Td>
                      {!viewOnly && (
                        <Td borderColor="#EDF2F7" isNumeric>
                          <div className="action-cell">
                            <ActionMenu>
                              <PayFeeModal
                                fee={fee}
                                isDisabled={fee.amount === 0 || isPaid}
                              />
                              <DiscountFeeModal
                                fee={fee}
                                isDisabled={fee.amount === 0 || isPaid}
                              />
                              <DeleteFeeModal fee={fee} />
                            </ActionMenu>
                          </div>
                        </Td>
                      )}
                    </Tr>
                  );
                })
              ) : (
                <Tr>
                  <Td colSpan={viewOnly ? 7 : 8} py={16}>
                    <Flex direction="column" align="center" gap={3} color="#A0AEC0">
                      <Box p={4} borderRadius="full" bg="#F7FAFC">
                        <FileX size={32} />
                      </Box>
                      <Text fontWeight="medium" color="#718096">
                        No fee records found
                      </Text>
                      <Text fontSize="sm" textAlign="center" maxW="sm">
                        Try adjusting the date, batch, or status filters to see more
                        results.
                      </Text>
                    </Flex>
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
}

export default FeesRecordsTable;
