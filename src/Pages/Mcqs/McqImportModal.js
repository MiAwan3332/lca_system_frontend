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
  useToast,
} from "@chakra-ui/react";
import { useDispatch, useSelector } from "react-redux";
import { FileUp, Download } from "lucide-react";
import { bulkImportMcqs, fetchMcqs } from "../../Features/mcqSlice";
import { isTeacherRole } from "../../utlls/teacherAccess";
import { downloadMcqTemplate, parseMcqExcelFile } from "../../utlls/mcqExcel";
import {
  getResponsiveModalSize,
  responsiveModalContentProps,
} from "../../utlls/responsiveModal";

function McqImportModal({ isOpen, onClose, courses = [] }) {
  const fileInputRef = useRef(null);
  const toast = useToast();
  const dispatch = useDispatch();
  const [authToken] = useState(Cookies.get("authToken"));
  const [selectedFile, setSelectedFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [importResult, setImportResult] = useState(null);
  const [parseError, setParseError] = useState("");
  const { importStatus } = useSelector((state) => state.mcqs);
  const isTeacher = isTeacherRole();

  const sampleCourseName = courses[0]?.name || "Sample Course";
  const assignedCourseHint =
    courses.length > 0
      ? courses.map((course) => course.name).join(", ")
      : null;

  const resetState = () => {
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
    downloadMcqTemplate(sampleCourseName);
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
      const rows = await parseMcqExcelFile(file);
      setSelectedFile(file);
      setParsedRows(rows);
    } catch (error) {
      setSelectedFile(null);
      setParsedRows([]);
      setParseError(error.message);
    }
  };

  const handleImport = () => {
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
      bulkImportMcqs({
        authToken,
        mcqs: parsedRows.map(({ excelRow, ...row }) => row),
      })
    )
      .unwrap()
      .then((result) => {
        setImportResult(result);
        dispatch(fetchMcqs({ authToken }));
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
          Import MCQs from Excel
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text fontSize="sm" color="gray.600" mb={4}>
            Download the sample template, fill in your MCQs, then upload the
            file here. Use the exact course name
            {isTeacher ? " from your assigned courses" : " from your Courses list"}{" "}
            in the Course column. Correct Option accepts A, B, C, D or 0, 1, 2, 3.
          </Text>
          {isTeacher && assignedCourseHint && (
            <Text fontSize="sm" color="gray.500" mb={4}>
              Assigned courses: {assignedCourseHint}
            </Text>
          )}
          {isTeacher && !assignedCourseHint && (
            <Text fontSize="sm" color="orange.600" mb={4}>
              No assigned courses found. Assign a course in All Batchs before importing MCQs.
            </Text>
          )}

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
              Course, Question, Option-A, Option-B, Option-C, Option-D, Correct
              Option
            </Text>
            <Button
              mt={3}
              leftIcon={<Download size={18} />}
              variant="outline"
              borderRadius="xl"
              onClick={handleDownloadTemplate}
            >
              Download Sample Template
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
              MCQ{parsedRows.length === 1 ? "" : "s"} ready to import)
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
              </Text>
              <Text fontSize="sm" color="green.700">
                Successfully imported: {importResult.imported}
              </Text>
              {importResult.failed?.length > 0 && (
                <>
                  <Text fontSize="sm" color="red.600" mt={2}>
                    Failed rows: {importResult.failed.length}
                  </Text>
                  <List spacing={1} mt={2} maxH="160px" overflowY="auto">
                    {importResult.failed.map((item) => (
                      <ListItem key={`${item.row}-${item.message}`} fontSize="sm" color="red.600">
                        Row {item.row}: {item.message}
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
            isDisabled={!parsedRows.length || (isTeacher && !assignedCourseHint)}
            isLoading={importStatus === "loading"}
            loadingText="Importing..."
          >
            Import MCQs
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default McqImportModal;
