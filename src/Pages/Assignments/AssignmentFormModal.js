import React, { useEffect, useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Switch,
  VStack,
  HStack,
  Text,
} from "@chakra-ui/react";
import { useDispatch, useSelector } from "react-redux";
import {
  addAssignment,
  updateAssignment,
  fetchBatchCoursesForAssignment,
} from "../../Features/assignmentSlice";
import { fetchBatches, selectAllBatches } from "../../Features/batchSlice";
import { isTeacherRole } from "../../utlls/teacherAccess";
import {
  responsiveModalProps,
  responsiveModalContentProps,
  getResponsiveModalSize,
} from "../../utlls/responsiveModal";

const defaultForm = {
  title: "",
  description: "",
  instructions: "",
  batch: "",
  course: "",
  max_marks: 100,
  grading_criteria: "",
  availability_date: "",
  has_deadline: true,
  submission_deadline: "",
  late_submission_policy: "no_late",
  late_deadline: "",
  late_penalty_percent: 0,
  visibility_status: "Draft",
  resubmission_allowed: false,
  max_attempts: 1,
};

function AssignmentFormModal({ isOpen, onClose, authToken, assignment }) {
  const dispatch = useDispatch();
  const batches = useSelector(selectAllBatches);
  const batchCourses = useSelector((state) => state.assignments.batchCourses);
  const [form, setForm] = useState(defaultForm);
  const [files, setFiles] = useState([]);
  const isTeacher = isTeacherRole();

  const availableCourses = batchCourses;

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchBatches({ authToken, limit: 100 }));
    }
  }, [isOpen, dispatch, authToken]);

  useEffect(() => {
    if (assignment) {
      setForm({
        ...defaultForm,
        ...assignment,
        batch: assignment.batch?._id || assignment.batch || "",
        course: assignment.course?._id || assignment.course || "",
        availability_date: assignment.availability_date?.slice(0, 16) || "",
        submission_deadline: assignment.submission_deadline?.slice(0, 16) || "",
        late_deadline: assignment.late_deadline?.slice(0, 16) || "",
      });
    } else {
      setForm(defaultForm);
    }
    setFiles([]);
  }, [assignment, isOpen]);

  useEffect(() => {
    if (form.batch) {
      dispatch(fetchBatchCoursesForAssignment({ authToken, batchId: form.batch }));
    }
  }, [form.batch, dispatch, authToken]);

  useEffect(() => {
    if (!form.course || !availableCourses.length) return;
    const courseStillValid = availableCourses.some(
      (course) => String(course._id) === String(form.course)
    );
    if (!courseStillValid) {
      setForm((prev) => ({ ...prev, course: "" }));
    }
  }, [availableCourses, form.course]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => {
      const next = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };
      if (name === "batch") {
        next.course = "";
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value !== "" && value !== null && value !== undefined) {
        formData.append(key, value);
      }
    });
    files.forEach((file) => formData.append("attachments", file));

    if (assignment?._id) {
      await dispatch(updateAssignment({ authToken, id: assignment._id, formData }));
    } else {
      await dispatch(addAssignment({ authToken, formData }));
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} {...responsiveModalProps} {...getResponsiveModalSize("2xl")}>
      <ModalOverlay />
      <ModalContent {...responsiveModalContentProps}>
        <ModalHeader>{assignment ? "Edit Assignment" : "Create Assignment"}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <FormControl isRequired>
              <FormLabel>Title</FormLabel>
              <Input name="title" value={form.title} onChange={handleChange} />
            </FormControl>
            <FormControl>
              <FormLabel>Description</FormLabel>
              <Textarea name="description" value={form.description} onChange={handleChange} />
            </FormControl>
            <FormControl>
              <FormLabel>Instructions</FormLabel>
              <Textarea name="instructions" value={form.instructions} onChange={handleChange} />
            </FormControl>
            <HStack spacing={4} flexWrap="wrap">
              <FormControl isRequired flex="1" minW="200px">
                <FormLabel>Batch</FormLabel>
                <Select name="batch" value={form.batch} onChange={handleChange}>
                  <option value="">Select batch</option>
                  {batches.map((b) => (
                    <option key={b._id} value={b._id}>{b.name}</option>
                  ))}
                </Select>
              </FormControl>
              <FormControl isRequired flex="1" minW="200px">
                <FormLabel>Course</FormLabel>
                <Select
                  name="course"
                  value={form.course}
                  onChange={handleChange}
                  isDisabled={!form.batch}
                >
                  <option value="">
                    {form.batch ? "Select assigned course" : "Select batch first"}
                  </option>
                  {availableCourses.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </Select>
                {isTeacher && form.batch && availableCourses.length === 0 && (
                  <Text fontSize="sm" color="orange.500" mt={1}>
                    No courses assigned to you for this batch.
                  </Text>
                )}
              </FormControl>
            </HStack>
            <HStack spacing={4} flexWrap="wrap">
              <FormControl flex="1" minW="140px">
                <FormLabel>Max Marks</FormLabel>
                <Input type="number" name="max_marks" value={form.max_marks} onChange={handleChange} />
              </FormControl>
              <FormControl flex="1" minW="140px">
                <FormLabel>Max Attempts</FormLabel>
                <Input type="number" name="max_attempts" value={form.max_attempts} onChange={handleChange} />
              </FormControl>
              <FormControl flex="1" minW="140px">
                <FormLabel>Visibility</FormLabel>
                <Select name="visibility_status" value={form.visibility_status} onChange={handleChange}>
                  <option value="Draft">Draft</option>
                  <option value="Published">Published</option>
                </Select>
              </FormControl>
            </HStack>
            <FormControl>
              <FormLabel>Grading Criteria</FormLabel>
              <Textarea name="grading_criteria" value={form.grading_criteria} onChange={handleChange} />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Availability Date</FormLabel>
              <Input type="datetime-local" name="availability_date" value={form.availability_date} onChange={handleChange} />
            </FormControl>
            <FormControl display="flex" alignItems="center">
              <FormLabel mb={0}>Has Deadline</FormLabel>
              <Switch name="has_deadline" isChecked={form.has_deadline} onChange={handleChange} />
            </FormControl>
            {form.has_deadline && (
              <>
                <FormControl>
                  <FormLabel>Submission Deadline</FormLabel>
                  <Input type="datetime-local" name="submission_deadline" value={form.submission_deadline} onChange={handleChange} />
                </FormControl>
                <FormControl>
                  <FormLabel>Late Submission Policy</FormLabel>
                  <Select name="late_submission_policy" value={form.late_submission_policy} onChange={handleChange}>
                    <option value="no_late">No late submissions</option>
                    <option value="late_with_penalty">Allow with penalty</option>
                    <option value="late_without_penalty">Allow without penalty</option>
                    <option value="late_until_deadline">Allow until late deadline</option>
                  </Select>
                </FormControl>
                {form.late_submission_policy === "late_with_penalty" && (
                  <FormControl>
                    <FormLabel>Penalty %</FormLabel>
                    <Input type="number" name="late_penalty_percent" value={form.late_penalty_percent} onChange={handleChange} />
                  </FormControl>
                )}
                {form.late_submission_policy === "late_until_deadline" && (
                  <FormControl>
                    <FormLabel>Late Deadline</FormLabel>
                    <Input type="datetime-local" name="late_deadline" value={form.late_deadline} onChange={handleChange} />
                  </FormControl>
                )}
              </>
            )}
            <FormControl display="flex" alignItems="center">
              <FormLabel mb={0}>Resubmission Allowed</FormLabel>
              <Switch name="resubmission_allowed" isChecked={form.resubmission_allowed} onChange={handleChange} />
            </FormControl>
            <FormControl>
              <FormLabel>Attachments</FormLabel>
              <Input type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} />
              {files.length > 0 && (
                <Text fontSize="sm" color="gray.500" mt={1}>{files.length} file(s) selected</Text>
              )}
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
          <Button colorScheme="yellow" onClick={handleSubmit}>
            {assignment ? "Update" : "Create"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default AssignmentFormModal;
