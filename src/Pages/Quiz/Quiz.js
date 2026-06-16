import React, { useState } from "react";
import { Box, Button, HStack, Text } from "@chakra-ui/react";
import { useDispatch } from "react-redux";
import { clearQuizResult } from "../../Features/quizSlice";
import QuizSetup from "./QuizSetup";
import QuizAttempt from "./QuizAttempt";
import QuizResults from "./QuizResults";
import QuizHistory from "./QuizHistory";
import { PlayCircle, History } from "lucide-react";

function Quiz() {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState("take");
  const [screen, setScreen] = useState("setup");
  const [activeAttempt, setActiveAttempt] = useState(null);
  const [result, setResult] = useState(null);

  const handleStarted = (attempt) => {
    setActiveAttempt(attempt);
    setScreen("attempt");
    setActiveTab("take");
  };

  const handleSubmitted = (attemptResult) => {
    setResult(attemptResult);
    setScreen("results");
  };

  const handleRetry = () => {
    dispatch(clearQuizResult());
    setActiveAttempt(null);
    setResult(null);
    setScreen("setup");
    setActiveTab("take");
  };

  const handleViewHistory = () => {
    setActiveTab("history");
    setScreen("setup");
  };

  const handleExitAttempt = () => {
    setActiveAttempt(null);
    setScreen("setup");
  };

  return (
    <Box>
      <Box className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <Text fontSize="2xl" fontWeight="semibold" ml={2}>
            Quiz Module
          </Text>
          <Text fontSize="sm" color="gray.500" ml={2}>
            Attempt quizzes by subject with flexible patterns and detailed logs.
          </Text>
        </div>
        <HStack spacing={3} mr={2}>
          <Button
            leftIcon={<PlayCircle size={18} />}
            variant={activeTab === "take" ? "solid" : "outline"}
            colorScheme={activeTab === "take" ? "yellow" : "gray"}
            borderRadius="xl"
            onClick={() => setActiveTab("take")}
          >
            Take Quiz
          </Button>
          <Button
            leftIcon={<History size={18} />}
            variant={activeTab === "history" ? "solid" : "outline"}
            colorScheme={activeTab === "history" ? "yellow" : "gray"}
            borderRadius="xl"
            onClick={() => setActiveTab("history")}
          >
            Attempt Logs
          </Button>
        </HStack>
      </Box>

      {activeTab === "take" && screen === "setup" && (
        <QuizSetup onStarted={handleStarted} />
      )}

      {activeTab === "take" && screen === "attempt" && activeAttempt && (
        <QuizAttempt
          attempt={activeAttempt}
          onSubmitted={handleSubmitted}
          onCancel={handleExitAttempt}
        />
      )}

      {activeTab === "take" && screen === "results" && result && (
        <QuizResults
          result={result}
          onRetry={handleRetry}
          onViewHistory={handleViewHistory}
        />
      )}

      {activeTab === "history" && <QuizHistory />}
    </Box>
  );
}

export default Quiz;
