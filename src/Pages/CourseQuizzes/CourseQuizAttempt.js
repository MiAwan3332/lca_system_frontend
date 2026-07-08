import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Button,
  Text,
  VStack,
  Radio,
  RadioGroup,
  Stack,
  Progress,
  Textarea,
  HStack,
  Badge,
} from "@chakra-ui/react";
import { useDispatch, useSelector } from "react-redux";
import {
  saveCourseQuizAnswer,
  submitCourseQuizAttempt,
  clearActiveAttempt,
} from "../../Features/courseQuizSlice";

function CourseQuizAttempt({ authToken, quiz, onExit, onSubmitted }) {
  const dispatch = useDispatch();
  const attempt = useSelector((state) => state.courseQuizzes.activeAttempt);
  const questions = useSelector((state) => state.courseQuizzes.activeQuestions);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState((quiz?.duration_minutes || 30) * 60);

  const handleSubmit = useCallback(async () => {
    const result = await dispatch(
      submitCourseQuizAttempt({ authToken, attemptId: attempt._id })
    );
    if (result.payload) onSubmitted(result.payload);
  }, [dispatch, authToken, attempt, onSubmitted]);

  useEffect(() => {
    if (!quiz?.auto_submit_on_timeout) return undefined;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [quiz, handleSubmit]);

  const currentQuestion = questions[currentIndex];
  if (!currentQuestion || !attempt) return null;

  const saveAnswer = async (questionId, selectedAnswers, textAnswer = "") => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { selectedAnswers, textAnswer },
    }));
    await dispatch(
      saveCourseQuizAnswer({
        authToken,
        attemptId: attempt._id,
        answer: {
          question_id: questionId,
          selected_answers: selectedAnswers,
          text_answer: textAnswer,
        },
      })
    );
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <Box className="bg-white border border-[#E0E8EC] rounded-xl p-4 md:p-6">
      <HStack justify="space-between" mb={4} flexWrap="wrap" gap={2}>
        <Text fontWeight="bold" fontSize="lg">{quiz.title}</Text>
        <Badge colorScheme="orange">Time: {formatTime(timeLeft)}</Badge>
      </HStack>
      <Progress value={progress} size="sm" colorScheme="yellow" mb={4} />
      <Text fontSize="sm" color="gray.500" mb={2}>
        Question {currentIndex + 1} of {questions.length}
      </Text>

      <VStack align="stretch" spacing={4}>
        <Text fontWeight="medium">{currentQuestion.question}</Text>

        {currentQuestion.question_type === "multiple_choice" ||
        currentQuestion.question_type === "true_false" ? (
          <RadioGroup
            value={answers[currentQuestion.question_id]?.selectedAnswers?.[0] || ""}
            onChange={(val) => saveAnswer(currentQuestion.question_id, [val])}
          >
            <Stack>
              {(currentQuestion.options || []).map((opt) => (
                <Radio key={opt} value={opt}>{opt}</Radio>
              ))}
            </Stack>
          </RadioGroup>
        ) : currentQuestion.question_type === "multiple_select" ? (
          <Stack>
            {(currentQuestion.options || []).map((opt) => {
              const selected = answers[currentQuestion.question_id]?.selectedAnswers || [];
              const checked = selected.includes(opt);
              return (
                <label key={opt} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      const next = checked
                        ? selected.filter((v) => v !== opt)
                        : [...selected, opt];
                      saveAnswer(currentQuestion.question_id, next);
                    }}
                  />
                  {opt}
                </label>
              );
            })}
          </Stack>
        ) : (
          <Textarea
            placeholder="Type your answer..."
            value={answers[currentQuestion.question_id]?.textAnswer || ""}
            onChange={(e) =>
              saveAnswer(currentQuestion.question_id, [], e.target.value)
            }
          />
        )}

        <HStack justify="space-between" flexWrap="wrap" gap={2}>
          <Button
            isDisabled={currentIndex === 0}
            onClick={() => setCurrentIndex((i) => i - 1)}
          >
            Previous
          </Button>
          {currentIndex < questions.length - 1 ? (
            <Button colorScheme="yellow" onClick={() => setCurrentIndex((i) => i + 1)}>
              Next
            </Button>
          ) : (
            <Button colorScheme="green" onClick={handleSubmit}>
              Submit Quiz
            </Button>
          )}
          <Button variant="ghost" onClick={() => { dispatch(clearActiveAttempt()); onExit(); }}>
            Exit
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
}

export default CourseQuizAttempt;
