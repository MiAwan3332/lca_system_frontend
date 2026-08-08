import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  useToast,
  VStack,
} from "@chakra-ui/react";
import Cookies from "js-cookie";
import axios from "axios";
import { FileText, Search } from "lucide-react";
import { useSelector } from "react-redux";
import { selectActiveBatches } from "../../Features/batchSlice";
import SearchableBatchSelect from "../../Components/SearchableBatchSelect";
import GeneratePendingFeeSlipAction from "./GeneratePendingFeeSlipAction";
import {
  getResponsiveModalSize,
  responsiveModalContentProps,
  responsiveModalProps,
} from "../../utlls/responsiveModal";
import { config } from "../../utlls/config";

const formatAmount = (amount) =>
  `Rs. ${Number(amount || 0).toLocaleString("en-PK", {
    maximumFractionDigits: 0,
  })}`;

/**
 * Header flow: select batch → search/select student with pending fee → generate slip.
 */
function GeneratePendingFeeWizard() {
  const authToken = Cookies.get("authToken");
  const toast = useToast();
  const batches = useSelector(selectActiveBatches);

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [batchId, setBatchId] = useState("");
  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState("");
  const [activeStudent, setActiveStudent] = useState(null);
  const [nameSearch, setNameSearch] = useState("");
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [collectOpen, setCollectOpen] = useState(false);

  const filteredStudents = useMemo(() => {
    const q = nameSearch.trim().toLowerCase();
    if (!q) return students;
    return students.filter((student) => {
      const name = String(student.name || "").toLowerCase();
      const roll = String(student.roll_number || "").toLowerCase();
      const phone = String(student.phone || "").toLowerCase();
      return name.includes(q) || roll.includes(q) || phone.includes(q);
    });
  }, [students, nameSearch]);

  const resetPicker = () => {
    setBatchId("");
    setStudents([]);
    setStudentId("");
    setActiveStudent(null);
    setNameSearch("");
    setIsLoadingStudents(false);
  };

  const handleClosePicker = () => {
    setIsPickerOpen(false);
    if (!collectOpen) {
      resetPicker();
    }
  };

  const openFeeSlipForStudent = (student) => {
    if (!student?._id) return;
    setStudentId(student._id);
    setActiveStudent(student);
    setIsPickerOpen(false);
    setCollectOpen(true);
  };

  const handleCloseFeeSlip = () => {
    setCollectOpen(false);
    setActiveStudent(null);
    setStudentId("");
    setIsPickerOpen(true);
    if (batchId) {
      loadStudentsForBatch(batchId);
    }
  };

  const loadStudentsForBatch = async (id) => {
    if (!id) {
      setStudents([]);
      setStudentId("");
      setNameSearch("");
      return;
    }
    setIsLoadingStudents(true);
    setStudentId("");
    setNameSearch("");
    try {
      const response = await axios.get(`${config.BASE_URL}/students`, {
        headers: { Authorization: `Bearer ${authToken}` },
        params: {
          batch_id: id,
          limit: 500,
          page: 1,
          is_active: "true",
        },
      });
      const list = Array.isArray(response.data?.docs)
        ? response.data.docs
        : Array.isArray(response.data?.students)
          ? response.data.students
          : Array.isArray(response.data)
            ? response.data
            : [];
      const pendingStudents = list.filter((s) => Number(s.pending_fee) > 0);
      setStudents(pendingStudents);
      if (!pendingStudents.length) {
        toast({
          title: "No pending fees",
          description: "No students with outstanding balance in this batch.",
          status: "info",
          duration: 4000,
          isClosable: true,
        });
      }
    } catch (error) {
      setStudents([]);
      toast({
        title: "Could not load students",
        description: error?.response?.data?.message || error.message,
        status: "error",
        duration: 4500,
        isClosable: true,
      });
    } finally {
      setIsLoadingStudents(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="table-action-btn"
        onClick={() => {
          resetPicker();
          setIsPickerOpen(true);
        }}
      >
        <FileText size={18} />
        Generate Pending Fee
      </button>

      <Modal
        isOpen={isPickerOpen}
        onClose={handleClosePicker}
        {...responsiveModalProps}
        {...getResponsiveModalSize("6xl")}
      >
        <ModalOverlay />
        <ModalContent
          {...responsiveModalContentProps}
          display="flex"
          flexDirection="column"
          maxH={{ base: "100dvh", sm: "92vh" }}
          minH={{ base: "100dvh", sm: "40rem" }}
          w={{ base: "100%", sm: "92vw" }}
          maxW={{ base: "100%", sm: "72rem" }}
        >
          <ModalHeader flexShrink={0}>Generate Pending Fee</ModalHeader>
          <ModalCloseButton />
          <ModalBody flex="1" overflowY="auto" py={4}>
            <VStack spacing={5} align="stretch">
              <FormControl isRequired>
                <FormLabel fontSize={14}>Select batch</FormLabel>
                <SearchableBatchSelect
                  batches={batches}
                  value={batchId}
                  onChange={(value) => {
                    setBatchId(value);
                    loadStudentsForBatch(value);
                  }}
                  placeholder="Search batch"
                  width="100%"
                  showClearOption={false}
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize={14}>Search student by name</FormLabel>
                <InputGroup>
                  <InputLeftElement pointerEvents="none" h="full">
                    <Search size={16} color="#A0AEC0" />
                  </InputLeftElement>
                  <Input
                    borderRadius="0.5rem"
                    pl={10}
                    placeholder={
                      batchId
                        ? "Type student name, roll no, or phone..."
                        : "Select a batch first"
                    }
                    value={nameSearch}
                    isDisabled={!batchId || isLoadingStudents}
                    onChange={(e) => setNameSearch(e.target.value)}
                  />
                </InputGroup>
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize={14}>
                  Select student
                  {batchId && !isLoadingStudents
                    ? ` (${filteredStudents.length}${
                        nameSearch.trim() ? ` of ${students.length}` : ""
                      } with pending fee)`
                    : ""}
                </FormLabel>

                {!batchId ? (
                  <Box
                    p={6}
                    borderRadius="lg"
                    border="1px dashed"
                    borderColor="gray.300"
                    textAlign="center"
                  >
                    <Text fontSize="sm" color="gray.500">
                      Select a batch to load students with pending fees.
                    </Text>
                  </Box>
                ) : isLoadingStudents ? (
                  <Box
                    p={6}
                    borderRadius="lg"
                    border="1px solid"
                    borderColor="gray.200"
                    textAlign="center"
                  >
                    <Text fontSize="sm" color="gray.500">
                      Loading students...
                    </Text>
                  </Box>
                ) : filteredStudents.length === 0 ? (
                  <Box
                    p={6}
                    borderRadius="lg"
                    border="1px dashed"
                    borderColor="gray.300"
                    textAlign="center"
                  >
                    <Text fontSize="sm" color="gray.500">
                      {nameSearch.trim()
                        ? "No students match this name search."
                        : "No students with pending fees in this batch."}
                    </Text>
                  </Box>
                ) : (
                  <Box
                    maxH="22rem"
                    overflowY="auto"
                    border="1px solid"
                    borderColor="gray.200"
                    borderRadius="lg"
                  >
                    <VStack spacing={0} align="stretch" divider={undefined}>
                      {filteredStudents.map((student) => {
                        const isSelected =
                          String(student._id) === String(studentId);
                        return (
                          <Box
                            key={student._id}
                            as="button"
                            type="button"
                            textAlign="left"
                            w="100%"
                            px={4}
                            py={3}
                            bg={isSelected ? "#FFF6E8" : "white"}
                            borderBottom="1px solid"
                            borderColor="gray.100"
                            _hover={{ bg: isSelected ? "#FFF0D6" : "gray.50" }}
                            onClick={() => openFeeSlipForStudent(student)}
                          >
                            <Text fontWeight="600" fontSize="sm">
                              {student.name}
                            </Text>
                            <Text fontSize="xs" color="gray.500" mt={0.5}>
                              {student.roll_number
                                ? `Roll: ${student.roll_number}`
                                : "No roll no"}
                              {student.phone ? ` · ${student.phone}` : ""}
                              {` · Pending ${formatAmount(student.pending_fee)}`}
                            </Text>
                            <Text fontSize="xs" color="#85652D" mt={1} fontWeight="600">
                              Open fee slip →
                            </Text>
                          </Box>
                        );
                      })}
                    </VStack>
                  </Box>
                )}
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter flexShrink={0} gap={2}>
            <Button variant="ghost" onClick={handleClosePicker}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {activeStudent ? (
        <GeneratePendingFeeSlipAction
          student={activeStudent}
          showTrigger={false}
          isOpen={collectOpen}
          onClose={handleCloseFeeSlip}
        />
      ) : null}
    </>
  );
}

export default GeneratePendingFeeWizard;
