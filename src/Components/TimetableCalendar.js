import moment from "moment";
import Calendar from "./Calendar";
import React, {
  Fragment,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import { Views } from "react-big-calendar";
import {
  Card,
  Divider,
  Heading,
  Spinner,
  TabPanel,
  useDisclosure,
} from "@chakra-ui/react";
import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from "@chakra-ui/react";
import { Box, FormControl, FormLabel, Input, VStack } from "@chakra-ui/react";
import { Select } from "@chakra-ui/react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useDispatch, useSelector } from "react-redux";
import { fetchTeachers, selectAllTeachers } from "../Features/teacherSlice";
import { fetchCourses, selectAllCourses } from "../Features/courseSlice";
import { fetchBatches, selectAllBatches } from "../Features/batchSlice";
import Cookies from "js-cookie";
import {
  addTimeTableEvent,
  deleteTimeTableEvent,
  fetchTimeTableEvents,
  selectTimeTableEvents,
} from "../Features/timetableSlice";
import { Tab, TabList, TabPanels, Tabs } from "@chakra-ui/react";
import { Text } from "@chakra-ui/react";
import TimeTableEventEditForm from "./TimeTableEventEditForm";
import { isStudentViewOnly } from "../utlls/studentAccess";

export default function TimetableCalendar() {
  const viewOnly = isStudentViewOnly();
  const {
    isOpen: isAddModalOpen,
    onOpen: onAddModalOpen,
    onClose: onAddModalClose,
  } = useDisclosure();
  const {
    isOpen: isEditModalOpen,
    onOpen: onEditModalOpen,
    onClose: onEditModalClose,
  } = useDisclosure();

  const [events, setEvents] = useState([]);

  const [authToken, setAuthToken] = useState(Cookies.get("authToken"));

  const [start, setStart] = useState(new Date());
  const [end, setEnd] = useState(new Date());
  const [day, setDay] = useState("");

  const [eventDetails, setEventDetails] = useState({});

  const [selectedBatch, setSelectedBatch] = useState("");

  const { fetchStatus, addStatus, deleteStatus } = useSelector(
    (state) => state.timetable
  );

  const timeTableEvents = useSelector(selectTimeTableEvents);
  const teachers = useSelector(selectAllTeachers);
  const courses = useSelector(selectAllCourses);
  const batches = useSelector(selectAllBatches);
  const dispatch = useDispatch();

  const handleSelectSlot = useCallback(
    ({ start, end }) => {
      if (viewOnly) return;
      setStart(start);
      setEnd(end);
      setDay(moment(start).format("YYYY-MM-DD"));
      formik.setFieldValue("day", moment(start).format("YYYY-MM-DD"));
      formik.setFieldValue("start_time", moment(start).format("HH:mm"));
      formik.setFieldValue("end_time", moment(end).format("HH:mm"));
      onAddModalOpen();
    },
    [setEvents, viewOnly]
  );

  const handleSelectEvent = useCallback((event) => {
    if (viewOnly) return;
    setEventDetails(event);
    onEditModalOpen();
  }, [viewOnly]);

  const { defaultDate, scrollToTime } = useMemo(
    () => ({
      defaultDate: new Date(),
      // scrollToTime: new Date(2024, 31, 5, 6),
    }),
    []
  );

  const formik = useFormik({
    initialValues: {
      day: "",
      start_time: "",
      end_time: "",
      teacher: "",
      course: "",
      batch: "",
    },
    validationSchema: Yup.object({
      day: Yup.string().required("Required"),
      start_time: Yup.string().required("Required"),
      end_time: Yup.string().required("Required"),
      teacher: Yup.string().required("Required"),
      course: Yup.string().required("Required"),
      batch: Yup.string().required("Required"),
    }),
    onSubmit: async (values) => {
      dispatch(addTimeTableEvent({ authToken, timeTable: values }))
        .unwrap()
        .then((data) => {
          onAddModalClose();
          window.location.reload();
        });
    },
  });

  const formateDateTime = (payload) => {
    const start = moment(payload.day + " " + payload.start_time);
    const end = moment(payload.day + " " + payload.end_time);
    return {
      start: new Date(
        start.year(),
        start.month(),
        start.date(),
        start.hours(),
        start.minutes()
      ),
      end: new Date(
        end.year(),
        end.month(),
        end.date(),
        end.hours(),
        end.minutes()
      ),
    };
  };

  const handleDeleteEvent = () => {
    dispatch(deleteTimeTableEvent({ authToken, id: eventDetails._id }))
      .unwrap()
      .then(() => {
        onEditModalClose();
        window.location.reload();
      });
  };

  const batchChangeHandler = (e) => {
    formik.handleChange(e);
    setSelectedBatch(batches.find((batch) => batch._id === e.target.value));
  };

  useEffect(() => {
    dispatch(fetchTimeTableEvents({ authToken }))
      .unwrap()
      .then((data) => {
        // dispatch(fetchTeachers({ authToken }));
        // dispatch(fetchCourses({ authToken }));
        dispatch(fetchBatches({ authToken }));
        const formattedDateTime = data.map((event) => formateDateTime(event));
        const formattedData = data.map((event, index) => ({
          ...event,
          title: event.course?.name || "ERR",
          teacherName: event.teacher?.name || "ERR",
          batchName: event.batch?.name || "ERR",
          courseName: event.course?.name || "ERR",
          start: formattedDateTime[index].start,
          end: formattedDateTime[index].end,
        }));
        setEvents(formattedData);
      });
  }, [authToken]);

  return (
    <>
      {fetchStatus === "loading" ? (
        <div className="w-full h-full flex justify-center items-center">
          <Spinner />
        </div>
      ) : (
        <Calendar
          defaultDate={defaultDate}
          defaultView={Views.MONTH}
          events={events}
          onSelectEvent={viewOnly ? undefined : handleSelectEvent}
          onSelectSlot={viewOnly ? undefined : handleSelectSlot}
          selectable={!viewOnly}
          scrollToTime={scrollToTime}
          components={{
            day: {
              event: (props) => {
                return (
                  <Fragment>
                    <div>
                      <span className="font-bold">Course: </span>
                      {props.event.title}
                    </div>
                    <div>
                      <span className="font-bold">Teacher: </span>
                      {props.event.teacherName}
                    </div>
                    <div>
                      <span className="font-bold">Batch: </span>
                      {props.event.batchName}
                    </div>
                  </Fragment>
                );
              },
            },
          }}
        />
      )}

      {!viewOnly && (
      <>
      {/* Add New Timetable Event Modal */}
      <Modal isOpen={isAddModalOpen} onClose={onAddModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader className="text-xl font-semibold">
            Lecture Details
          </ModalHeader>
          <ModalCloseButton />
          <form onSubmit={formik.handleSubmit}>
            <ModalBody>
              <VStack spacing={4}>
                <FormControl id="day">
                  <FormLabel fontSize={14}>Day</FormLabel>
                  <Input
                    type="date"
                    name="day"
                    borderRadius={"0.5rem"}
                    value={formik.values.day}
                    onChange={formik.handleChange}
                  />
                  {formik.touched.day && formik.errors.day ? (
                    <Box color="red" fontSize="sm">
                      {formik.errors.day}
                    </Box>
                  ) : null}
                </FormControl>
                <FormControl id="start_time">
                  <FormLabel fontSize={14}>Start Time</FormLabel>
                  <Input
                    type="time"
                    name="start_time"
                    borderRadius={"0.5rem"}
                    value={formik.values.start_time}
                    onChange={formik.handleChange}
                  />
                  {formik.touched.start_time && formik.errors.start_time ? (
                    <Box color="red" fontSize="sm">
                      {formik.errors.start_time}
                    </Box>
                  ) : null}
                </FormControl>
                <FormControl id="end_time">
                  <FormLabel fontSize={14}>End Time</FormLabel>
                  <Input
                    type="time"
                    name="end_time"
                    borderRadius={"0.5rem"}
                    value={formik.values.end_time}
                    onChange={formik.handleChange}
                  />
                  {formik.touched.end_time && formik.errors.end_time ? (
                    <Box color="red" fontSize="sm">
                      {formik.errors.end_time}
                    </Box>
                  ) : null}
                </FormControl>
                <FormControl id="batch">
                  <FormLabel fontSize={14}>Batch</FormLabel>
                  <Select
                    placeholder="Select Batch"
                    name="batch"
                    borderRadius={"0.5rem"}
                    value={formik.values.batch}
                    onChange={batchChangeHandler}
                  >
                    {batches.map((batch) => (
                      <option key={batch._id} value={batch._id}>
                        {batch.name}
                      </option>
                    ))}
                  </Select>
                  {formik.touched.batch && formik.errors.batch ? (
                    <Box color="red" fontSize="sm">
                      {formik.errors.batch}
                    </Box>
                  ) : null}
                </FormControl>
                {selectedBatch && (
                  <>
                    <FormControl id="course">
                      <FormLabel fontSize={14}>Course</FormLabel>
                      <Select
                        placeholder="Select Course"
                        name="course"
                        borderRadius={"0.5rem"}
                        value={formik.values.course}
                        onChange={formik.handleChange}
                      >
                        {selectedBatch.courses?.map((course) => (
                          <option key={course._id} value={course._id}>
                            {course.name}
                          </option>
                        ))}
                      </Select>
                      {formik.touched.course && formik.errors.course ? (
                        <Box color="red" fontSize="sm">
                          {formik.errors.course}
                        </Box>
                      ) : null}
                    </FormControl>
                    <FormControl id="teacher">
                      <FormLabel fontSize={14}>Teacher</FormLabel>
                      <Select
                        placeholder="Select Teacher"
                        name="teacher"
                        borderRadius={"0.5rem"}
                        value={formik.values.teacher}
                        onChange={formik.handleChange}
                      >
                        {selectedBatch.teachers?.map((teacher) => (
                          <option key={teacher._id} value={teacher._id}>
                            {teacher.name}
                          </option>
                        ))}
                      </Select>
                      {formik.touched.teacher && formik.errors.teacher ? (
                        <Box color="red" fontSize="sm">
                          {formik.errors.teacher}
                        </Box>
                      ) : null}
                    </FormControl>
                  </>
                )}
              </VStack>
            </ModalBody>

            <ModalFooter>
              <Button
                variant="ghost"
                mr={3}
                borderRadius={"0.75rem"}
                onClick={onAddModalClose}
              >
                Close
              </Button>
              <Button
                borderRadius={"0.75rem"}
                backgroundColor={"#FFCB82"}
                color={"#85652D"}
                _hover={{
                  backgroundColor: "#E3B574",
                  color: "#654E26",
                }}
                fontWeight={"500"}
                type="submit"
                loadingText="Saving"
                isLoading={addStatus === "loading"}
              >
                Save
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* Edit Timetable Event Modal */}
      <Modal isOpen={isEditModalOpen} onClose={onEditModalClose}>
        <ModalOverlay />
        <ModalContent className="p-4">
          <ModalCloseButton />
          <Tabs variant="soft-rounded" colorScheme="gray">
            <TabList>
              <Tab>Detail</Tab>
              <Tab>Edit</Tab>
              <Tab>Delete</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <ModalBody className="!p-0 flex flex-col gap-3">
                  <div className="flex justify-between items-center gap-4">
                    <Text as="b" className="min-w-max" fontSize="md">
                      Course
                    </Text>
                    <Divider />
                    <Text className="min-w-max">{eventDetails.courseName}</Text>
                  </div>
                  <div className="flex justify-between items-center gap-4">
                    <Text as="b" className="min-w-max" fontSize="md">
                      Teacher
                    </Text>
                    <Divider />
                    <Text className="min-w-max">
                      {eventDetails.teacherName}
                    </Text>
                  </div>
                  <div className="flex justify-between items-center gap-4">
                    <Text as="b" className="min-w-max" fontSize="md">
                      Batch
                    </Text>
                    <Divider />
                    <Text className="min-w-max">{eventDetails.batchName}</Text>
                  </div>
                  <div className="flex justify-between items-center gap-4">
                    <Text as="b" className="min-w-max" fontSize="md">
                      Start Time
                    </Text>
                    <Divider />
                    <Text className="min-w-max">
                      {moment(eventDetails.start).format("hh:mm a")}
                    </Text>
                  </div>
                  <div className="flex justify-between items-center gap-4">
                    <Text as="b" className="min-w-max" fontSize="md">
                      End Time
                    </Text>
                    <Divider />
                    <Text className="min-w-max">
                      {moment(eventDetails.end).format("hh:mm a")}
                    </Text>
                  </div>
                  <div className="flex justify-between items-center gap-4">
                    <Text as="b" className="min-w-max" fontSize="md">
                      Date
                    </Text>
                    <Divider />
                    <Text className="min-w-max">
                      {moment(eventDetails.start).format("DD dddd, MMMM YYYY")}
                    </Text>
                  </div>
                </ModalBody>
              </TabPanel>
              <TabPanel>
                <TimeTableEventEditForm
                  event={eventDetails}
                  teachers={teachers}
                  courses={courses}
                  batches={batches}
                  onClose={onEditModalClose}
                />
              </TabPanel>
              <TabPanel>
                <ModalBody className="!p-0">
                  <p>Are you sure you want to delete this event?</p>
                </ModalBody>

                <ModalFooter className="!px-0 !pb-0">
                  <Button
                    variant="ghost"
                    mr={3}
                    borderRadius={"0.75rem"}
                    onClick={onEditModalClose}
                  >
                    Close
                  </Button>
                  <Button
                    borderRadius={"0.75rem"}
                    backgroundColor={"#FF8A8A"}
                    color={"#6D1F1F"}
                    _hover={{
                      backgroundColor: "#E48080",
                      color: "#561616",
                    }}
                    fontWeight={"500"}
                    onClick={handleDeleteEvent}
                    loadingText="Deleting"
                    isLoading={deleteStatus === "loading"}
                  >
                    Delete
                  </Button>
                </ModalFooter>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalContent>
      </Modal>
      </>
      )}
    </>
  );
}
