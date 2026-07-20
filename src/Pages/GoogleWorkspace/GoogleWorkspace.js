import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Badge,
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
  Link,
  Select,
  SimpleGrid,
  Text,
  VStack,
  createStandaloneToast,
} from "@chakra-ui/react";
import {
  CalendarPlus,
  CheckCircle2,
  ExternalLink,
  GraduationCap,
  Link2,
  PlugZap,
  RefreshCw,
} from "lucide-react";
import PageHeader, { FilterStack } from "../../Components/PageHeader";
import { config } from "../../utlls/config";
import { getAuthToken } from "../../utlls/authSession";

const { toast } = createStandaloneToast();
const BASE_URL = config.BASE_URL;

const authHeaders = (authToken) => ({
  Authorization: `Bearer ${authToken}`,
});

function IntegrationCard({ title, description, icon: Icon, children }) {
  return (
    <Box borderWidth="1px" borderColor="#E0E8EC" borderRadius="xl" bg="white" p={5}>
      <HStack align="flex-start" spacing={3} mb={4}>
        <Box bg="#FFF7E8" color="#85652D" borderRadius="lg" p={2} flexShrink={0}>
          <Icon size={20} />
        </Box>
        <Box>
          <Text fontWeight="semibold" color="#2D3748">
            {title}
          </Text>
          <Text fontSize="sm" color="gray.600" mt={1}>
            {description}
          </Text>
        </Box>
      </HStack>
      {children}
    </Box>
  );
}

function GoogleWorkspace() {
  const authToken = getAuthToken();
  const [status, setStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [working, setWorking] = useState("");
  const [batches, setBatches] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedAssignment, setSelectedAssignment] = useState("");
  const [selectedTimetable, setSelectedTimetable] = useState("");
  const [lastResult, setLastResult] = useState(null);

  const connected = Boolean(status?.connected);

  const loadStatus = useCallback(async () => {
    if (!authToken) return;
    setLoadingStatus(true);
    try {
      const response = await axios.get(`${BASE_URL}/google/status`, {
        headers: authHeaders(authToken),
      });
      setStatus(response.data);
    } catch (error) {
      toast({
        title: "Unable to load Google status",
        description: error.response?.data?.message || error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoadingStatus(false);
    }
  }, [authToken]);

  const loadPortalData = useCallback(async () => {
    if (!authToken) return;
    try {
      const [batchResponse, assignmentResponse, timetableResponse] = await Promise.all([
        axios.get(`${BASE_URL}/batches`, {
          headers: authHeaders(authToken),
          params: { limit: 100 },
        }),
        axios.get(`${BASE_URL}/assignments`, {
          headers: authHeaders(authToken),
          params: { limit: 100 },
        }),
        axios.get(`${BASE_URL}/timetable`, {
          headers: authHeaders(authToken),
        }),
      ]);

      setBatches(batchResponse.data?.docs || []);
      setAssignments(assignmentResponse.data?.docs || []);
      setTimetable(Array.isArray(timetableResponse.data) ? timetableResponse.data : []);
    } catch (error) {
      toast({
        title: "Unable to load portal records",
        description: error.response?.data?.message || error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  }, [authToken]);

  useEffect(() => {
    loadStatus();
    loadPortalData();
  }, [loadStatus, loadPortalData]);

  const connectGoogle = async () => {
    setWorking("connect");
    try {
      const response = await axios.get(`${BASE_URL}/google/connect-url`, {
        headers: authHeaders(authToken),
      });
      window.location.assign(response.data.url);
    } catch (error) {
      toast({
        title: "Google connection is not ready",
        description: error.response?.data?.message || error.message,
        status: "error",
        duration: 7000,
        isClosable: true,
      });
      setWorking("");
    }
  };

  const disconnectGoogle = async () => {
    setWorking("disconnect");
    try {
      await axios.delete(`${BASE_URL}/google/disconnect`, {
        headers: authHeaders(authToken),
      });
      await loadStatus();
      toast({
        title: "Google account disconnected",
        status: "success",
        duration: 4000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Unable to disconnect Google",
        description: error.response?.data?.message || error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setWorking("");
    }
  };

  const runSync = async ({ key, endpoint, successTitle }) => {
    setWorking(key);
    setLastResult(null);
    try {
      const response = await axios.post(
        `${BASE_URL}${endpoint}`,
        {},
        { headers: authHeaders(authToken) }
      );
      setLastResult(response.data);
      await loadPortalData();
      toast({
        title: successTitle,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Google sync failed",
        description: error.response?.data?.message || error.message,
        status: "error",
        duration: 7000,
        isClosable: true,
      });
    } finally {
      setWorking("");
    }
  };

  const selectedAssignmentData = useMemo(
    () => assignments.find((assignment) => assignment._id === selectedAssignment),
    [assignments, selectedAssignment]
  );

  const selectedTimetableData = useMemo(
    () => timetable.find((entry) => entry._id === selectedTimetable),
    [timetable, selectedTimetable]
  );

  return (
    <>
      <PageHeader
        title="Google Workspace"
        subtitle="Connect LCA Portal with Google Classroom, Calendar, and Meet."
      >
        <FilterStack className="filter-stack--actions">
          <Button
            leftIcon={<RefreshCw size={16} />}
            variant="outline"
            borderRadius="xl"
            isLoading={loadingStatus}
            onClick={() => {
              loadStatus();
              loadPortalData();
            }}
          >
            Refresh
          </Button>
        </FilterStack>
      </PageHeader>

      <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={5}>
        <IntegrationCard
          title="Google Account"
          description="Authorize the Google account that owns Classroom courses and Calendar events."
          icon={PlugZap}
        >
          <VStack align="stretch" spacing={4}>
            <HStack spacing={3} flexWrap="wrap">
              <Badge colorScheme={status?.configured ? "green" : "red"} borderRadius="md">
                {status?.configured ? "Configured" : "Missing env"}
              </Badge>
              <Badge colorScheme={connected ? "green" : "gray"} borderRadius="md">
                {connected ? "Connected" : "Not connected"}
              </Badge>
            </HStack>
            {connected && (
              <Box fontSize="sm" color="gray.600">
                Connected as{" "}
                <Text as="span" fontWeight="semibold" color="#2D3748">
                  {status.account?.email || "Google account"}
                </Text>
              </Box>
            )}
            <HStack spacing={3} flexWrap="wrap">
              <Button
                leftIcon={<Link2 size={16} />}
                bg="#FFCB82"
                color="#222222"
                borderRadius="xl"
                isLoading={working === "connect"}
                onClick={connectGoogle}
              >
                {connected ? "Reconnect Google" : "Connect Google"}
              </Button>
              {connected && (
                <Button
                  variant="outline"
                  borderRadius="xl"
                  isLoading={working === "disconnect"}
                  onClick={disconnectGoogle}
                >
                  Disconnect
                </Button>
              )}
            </HStack>
          </VStack>
        </IntegrationCard>

        <IntegrationCard
          title="Classroom Course"
          description="Create one Google Classroom course for an LCA batch."
          icon={GraduationCap}
        >
          <VStack align="stretch" spacing={4}>
            <FormControl>
              <FormLabel fontSize="sm">Batch</FormLabel>
              <Select
                size="lg"
                borderRadius="xl"
                value={selectedBatch}
                onChange={(event) => setSelectedBatch(event.target.value)}
              >
                <option value="">Select batch</option>
                {batches.map((batch) => (
                  <option key={batch._id} value={batch._id}>
                    {batch.name}
                    {batch.google_classroom_course_id ? " - synced" : ""}
                  </option>
                ))}
              </Select>
            </FormControl>
            <Button
              leftIcon={<CheckCircle2 size={16} />}
              borderRadius="xl"
              isDisabled={!connected || !selectedBatch}
              isLoading={working === "batch"}
              onClick={() =>
                runSync({
                  key: "batch",
                  endpoint: `/google/classroom/batches/${selectedBatch}/sync-course`,
                  successTitle: "Batch synced to Google Classroom",
                })
              }
            >
              Sync Batch Course
            </Button>
          </VStack>
        </IntegrationCard>

        <IntegrationCard
          title="Classroom Assignment"
          description="Push an LCA assignment into the synced Classroom course."
          icon={ExternalLink}
        >
          <VStack align="stretch" spacing={4}>
            <FormControl>
              <FormLabel fontSize="sm">Assignment</FormLabel>
              <Select
                size="lg"
                borderRadius="xl"
                value={selectedAssignment}
                onChange={(event) => setSelectedAssignment(event.target.value)}
              >
                <option value="">Select assignment</option>
                {assignments.map((assignment) => (
                  <option key={assignment._id} value={assignment._id}>
                    {assignment.title}
                    {assignment.google_classroom_coursework_id ? " - synced" : ""}
                  </option>
                ))}
              </Select>
            </FormControl>
            {selectedAssignmentData?.google_classroom_alternate_link && (
              <Link
                href={selectedAssignmentData.google_classroom_alternate_link}
                isExternal
                color="blue.500"
                fontSize="sm"
              >
                Open synced coursework
              </Link>
            )}
            <Button
              leftIcon={<CheckCircle2 size={16} />}
              borderRadius="xl"
              isDisabled={!connected || !selectedAssignment}
              isLoading={working === "assignment"}
              onClick={() =>
                runSync({
                  key: "assignment",
                  endpoint: `/google/classroom/assignments/${selectedAssignment}/sync`,
                  successTitle: "Assignment synced to Google Classroom",
                })
              }
            >
              Sync Assignment
            </Button>
          </VStack>
        </IntegrationCard>

        <IntegrationCard
          title="Calendar and Meet"
          description="Create a Google Calendar class event with a Google Meet link from a timetable entry."
          icon={CalendarPlus}
        >
          <VStack align="stretch" spacing={4}>
            <FormControl>
              <FormLabel fontSize="sm">Timetable entry</FormLabel>
              <Select
                size="lg"
                borderRadius="xl"
                value={selectedTimetable}
                onChange={(event) => setSelectedTimetable(event.target.value)}
              >
                <option value="">Select timetable entry</option>
                {timetable.map((entry) => (
                  <option key={entry._id} value={entry._id}>
                    {entry.day} - {entry.course?.name || "Course"} - {entry.batch?.name || "Batch"}
                    {entry.google_calendar_event_id ? " - synced" : ""}
                  </option>
                ))}
              </Select>
            </FormControl>
            {selectedTimetableData?.google_meet_link && (
              <Link href={selectedTimetableData.google_meet_link} isExternal color="blue.500" fontSize="sm">
                Open Google Meet
              </Link>
            )}
            <Button
              leftIcon={<CalendarPlus size={16} />}
              borderRadius="xl"
              isDisabled={!connected || !selectedTimetable}
              isLoading={working === "timetable"}
              onClick={() =>
                runSync({
                  key: "timetable",
                  endpoint: `/google/calendar/timetable/${selectedTimetable}/sync-event`,
                  successTitle: "Calendar event and Meet link created",
                })
              }
            >
              Create Calendar Event
            </Button>
          </VStack>
        </IntegrationCard>
      </SimpleGrid>

      {lastResult && (
        <Box mt={5} borderWidth="1px" borderColor="#E0E8EC" borderRadius="xl" bg="white" p={4}>
          <Text fontWeight="semibold" mb={2}>
            Last sync result
          </Text>
          <Text fontSize="sm" color="gray.600">
            The selected record was updated with Google identifiers. Refresh the page after deployment if
            you do not see the latest status immediately.
          </Text>
        </Box>
      )}
    </>
  );
}

export default GoogleWorkspace;
