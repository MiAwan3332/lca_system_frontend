import React, { useState } from "react";
import { Box, Button } from "@chakra-ui/react";
import { useDispatch } from "react-redux";
import { clearQuizResult } from "../../Features/quizSlice";
import QuizSetup from "./QuizSetup";
import QuizAttempt from "./QuizAttempt";
import QuizResults from "./QuizResults";
import QuizHistory from "./QuizHistory";
import { PlayCircle, History } from "lucide-react";
import PageHeader, { FilterStack } from "../../Components/PageHeader";

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
      <PageHeader
        title="Quiz Module"
        subtitle="Attempt quizzes by subject with flexible patterns and detailed logs."
      >
        <FilterStack>
          <Button
            leftIcon={<PlayCircle size={18} />}
            variant={activeTab === "take" ? "solid" : "outline"}
            colorScheme={activeTab === "take" ? "yellow" : "gray"}
            borderRadius="xl"
            w={{ base: "full", sm: "auto" }}
            onClick={() => setActiveTab("take")}
          >
            Take Quiz
          </Button>
          <Button
            leftIcon={<History size={18} />}
            variant={activeTab === "history" ? "solid" : "outline"}
            colorScheme={activeTab === "history" ? "yellow" : "gray"}
            borderRadius="xl"
            w={{ base: "full", sm: "auto" }}
            onClick={() => setActiveTab("history")}
          >
            Attempt Logs
          </Button>
        </FilterStack>
      </PageHeader>

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
