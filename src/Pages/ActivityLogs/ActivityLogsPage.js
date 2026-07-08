import React, { useEffect, useRef, useState } from "react";
import Cookies from "js-cookie";
import moment from "moment";
import {
  Badge,
  Button,
  FormControl,
  Input,
  Select,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Text,
  Box,
} from "@chakra-ui/react";
import { FileX, FilterX } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import TableSearch from "../../Components/TableSearch";
import TableRowLoading from "../../Components/TableRowLoading";
import TablePagination from "../../Components/TablePagination";
import PageHeader, { DataTableShell, FilterStack } from "../../Components/PageHeader";
import {
  fetchActivityLogs,
  fetchActivityLogFilters,
  selectAllActivityLogs,
  setActorCategoryFilter,
  setLimitFilter,
  setPageFilter,
  setQueryFilter,
  setModuleFilter,
  setActionFilter,
  setStartDateFilter,
  setEndDateFilter,
  clearActivityLogFilters,
} from "../../Features/activityLogSlice";
import { isInstitutionAdmin } from "../../utlls/teacherAccess";
import { Navigate } from "react-router-dom";

const ACTION_COLORS = {
  login: "purple",
  view: "blue",
  create: "green",
  update: "orange",
  delete: "red",
  status_change: "yellow",
  read: "cyan",
};

const getActionColor = (action) => ACTION_COLORS[action] || "gray";

function ActivityLogsPage({ actorCategory, title, subtitle }) {
  const tableSearchRef = useRef();
  const [authToken] = useState(Cookies.get("authToken"));
  const dispatch = useDispatch();
  const logs = useSelector(selectAllActivityLogs);
  const { fetchStatus, pagination, filters, filterOptions } = useSelector(
    (state) => state.activityLogs
  );

  const canView = isInstitutionAdmin();

  const loadLogs = () => {
    dispatch(fetchActivityLogs({ authToken }));
  };

  useEffect(() => {
    dispatch(setActorCategoryFilter(actorCategory));
  }, [actorCategory, dispatch]);

  useEffect(() => {
    if (filters.actor_category !== actorCategory) return;
    dispatch(fetchActivityLogFilters({ authToken, actor_category: actorCategory }));
    dispatch(fetchActivityLogs({ authToken }));
  }, [filters.actor_category, actorCategory, authToken, dispatch]);

  const handleModuleChange = (e) => {
    dispatch(setModuleFilter(e.target.value));
    loadLogs();
  };

  const handleActionChange = (e) => {
    dispatch(setActionFilter(e.target.value));
    loadLogs();
  };

  const handleStartDateChange = (e) => {
    dispatch(setStartDateFilter(e.target.value));
    loadLogs();
  };

  const handleEndDateChange = (e) => {
    dispatch(setEndDateFilter(e.target.value));
    loadLogs();
  };

  const handleClearFilters = () => {
    tableSearchRef.current?.clearSearch?.();
    dispatch(clearActivityLogFilters());
    loadLogs();
  };

  if (!canView) {
    return <Navigate to="/dashboard" replace />;
  }

  const tableColumnCount = 8;

  return (
    <>
      <PageHeader title={title} subtitle={subtitle}>
        <FilterStack>
          <div className="w-full sm:max-w-xs">
            <TableSearch
              ref={tableSearchRef}
              setQueryFilter={setQueryFilter}
              method={fetchActivityLogs}
              placeholder="Search logs..."
            />
          </div>
        </FilterStack>
      </PageHeader>

      <FilterStack className="mt-3">
        <FormControl className="responsive-input" w={{ base: "full", md: "11rem" }}>
          <Select
            placeholder="All modules"
            size="lg"
            borderRadius="xl"
            value={filters.module}
            onChange={handleModuleChange}
          >
            {filterOptions.modules.map((moduleName) => (
              <option key={moduleName} value={moduleName}>
                {moduleName}
              </option>
            ))}
          </Select>
        </FormControl>
        <FormControl className="responsive-input" w={{ base: "full", md: "11rem" }}>
          <Select
            placeholder="All actions"
            size="lg"
            borderRadius="xl"
            value={filters.action}
            onChange={handleActionChange}
          >
            {filterOptions.actions.map((actionName) => (
              <option key={actionName} value={actionName}>
                {actionName}
              </option>
            ))}
          </Select>
        </FormControl>
        <FormControl className="responsive-input" w={{ base: "full", md: "10rem" }}>
          <Input
            type="date"
            size="lg"
            borderRadius="xl"
            value={filters.start_date}
            onChange={handleStartDateChange}
          />
        </FormControl>
        <FormControl className="responsive-input" w={{ base: "full", md: "10rem" }}>
          <Input
            type="date"
            size="lg"
            borderRadius="xl"
            value={filters.end_date}
            onChange={handleEndDateChange}
          />
        </FormControl>
        <Button size="icon" p={4} borderRadius="xl" onClick={handleClearFilters}>
          <FilterX className="h-4 w-4" />
        </Button>
      </FilterStack>

      <DataTableShell>
        <TableContainer>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>No</Th>
                <Th>Date & Time</Th>
                <Th>User</Th>
                <Th>Role</Th>
                <Th>Module</Th>
                <Th>Action</Th>
                <Th>Description</Th>
                <Th>Status</Th>
              </Tr>
            </Thead>
            <Tbody>
              {fetchStatus === "loading" ? (
                <TableRowLoading nOfColumns={tableColumnCount} />
              ) : logs.length === 0 ? (
                <Tr>
                  <Td colSpan={tableColumnCount}>
                    <span className="flex justify-center items-center gap-2 text-[#A1A1A1]">
                      <FileX />
                      No activity logs found
                    </span>
                  </Td>
                </Tr>
              ) : (
                logs.map((log, index) => (
                  <Tr key={log._id}>
                    <Td>{(pagination.page - 1) * pagination.limit + index + 1}</Td>
                    <Td whiteSpace="nowrap">
                      {moment(log.created_at).format("DD MMM YYYY, hh:mm A")}
                    </Td>
                    <Td>
                      <Box>
                        <Text fontWeight="medium">{log.actor_name || "—"}</Text>
                        <Text fontSize="sm" color="gray.500">
                          {log.actor_email || "—"}
                        </Text>
                      </Box>
                    </Td>
                    <Td>
                      <Badge textTransform="capitalize">{log.actor_role || log.actor_category}</Badge>
                    </Td>
                    <Td textTransform="capitalize">{log.module || "—"}</Td>
                    <Td>
                      <Badge colorScheme={getActionColor(log.action)} textTransform="capitalize">
                        {log.action}
                      </Badge>
                    </Td>
                    <Td maxW="320px">
                      <Text noOfLines={2} title={log.description}>
                        {log.description}
                      </Text>
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        {log.method} {log.path}
                      </Text>
                    </Td>
                    <Td>
                      <Badge colorScheme={log.status_code >= 400 ? "red" : "green"}>
                        {log.status_code || "—"}
                      </Badge>
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </TableContainer>
      </DataTableShell>

      {fetchStatus !== "loading" && (
        <TablePagination
          pagination={pagination}
          setLimitFilter={setLimitFilter}
          setPageFilter={setPageFilter}
          method={fetchActivityLogs}
        />
      )}
    </>
  );
}

export function StudentActivityLogs() {
  return (
    <ActivityLogsPage
      actorCategory="student"
      title="Student Activity Logs"
      subtitle="Complete activity history for all student accounts."
    />
  );
}

export function TeacherActivityLogs() {
  return (
    <ActivityLogsPage
      actorCategory="teacher"
      title="Teacher Activity Logs"
      subtitle="Complete activity history for all teacher accounts."
    />
  );
}

export function AdminActivityLogs() {
  return (
    <ActivityLogsPage
      actorCategory="admin"
      title="Admin Activity Logs"
      subtitle="Complete activity history for admin and staff accounts."
    />
  );
}

export default ActivityLogsPage;
