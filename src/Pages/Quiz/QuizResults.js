import React from "react";
import {
  Box,
  Button,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Text,
  VStack,
  Badge,
  Divider,
} from "@chakra-ui/react";
import { RotateCw, CheckCircle2, XCircle, SkipForward } from "lucide-react";

const PATTERN_LABELS = {
  sequential: "Sequential Order",
  shuffle_questions: "Shuffle Questions",
  shuffle_all: "Shuffle Questions and Options",
};

function formatDuration(seconds) {
  if (!seconds && seconds !== 0) return "N/A";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

function QuizResults({ result, onRetry, onViewHistory }) {
  if (!result) return null;

  return (
    <Box className="max-w-5xl mx-auto w-full px-0 sm:px-2">
      <Box className="bg-white rounded-2xl border border-[#E0E8EC] p-4 sm:p-8 mb-4">
        <Text fontSize="2xl" fontWeight="semibold" mb={2}>
          Quiz Results
        </Text>
        <Text color="gray.500" mb={6}>
          {result.course?.name} • {PATTERN_LABELS[result.pattern] || result.pattern}
        </Text>

        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={8}>
          <Stat className="bg-[#FFF7E8] rounded-xl p-4">
            <StatLabel>Score</StatLabel>
            <StatNumber>{result.percentage}%</StatNumber>
          </Stat>
          <Stat className="bg-green-50 rounded-xl p-4">
            <StatLabel>Correct</StatLabel>
            <StatNumber>{result.correct_count}</StatNumber>
          </Stat>
          <Stat className="bg-red-50 rounded-xl p-4">
            <StatLabel>Incorrect</StatLabel>
            <StatNumber>{result.incorrect_count}</StatNumber>
          </Stat>
          <Stat className="bg-orange-50 rounded-xl p-4">
            <StatLabel>Skipped</StatLabel>
            <StatNumber>{result.skipped_count}</StatNumber>
          </Stat>
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={8}>
          <Box>
            <Text fontSize="sm" color="gray.500">
              Total Questions
            </Text>
            <Text fontWeight="semibold">{result.total_questions}</Text>
          </Box>
          <Box>
            <Text fontSize="sm" color="gray.500">
              Duration
            </Text>
            <Text fontWeight="semibold">
              {formatDuration(result.duration_seconds)}
            </Text>
          </Box>
          <Box>
            <Text fontSize="sm" color="gray.500">
              Submitted At
            </Text>
            <Text fontWeight="semibold">
              {result.ended_at
                ? new Date(result.ended_at).toLocaleString()
                : "N/A"}
            </Text>
          </Box>
        </SimpleGrid>

        <Divider mb={6} />

        <Text fontSize="lg" fontWeight="semibold" mb={4}>
          Question-wise Summary
        </Text>
        <VStack spacing={4} align="stretch">
          {(result.answers || []).map((answer, index) => (
            <Box
              key={answer.question_order}
              className="border border-[#E0E8EC] rounded-xl p-4"
            >
              <HStackHeader
                index={index}
                answer={answer}
              />
              <Text mt={2} fontWeight="medium">
                {answer.question}
              </Text>
              <Text fontSize="sm" color="gray.600" mt={2}>
                Your answer:{" "}
                {answer.is_skipped || answer.selected_option === null
                  ? "Skipped"
                  : answer.options?.[answer.selected_option] || "N/A"}
              </Text>
              <Text fontSize="sm" color="gray.600">
                Correct answer:{" "}
                {answer.options?.[answer.correct_option_index] || "N/A"}
              </Text>
            </Box>
          ))}
        </VStack>

        <HStackActions onRetry={onRetry} onViewHistory={onViewHistory} />
      </Box>
    </Box>
  );
}

function HStackHeader({ index, answer }) {
  let icon = <SkipForward size={16} />;
  let colorScheme = "orange";
  let label = "Skipped";

  if (!answer.is_skipped && answer.selected_option !== null) {
    if (answer.is_correct) {
      icon = <CheckCircle2 size={16} />;
      colorScheme = "green";
      label = "Correct";
    } else {
      icon = <XCircle size={16} />;
      colorScheme = "red";
      label = "Incorrect";
    }
  }

  return (
    <Box className="flex items-center justify-between gap-3 flex-wrap">
      <Text fontWeight="semibold">Q{index + 1}</Text>
      <Badge colorScheme={colorScheme} display="flex" gap={1} alignItems="center">
        {icon}
        {label}
      </Badge>
    </Box>
  );
}

function HStackActions({ onRetry, onViewHistory }) {
  return (
    <Box className="flex gap-3 mt-8 flex-wrap">
      <Button
        leftIcon={<RotateCw size={18} />}
        onClick={onRetry}
        backgroundColor="#FFCB82"
        color="#85652D"
        _hover={{ backgroundColor: "#E3B574" }}
        borderRadius="xl"
      >
        Take Another Quiz
      </Button>
      <Button variant="outline" onClick={onViewHistory} borderRadius="xl">
        View Attempt History
      </Button>
    </Box>
  );
}

export default QuizResults;
