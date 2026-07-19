import React, { useRef, useState } from "react";
import Cookies from "js-cookie";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Text,
  Box,
  List,
  ListItem,
  FormControl,
  FormLabel,
  useToast,
} from "@chakra-ui/react";
import { useDispatch, useSelector } from "react-redux";
import { FileUp, Download } from "lucide-react";
import { bulkImportStudents, fetchStudents } from "../../Features/studentSlice";
import SearchableBatchSelect from "../../Components/SearchableBatchSelect";
import {
  downloadStudentTemplate,
  parseStudentExcelFile,
} from "../../utlls/studentExcel";
import {
  getResponsiveModalSize,
  responsiveModalContentProps,
} from "../../utlls/responsiveModal";

function StudentImportModal({ isOpen, onClose, batches = [] }) {
  const fileInputRef = useRef(null);
  const toast = useToast();
  const dispatch = useDispatch();
  const [authToken] = useState(Cookies.get("authToken"));
  const [batchId, setBatchId] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [importResult, setImportResult] = useState(null);
  const [parseError, setParseError] = useState("");
  const { importStatus } = useSelector((state) => state.students);

  const selectedBatch = batches.find((batch) => batch._id === batchId);

  const resetState = () => {
    setBatchId("");
    setSelectedFile(null);
    setParsedRows([]);
    setImportResult(null);
    setParseError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleDownloadTemplate = () => {
    downloadStudentTemplate({
      batchName: selectedBatch?.name || "Sample Batch",
      batchFee: selectedBatch?.batch_fee,
    });
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    setImportResult(null);
    setParseError("");

    if (!file) {
      setSelectedFile(null);
      setParsedRows([]);
      return;
    }

    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(extension)) {
      setParseError("Please upload an Excel file (.xlsx, .xls) or CSV file");
      setSelectedFile(null);
      setParsedRows([]);
      return;
    }

    try {
      const rows = await parseStudentExcelFile(file);
      setSelectedFile(file);
      setParsedRows(rows);
    } catch (error) {
      setSelectedFile(null);
      setParsedRows([]);
      setParseError(error.message);
    }
  };

  const handleImport = () => {
    if (!batchId) {
      toast({
        title: "Select a batch",
        description: "Choose the batch these students belong to.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!parsedRows.length) {
      toast({
        title: "No rows to import",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    dispatch(
      bulkImportStudents({
        authToken,
        batch_id: batchId,
        students: parsedRows.map(({ excelRow, ...row }) => ({
          ...row,
          excelRow,
        })),
      })
    )
      .unwrap()
      .then((result) => {
        setImportResult(result);
        dispatch(fetchStudents({ authToken }));
        setSelectedFile(null);
        setParsedRows([]);
        setParseError("");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      })
      .catch(() => {});
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      {...getResponsiveModalSize("2xl")}
    >
      <ModalOverlay />
      <ModalContent {...responsiveModalContentProps}>
        <ModalHeader className="text-xl font-semibold">
          Import Students from Excel
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text fontSize="sm" color="gray.600" mb={4}>
            Select a batch, download the template, fill in student details with fee
            amounts, then upload the Excel file. Each imported student gets an auto-generated
            batch roll number (for example <strong>B8-1</strong>), a login account with role{" "}
            <strong>student</strong>, and default password <strong>lca@123456</strong>.
            Fee records and payment logs are created automatically.
          </Text>

          <FormControl mb={4} isRequired>
            <FormLabel fontSize="sm">Batch</FormLabel>
            <SearchableBatchSelect
              batches={batches}
              value={batchId}
              onChange={setBatchId}
              placeholder="Select batch for import"
              width="100%"
            />
          </FormControl>

          <Box
            mb={4}
            p={4}
            borderRadius="xl"
            border="1px solid"
            borderColor="#E0E8EC"
            bg="gray.50"
          >
            <Text fontWeight="semibold" mb={2}>
              Template columns
            </Text>
            <Text fontSize="sm" color="gray.600">
              Name, Email, Phone, Total Fee, Paid Amount, Pending Amount, Remarks
              (optional)
            </Text>
            <Text fontSize="sm" color="gray.500" mt={2}>
              Pending Amount must equal Total Fee minus Paid Amount.
            </Text>
            <Button
              mt={3}
              leftIcon={<Download size={18} />}
              variant="outline"
              borderRadius="xl"
              onClick={handleDownloadTemplate}
            >
              Download Excel Template
            </Button>
          </Box>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleFileChange}
          />

          <Button
            leftIcon={<FileUp size={18} />}
            borderRadius="xl"
            backgroundColor="#FFCB82"
            color="#85652D"
            _hover={{ backgroundColor: "#E3B574", color: "#654E26" }}
            onClick={() => fileInputRef.current?.click()}
          >
            Choose Excel File
          </Button>

          {selectedFile && (
            <Text mt={3} fontSize="sm" color="gray.700">
              Selected file: <strong>{selectedFile.name}</strong> ({parsedRows.length}{" "}
              student{parsedRows.length === 1 ? "" : "s"} ready to import)
            </Text>
          )}

          {parseError && (
            <Box mt={3} p={3} borderRadius="md" bg="red.50" color="red.700" fontSize="sm">
              {parseError}
            </Box>
          )}

          {importResult && (
            <Box mt={4} p={4} borderRadius="xl" border="1px solid" borderColor="#E0E8EC">
              <Text fontWeight="semibold" mb={2}>
                Import summary
                {importResult.batch_name ? ` — ${importResult.batch_name}` : ""}
              </Text>
              <Text fontSize="sm" color="green.700">
                Successfully imported: {importResult.imported}
              </Text>
              {importResult.imported_students?.length > 0 && (
                <>
                  <Text fontSize="sm" color="gray.700" mt={2} fontWeight="medium">
                    Assigned roll numbers
                  </Text>
                  <List spacing={1} mt={2} maxH="180px" overflowY="auto">
                    {importResult.imported_students.map((item) => (
                      <ListItem key={`${item.row}-${item.email}`} fontSize="sm" color="gray.700">
                        Row {item.row}: <strong>{item.roll_number || "—"}</strong> — {item.name} ({item.email})
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
              {importResult.backfilled_roll_numbers?.length > 0 && (
                <Text fontSize="sm" color="blue.700" mt={2}>
                  Also assigned roll numbers to{" "}
                  {importResult.backfilled_roll_numbers.length} existing student
                  {importResult.backfilled_roll_numbers.length === 1 ? "" : "s"} in this batch who were missing one.
                </Text>
              )}
              {importResult.failed?.length > 0 && (
                <>
                  <Text fontSize="sm" color="red.600" mt={2}>
                    Failed rows: {importResult.failed.length}
                  </Text>
                  <List spacing={1} mt={2} maxH="160px" overflowY="auto">
                    {importResult.failed.map((item) => (
                      <ListItem
                        key={`${item.row}-${item.message}`}
                        fontSize="sm"
                        color="red.600"
                      >
                        Row {item.row}
                        {item.email ? ` (${item.email})` : ""}: {item.message}
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
            </Box>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} borderRadius="0.75rem" onClick={handleClose}>
            Close
          </Button>
          <Button
            borderRadius="0.75rem"
            backgroundColor="#7AEF85"
            color="#257947"
            _hover={{ backgroundColor: "#65C76E", color: "#184E2E" }}
            fontWeight="500"
            onClick={handleImport}
            isDisabled={!batchId || !parsedRows.length}
            isLoading={importStatus === "loading"}
            loadingText="Importing..."
          >
            Import Students
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default StudentImportModal;
