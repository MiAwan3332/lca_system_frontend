import * as XLSX from "xlsx";

export const QUALIFIER_TEMPLATE_HEADERS = [
  "Name",
  "Phone",
  "CSS/PMS Roll No",
  "Online / On Campus",
  "CNIC",
  "City",
  "Province",
  "Father Name",
  "Father Phone",
  "Remarks",
];

const HEADER_ALIASES = {
  name: ["name", "qualifier name", "full name", "student name"],
  phone: ["phone", "phone no", "phone number", "mobile", "contact"],
  css_pms_roll_no: [
    "css/pms roll no",
    "css pms roll no",
    "css/pms roll number",
    "css pms roll number",
    "css roll no",
    "pms roll no",
    "roll no",
    "roll number",
    "roll",
  ],
  class_type: [
    "online / on campus",
    "online/on campus",
    "online or on campus",
    "class type",
    "mode",
    "attendance type",
    "online",
    "on campus",
  ],
  cnic: ["cnic", "cnic number", "nic"],
  city: ["city"],
  province: ["province", "state"],
  father_name: ["father name", "father's name", "father"],
  father_phone: ["father phone", "father's phone", "father contact"],
  remarks: ["remarks", "note", "notes", "comment", "description"],
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

/**
 * Excel often stores 03088811771 as number 3088811771 (leading 0 dropped).
 * Restore local PK mobile format: 03XXXXXXXXX
 */
export const normalizeImportPhone = (value) => {
  let raw = value;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    raw = String(Math.trunc(raw));
  } else {
    raw = String(raw ?? "").trim();
  }

  if (!raw) return "";

  let digits = raw.replace(/\D/g, "");

  // 3088811771 → 03088811771
  if (digits.length === 10 && digits.startsWith("3")) {
    digits = `0${digits}`;
  }

  return digits;
};

const cellValue = (row, fieldIndexes, field) =>
  fieldIndexes[field] !== undefined
    ? String(row[fieldIndexes[field]] ?? "").trim()
    : "";

const cellPhone = (row, fieldIndexes, field) => {
  if (fieldIndexes[field] === undefined) return "";
  return normalizeImportPhone(row[fieldIndexes[field]]);
};

const normalizeImportClassType = (value) => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const lower = raw.toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
  if (lower === "online") return "Online";
  if (lower === "on campus" || lower === "oncampus" || lower === "campus") {
    return "On Campus";
  }
  if (raw === "Online" || raw === "On Campus") return raw;
  return raw;
};

export const downloadQualifierTemplate = ({
  batchName = "Interview Batch",
} = {}) => {
  const worksheet = XLSX.utils.aoa_to_sheet([
    QUALIFIER_TEMPLATE_HEADERS,
    [
      "Ali Khan",
      "03001234567",
      "CSS-001",
      "On Campus",
      "3520212345671",
      "Lahore",
      "Punjab",
      "Ahmed Khan",
      "03009876543",
      `${batchName} qualifier`,
    ],
    [
      "Sara Ahmed",
      "03007654321",
      "PMS-014",
      "Online",
      "",
      "Karachi",
      "Sindh",
      "",
      "",
      "",
    ],
  ]);

  worksheet["!cols"] = [
    { wch: 22 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 18 },
    { wch: 14 },
    { wch: 14 },
    { wch: 18 },
    { wch: 16 },
    { wch: 24 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Qualifiers");
  XLSX.writeFile(workbook, "qualifier_import_template.xlsx");
};

export const parseQualifierExcelFile = async (file) => {
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

  if (fieldIndexes.name === undefined || fieldIndexes.phone === undefined) {
    throw new Error(
      "Missing required columns. Expected: Name, Phone (CNIC, City, Province, Father Name, Father Phone, Remarks optional)"
    );
  }

  const qualifiers = [];

  for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    if (!row || isRowEmpty(row)) {
      continue;
    }

    const name = cellValue(row, fieldIndexes, "name");
    const phone = cellPhone(row, fieldIndexes, "phone");

    if (!name && !phone) {
      continue;
    }

    if (!name) {
      throw new Error(`Row ${rowIndex + 1}: Name is required`);
    }
    if (!phone) {
      throw new Error(`Row ${rowIndex + 1}: Phone is required`);
    }

    if (phone.length < 10) {
      throw new Error(`Row ${rowIndex + 1}: Phone number must have at least 10 digits`);
    }

    const fatherPhone = cellPhone(row, fieldIndexes, "father_phone");
    const classTypeRaw = cellValue(row, fieldIndexes, "class_type");
    const classType = normalizeImportClassType(classTypeRaw);

    if (
      classType &&
      classType !== "Online" &&
      classType !== "On Campus"
    ) {
      throw new Error(
        `Row ${rowIndex + 1}: Online / On Campus must be "Online" or "On Campus"`
      );
    }

    qualifiers.push({
      name,
      phone,
      css_pms_roll_no: cellValue(row, fieldIndexes, "css_pms_roll_no"),
      class_type: classType,
      cnic: cellValue(row, fieldIndexes, "cnic"),
      city: cellValue(row, fieldIndexes, "city"),
      province: cellValue(row, fieldIndexes, "province"),
      father_name: cellValue(row, fieldIndexes, "father_name"),
      father_phone: fatherPhone,
      remarks: cellValue(row, fieldIndexes, "remarks"),
      excelRow: rowIndex + 1,
    });
  }

  if (!qualifiers.length) {
    throw new Error("No qualifier rows found in the Excel file");
  }

  if (qualifiers.length > 500) {
    throw new Error("Maximum 500 qualifiers can be imported at once");
  }

  return qualifiers;
};
