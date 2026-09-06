import React, { useEffect, useRef, useState } from "react";
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
import {
  bulkImportQualifiers,
  fetchQualifiers,
} from "../../Features/qualifierSlice";
import {
  fetchBatches,
  selectActiveInterviewBatches,
} from "../../Features/batchSlice";
import SearchableBatchSelect from "../../Components/SearchableBatchSelect";
import {
  downloadQualifierTemplate,
  parseQualifierExcelFile,
} from "../../utlls/qualifierExcel";
import {
  getResponsiveModalSize,
  responsiveModalContentProps,
} from "../../utlls/responsiveModal";

function QualifierImportModal({ isOpen, onClose }) {
  const fileInputRef = useRef(null);
  const toast = useToast();
  const dispatch = useDispatch();
  const [authToken] = useState(Cookies.get("authToken"));
  const [batchId, setBatchId] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [importResult, setImportResult] = useState(null);
  const [parseError, setParseError] = useState("");
  const { importStatus } = useSelector((state) => state.qualifiers);
  const interviewBatches = useSelector(selectActiveInterviewBatches);

  const selectedBatch = interviewBatches.find((batch) => batch._id === batchId);

  useEffect(() => {
    if (!isOpen || !authToken) return;
    dispatch(
      fetchBatches({
        authToken,
        queryParams: { limit: 200, page: 1, query: "", is_active: "true" },
      })
    );
  }, [isOpen, authToken, dispatch]);

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
    downloadQualifierTemplate({
      batchName: selectedBatch?.name || "Interview Batch",
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
      const rows = await parseQualifierExcelFile(file);
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
        title: "Select an interview batch",
        description: "Choose the interview batch these qualifiers belong to.",
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
      bulkImportQualifiers({
        authToken,
        batch_id: batchId,
        qualifiers: parsedRows.map(({ excelRow, ...row }) => ({
          ...row,
          excelRow,
        })),
      })
    )
      .unwrap()
      .then((result) => {
        setImportResult(result);
        dispatch(fetchQualifiers({ authToken }));
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
          Import Qualifiers from Excel
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text fontSize="sm" color="gray.600" mb={4}>
            Select an interview batch, download the template, fill in qualifier
            details (Name and Phone required), then upload the Excel file. Each
            imported qualifier gets a login account with role{" "}
            <strong>qualifier</strong> (phone login), default password{" "}
            <strong>lca@123456</strong>. WhatsApp{" "}
            <strong>Qualifier Welcome</strong> messages are added to the{" "}
            <strong>WA Queue</strong> and send one-by-one every 10 seconds.
          </Text>

          <FormControl mb={4} isRequired>
            <FormLabel fontSize="sm">Interview Batch</FormLabel>
            <SearchableBatchSelect
              batches={interviewBatches}
              value={batchId}
              onChange={setBatchId}
              placeholder="Select interview batch for import"
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
              Name, Phone (required). Optional: CSS/PMS Roll No, Online / On
              Campus, CNIC, City, Province, Father Name, Father Phone, Remarks.
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
              Selected file: <strong>{selectedFile.name}</strong> (
              {parsedRows.length} qualifier
              {parsedRows.length === 1 ? "" : "s"} ready to import)
            </Text>
          )}

          {parseError && (
            <Box
              mt={3}
              p={3}
              borderRadius="md"
              bg="red.50"
              color="red.700"
              fontSize="sm"
            >
              {parseError}
            </Box>
          )}

          {importResult && (
            <Box
              mt={4}
              p={4}
              borderRadius="xl"
              border="1px solid"
              borderColor="#E0E8EC"
            >
              <Text fontWeight="semibold" mb={2}>
                Import summary
                {importResult.batch_name
                  ? ` — ${importResult.batch_name}`
                  : ""}
              </Text>
              <Text fontSize="sm" color="green.700">
                Successfully imported: {importResult.imported}
              </Text>
              {(importResult.whatsapp_queued > 0 ||
                importResult.whatsapp_failed > 0) && (
                <Text fontSize="sm" color="gray.700" mt={1}>
                  WhatsApp Qualifier Welcome queued:{" "}
                  {importResult.whatsapp_queued || 0}
                  {importResult.whatsapp_failed > 0
                    ? ` (failed to queue: ${importResult.whatsapp_failed})`
                    : ""}
                  . Track status on the WA Queue page.
                </Text>
              )}
              {importResult.imported_qualifiers?.length > 0 && (
                <List spacing={1} mt={2} maxH="180px" overflowY="auto">
                  {importResult.imported_qualifiers.map((item) => (
                    <ListItem
                      key={`${item.row}-${item.phone || item.name}`}
                      fontSize="sm"
                      color="gray.700"
                    >
                      Row {item.row}: {item.name}
                      {item.phone ? ` (${item.phone})` : ""}
                      {item.whatsapp_queued ? " — queued" : ""}
                    </ListItem>
                  ))}
                </List>
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
                        {item.phone ? ` (${item.phone})` : ""}: {item.message}
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
            </Box>
          )}
        </ModalBody>
        <ModalFooter>
          <Button
            variant="ghost"
            mr={3}
            borderRadius="0.75rem"
            onClick={handleClose}
          >
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
            Import Qualifiers
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default QualifierImportModal;
