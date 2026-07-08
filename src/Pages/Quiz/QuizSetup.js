import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Select,
  Input,
  Switch,
  VStack,
  Text,
  SimpleGrid,
  Badge,
  Spinner,
} from "@chakra-ui/react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchQuizSubjects,
  startQuizAttempt,
} from "../../Features/quizSlice";
import { Play } from "lucide-react";

const PATTERN_OPTIONS = [
  {
    value: "sequential",
    label: "Sequential Order",
    description: "Questions appear in the original order.",
  },
  {
    value: "shuffle_questions",
    label: "Shuffle Questions",
    description: "Randomize question order only.",
  },
  {
    value: "shuffle_all",
    label: "Shuffle Questions and Options",
    description: "Randomize both questions and answer choices.",
  },
];

function QuizSetup({ onStarted }) {
  const [authToken] = useState(Cookies.get("authToken"));
  const dispatch = useDispatch();
  const { subjects, subjectsStatus, startStatus } = useSelector(
    (state) => state.quiz
  );

  const [courseId, setCourseId] = useState("");
  const [pattern, setPattern] = useState("sequential");
  const [questionCount, setQuestionCount] = useState("");
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState("600");

  const selectedSubject = subjects.find((item) => item._id === courseId);

  useEffect(() => {
    dispatch(fetchQuizSubjects({ authToken }));
  }, [authToken, dispatch]);

  const handleStart = () => {
    if (!courseId) return;

    const payload = {
      course_id: courseId,
      pattern,
      timer_enabled: timerEnabled,
    };

    if (questionCount) {
      payload.question_count = Number(questionCount);
    }
    if (timerEnabled) {
      payload.timer_seconds = Number(timerSeconds) || 600;
    }

    dispatch(startQuizAttempt({ authToken, payload }))
      .unwrap()
      .then((attempt) => onStarted(attempt));
  };

  if (subjectsStatus === "loading") {
    return (
      <Box className="flex justify-center py-16">
        <Spinner size="lg" />
      </Box>
    );
  }

  return (
    <Box className="max-w-3xl mx-auto bg-white rounded-2xl border border-[#E0E8EC] p-4 sm:p-8">
      <Text fontSize="2xl" fontWeight="semibold" mb={2}>
        Start a Quiz
      </Text>
      <Text color="gray.500" mb={6}>
        Select your subject and quiz pattern before starting.
      </Text>

      <VStack spacing={5} align="stretch">
        <FormControl isRequired>
          <FormLabel>Subject</FormLabel>
          <Select
            placeholder="Select subject"
            value={courseId}
            onChange={(e) => {
              setCourseId(e.target.value);
              setQuestionCount("");
            }}
            borderRadius="xl"
            size="lg"
          >
            {subjects.map((subject) => (
              <option key={subject._id} value={subject._id}>
                {subject.name} ({subject.mcq_count} questions)
              </option>
            ))}
          </Select>
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Quiz Pattern</FormLabel>
          <Select
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            borderRadius="xl"
            size="lg"
          >
            {PATTERN_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Text fontSize="sm" color="gray.500" mt={2}>
            {PATTERN_OPTIONS.find((item) => item.value === pattern)?.description}
          </Text>
        </FormControl>

        <FormControl>
          <FormLabel>Number of Questions (optional)</FormLabel>
          <Input
            type="number"
            min={1}
            max={selectedSubject?.mcq_count || undefined}
            placeholder={
              selectedSubject
                ? `Leave empty for all ${selectedSubject.mcq_count} questions`
                : "Select a subject first"
            }
            value={questionCount}
            onChange={(e) => setQuestionCount(e.target.value)}
            borderRadius="xl"
            size="lg"
            isDisabled={!selectedSubject}
          />
        </FormControl>

        <FormControl display="flex" alignItems="center">
          <FormLabel mb={0}>Enable Timer</FormLabel>
          <Switch
            isChecked={timerEnabled}
            onChange={(e) => setTimerEnabled(e.target.checked)}
            colorScheme="orange"
          />
        </FormControl>

        {timerEnabled && (
          <FormControl>
            <FormLabel>Timer (seconds)</FormLabel>
            <Input
              type="number"
              min={60}
              value={timerSeconds}
              onChange={(e) => setTimerSeconds(e.target.value)}
              borderRadius="xl"
              size="lg"
            />
          </FormControl>
        )}

        <Button
          leftIcon={<Play size={18} />}
          onClick={handleStart}
          isLoading={startStatus === "loading"}
          isDisabled={!courseId || subjects.length === 0}
          backgroundColor="#FFCB82"
          color="#85652D"
          _hover={{ backgroundColor: "#E3B574" }}
          borderRadius="xl"
          size="lg"
        >
          Start Quiz
        </Button>
      </VStack>
    </Box>
  );
}

export default QuizSetup;
