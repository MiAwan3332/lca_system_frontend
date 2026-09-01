export const QUALIFICATION_OPTIONS = [
  "Matric / O-Level",
  "Intermediate / A-Level",
  "Bachelor's Degree",
  "Master's Degree",
  "MPhil / MS",
  "Other",
];

export const createEmptyEducationEntry = () => ({
  id: `edu_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  qualification: "",
  institution: "",
  board_or_university: "",
  year: "",
  grade: "",
  details: "",
});

const trim = (value) => String(value || "").trim();

export const normalizeEducationEntry = (entry = {}) => ({
  qualification: trim(entry.qualification),
  institution: trim(entry.institution),
  board_or_university: trim(entry.board_or_university),
  year: trim(entry.year),
  grade: trim(entry.grade),
  details: trim(entry.details),
});

export const educationEntryHasContent = (entry) => {
  const normalized = normalizeEducationEntry(entry);
  return Object.values(normalized).some(Boolean);
};

export const educationEntryIsComplete = (entry) => {
  const normalized = normalizeEducationEntry(entry);
  return Boolean(normalized.qualification && normalized.institution);
};

/** Accept legacy string or array from API / form. */
export const normalizeEducationBackground = (value) => {
  if (Array.isArray(value)) {
    return value
      .map(normalizeEducationEntry)
      .filter(educationEntryHasContent);
  }
  if (typeof value === "string") {
    const text = value.trim();
    if (!text) return [];
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return normalizeEducationBackground(parsed);
      }
    } catch {
      // legacy plain text
    }
    return [
      normalizeEducationEntry({
        qualification: "Other",
        institution: "",
        details: text,
      }),
    ];
  }
  return [];
};

export const parseEducationBackgroundPayload = (value) => {
  if (value === undefined || value === null) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      return normalizeEducationBackground(JSON.parse(trimmed));
    } catch {
      return normalizeEducationBackground(trimmed);
    }
  }
  return normalizeEducationBackground(value);
};

export const isEducationBackgroundComplete = (value) => {
  const entries = normalizeEducationBackground(value);
  if (entries.length === 0) return false;
  return entries.every(educationEntryIsComplete);
};

export const getEducationBackgroundIncompleteReason = (value) => {
  const entries = normalizeEducationBackground(value);
  if (entries.length === 0) {
    return "Add at least one qualification in Education Background";
  }
  const incomplete = entries.some((entry) => !educationEntryIsComplete(entry));
  if (incomplete) {
    return "Each qualification requires qualification level and institution";
  }
  return null;
};

export const educationEntriesToFormRows = (value) => {
  const entries = normalizeEducationBackground(value);
  if (entries.length === 0) {
    return [createEmptyEducationEntry()];
  }
  return entries.map((entry, index) => ({
    id: `edu_${index}_${entry.qualification || "row"}`,
    ...entry,
  }));
};

export const formRowsToEducationPayload = (rows = []) =>
  (rows || [])
    .map(({ id, ...entry }) => normalizeEducationEntry(entry))
    .filter(educationEntryHasContent);
