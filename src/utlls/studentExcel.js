import * as XLSX from "xlsx";

export const STUDENT_TEMPLATE_HEADERS = [
  "Name",
  "Phone",
  "Total Fee",
  "Paid Amount",
  "Pending Amount",
  "Remarks",
];

const HEADER_ALIASES = {
  name: ["name", "student name", "full name"],
  phone: ["phone", "phone no", "phone number", "mobile", "contact"],
  total_fee: ["total fee", "total fees", "total amount", "fee total"],
  paid_fee: ["paid amount", "paid fee", "paid", "amount paid"],
  pending_fee: ["pending amount", "pending fee", "pending", "balance"],
  remarks: ["remarks", "note", "notes", "comment"],
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

const toNumber = (value) => {
  if (value === null || value === undefined || value === "") {
    return 0;
  }
  const cleaned = String(value).replace(/,/g, "").trim();
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : NaN;
};

export const downloadStudentTemplate = ({
  batchName = "Sample Batch",
  batchFee,
} = {}) => {
  const totalFee = Number(batchFee);
  const sampleTotal = Number.isFinite(totalFee) && totalFee > 0 ? totalFee : 50000;
  const samplePartialPaid = Math.round(sampleTotal * 0.2);
  const samplePartialPending = sampleTotal - samplePartialPaid;

  const worksheet = XLSX.utils.aoa_to_sheet([
    STUDENT_TEMPLATE_HEADERS,
    [
      "Ali Khan",
      "03001234567",
      sampleTotal,
      samplePartialPaid,
      samplePartialPending,
      `${batchName} admission`,
    ],
    [
      "Sara Ahmed",
      "03007654321",
      sampleTotal,
      sampleTotal,
      0,
      "Full payment",
    ],
  ]);

  worksheet["!cols"] = [
    { wch: 22 },
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 24 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
  XLSX.writeFile(workbook, "student_import_template.xlsx");
};

export const parseStudentExcelFile = async (file) => {
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

  const requiredFields = ["name", "phone", "total_fee", "paid_fee", "pending_fee"];
  const missingHeaders = requiredFields.filter(
    (field) => fieldIndexes[field] === undefined
  );

  if (missingHeaders.length > 0) {
    throw new Error(
      `Missing required columns. Expected: Name, Phone, Total Fee, Paid Amount, Pending Amount (Remarks optional)`
    );
  }

  const students = [];

  for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    if (!row || isRowEmpty(row)) {
      continue;
    }

    const totalFee = toNumber(row[fieldIndexes.total_fee]);
    const paidFee = toNumber(row[fieldIndexes.paid_fee]);
    const pendingFee = toNumber(row[fieldIndexes.pending_fee]);

    if (Number.isNaN(totalFee) || Number.isNaN(paidFee) || Number.isNaN(pendingFee)) {
      throw new Error(`Row ${rowIndex + 1}: fee amounts must be valid numbers`);
    }

    if (totalFee < 0 || paidFee < 0 || pendingFee < 0) {
      throw new Error(`Row ${rowIndex + 1}: fee amounts cannot be negative`);
    }

    if (paidFee > totalFee) {
      throw new Error(`Row ${rowIndex + 1}: paid amount cannot exceed total fee`);
    }

    const expectedPending = totalFee - paidFee;
    if (Math.abs(pendingFee - expectedPending) > 0.01) {
      throw new Error(
        `Row ${rowIndex + 1}: pending amount must equal total fee minus paid amount (${expectedPending})`
      );
    }

    students.push({
      name: String(row[fieldIndexes.name] ?? "").trim(),
      phone: String(row[fieldIndexes.phone] ?? "").trim(),
      total_fee: totalFee,
      paid_fee: paidFee,
      pending_fee: pendingFee,
      remarks:
        fieldIndexes.remarks !== undefined
          ? String(row[fieldIndexes.remarks] ?? "").trim()
          : "",
      excelRow: rowIndex + 1,
    });
  }

  if (!students.length) {
    throw new Error("No student rows found in the Excel file");
  }

  if (students.length > 500) {
    throw new Error("Maximum 500 students can be imported at once");
  }

  return students;
};
