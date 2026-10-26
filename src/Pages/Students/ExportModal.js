
import { Select, Input } from '../../Components/AccessInputs';
import AccessForm from '../../Components/AccessForm';
import FormControl from '../../Components/AccessFormControl';
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, Button, Table, Thead, Tbody, Tr, Th, Td, TableContainer, FormLabel, SimpleGrid, Box, Text, Badge, HStack, useToast } from '@chakra-ui/react';
import Cookies from "js-cookie";
import { Download, FilterX } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import moment from "moment";
import {
  getResponsiveModalSize,
  responsiveModalContentProps,
} from "../../utlls/responsiveModal";
import { formatStudentEmail } from "../../utlls/studentEmail";
import { fetchBatches, selectActiveStudentBatches } from "../../Features/batchSlice";
import { fetchStudents } from "../../Features/studentSlice";
import LcaLogoLoading from "../../Components/LcaLogoLoading";
import { compareStudentsByRollAscending } from "../../utlls/rollNumber";
import { config } from "../../utlls/config";
import {
  downloadStudentsExcel,
  getStudentDueDate,
  hasPendingDues,
} from "../../utlls/exportStudentsExcel";

const isStudentBatch = (batch) =>
  batch && batch.is_active !== false && batch.is_interview_batch !== true;

const DEFAULT_FILTERS = {
  batch_id: "",
  search_field: "all",
  query: "",
  payment_status: "", // "" | pending_dues | fully_paid
  start_date: "",
  end_date: "",
  due_date_from: "",
  due_date_to: "",
  city: "",
  is_active: "",
};

const formatDueDate = (value) => {
  if (!value) return "—";
  const m = moment(value);
  return m.isValid() ? m.format("DD/MM/YYYY") : String(value);
};

const ExportModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [authToken] = useState(Cookies.get("authToken"));
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  const batches = useSelector(selectActiveStudentBatches);
  const dispatch = useDispatch();
  const toast = useToast();

  const studentBatches = useMemo(
    () => (batches || []).filter(isStudentBatch),
    [batches]
  );

  const hasActiveFilters =
    Boolean(filters.batch_id) ||
    Boolean(filters.query?.trim()) ||
    Boolean(filters.payment_status) ||
    Boolean(filters.start_date) ||
    Boolean(filters.end_date) ||
    Boolean(filters.due_date_from) ||
    Boolean(filters.due_date_to) ||
    Boolean(filters.city?.trim()) ||
    Boolean(filters.is_active) ||
    filters.search_field !== "all";

  /** Highlight pending rows when not filtered to a single payment status. */
  const highlightPending = !filters.payment_status;
  const showDueDate =
    filters.payment_status === "pending_dues" ||
    Boolean(filters.due_date_from || filters.due_date_to);

  const buildExportParams = useCallback(
    (page = 1) => {
      const params = {
        page,
        limit: 10000,
        export: 1,
      };
      if (filters.batch_id) params.batch_id = filters.batch_id;
      if (filters.query?.trim()) {
        params.query = filters.query.trim();
        params.search_field = filters.search_field || "all";
      }
      if (filters.payment_status) params.payment_status = filters.payment_status;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;
      if (filters.due_date_from) params.due_date_from = filters.due_date_from;
      if (filters.due_date_to) params.due_date_to = filters.due_date_to;
      if (filters.city?.trim()) params.city = filters.city.trim();
      if (filters.is_active) params.is_active = filters.is_active;
      return params;
    },
    [filters]
  );

  const fetchAllFilteredStudents = useCallback(async () => {
    const headers = { Authorization: `Bearer ${authToken}` };
    const first = await axios.get(`${config.BASE_URL}/students`, {
      headers,
      params: buildExportParams(1),
    });
    let docs = Array.isArray(first.data?.docs) ? [...first.data.docs] : [];
    const totalPages = Number(first.data?.totalPages) || 1;

    for (let page = 2; page <= totalPages; page += 1) {
      const next = await axios.get(`${config.BASE_URL}/students`, {
        headers,
        params: buildExportParams(page),
      });
      if (Array.isArray(next.data?.docs)) {
        docs = docs.concat(next.data.docs);
      }
    }

    return docs;
  }, [authToken, buildExportParams]);

  const loadStudents = useCallback(async () => {
    if (!authToken) return;
    setLoading(true);
    setError("");
    try {
      const docs = await fetchAllFilteredStudents();
      setStudents([...docs].sort(compareStudentsByRollAscending));
    } catch (err) {
      setStudents([]);
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Could not load students for export"
      );
    } finally {
      setLoading(false);
    }
  }, [authToken, fetchAllFilteredStudents]);

  useEffect(() => {
    if (!isOpen) return;
    loadStudents();
  }, [isOpen, loadStudents]);

  const pendingCount = useMemo(
    () => students.filter(hasPendingDues).length,
    [students]
  );

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => setFilters({ ...DEFAULT_FILTERS });

  const handleModalOpen = () => {
    setFilters({ ...DEFAULT_FILTERS });
    setStudents([]);
    setError("");
    dispatch(fetchBatches({ authToken }));
    setIsOpen(true);
  };

  const handleModalClose = () => {
    setIsOpen(false);
    // Restore main students list (export uses its own request, not redux list)
    dispatch(fetchStudents({ authToken }));
  };

  const handleDownloadExcel = async () => {
    setExporting(true);
    try {
      const docs = await fetchAllFilteredStudents();
      const exportStudents = [...docs].sort(compareStudentsByRollAscending);

      const fileName = downloadStudentsExcel({
        students: exportStudents,
        highlightPending: !filters.payment_status,
        fileName: `StudentsSheet[${moment().format("DD-MM-YYYY")}]`,
      });

      toast({
        title: "Excel downloaded",
        description: `${exportStudents.length} student(s)${
          !filters.payment_status
            ? ` · pending dues highlighted (${
                exportStudents.filter(hasPendingDues).length
              })`
            : ""
        } · ${fileName}`,
        status: "success",
        duration: 4500,
        isClosable: true,
      });
      handleModalClose();
    } catch (err) {
      toast({
        title: "Export failed",
        description:
          err?.response?.data?.message ||
          err.message ||
          "Could not export students",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <button className="table-action-btn" onClick={handleModalOpen}>
        <Download size={18} />
        Excel File
      </button>

      <Modal
        isOpen={isOpen}
        onClose={handleModalClose}
        {...getResponsiveModalSize("6xl")}
      >
        <ModalOverlay />
        <AccessForm permissionMode="read" component={ModalContent} {...responsiveModalContentProps}>
          <ModalHeader className="text-xl font-semibold">
            Export Student Records
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Box
              mb={4}
              p={4}
              borderWidth="1px"
              borderColor="#E0E8EC"
              borderRadius="xl"
              bg="#FAFBFC"
            >
              <HStack justify="space-between" mb={3} flexWrap="wrap" gap={2}>
                <Text fontSize="sm" fontWeight="semibold" color="#4A5568">
                  Filters
                </Text>
                {hasActiveFilters && (
                  <Button
                    size="sm"
                    leftIcon={<FilterX size={14} />}
                    borderRadius="lg"
                    variant="ghost"
                    onClick={clearFilters}
                  >
                    Clear filters
                  </Button>
                )}
              </HStack>

              <SimpleGrid columns={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing={3}>
                <FormControl>
                  <FormLabel fontSize="xs" color="gray.500" mb={1}>
                    Batch
                  </FormLabel>
                  <Select
                    size="md"
                    borderRadius="xl"
                    bg="white"
                    value={filters.batch_id}
                    onChange={(e) => updateFilter("batch_id", e.target.value)}
                  >
                    <option value="">All batches</option>
                    {studentBatches.map((batch) => (
                      <option key={batch._id} value={batch._id}>
                        {batch.name}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="xs" color="gray.500" mb={1}>
                    Pending dues
                  </FormLabel>
                  <Select
                    size="md"
                    borderRadius="xl"
                    bg="white"
                    value={filters.payment_status}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFilters((prev) => ({
                        ...prev,
                        payment_status: value,
                        // Clear due-date filters when leaving pending-dues mode
                        due_date_from:
                          value === "pending_dues" ? prev.due_date_from : "",
                        due_date_to:
                          value === "pending_dues" ? prev.due_date_to : "",
                      }));
                    }}
                  >
                    <option value="">All (highlight pending)</option>
                    <option value="pending_dues">Pending dues only</option>
                    <option value="fully_paid">No pending dues</option>
                  </Select>
                </FormControl>

                {filters.payment_status === "pending_dues" && (
                  <>
                    <FormControl>
                      <FormLabel fontSize="xs" color="gray.500" mb={1}>
                        Due date from
                      </FormLabel>
                      <Input
                        type="date"
                        size="md"
                        borderRadius="xl"
                        bg="white"
                        value={filters.due_date_from}
                        onChange={(e) =>
                          updateFilter("due_date_from", e.target.value)
                        }
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize="xs" color="gray.500" mb={1}>
                        Due date to
                      </FormLabel>
                      <Input
                        type="date"
                        size="md"
                        borderRadius="xl"
                        bg="white"
                        value={filters.due_date_to}
                        onChange={(e) =>
                          updateFilter("due_date_to", e.target.value)
                        }
                      />
                    </FormControl>
                  </>
                )}

                <FormControl>
                  <FormLabel fontSize="xs" color="gray.500" mb={1}>
                    Student status
                  </FormLabel>
                  <Select
                    size="md"
                    borderRadius="xl"
                    bg="white"
                    value={filters.is_active}
                    onChange={(e) => updateFilter("is_active", e.target.value)}
                  >
                    <option value="">All statuses</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="xs" color="gray.500" mb={1}>
                    Search in
                  </FormLabel>
                  <Select
                    size="md"
                    borderRadius="xl"
                    bg="white"
                    value={filters.search_field}
                    onChange={(e) =>
                      updateFilter("search_field", e.target.value)
                    }
                  >
                    <option value="all">All fields</option>
                    <option value="name">Name</option>
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="xs" color="gray.500" mb={1}>
                    Search
                  </FormLabel>
                  <Input
                    size="md"
                    borderRadius="xl"
                    bg="white"
                    placeholder="Name, phone, email, roll no…"
                    value={filters.query}
                    onChange={(e) => updateFilter("query", e.target.value)}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="xs" color="gray.500" mb={1}>
                    City
                  </FormLabel>
                  <Input
                    size="md"
                    borderRadius="xl"
                    bg="white"
                    placeholder="City"
                    value={filters.city}
                    onChange={(e) => updateFilter("city", e.target.value)}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="xs" color="gray.500" mb={1}>
                    Admission from
                  </FormLabel>
                  <Input
                    type="date"
                    size="md"
                    borderRadius="xl"
                    bg="white"
                    value={filters.start_date}
                    onChange={(e) => updateFilter("start_date", e.target.value)}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="xs" color="gray.500" mb={1}>
                    Admission to
                  </FormLabel>
                  <Input
                    type="date"
                    size="md"
                    borderRadius="xl"
                    bg="white"
                    value={filters.end_date}
                    onChange={(e) => updateFilter("end_date", e.target.value)}
                  />
                </FormControl>
              </SimpleGrid>

              <HStack mt={3} spacing={2} flexWrap="wrap">
                <Badge colorScheme="blue" borderRadius="md" px={2} py={1}>
                  {students.length} student{students.length === 1 ? "" : "s"}
                </Badge>
                {highlightPending && (
                  <Badge colorScheme="orange" borderRadius="md" px={2} py={1}>
                    {pendingCount} with pending dues (highlighted)
                  </Badge>
                )}
                {filters.payment_status === "pending_dues" && (
                  <Badge colorScheme="red" borderRadius="md" px={2} py={1}>
                    Pending dues only
                    {(filters.due_date_from || filters.due_date_to) &&
                      ` · due ${filters.due_date_from || "…"} → ${
                        filters.due_date_to || "…"
                      }`}
                  </Badge>
                )}
                {filters.payment_status === "fully_paid" && (
                  <Badge colorScheme="green" borderRadius="md" px={2} py={1}>
                    Fully paid only
                  </Badge>
                )}
              </HStack>
            </Box>

            {loading ? (
              <div className="flex justify-center items-center h-40 rounded-xl border border-[#E0E8EC]">
                <LcaLogoLoading size="sm" />
              </div>
            ) : error ? (
              <Text color="red.500" textAlign="center" py={8}>
                {error}
              </Text>
            ) : (
              <div className="w-full bg-white rounded-xl border border-[#E0E8EC] overflow-auto max-h-[50vh]">
                {students.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No students found for these filters
                  </div>
                ) : (
                  <TableContainer>
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th>No</Th>
                          <Th>Name</Th>
                          <Th>Roll No</Th>
                          <Th>Phone</Th>
                          <Th>Batch</Th>
                          <Th>Pending Dues?</Th>
                          {showDueDate && <Th>Due Date</Th>}
                          <Th isNumeric>Pending Fee</Th>
                          <Th>Status</Th>
                          <Th>City</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {students.map((student, index) => {
                          const pending = hasPendingDues(student);
                          return (
                            <Tr
                              key={student._id}
                              className={
                                highlightPending && pending
                                  ? "student-row--pending-fee"
                                  : undefined
                              }
                              title={
                                pending
                                  ? `Pending fee: Rs. ${Number(
                                      student.pending_fee
                                    ).toLocaleString()}`
                                  : undefined
                              }
                            >
                              <Td>{index + 1}</Td>
                              <Td fontWeight="medium">{student.name}</Td>
                              <Td>{student.roll_number || "—"}</Td>
                              <Td>{student.phone}</Td>
                              <Td>{student.batch?.name || "—"}</Td>
                              <Td>
                                {pending ? (
                                  <Badge colorScheme="orange">
                                    PENDING DUES
                                  </Badge>
                                ) : (
                                  <Badge colorScheme="green">Clear</Badge>
                                )}
                              </Td>
                              {showDueDate && (
                                <Td fontWeight="semibold" color="#9C4221">
                                  {formatDueDate(getStudentDueDate(student))}
                                </Td>
                              )}
                              <Td isNumeric fontWeight="semibold">
                                {Number(
                                  student.pending_fee || 0
                                ).toLocaleString()}
                              </Td>
                              <Td>
                                {student.is_active === false
                                  ? "Inactive"
                                  : "Active"}
                              </Td>
                              <Td>{student.city || "—"}</Td>
                            </Tr>
                          );
                        })}
                      </Tbody>
                    </Table>
                  </TableContainer>
                )}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              borderRadius="0.75rem"
              onClick={handleModalClose}
            >
              Close
            </Button>
            <Button
              borderRadius="0.75rem"
              backgroundColor="#7AEF85"
              color="#257947"
              _hover={{
                backgroundColor: "#65C76E",
                color: "#184E2E",
              }}
              fontWeight="500"
              onClick={handleDownloadExcel}
              loadingText="Exporting"
              isLoading={exporting}
              isDisabled={loading || students.length === 0}
            >
              Export Excel
            </Button>
          </ModalFooter>
        </AccessForm>
      </Modal>
    </>
  );
};

export default ExportModal;
