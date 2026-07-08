import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  Button,
  Spinner,
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  useDisclosure,
} from "@chakra-ui/react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchQuizAttempts,
  fetchQuizAttemptLog,
} from "../../Features/quizSlice";
import { FileX, Eye } from "lucide-react";
import { DataTableShell } from "../../Components/PageHeader";
import { getResponsiveModalSize, responsiveModalContentProps } from "../../utlls/responsiveModal";
import { isStudentViewOnly } from "../../utlls/studentAccess";

const PATTERN_LABELS = {
  sequential: "Sequential",
  shuffle_questions: "Shuffle Questions",
  shuffle_all: "Shuffle All",
};

function formatDuration(seconds) {
  if (!seconds && seconds !== 0) return "-";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

function QuizHistory() {
  const [authToken] = useState(Cookies.get("authToken"));
  const dispatch = useDispatch();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const viewOnly = isStudentViewOnly();

  const { attempts, historyStatus, pagination, result } = useSelector(
    (state) => state.quiz
  );

  useEffect(() => {
    dispatch(fetchQuizAttempts({ authToken }));
  }, [authToken, dispatch]);

  const handleViewLog = (attemptId) => {
    dispatch(fetchQuizAttemptLog({ authToken, attemptId }))
      .unwrap()
      .then(() => onOpen());
  };

  if (historyStatus === "loading") {
    return (
      <Box className="flex justify-center py-16">
        <Spinner size="lg" />
      </Box>
    );
  }

  return (
    <>
      <DataTableShell>
        <Box className="px-4 sm:px-6 py-4 border-b border-[#E0E8EC]">
          <Text fontSize="xl" fontWeight="semibold">
            {viewOnly ? "My Attempt History" : "Quiz Attempt Logs"}
          </Text>
        </Box>
        <TableContainer>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>No</Th>
                {!viewOnly && <Th>Student</Th>}
                <Th>Subject</Th>
                <Th>Pattern</Th>
                <Th>Score</Th>
                <Th>Correct</Th>
                <Th>Incorrect</Th>
                <Th>Skipped</Th>
                <Th>Duration</Th>
                <Th>Date</Th>
                <Th isNumeric>Action</Th>
              </Tr>
            </Thead>
            <Tbody>
              {attempts.length === 0 ? (
                <Tr>
                  <Td colSpan={viewOnly ? 10 : 11}>
                    <span className="flex justify-center items-center gap-2 text-[#A1A1A1] py-6">
                      <FileX />
                      No attempt logs found
                    </span>
                  </Td>
                </Tr>
              ) : (
                attempts.map((attempt, index) => (
                  <Tr key={attempt._id}>
                    <Td>{index + 1}</Td>
                    {!viewOnly && (
                      <Td>{attempt.student?.name || "N/A"}</Td>
                    )}
                    <Td>{attempt.course?.name || "N/A"}</Td>
                    <Td>
                      <Badge>
                        {PATTERN_LABELS[attempt.pattern] || attempt.pattern}
                      </Badge>
                    </Td>
                    <Td>{attempt.percentage}%</Td>
                    <Td>{attempt.correct_count}</Td>
                    <Td>{attempt.incorrect_count}</Td>
                    <Td>{attempt.skipped_count}</Td>
                    <Td>{formatDuration(attempt.duration_seconds)}</Td>
                    <Td>
                      {attempt.ended_at
                        ? new Date(attempt.ended_at).toLocaleString()
                        : "-"}
                    </Td>
                    <Td isNumeric>
                      <Button
                        size="sm"
                        leftIcon={<Eye size={16} />}
                        variant="outline"
                        borderRadius="lg"
                        onClick={() => handleViewLog(attempt._id)}
                      >
                        View
                      </Button>
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </TableContainer>
      </DataTableShell>

      <Modal isOpen={isOpen} onClose={onClose} {...getResponsiveModalSize("4xl")}>
        <ModalOverlay />
        <ModalContent {...responsiveModalContentProps}>
          <ModalHeader>Attempt Detail Log</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {result && (
              <VStack align="stretch" spacing={4}>
                <Box className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Box>
                    <Text fontSize="sm" color="gray.500">
                      Score
                    </Text>
                    <Text fontWeight="bold">{result.percentage}%</Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.500">
                      Correct
                    </Text>
                    <Text fontWeight="bold">{result.correct_count}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.500">
                      Incorrect
                    </Text>
                    <Text fontWeight="bold">{result.incorrect_count}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.500">
                      Skipped
                    </Text>
                    <Text fontWeight="bold">{result.skipped_count}</Text>
                  </Box>
                </Box>

                {(result.answers || []).map((answer, index) => (
                  <Box
                    key={answer.question_order}
                    className="border border-[#E0E8EC] rounded-xl p-4"
                  >
                    <Text fontWeight="semibold" mb={2}>
                      Q{index + 1}. {answer.question}
                    </Text>
                    <Text fontSize="sm">
                      Selected:{" "}
                      {answer.is_skipped || answer.selected_option === null
                        ? "Skipped"
                        : answer.options?.[answer.selected_option]}
                    </Text>
                    <Text fontSize="sm">
                      Correct: {answer.options?.[answer.correct_option_index]}
                    </Text>
                    <Badge
                      mt={2}
                      colorScheme={
                        answer.is_skipped
                          ? "orange"
                          : answer.is_correct
                          ? "green"
                          : "red"
                      }
                    >
                      {answer.is_skipped
                        ? "Skipped"
                        : answer.is_correct
                        ? "Correct"
                        : "Incorrect"}
                    </Badge>
                  </Box>
                ))}
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}

export default QuizHistory;
