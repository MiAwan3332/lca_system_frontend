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
} from "@chakra-ui/react";
import { useDispatch, useSelector } from "react-redux";
import {
  addCourseQuiz,
  updateCourseQuiz,
  fetchBatchCoursesForQuiz,
} from "../../Features/courseQuizSlice";
import { fetchBatches, selectActiveBatches } from "../../Features/batchSlice";
import {
  responsiveModalProps,
  responsiveModalContentProps,
  getResponsiveModalSize,
} from "../../utlls/responsiveModal";

const defaultForm = {
  title: "",
  description: "",
  batch: "",
  course: "",
  start_datetime: "",
  end_datetime: "",
  duration_minutes: 30,
  passing_marks: 50,
  max_marks: 100,
  max_attempts: 1,
  randomize_questions: true,
  negative_marking: false,
  negative_mark_value: 0,
  use_mcq_bank: true,
  question_count: 10,
  auto_submit_on_timeout: true,
  result_publication: "after_end_date",
  result_release_at: "",
  hide_correct_answers_until_release: true,
  status: "Draft",
};

function QuizFormModal({ isOpen, onClose, authToken, quiz }) {
  const dispatch = useDispatch();
  const batches = useSelector(selectActiveBatches);
  const batchCourses = useSelector((state) => state.courseQuizzes.batchCourses);
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    if (isOpen) dispatch(fetchBatches({ authToken, limit: 100 }));
  }, [isOpen, dispatch, authToken]);

  useEffect(() => {
    if (quiz) {
      setForm({
        ...defaultForm,
        ...quiz,
        batch: quiz.batch?._id || quiz.batch || "",
        course: quiz.course?._id || quiz.course || "",
        start_datetime: quiz.start_datetime?.slice(0, 16) || "",
        end_datetime: quiz.end_datetime?.slice(0, 16) || "",
        result_release_at: quiz.result_release_at?.slice(0, 16) || "",
      });
    } else {
      setForm(defaultForm);
    }
  }, [quiz, isOpen]);

  useEffect(() => {
    if (form.batch) {
      dispatch(fetchBatchCoursesForQuiz({ authToken, batchId: form.batch }));
    }
  }, [form.batch, dispatch, authToken]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async () => {
    const payload = { ...form };
    if (quiz?._id) {
      await dispatch(updateCourseQuiz({ authToken, id: quiz._id, quiz: payload }));
    } else {
      await dispatch(addCourseQuiz({ authToken, quiz: payload }));
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} {...responsiveModalProps} {...getResponsiveModalSize("2xl")}>
      <ModalOverlay />
      <ModalContent {...responsiveModalContentProps}>
        <ModalHeader>{quiz ? "Edit Course Quiz" : "Create Course Quiz"}</ModalHeader>
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
                <Select name="course" value={form.course} onChange={handleChange}>
                  <option value="">Select course</option>
                  {batchCourses.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </Select>
              </FormControl>
            </HStack>
            <HStack spacing={4} flexWrap="wrap">
              <FormControl flex="1" minW="180px">
                <FormLabel>Start</FormLabel>
                <Input type="datetime-local" name="start_datetime" value={form.start_datetime} onChange={handleChange} />
              </FormControl>
              <FormControl flex="1" minW="180px">
                <FormLabel>End</FormLabel>
                <Input type="datetime-local" name="end_datetime" value={form.end_datetime} onChange={handleChange} />
              </FormControl>
            </HStack>
            <HStack spacing={4} flexWrap="wrap">
              <FormControl flex="1" minW="120px">
                <FormLabel>Duration (min)</FormLabel>
                <Input type="number" name="duration_minutes" value={form.duration_minutes} onChange={handleChange} />
              </FormControl>
              <FormControl flex="1" minW="120px">
                <FormLabel>Passing %</FormLabel>
                <Input type="number" name="passing_marks" value={form.passing_marks} onChange={handleChange} />
              </FormControl>
              <FormControl flex="1" minW="120px">
                <FormLabel>Attempts</FormLabel>
                <Input type="number" name="max_attempts" value={form.max_attempts} onChange={handleChange} />
              </FormControl>
              <FormControl flex="1" minW="120px">
                <FormLabel>Questions</FormLabel>
                <Input type="number" name="question_count" value={form.question_count} onChange={handleChange} />
              </FormControl>
            </HStack>
            <FormControl>
              <FormLabel>Result Publication</FormLabel>
              <Select name="result_publication" value={form.result_publication} onChange={handleChange}>
                <option value="immediate">Immediately after submission</option>
                <option value="after_review">After teacher review</option>
                <option value="scheduled">On scheduled date</option>
                <option value="after_end_date">After quiz end date</option>
              </Select>
            </FormControl>
            {form.result_publication === "scheduled" && (
              <FormControl>
                <FormLabel>Result Release Date</FormLabel>
                <Input type="datetime-local" name="result_release_at" value={form.result_release_at} onChange={handleChange} />
              </FormControl>
            )}
            <HStack spacing={6} flexWrap="wrap">
              <FormControl display="flex" alignItems="center" w="auto">
                <FormLabel mb={0}>Randomize</FormLabel>
                <Switch name="randomize_questions" isChecked={form.randomize_questions} onChange={handleChange} />
              </FormControl>
              <FormControl display="flex" alignItems="center" w="auto">
                <FormLabel mb={0}>Negative Marking</FormLabel>
                <Switch name="negative_marking" isChecked={form.negative_marking} onChange={handleChange} />
              </FormControl>
              <FormControl display="flex" alignItems="center" w="auto">
                <FormLabel mb={0}>Use MCQ Bank</FormLabel>
                <Switch name="use_mcq_bank" isChecked={form.use_mcq_bank} onChange={handleChange} />
              </FormControl>
              <FormControl display="flex" alignItems="center" w="auto">
                <FormLabel mb={0}>Auto-submit on timeout</FormLabel>
                <Switch name="auto_submit_on_timeout" isChecked={form.auto_submit_on_timeout} onChange={handleChange} />
              </FormControl>
            </HStack>
            {form.negative_marking && (
              <FormControl>
                <FormLabel>Negative Mark Value</FormLabel>
                <Input type="number" name="negative_mark_value" value={form.negative_mark_value} onChange={handleChange} />
              </FormControl>
            )}
            <FormControl>
              <FormLabel>Status</FormLabel>
              <Select name="status" value={form.status} onChange={handleChange}>
                <option value="Draft">Draft</option>
                <option value="Scheduled">Scheduled</option>
              </Select>
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
          <Button colorScheme="yellow" onClick={handleSubmit}>
            {quiz ? "Update" : "Create"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default QuizFormModal;
