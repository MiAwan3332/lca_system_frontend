import React, { useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import {
  Box,
  Button,
  Progress,
  Text,
  VStack,
  HStack,
  Badge,
  SimpleGrid,
  useToast,
} from "@chakra-ui/react";
import { useDispatch, useSelector } from "react-redux";
import {
  saveQuizAnswer,
  submitQuizAttempt,
} from "../../Features/quizSlice";
import { ChevronLeft, ChevronRight, SkipForward } from "lucide-react";

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function QuizAttempt({ attempt, onSubmitted, onCancel }) {
  const [authToken] = useState(Cookies.get("authToken"));
  const dispatch = useDispatch();
  const toast = useToast();
  const { submitStatus } = useSelector((state) => state.quiz);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState({});
  const [timeLeft, setTimeLeft] = useState(
    attempt.timer_enabled ? attempt.timer_seconds || 600 : null
  );

  const questions = attempt.answers || [];
  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;

  const answeredCount = useMemo(
    () =>
      Object.values(responses).filter(
        (item) => item.selected_option !== null && item.selected_option !== undefined
      ).length,
    [responses]
  );

  const skippedCount = useMemo(
    () => Object.values(responses).filter((item) => item.is_skipped).length,
    [responses]
  );

  useEffect(() => {
    const initial = {};
    questions.forEach((question) => {
      initial[question.question_order] = {
        selected_option: question.selected_option,
        is_skipped: question.is_skipped,
      };
    });
    setResponses(initial);
  }, [attempt._id]);

  useEffect(() => {
    if (!attempt.timer_enabled || timeLeft === null) return undefined;

    if (timeLeft <= 0) {
      handleSubmit(true);
      return undefined;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev !== null ? prev - 1 : prev));
    }, 1000);

    return () => clearInterval(timer);
  }, [attempt.timer_enabled, timeLeft]);

  const persistAnswer = async (questionOrder, payload) => {
    await dispatch(
      saveQuizAnswer({
        authToken,
        attemptId: attempt._id,
        answer: {
          question_order: questionOrder,
          ...payload,
        },
      })
    ).unwrap();
  };

  const handleSelectOption = async (optionIndex) => {
    const questionOrder = currentQuestion.question_order;
    setResponses((prev) => ({
      ...prev,
      [questionOrder]: { selected_option: optionIndex, is_skipped: false },
    }));

    try {
      await persistAnswer(questionOrder, {
        selected_option: optionIndex,
        is_skipped: false,
      });
    } catch (error) {
      toast({
        title: "Could not save answer",
        description: error,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleSkip = async () => {
    const questionOrder = currentQuestion.question_order;
    setResponses((prev) => ({
      ...prev,
      [questionOrder]: { selected_option: null, is_skipped: true },
    }));

    try {
      await persistAnswer(questionOrder, {
        selected_option: null,
        is_skipped: true,
      });
      if (currentIndex < totalQuestions - 1) {
        setCurrentIndex((prev) => prev + 1);
      }
    } catch (error) {
      toast({
        title: "Could not skip question",
        description: error,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleSubmit = async (auto = false) => {
    try {
      const result = await dispatch(
        submitQuizAttempt({ authToken, attemptId: attempt._id })
      ).unwrap();
      onSubmitted(result);
      if (auto) {
        toast({
          title: "Time is up",
          description: "Your quiz was submitted automatically.",
          status: "info",
          duration: 4000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: "Submit failed",
        description: error,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    }
  };

  const getQuestionStatus = (questionOrder) => {
    const response = responses[questionOrder];
    if (!response) return "unanswered";
    if (response.is_skipped) return "skipped";
    if (
      response.selected_option !== null &&
      response.selected_option !== undefined
    ) {
      return "answered";
    }
    return "unanswered";
  };

  if (!currentQuestion) return null;

  const currentResponse = responses[currentQuestion.question_order];

  return (
    <Box className="max-w-5xl mx-auto w-full px-0 sm:px-2">
      <Box className="bg-white rounded-2xl border border-[#E0E8EC] p-4 sm:p-6 mb-4">
        <HStack justify="space-between" mb={4} flexWrap="wrap" gap={3}>
          <VStack align="start" spacing={1}>
            <Text fontSize="lg" fontWeight="semibold">
              {attempt.course?.name || "Quiz"}
            </Text>
            <Text fontSize="sm" color="gray.500">
              Question {currentIndex + 1} of {totalQuestions}
            </Text>
          </VStack>
          <HStack spacing={3}>
            <Badge colorScheme="green">Answered: {answeredCount}</Badge>
            <Badge colorScheme="orange">Skipped: {skippedCount}</Badge>
            <Badge colorScheme="gray">
              Unanswered: {totalQuestions - answeredCount - skippedCount}
            </Badge>
            {attempt.timer_enabled && timeLeft !== null && (
              <Badge colorScheme={timeLeft <= 60 ? "red" : "purple"}>
                {formatTime(timeLeft)}
              </Badge>
            )}
          </HStack>
        </HStack>

        <Progress
          value={((currentIndex + 1) / totalQuestions) * 100}
          size="sm"
          borderRadius="full"
          colorScheme="orange"
          mb={6}
        />

        <Text fontSize="xl" fontWeight="medium" mb={6}>
          {currentQuestion.question}
        </Text>

        <VStack spacing={3} align="stretch">
          {currentQuestion.options.map((option, index) => {
            const isSelected = currentResponse?.selected_option === index;
            return (
              <Button
                key={index}
                variant="outline"
                justifyContent="flex-start"
                whiteSpace="normal"
                height="auto"
                py={4}
                px={4}
                borderRadius="xl"
                borderColor={isSelected ? "#FFCB82" : "#E0E8EC"}
                backgroundColor={isSelected ? "#FFF7E8" : "white"}
                onClick={() => handleSelectOption(index)}
              >
                <Text textAlign="left">
                  {String.fromCharCode(65 + index)}. {option}
                </Text>
              </Button>
            );
          })}
        </VStack>

        <HStack justify="space-between" mt={8} flexWrap="wrap" gap={3}>
          <HStack>
            <Button
              leftIcon={<ChevronLeft size={18} />}
              onClick={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}
              isDisabled={currentIndex === 0}
              variant="outline"
              borderRadius="xl"
            >
              Previous
            </Button>
            <Button
              rightIcon={<ChevronRight size={18} />}
              onClick={() =>
                setCurrentIndex((prev) =>
                  Math.min(prev + 1, totalQuestions - 1)
                )
              }
              isDisabled={currentIndex === totalQuestions - 1}
              variant="outline"
              borderRadius="xl"
            >
              Next
            </Button>
            <Button
              leftIcon={<SkipForward size={18} />}
              onClick={handleSkip}
              variant="ghost"
              borderRadius="xl"
            >
              Skip
            </Button>
          </HStack>

          <HStack>
            <Button variant="ghost" onClick={onCancel} borderRadius="xl">
              Exit
            </Button>
            <Button
              backgroundColor="#82B4FF"
              color="#2D4185"
              _hover={{ backgroundColor: "#74A0E3" }}
              borderRadius="xl"
              onClick={() => handleSubmit(false)}
              isLoading={submitStatus === "loading"}
            >
              Submit Quiz
            </Button>
          </HStack>
        </HStack>
      </Box>

      <Box className="bg-white rounded-2xl border border-[#E0E8EC] p-4 sm:p-6">
        <Text fontWeight="semibold" mb={4}>
          Question Navigator
        </Text>
        <SimpleGrid columns={{ base: 5, md: 10 }} spacing={2}>
          {questions.map((question, index) => {
            const status = getQuestionStatus(question.question_order);
            const colorScheme =
              status === "answered"
                ? "green"
                : status === "skipped"
                ? "orange"
                : "gray";
            return (
              <Button
                key={question.question_order}
                size="sm"
                borderRadius="lg"
                colorScheme={currentIndex === index ? "yellow" : colorScheme}
                variant={currentIndex === index ? "solid" : "outline"}
                onClick={() => setCurrentIndex(index)}
              >
                {index + 1}
              </Button>
            );
          })}
        </SimpleGrid>
      </Box>
    </Box>
  );
}

export default QuizAttempt;
