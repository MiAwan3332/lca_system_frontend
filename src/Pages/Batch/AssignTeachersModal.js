import React, { useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Spinner,
  VStack,
  FormControl,
  FormLabel,
  Select,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  IconButton,
  Alert,
  AlertIcon,
  useToast,
  Heading,
} from "@chakra-ui/react";
import Cookies from "js-cookie";
import { UserPlus, Trash2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { fetchTeachers, selectAllTeachers } from "../../Features/teacherSlice";
import {
  assignTeacherCoursesToBatch,
  fetchBatchCourses,
  fetchBatchTeacherAssignments,
  fetchBatches,
  selectBatchCourses,
} from "../../Features/batchSlice";
import {
  responsiveModalProps,
  responsiveModalContentProps,
  getResponsiveModalSize,
} from "../../utlls/responsiveModal";

const getId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value._id || "";
};

const getName = (value, fallback = "N/A") => {
  if (!value) return fallback;
  if (typeof value === "string") return fallback;
  return value.name || fallback;
};

const mapAssignments = (items = []) =>
  items.map((item) => ({
    teacher: getId(item.teacher),
    course: getId(item.course),
    teacherName: getName(item.teacher),
    courseName: getName(item.course),
  }));

const AssignTeachersModal = ({ batchId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [authToken] = useState(Cookies.get("authToken"));
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [assignments, setAssignments] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const toast = useToast();

  const dispatch = useDispatch();
  const teachers = useSelector(selectAllTeachers);
  const batchCourses = useSelector(selectBatchCourses);
  const { assignTeacherCoursesStatus, fetchBatchCoursesStatus } = useSelector(
    (state) => state.batches
  );

  const onClose = () => {
    setIsOpen(false);
    setSelectedTeacher("");
    setSelectedCourse("");
  };

  const handleOpenModal = async () => {
    setAssignments([]);
    setSelectedTeacher("");
    setSelectedCourse("");
    setIsOpen(true);
    setLoadingData(true);

    try {
      await Promise.all([
        dispatch(
          fetchTeachers({
            authToken,
            queryParams: { page: 1, limit: 1000, query: "" },
          })
        ),
        dispatch(fetchBatchCourses({ authToken, batchId })),
      ]);

      const data = await dispatch(
        fetchBatchTeacherAssignments({ authToken, batchId })
      ).unwrap();

      setAssignments(mapAssignments(Array.isArray(data) ? data : []));
    } catch {
      setAssignments([]);
      toast({
        title: "Could not load existing teacher assignments",
        status: "error",
        duration: 3500,
        isClosable: true,
      });
    } finally {
      setLoadingData(false);
    }
  };

  const handleAddAssignment = () => {
    if (!selectedTeacher || !selectedCourse) return;

    const teacher = teachers.find((item) => item._id === selectedTeacher);
    const course = batchCourses.find((item) => item._id === selectedCourse);
    const exists = assignments.some(
      (item) => item.teacher === selectedTeacher && item.course === selectedCourse
    );

    if (exists) {
      toast({
        title: "Duplicate assignment is not allowed",
        description: "This teacher is already assigned to the selected course.",
        status: "warning",
        duration: 3500,
        isClosable: true,
      });
      return;
    }

    setAssignments((prev) => [
      ...prev,
      {
        teacher: selectedTeacher,
        course: selectedCourse,
        teacherName: getName(teacher),
        courseName: getName(course),
      },
    ]);
    setSelectedTeacher("");
    setSelectedCourse("");
  };

  const handleRemoveAssignment = (index) => {
    setAssignments((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleSave = async () => {
    await dispatch(
      assignTeacherCoursesToBatch({
        authToken,
        batchId,
        assignments: assignments.map((item) => ({
          teacher: item.teacher,
          course: item.course,
        })),
      })
    )
      .unwrap()
      .then(() => {
        dispatch(fetchBatches({ authToken }));
        onClose();
      });
  };

  const isLoading =
    loadingData || fetchBatchCoursesStatus === "loading";

  return (
    <>
      <button
        className="hover:bg-[#7AEF85] hover:text-[#257947] font-medium p-[10px] rounded-xl transition-colors duration-300 flex flex-nowrap items-center gap-1.5 pr-3"
        onClick={handleOpenModal}
      >
        <UserPlus size={18} />
        <span>Teachers</span>
      </button>

      <Modal
        isOpen={isOpen}
        onClose={onClose}
        {...responsiveModalProps}
        {...getResponsiveModalSize("2xl")}
      >
        <ModalOverlay />
        <ModalContent {...responsiveModalContentProps}>
          <ModalHeader className="text-xl font-semibold">
            Assign Teacher to Batch by Course
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {isLoading ? (
              <Spinner />
            ) : (
              <VStack spacing={4} align="stretch">
                {batchCourses.length === 0 ? (
                  <Alert status="warning" borderRadius="lg">
                    <AlertIcon />
                    Assign courses to this batch first, then map teachers to each course.
                  </Alert>
                ) : (
                  <>
                    <Text fontSize="sm" color="gray.600">
                      Select a teacher and the course within this batch, then add the
                      assignment. Existing assignments for this batch are listed below.
                    </Text>

                    <FormControl>
                      <FormLabel>Teacher</FormLabel>
                      <Select
                        placeholder="Select teacher"
                        value={selectedTeacher}
                        onChange={(e) => setSelectedTeacher(e.target.value)}
                      >
                        {teachers.map((teacher) => (
                          <option key={teacher._id} value={teacher._id}>
                            {teacher.name}
                          </option>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Course</FormLabel>
                      <Select
                        placeholder="Select course"
                        value={selectedCourse}
                        onChange={(e) => setSelectedCourse(e.target.value)}
                      >
                        {batchCourses.map((course) => (
                          <option key={course._id} value={course._id}>
                            {course.name}
                          </option>
                        ))}
                      </Select>
                    </FormControl>

                    <Button
                      leftIcon={<UserPlus size={16} />}
                      colorScheme="green"
                      variant="outline"
                      onClick={handleAddAssignment}
                      isDisabled={!selectedTeacher || !selectedCourse}
                    >
                      Add Assignment
                    </Button>

                    <Heading size="sm" mt={2}>
                      Assigned Teachers ({assignments.length})
                    </Heading>

                    <TableContainer>
                      <Table size="sm" variant="simple">
                        <Thead>
                          <Tr>
                            <Th>Teacher</Th>
                            <Th>Course</Th>
                            <Th isNumeric>Action</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {assignments.length === 0 ? (
                            <Tr>
                              <Td colSpan={3} textAlign="center" color="gray.500">
                                No teacher-course assignments yet
                              </Td>
                            </Tr>
                          ) : (
                            assignments.map((item, index) => (
                              <Tr key={`${item.teacher}-${item.course}-${index}`}>
                                <Td>{item.teacherName}</Td>
                                <Td>{item.courseName}</Td>
                                <Td isNumeric>
                                  <IconButton
                                    aria-label="Remove assignment"
                                    icon={<Trash2 size={16} />}
                                    size="sm"
                                    variant="ghost"
                                    colorScheme="red"
                                    onClick={() => handleRemoveAssignment(index)}
                                  />
                                </Td>
                              </Tr>
                            ))
                          )}
                        </Tbody>
                      </Table>
                    </TableContainer>
                  </>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} borderRadius="0.75rem" onClick={onClose}>
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
              onClick={handleSave}
              isLoading={assignTeacherCoursesStatus === "loading"}
              isDisabled={batchCourses.length === 0 || isLoading}
            >
              Save Assignments
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default AssignTeachersModal;
