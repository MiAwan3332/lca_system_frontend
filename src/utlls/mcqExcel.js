import * as XLSX from "xlsx";

export const MCQ_TEMPLATE_HEADERS = [
  "Course",
  "Question",
  "Option-A",
  "Option-B",
  "Option-C",
  "Option-D",
  "Correct Option",
];

const HEADER_ALIASES = {
  course: ["course", "course name", "subject", "courseid"],
  question: ["question", "mcq question"],
  option1: ["option-a", "option a", "optiona", "option1"],
  option2: ["option-b", "option b", "optionb", "option2"],
  option3: ["option-c", "option c", "optionc", "option3"],
  option4: ["option-d", "option d", "optiond", "option4"],
  correct_option: [
    "correct option",
    "correct",
    "correct answer",
    "answer",
    "correct_option",
  ],
};

const normalizeHeader = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const mapHeaderToField = (header) => {
  const normalized = normalizeHeader(header);
  for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
    if (aliases.includes(normalized)) {
      return field;
    }
  }
  return null;
};

const isRowEmpty = (row = []) =>
  row.every((cell) => String(cell ?? "").trim() === "");

export const downloadMcqTemplate = (sampleCourseName = "Sample Course") => {
  const worksheet = XLSX.utils.aoa_to_sheet([
    MCQ_TEMPLATE_HEADERS,
    [
      sampleCourseName,
      "What does CPU stand for?",
      "Central Processing Unit",
      "Computer Personal Unit",
      "Central Program Utility",
      "Control Processing Unit",
      "A",
    ],
    [
      sampleCourseName,
      "Which language runs in the browser?",
      "Python",
      "JavaScript",
      "C++",
      "Java",
      "B",
    ],
  ]);

  worksheet["!cols"] = [
    { wch: 22 },
    { wch: 40 },
    { wch: 28 },
    { wch: 28 },
    { wch: 28 },
    { wch: 28 },
    { wch: 16 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "MCQ Template");
  XLSX.writeFile(workbook, "mcq_import_template.xlsx");
};

export const parseMcqExcelFile = async (file) => {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error("The Excel file has no sheets");
  }

  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
    header: 1,
    defval: "",
    blankrows: false,
  });

  if (!rows.length) {
    throw new Error("The Excel file is empty");
  }

  const headerRow = rows[0];
  const fieldIndexes = {};

  headerRow.forEach((header, index) => {
    const field = mapHeaderToField(header);
    if (field && fieldIndexes[field] === undefined) {
      fieldIndexes[field] = index;
    }
  });

  const missingHeaders = Object.keys(HEADER_ALIASES).filter(
    (field) => fieldIndexes[field] === undefined
  );

  if (missingHeaders.length > 0) {
    throw new Error(
      `Missing required columns. Expected: ${MCQ_TEMPLATE_HEADERS.join(", ")}`
    );
  }

  const mcqs = [];

  for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    if (!row || isRowEmpty(row)) {
      continue;
    }

    mcqs.push({
      course: row[fieldIndexes.course],
      question: row[fieldIndexes.question],
      option1: row[fieldIndexes.option1],
      option2: row[fieldIndexes.option2],
      option3: row[fieldIndexes.option3],
      option4: row[fieldIndexes.option4],
      correct_option: row[fieldIndexes.correct_option],
      excelRow: rowIndex + 1,
    });
  }

  if (!mcqs.length) {
    throw new Error("No MCQ rows found in the Excel file");
  }

  if (mcqs.length > 500) {
    throw new Error("Maximum 500 MCQs can be imported at once");
  }

  return mcqs;
};
