export const INTERVIEW_SCORE_FIELDS = [
  { key: "knowledge", label: "Knowledge", max: 15 },
  { key: "analytical_ability", label: "Analytical Ability", max: 20 },
  { key: "communication", label: "Communication", max: 15 },
  { key: "confidence", label: "Confidence", max: 15 },
  { key: "personality", label: "Personality", max: 10 },
  { key: "body_language", label: "Body Language", max: 10 },
  { key: "current_affairs", label: "Current Affairs", max: 10 },
  { key: "ethics_decision", label: "Ethics / Decision", max: 10 },
];

export const INTERVIEW_SCORE_MAX_TOTAL = INTERVIEW_SCORE_FIELDS.reduce(
  (sum, field) => sum + field.max,
  0
);

export const INTERVIEW_VERDICT_OPTIONS = [
  {
    value: "ready_final_css",
    label: "Ready for Final CSS Interview",
  },
  {
    value: "needs_more_mock",
    label: "Needs More Mock Interviews",
  },
  {
    value: "intensive_coaching",
    label: "Intensive 1-1 Coaching Required",
  },
];

export const getInterviewVerdictLabel = (value) =>
  INTERVIEW_VERDICT_OPTIONS.find((item) => item.value === value)?.label ||
  value ||
  "—";

export const getEvaluationScoreTotal = (evaluation) =>
  INTERVIEW_SCORE_FIELDS.reduce((sum, field) => {
    const value = Number(evaluation?.[field.key]);
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);

export const getInterviewConductPath = (panelId, scheduleIndex) =>
  `/interview-panel-schedules/${panelId}/conduct/${scheduleIndex}`;

export const isInterviewConductRoute = (path) =>
  String(path || "").includes("/interview-panel-schedules/") &&
  String(path || "").includes("/conduct/");
