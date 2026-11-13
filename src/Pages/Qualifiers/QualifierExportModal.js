import { Select } from '../../Components/AccessInputs';
import AccessForm from '../../Components/AccessForm';
import FormControl from '../../Components/AccessFormControl';
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import axios from "axios";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormLabel,
  Text,
  HStack,
  Badge,
  useToast,
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Avatar,
  SimpleGrid,
  VStack,
} from '@chakra-ui/react';
import {
  Download,
  FileSpreadsheet,
  FileX,
  Eye,
  Printer,
  ArrowLeft,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchBatches,
  selectActiveInterviewBatches,
} from "../../Features/batchSlice";
import SearchableBatchSelect from "../../Components/SearchableBatchSelect";
import {
  getResponsiveModalSize,
  responsiveModalContentProps,
  responsiveModalProps,
} from "../../utlls/responsiveModal";
import { config } from "../../utlls/config";
import { getMediaUrl } from "../../utlls/useful";
import { isQualifierProfileComplete } from "../../utlls/qualifierProfile";
import { downloadQualifiersExcel } from "../../utlls/exportQualifiersExcel";
import { generateQualifiersPdf } from "../../utlls/generateQualifiersPdf";
import LcaLogoLoading from "../../Components/LcaLogoLoading";
import { fetchAllPaginated } from "../../utlls/fetchAllPaginated";

const defaultAvatar =
  "https://images.unsplash.com/photo-1619946794135-5bc917a27793?ixlib=rb-0.3.5&q=80&fm=jpg&crop=faces&fit=crop&h=200&w=200&s=b616b2c5b373a80ffc9636ba24f7a4a9";

function StatCard({ label, value, hint, accent = "#163150" }) {
  return (
    <Box
      flex="1"
      minW="120px"
      px={3.5}
      py={3}
      borderRadius="xl"
      borderWidth="1px"
      borderColor="#E0E8EC"
      bg="white"
      borderLeftWidth="4px"
      borderLeftColor={accent}
    >
      <Text
        fontSize="10px"
        fontWeight="700"
        letterSpacing="0.08em"
        textTransform="uppercase"
        color="gray.500"
        mb={1}
      >
        {label}
      </Text>
      <Text fontSize="2xl" fontWeight="800" color={accent} lineHeight="1.1">
        {value}
      </Text>
      {hint ? (
        <Text fontSize="xs" color="gray.500" mt={1} noOfLines={1}>
          {hint}
        </Text>
      ) : null}
    </Box>
  );
}

function QualifierExportModal({ isOpen, onClose }) {
  const toast = useToast();
  const dispatch = useDispatch();
  const [authToken] = useState(Cookies.get("authToken"));
  const interviewBatches = useSelector(selectActiveInterviewBatches);

  const [batchId, setBatchId] = useState("");
  const [profileUpdated, setProfileUpdated] = useState("");
  const [classType, setClassType] = useState("");
  const [examType, setExamType] = useState("");
  const [isActive, setIsActive] = useState("");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState("");
  const [preview, setPreview] = useState([]);
  const [examTypeCounts, setExamTypeCounts] = useState({
    total: 0,
    css: 0,
    pms: 0,
  });
  const [statusCounts, setStatusCounts] = useState({
    total: 0,
    active: 0,
    inactive: 0,
  });
  const [matchedTotal, setMatchedTotal] = useState(0);
  const [viewStep, setViewStep] = useState("filters"); // filters | printview
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [pdfFileName, setPdfFileName] = useState("");
  const [cachedExportRecords, setCachedExportRecords] = useState(null);

  const headers = useMemo(
    () => ({ Authorization: `Bearer ${authToken}` }),
    [authToken]
  );

  const selectedBatch = interviewBatches.find((b) => b._id === batchId);

  const buildQualifierParams = useCallback(
    () => ({
      batch: batchId || undefined,
      profile_updated: profileUpdated || undefined,
      class_type: classType || undefined,
      exam_type: examType || undefined,
      is_active: isActive || undefined,
    }),
    [batchId, profileUpdated, classType, examType, isActive]
  );

  const revokePdfUrl = useCallback((url) => {
    if (!url) return;
    try {
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  }, []);

  const clearPrintView = useCallback(() => {
    setPdfBlobUrl((prev) => {
      revokePdfUrl(prev);
      return null;
    });
    setPdfFileName("");
    setCachedExportRecords(null);
    setViewStep("filters");
  }, [revokePdfUrl]);

  useEffect(() => {
    if (!isOpen || !authToken) return;
    dispatch(
      fetchBatches({
        authToken,
        queryParams: { limit: 100, page: 1, query: "", is_active: "true" },
      })
    );
  }, [isOpen, authToken, dispatch]);

  useEffect(() => {
    if (!isOpen) {
      setBatchId("");
      setProfileUpdated("");
      setClassType("");
      setExamType("");
      setIsActive("");
      setPreview([]);
      setExamTypeCounts({ total: 0, css: 0, pms: 0 });
      setStatusCounts({ total: 0, active: 0, inactive: 0 });
      setMatchedTotal(0);
      setExporting("");
      setLoading(false);
      clearPrintView();
    }
  }, [isOpen, clearPrintView]);

  useEffect(() => {
    return () => {
      revokePdfUrl(pdfBlobUrl);
    };
  }, [pdfBlobUrl, revokePdfUrl]);

  const loadPreview = useCallback(async () => {
    setLoading(true);
    clearPrintView();
    try {
      const { data } = await axios.get(`${config.BASE_URL}/qualifiers`, {
        headers,
        params: { ...buildQualifierParams(), page: 1, limit: 50 },
      });
      setPreview(Array.isArray(data?.docs) ? data.docs : []);
      setExamTypeCounts({
        total: Number(data?.exam_type_counts?.total) || Number(data?.totalDocs) || 0,
        css: Number(data?.exam_type_counts?.css) || 0,
        pms: Number(data?.exam_type_counts?.pms) || 0,
      });
      setStatusCounts({
        total: Number(data?.status_counts?.total) || Number(data?.totalDocs) || 0,
        active: Number(data?.status_counts?.active) || 0,
        inactive: Number(data?.status_counts?.inactive) || 0,
      });
      setMatchedTotal(
        Number(data?.totalDocs) ||
          Number(data?.status_counts?.total) ||
          Number(data?.exam_type_counts?.total) ||
          0
      );
    } catch (error) {
      toast({
        title: "Could not load qualifiers",
        description:
          error?.response?.data?.message || error.message || "Please try again.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
      setPreview([]);
      setExamTypeCounts({ total: 0, css: 0, pms: 0 });
      setStatusCounts({ total: 0, active: 0, inactive: 0 });
      setMatchedTotal(0);
    } finally {
      setLoading(false);
    }
  }, [headers, buildQualifierParams, toast, clearPrintView]);

  const loadExportRecords = () =>
    fetchAllPaginated({
      url: `${config.BASE_URL}/qualifiers`,
      headers,
      params: buildQualifierParams(),
    });

  useEffect(() => {
    if (!isOpen) return;
    loadPreview();
  }, [isOpen, loadPreview]);

  const profileFilterLabel =
    profileUpdated === "true"
      ? "Profile Updated"
      : profileUpdated === "false"
        ? "Profile Not Updated"
        : "All Profiles";

  const classTypeLabel =
    classType === "Online"
      ? "Online"
      : classType === "On Campus"
        ? "On Campus"
        : "All Modes";

  const examTypeLabel =
    examType === "CSS" ? "CSS" : examType === "PMS" ? "PMS" : "All CSS/PMS";

  const statusFilterLabel =
    isActive === "true"
      ? "Active"
      : isActive === "false"
        ? "Inactive"
        : "All Status";

  const batchFilterLabel = selectedBatch?.name || "All interview batches";

  const isProfileUpdated = (qualifier) =>
    typeof qualifier?.profile_updated === "boolean"
      ? qualifier.profile_updated
      : isQualifierProfileComplete(qualifier);

  const updatedCount = preview.filter(isProfileUpdated).length;
  const notUpdatedCount = preview.length - updatedCount;

  const pdfOptions = useCallback(
    (records) => ({
      qualifiers: records,
      batchName: selectedBatch?.name || "",
      profileFilterLabel,
      classTypeLabel,
      statusFilterLabel,
      examTypeLabel,
      totalCount: matchedTotal,
    }),
    [
      selectedBatch?.name,
      profileFilterLabel,
      classTypeLabel,
      statusFilterLabel,
      examTypeLabel,
      matchedTotal,
    ]
  );

  const handleExcel = async () => {
    if (!matchedTotal) {
      toast({
        title: "Nothing to export",
        description: "No qualifier profiles match the selected filters.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    setExporting("excel");
    try {
      const exportRecords = await loadExportRecords();
      downloadQualifiersExcel({
        qualifiers: exportRecords,
        batchName: selectedBatch?.name || "",
      });
      toast({
        title: "Excel exported",
        description: `${exportRecords.length} qualifier profile(s) downloaded.`,
        status: "success",
        duration: 3500,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Excel export failed",
        description: error.message || "Please try again.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setExporting("");
    }
  };

  const handleOpenPrintView = async () => {
    if (!matchedTotal) {
      toast({
        title: "Nothing to preview",
        description: "No qualifier profiles match the selected filters.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    setExporting("preview");
    try {
      const exportRecords = await loadExportRecords();
      const { blobUrl, fileName } = await generateQualifiersPdf({
        ...pdfOptions(exportRecords),
        mode: "preview",
      });
      setCachedExportRecords(exportRecords);
      setPdfFileName(fileName);
      setPdfBlobUrl((prev) => {
        revokePdfUrl(prev);
        return blobUrl;
      });
      setViewStep("printview");
    } catch (error) {
      toast({
        title: "Print view failed",
        description: error.message || "Please try again.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setExporting("");
    }
  };

  const handleDownloadFromPreview = async () => {
    if (!cachedExportRecords?.length && !pdfBlobUrl) {
      toast({
        title: "Nothing to download",
        description: "Open print view first.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    setExporting("pdf");
    try {
      if (pdfBlobUrl) {
        const link = document.createElement("a");
        link.href = pdfBlobUrl;
        link.download = pdfFileName || "LCA_Qualifier_Profiles.pdf";
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        await generateQualifiersPdf({
          ...pdfOptions(cachedExportRecords || []),
          mode: "download",
        });
      }
      toast({
        title: "PDF downloaded",
        description: `${(cachedExportRecords || []).length || matchedTotal} qualifier profile(s) saved.`,
        status: "success",
        duration: 3500,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "PDF download failed",
        description: error.message || "Please try again.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setExporting("");
    }
  };

  const handlePrintFromPreview = async () => {
    setExporting("print");
    try {
      if (pdfBlobUrl) {
        const printWindow = window.open(pdfBlobUrl, "_blank");
        if (!printWindow) {
          throw new Error("Pop-up blocked. Allow pop-ups to print.");
        }
        printWindow.focus();
        setTimeout(() => {
          try {
            printWindow.print();
          } catch {
            // manual print
          }
        }, 500);
      } else {
        await generateQualifiersPdf({
          ...pdfOptions(cachedExportRecords || []),
          mode: "print",
        });
      }
    } catch (error) {
      toast({
        title: "Print failed",
        description: error.message || "Please try again.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setTimeout(() => setExporting(""), 400);
    }
  };

  const handleClose = () => {
    clearPrintView();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      {...responsiveModalProps}
      {...getResponsiveModalSize("6xl")}
    >
      <ModalOverlay />
      <AccessForm permissionMode="read" component={ModalContent} {...responsiveModalContentProps}>
        <ModalHeader className="text-xl font-semibold">
          {viewStep === "printview"
            ? "Print View — Qualifier Profiles"
            : "Export Qualifier Profiles"}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {viewStep === "printview" ? (
            <VStack align="stretch" spacing={3}>
              <Box
                p={3}
                borderRadius="xl"
                bg="#F7F9FC"
                borderWidth="1px"
                borderColor="#E0E8EC"
              >
                <HStack justify="space-between" flexWrap="wrap" gap={2}>
                  <Text fontSize="sm" color="gray.700" fontWeight="600">
                    Review the PDF below. Download only when it looks correct.
                  </Text>
                  <HStack spacing={2} flexWrap="wrap">
                    <Badge colorScheme="purple" borderRadius="md" px={2} py={0.5}>
                      Total: {matchedTotal}
                    </Badge>
                    <Badge colorScheme="blue" borderRadius="md" px={2} py={0.5}>
                      Batch: {batchFilterLabel}
                    </Badge>
                    <Badge colorScheme="teal" borderRadius="md" px={2} py={0.5}>
                      {examTypeLabel}
                    </Badge>
                    <Badge colorScheme="orange" borderRadius="md" px={2} py={0.5}>
                      {profileFilterLabel}
                    </Badge>
                    <Badge colorScheme="green" borderRadius="md" px={2} py={0.5}>
                      {classTypeLabel}
                    </Badge>
                    <Badge colorScheme="gray" borderRadius="md" px={2} py={0.5}>
                      {statusFilterLabel}
                    </Badge>
                  </HStack>
                </HStack>
              </Box>

              {pdfBlobUrl ? (
                <iframe
                  src={`${pdfBlobUrl}#toolbar=0&navpanes=0`}
                  title="Qualifier Profiles Print View"
                  style={{
                    width: "100%",
                    height: "68vh",
                    border: "1px solid #E0E8EC",
                    borderRadius: "12px",
                    backgroundColor: "#525659",
                  }}
                />
              ) : (
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  height="68vh"
                  bg="gray.50"
                  borderRadius="xl"
                >
                  <LcaLogoLoading size="sm" />
                </Box>
              )}
            </VStack>
          ) : (
            <>
              <Box
                mb={4}
                p={4}
                borderRadius="xl"
                bg="linear-gradient(135deg, #F7F9FC 0%, #FFF8EE 100%)"
                borderWidth="1px"
                borderColor="#E0E8EC"
              >
                <Text
                  fontSize="xs"
                  fontWeight="700"
                  letterSpacing="0.06em"
                  textTransform="uppercase"
                  color="#163150"
                  mb={3}
                >
                  Totals for current filters
                </Text>
                <SimpleGrid columns={{ base: 2, md: 3, lg: 6 }} spacing={3}>
                  <StatCard
                    label="Total"
                    value={loading ? "…" : matchedTotal}
                    hint="Matching profiles"
                    accent="#163150"
                  />
                  <StatCard
                    label="Interview Batch"
                    value={loading ? "…" : matchedTotal}
                    hint={batchFilterLabel}
                    accent="#2B6CB0"
                  />
                  <StatCard
                    label="Profile"
                    value={loading ? "…" : matchedTotal}
                    hint={
                      profileUpdated
                        ? profileFilterLabel
                        : `Updated ${updatedCount} · Not ${notUpdatedCount} (list sample)`
                    }
                    accent="#38A169"
                  />
                  <StatCard
                    label="Mode"
                    value={loading ? "…" : matchedTotal}
                    hint={classTypeLabel}
                    accent="#805AD5"
                  />
                  <StatCard
                    label="Status"
                    value={loading ? "…" : matchedTotal}
                    hint={
                      isActive
                        ? statusFilterLabel
                        : `Active ${statusCounts.active} · Inactive ${statusCounts.inactive}`
                    }
                    accent="#DD6B20"
                  />
                  <StatCard
                    label="CSS / PMS"
                    value={loading ? "…" : matchedTotal}
                    hint={
                      examType
                        ? examTypeLabel
                        : `CSS ${examTypeCounts.css} · PMS ${examTypeCounts.pms}`
                    }
                    accent="#C05621"
                  />
                </SimpleGrid>
              </Box>

              <Box
                mb={4}
                p={4}
                borderRadius="xl"
                borderWidth="1px"
                borderColor="#E0E8EC"
                bg="white"
              >
                <Text
                  fontSize="xs"
                  fontWeight="700"
                  letterSpacing="0.06em"
                  textTransform="uppercase"
                  color="#163150"
                  mb={3}
                >
                  Filters
                </Text>
                <HStack align="end" flexWrap="wrap" gap={3} mb={3}>
                  <FormControl maxW="280px">
                    <FormLabel fontSize="sm">Interview Batch</FormLabel>
                    <SearchableBatchSelect
                      batches={interviewBatches}
                      value={batchId}
                      onChange={setBatchId}
                      placeholder="All interview batches"
                      width="100%"
                    />
                  </FormControl>

                  <FormControl maxW="180px">
                    <FormLabel fontSize="sm">Profile</FormLabel>
                    <Select
                      value={profileUpdated}
                      onChange={(e) => setProfileUpdated(e.target.value)}
                    >
                      <option value="">All Profiles</option>
                      <option value="true">Updated</option>
                      <option value="false">Not Updated</option>
                    </Select>
                  </FormControl>

                  <FormControl maxW="160px">
                    <FormLabel fontSize="sm">Mode</FormLabel>
                    <Select
                      value={classType}
                      onChange={(e) => setClassType(e.target.value)}
                    >
                      <option value="">All Modes</option>
                      <option value="Online">Online</option>
                      <option value="On Campus">On Campus</option>
                    </Select>
                  </FormControl>

                  <FormControl maxW="150px">
                    <FormLabel fontSize="sm">Status</FormLabel>
                    <Select
                      permissionField="is_active"
                      value={isActive}
                      onChange={(e) => setIsActive(e.target.value)}
                    >
                      <option value="">All Status</option>
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </Select>
                  </FormControl>
                </HStack>

                <Text fontSize="sm" fontWeight="medium" mb={2}>
                  CSS/PMS
                </Text>
                <HStack spacing={2} flexWrap="wrap">
                  {[
                    { value: "", label: "All CSS/PMS", count: examTypeCounts.total },
                    { value: "CSS", label: "CSS", count: examTypeCounts.css },
                    { value: "PMS", label: "PMS", count: examTypeCounts.pms },
                  ].map((option) => {
                    const isSelected = examType === option.value;
                    return (
                      <Button
                        key={option.label}
                        type="button"
                        size="sm"
                        borderRadius="xl"
                        border="1px solid"
                        borderColor={isSelected ? "#E3B574" : "#E0E8EC"}
                        bg={isSelected ? "#FFCB82" : "white"}
                        color={isSelected ? "#654E26" : "#4A5568"}
                        _hover={{ bg: isSelected ? "#E3B574" : "#FFFBF5" }}
                        onClick={() => setExamType(option.value)}
                      >
                        {option.label}
                        <Badge
                          ml={2}
                          borderRadius="md"
                          colorScheme={isSelected ? "orange" : "gray"}
                        >
                          {loading ? "…" : option.count}
                        </Badge>
                      </Button>
                    );
                  })}
                </HStack>
              </Box>

              <HStack spacing={3} flexWrap="wrap" mb={3}>
                <Badge colorScheme="purple" borderRadius="md" px={3} py={1}>
                  Ready: {loading ? "…" : matchedTotal}
                </Badge>
                <Badge colorScheme="green" borderRadius="md" px={3} py={1}>
                  Active: {loading ? "…" : statusCounts.active}
                </Badge>
                <Badge colorScheme="red" borderRadius="md" px={3} py={1}>
                  Inactive: {loading ? "…" : statusCounts.inactive}
                </Badge>
                <Badge colorScheme="teal" borderRadius="md" px={3} py={1}>
                  CSS: {loading ? "…" : examTypeCounts.css}
                </Badge>
                <Badge colorScheme="orange" borderRadius="md" px={3} py={1}>
                  PMS: {loading ? "…" : examTypeCounts.pms}
                </Badge>
              </HStack>

              <Box
                borderRadius="xl"
                border="1px solid"
                borderColor="#E0E8EC"
                overflow="hidden"
              >
                {loading ? (
                  <HStack justify="center" py={10}>
                    <LcaLogoLoading size="sm" />
                    <Text fontSize="sm" color="gray.600">
                      Loading profiles…
                    </Text>
                  </HStack>
                ) : (
                  <TableContainer maxH="320px" overflowY="auto">
                    <Table variant="simple" size="sm">
                      <Thead position="sticky" top={0} bg="gray.50" zIndex={1}>
                        <Tr>
                          <Th>No</Th>
                          <Th>Photo / Name</Th>
                          <Th>Batch</Th>
                          <Th>CSS/PMS</Th>
                          <Th>CSS/PMS Roll No</Th>
                          <Th>CNIC</Th>
                          <Th>Mode</Th>
                          <Th>Phone</Th>
                          <Th>City</Th>
                          <Th>Profile</Th>
                          <Th>Status</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {preview.length === 0 ? (
                          <Tr>
                            <Td colSpan={11}>
                              <span className="flex justify-center items-center gap-2 text-[#A1A1A1] py-6">
                                <FileX size={18} />
                                No qualifier profiles match these filters
                              </span>
                            </Td>
                          </Tr>
                        ) : (
                          preview.map((qualifier, index) => {
                            const profileOk = isProfileUpdated(qualifier);
                            const active = qualifier.is_active !== false;
                            return (
                              <Tr key={qualifier._id || `${qualifier.phone}-${index}`}>
                                <Td>{index + 1}</Td>
                                <Td>
                                  <HStack spacing={2}>
                                    <Avatar
                                      size="sm"
                                      name={qualifier.name}
                                      src={
                                        getMediaUrl(qualifier.photo) || defaultAvatar
                                      }
                                    />
                                    <Text fontSize="sm" noOfLines={1} maxW="160px">
                                      {qualifier.name || "—"}
                                    </Text>
                                  </HStack>
                                </Td>
                                <Td>{qualifier.batch?.name || "—"}</Td>
                                <Td>{qualifier.exam_type || "—"}</Td>
                                <Td>{qualifier.css_pms_roll_no || "—"}</Td>
                                <Td>{qualifier.cnic || "—"}</Td>
                                <Td>{qualifier.class_type || "—"}</Td>
                                <Td>{qualifier.phone || "—"}</Td>
                                <Td>{qualifier.city || "—"}</Td>
                                <Td>
                                  <Badge
                                    colorScheme={profileOk ? "green" : "orange"}
                                    borderRadius="md"
                                    px={2}
                                    py={0.5}
                                  >
                                    {profileOk ? "Updated" : "Not Updated"}
                                  </Badge>
                                </Td>
                                <Td>
                                  <Badge
                                    colorScheme={active ? "green" : "red"}
                                    borderRadius="md"
                                    px={2}
                                    py={0.5}
                                  >
                                    {active ? "Active" : "Inactive"}
                                  </Badge>
                                </Td>
                              </Tr>
                            );
                          })
                        )}
                      </Tbody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
              {!loading && matchedTotal > preview.length ? (
                <Text fontSize="xs" color="gray.500" mt={2}>
                  Showing first {preview.length} of {matchedTotal} profiles in
                  the list. Print view includes all matched records.
                </Text>
              ) : null}
            </>
          )}
        </ModalBody>
        <ModalFooter flexWrap="wrap" gap={2}>
          {viewStep === "printview" ? (
            <>
              <Button
                leftIcon={<ArrowLeft size={16} />}
                variant="ghost"
                borderRadius="0.75rem"
                onClick={clearPrintView}
                mr="auto"
              >
                Back to filters
              </Button>
              <Button
                leftIcon={<Printer size={16} />}
                borderRadius="0.75rem"
                variant="outline"
                onClick={handlePrintFromPreview}
                isLoading={exporting === "print"}
                isDisabled={!pdfBlobUrl}
              >
                Print
              </Button>
              <Button
                leftIcon={<Download size={16} />}
                borderRadius="0.75rem"
                backgroundColor="#7AEF85"
                color="#257947"
                _hover={{ backgroundColor: "#65C76E", color: "#184E2E" }}
                onClick={handleDownloadFromPreview}
                isLoading={exporting === "pdf"}
                loadingText="Downloading..."
                isDisabled={!pdfBlobUrl}
              >
                Download PDF
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                borderRadius="0.75rem"
                onClick={handleClose}
                mr="auto"
              >
                Close
              </Button>
              <Button
                leftIcon={<FileSpreadsheet size={16} />}
                borderRadius="0.75rem"
                backgroundColor="#FFCB82"
                color="#85652D"
                _hover={{ backgroundColor: "#E3B574", color: "#654E26" }}
                onClick={handleExcel}
                isLoading={exporting === "excel"}
                loadingText="Excel..."
                isDisabled={loading || !matchedTotal}
              >
                Export Excel
              </Button>
              <Button
                leftIcon={<Eye size={16} />}
                borderRadius="0.75rem"
                backgroundColor="#7AEF85"
                color="#257947"
                _hover={{ backgroundColor: "#65C76E", color: "#184E2E" }}
                onClick={handleOpenPrintView}
                isLoading={exporting === "preview"}
                loadingText="Building..."
                isDisabled={loading || !matchedTotal}
              >
                Print View
              </Button>
            </>
          )}
        </ModalFooter>
      </AccessForm>
    </Modal>
  );
}

export function QualifierExportButton({ onClick }) {
  return (
    <button type="button" className="table-action-btn" onClick={onClick}>
      <Download size={18} />
      Export
    </button>
  );
}

export default QualifierExportModal;
