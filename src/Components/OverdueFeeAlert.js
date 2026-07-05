import React from "react";
import { Box, HStack, Text } from "@chakra-ui/react";
import { AlertTriangle } from "lucide-react";
import {
  formatDueDate,
  getOverdueMessage,
  isFeeOverdue,
} from "../utlls/feeDueDate";

const formatRs = (value) =>
  Number(value || 0).toLocaleString("en-PK", { maximumFractionDigits: 0 });

export function OverdueFeeAlert({
  dueDate,
  amount,
  status = "Pending",
  count,
  mb = 4,
}) {
  if (count != null && count > 0) {
    return (
      <Box
        mb={mb}
        px={4}
        py={3}
        borderRadius="xl"
        bg="#FEE2E2"
        border="1px solid #FCA5A5"
        boxShadow="sm"
      >
        <HStack spacing={3} align="flex-start">
          <Box color="#DC2626" pt={0.5} flexShrink={0}>
            <AlertTriangle size={20} />
          </Box>
          <Box>
            <Text fontWeight="bold" color="#991B1B" fontSize="sm">
              {count} overdue fee record{count === 1 ? "" : "s"} in this list
            </Text>
            <Text fontSize="sm" color="#B91C1C" mt={1}>
              Payment due dates have passed. Please follow up with students immediately.
            </Text>
          </Box>
        </HStack>
      </Box>
    );
  }

  if (!isFeeOverdue(status, dueDate)) return null;

  const overdueMessage = getOverdueMessage(dueDate);

  return (
    <Box
      mb={mb}
      px={4}
      py={3}
      borderRadius="xl"
      bg="#FEE2E2"
      border="1px solid #FCA5A5"
      boxShadow="sm"
    >
      <HStack spacing={3} align="flex-start">
        <Box color="#DC2626" pt={0.5} flexShrink={0}>
          <AlertTriangle size={20} />
        </Box>
        <Box>
          <Text fontWeight="bold" color="#991B1B" fontSize="sm">
            Payment overdue — due date exceeded
          </Text>
          <Text fontSize="sm" color="#B91C1C" mt={1}>
            {overdueMessage}. Due date was {formatDueDate(dueDate)}
            {amount != null ? ` · Outstanding: Rs. ${formatRs(amount)}` : ""}
          </Text>
        </Box>
      </HStack>
    </Box>
  );
}

export function DueDateCell({ status, dueDate }) {
  const overdue = isFeeOverdue(status, dueDate);
  const overdueMessage = getOverdueMessage(dueDate);

  return (
    <Box>
      <Text
        fontSize="sm"
        color={overdue ? "#DC2626" : "#4A5568"}
        fontWeight={overdue ? "bold" : "normal"}
      >
        {formatDueDate(dueDate)}
      </Text>
      {overdue && (
        <Text fontSize="xs" color="#DC2626" fontWeight="semibold" mt={1}>
          {overdueMessage}
        </Text>
      )}
    </Box>
  );
}

export default OverdueFeeAlert;
