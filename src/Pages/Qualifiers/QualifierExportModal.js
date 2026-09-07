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
  FormControl,
  FormLabel,
  Select,
  Text,
  HStack,
  Badge,
  useToast,
  Spinner,
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Avatar,
} from "@chakra-ui/react";
import { Download, FileSpreadsheet, FileText, FileX } from "lucide-react";
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
import { exportQualifiersPdf } from "../../utlls/generateQualifiersPdf";

const defaultAvatar =
  "https://images.unsplash.com/photo-1619946794135-5bc917a27793?ixlib=rb-0.3.5&q=80&fm=jpg&crop=faces&fit=crop&h=200&w=200&s=b616b2c5b373a80ffc9636ba24f7a4a9";

function QualifierExportModal({ isOpen, onClose }) {
  const toast = useToast();
  const dispatch = useDispatch();
  const [authToken] = useState(Cookies.get("authToken"));
  const interviewBatches = useSelector(selectActiveInterviewBatches);

  const [batchId, setBatchId] = useState("");
  const [profileUpdated, setProfileUpdated] = useState("");
  const [classType, setClassType] = useState("");
  const [isActive, setIsActive] = useState("");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState("");
  const [preview, setPreview] = useState([]);

  const headers = useMemo(
    () => ({ Authorization: `Bearer ${authToken}` }),
    [authToken]
  );

  const selectedBatch = interviewBatches.find((b) => b._id === batchId);

  useEffect(() => {
    if (!isOpen || !authToken) return;
    dispatch(
      fetchBatches({
        authToken,
        queryParams: { limit: 200, page: 1, query: "", is_active: "true" },
      })
    );
  }, [isOpen, authToken, dispatch]);

  useEffect(() => {
    if (!isOpen) {
      setBatchId("");
      setProfileUpdated("");
      setClassType("");
      setIsActive("");
      setPreview([]);
      setExporting("");
      setLoading(false);
    }
  }, [isOpen]);

  const loadPreview = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${config.BASE_URL}/qualifiers`, {
        headers,
        params: {
          page: 1,
          limit: 5000,
          batch: batchId || undefined,
          profile_updated: profileUpdated || undefined,
          class_type: classType || undefined,
          is_active: isActive || undefined,
        },
      });
      setPreview(Array.isArray(data.docs) ? data.docs : []);
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
    } finally {
      setLoading(false);
    }
  }, [headers, batchId, profileUpdated, classType, isActive, toast]);

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

  const handleExcel = async () => {
    if (!preview.length) {
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
      downloadQualifiersExcel({
        qualifiers: preview,
        batchName: selectedBatch?.name || "",
      });
      toast({
        title: "Excel exported",
        description: `${preview.length} qualifier profile(s) downloaded.`,
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

  const handlePdf = async () => {
    if (!preview.length) {
      toast({
        title: "Nothing to export",
        description: "No qualifier profiles match the selected filters.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    setExporting("pdf");
    try {
      await exportQualifiersPdf({
        qualifiers: preview,
        batchName: selectedBatch?.name || "",
        profileFilterLabel,
        classTypeLabel,
      });
      toast({
        title: "PDF exported",
        description: `${preview.length} qualifier profile(s) downloaded.`,
        status: "success",
        duration: 3500,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "PDF export failed",
        description: error.message || "Please try again.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setExporting("");
    }
  };

  const isProfileUpdated = (qualifier) =>
    typeof qualifier?.profile_updated === "boolean"
      ? qualifier.profile_updated
      : isQualifierProfileComplete(qualifier);

  const updatedCount = preview.filter(isProfileUpdated).length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      {...responsiveModalProps}
      {...getResponsiveModalSize("5xl")}
    >
      <ModalOverlay />
      <ModalContent {...responsiveModalContentProps}>
        <ModalHeader className="text-xl font-semibold">
          Export Qualifier Profiles
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text fontSize="sm" color="gray.600" mb={4}>
            Choose filters to preview matching profiles, then download Excel or
            PDF.
          </Text>

          <HStack align="end" flexWrap="wrap" gap={3} mb={4}>
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
                value={isActive}
                onChange={(e) => setIsActive(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </Select>
            </FormControl>
          </HStack>

          <HStack spacing={3} flexWrap="wrap" mb={3}>
            <Badge colorScheme="purple" borderRadius="md" px={3} py={1}>
              Ready: {loading ? "…" : preview.length}
            </Badge>
            <Badge colorScheme="green" borderRadius="md" px={3} py={1}>
              Updated: {loading ? "…" : updatedCount}
            </Badge>
            <Badge colorScheme="orange" borderRadius="md" px={3} py={1}>
              Not Updated: {loading ? "…" : preview.length - updatedCount}
            </Badge>
            {selectedBatch?.name ? (
              <Badge colorScheme="blue" borderRadius="md" px={3} py={1}>
                {selectedBatch.name}
              </Badge>
            ) : null}
          </HStack>

          <Box
            borderRadius="xl"
            border="1px solid"
            borderColor="#E0E8EC"
            overflow="hidden"
          >
            {loading ? (
              <HStack justify="center" py={10}>
                <Spinner size="sm" color="#85652D" />
                <Text fontSize="sm" color="gray.600">
                  Loading profiles…
                </Text>
              </HStack>
            ) : (
              <TableContainer maxH="420px" overflowY="auto">
                <Table variant="simple" size="sm">
                  <Thead position="sticky" top={0} bg="gray.50" zIndex={1}>
                    <Tr>
                      <Th>No</Th>
                      <Th>Photo / Name</Th>
                      <Th>Batch</Th>
                      <Th>CSS/PMS Roll No</Th>
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
                        <Td colSpan={9}>
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
                            <Td>{qualifier.css_pms_roll_no || "—"}</Td>
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
        </ModalBody>
        <ModalFooter flexWrap="wrap" gap={2}>
          <Button
            variant="ghost"
            borderRadius="0.75rem"
            onClick={onClose}
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
            isDisabled={loading || !preview.length}
          >
            Export Excel
          </Button>
          <Button
            leftIcon={<FileText size={16} />}
            borderRadius="0.75rem"
            backgroundColor="#7AEF85"
            color="#257947"
            _hover={{ backgroundColor: "#65C76E", color: "#184E2E" }}
            onClick={handlePdf}
            isLoading={exporting === "pdf"}
            loadingText="PDF..."
            isDisabled={loading || !preview.length}
          >
            Export PDF
          </Button>
        </ModalFooter>
      </ModalContent>
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
