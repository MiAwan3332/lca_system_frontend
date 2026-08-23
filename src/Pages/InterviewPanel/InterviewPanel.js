import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  SimpleGrid,
  Text,
  Badge,
  HStack,
  VStack,
  Select,
  Input,
  Flex,
  IconButton,
  Spinner,
  Center,
  useDisclosure,
  FormControl,
} from "@chakra-ui/react";
import {
  CalendarDays,
  CalendarPlus,
  Clock3,
  Eye,
  FilterX,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import Cookies from "js-cookie";
import moment from "moment";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import PageHeader, { FilterStack } from "../../Components/PageHeader";
import TableSearch from "../../Components/TableSearch";
import TablePagination from "../../Components/TablePagination";
import {
  clearInterviewPanelFilters,
  fetchInterviewPanels,
  setEndDateFilter,
  setLimitFilter,
  setPageFilter,
  setQueryFilter,
  setStartDateFilter,
  setStatusFilter,
} from "../../Features/interviewPanelSlice";
import {
  getInterviewPanelStatusMeta,
  getPanelScheduleCount,
  getPanelTimeRange,
} from "../../utlls/interviewPanel";
import { formatClassTimeRange, formatTime12Hour } from "../../utlls/classTime";
import AddInterviewPanelModal from "./AddInterviewPanelModal";
import UpdateInterviewPanelModal from "./UpdateInterviewPanelModal";
import DeleteInterviewPanelModal from "./DeleteInterviewPanelModal";
import ViewInterviewPanelModal from "./ViewInterviewPanelModal";
import ScheduleInterviewPanelModal from "./ScheduleInterviewPanelModal";

const formatPanelDuration = (panel) => {
  const { start_time, end_time } = getPanelTimeRange(panel);
  return (
    formatClassTimeRange(start_time, end_time) ||
    formatTime12Hour(start_time) ||
    "—"
  );
};

function InterviewPanel() {
  const tableSearchRef = useRef();
  const navigate = useNavigate();
  const [authToken] = useState(Cookies.get("authToken"));
  const [selectedPanel, setSelectedPanel] = useState(null);
  const dispatch = useDispatch();

  const { panels, filters, pagination, fetchStatus } = useSelector(
    (state) => state.interviewPanels
  );

  const {
    isOpen: isAddOpen,
    onOpen: onAddOpen,
    onClose: onAddClose,
  } = useDisclosure();
  const {
    isOpen: isViewOpen,
    onOpen: onViewOpen,
    onClose: onViewClose,
  } = useDisclosure();
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const {
    isOpen: isSchedulesOpen,
    onOpen: onSchedulesOpen,
    onClose: onSchedulesClose,
  } = useDisclosure();

  const loadPanels = () => {
    dispatch(fetchInterviewPanels({ authToken }));
  };

  useEffect(() => {
    loadPanels();
  }, []);

  const openView = (panel) => {
    setSelectedPanel(panel);
    onViewOpen();
  };

  const openEdit = (panel) => {
    setSelectedPanel(panel);
    onEditOpen();
  };

  const openDelete = (panel) => {
    setSelectedPanel(panel);
    onDeleteOpen();
  };

  const openSchedules = (panel) => {
    if (!panel?._id) return;
    setSelectedPanel(panel);
    onSchedulesOpen();
  };

  const closeSchedules = () => {
    onSchedulesClose();
    setSelectedPanel(null);
    loadPanels();
  };

  const handleClearFilters = () => {
    tableSearchRef.current?.clearSearch?.();
    dispatch(clearInterviewPanelFilters());
    loadPanels();
  };

  return (
    <Box w="full" maxW="100%" minW={0} overflowX="hidden">
      <PageHeader title="Interview Panels">
        <FilterStack className="filter-stack--actions">
          <button
            className="table-action-btn"
            type="button"
            onClick={() => navigate("/interview-panel-schedules")}
          >
            <CalendarDays size={18} />
            <span>All Schedules</span>
          </button>
          <button
            className="table-action-btn table-action-btn--primary"
            type="button"
            onClick={onAddOpen}
          >
            <Plus size={18} />
            <span>Create Panel</span>
          </button>
        </FilterStack>
      </PageHeader>

      <FilterStack className="filter-stack--panel filter-stack--table mt-3">
        <div className="w-full sm:max-w-xs min-w-0">
          <TableSearch
            ref={tableSearchRef}
            setQueryFilter={setQueryFilter}
            method={fetchInterviewPanels}
            placeholder="Search panels..."
          />
        </div>
        <FormControl className="responsive-input" w={{ base: "full", sm: "auto" }} minW={0}>
          <Select
            borderRadius="0.75rem"
            value={filters.status || ""}
            onChange={(e) => {
              dispatch(setStatusFilter(e.target.value));
              loadPanels();
            }}
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </FormControl>
        <FormControl className="responsive-input" w={{ base: "full", sm: "auto" }} minW={0}>
          <Input
            type="date"
            borderRadius="0.75rem"
            value={filters.start_date || ""}
            onChange={(e) => {
              dispatch(setStartDateFilter(e.target.value));
              loadPanels();
            }}
          />
        </FormControl>
        <FormControl className="responsive-input" w={{ base: "full", sm: "auto" }} minW={0}>
          <Input
            type="date"
            borderRadius="0.75rem"
            value={filters.end_date || ""}
            onChange={(e) => {
              dispatch(setEndDateFilter(e.target.value));
              loadPanels();
            }}
          />
        </FormControl>
        <button
          className="table-action-btn"
          type="button"
          onClick={handleClearFilters}
        >
          <FilterX size={18} />
          Clear
        </button>
      </FilterStack>

      <Box mt={{ base: 4, md: 5 }} w="full" minW={0}>
        {fetchStatus === "loading" ? (
          <Center py={{ base: 12, md: 16 }}>
            <Spinner size="lg" color="#85652D" />
          </Center>
        ) : panels.length === 0 ? (
          <Center
            py={{ base: 12, md: 16 }}
            px={4}
            border="1px dashed"
            borderColor="#E0E8EC"
            borderRadius="2xl"
            bg="#FAFBFC"
          >
            <VStack spacing={2} textAlign="center" px={2}>
              <Text fontWeight="600" color="gray.700">
                No interview panels yet
              </Text>
              <Text fontSize="sm" color="gray.500">
                Create a panel to get started.
              </Text>
              <Button
                mt={2}
                w={{ base: "full", sm: "auto" }}
                leftIcon={<Plus size={16} />}
                onClick={onAddOpen}
                borderRadius="0.75rem"
                backgroundColor="#FFCB82"
                color="#85652D"
                _hover={{ backgroundColor: "#E3B574", color: "#654E26" }}
              >
                Create Panel
              </Button>
            </VStack>
          </Center>
        ) : (
          <SimpleGrid
            columns={{ base: 1, md: 2, xl: 3 }}
            spacing={{ base: 3, md: 4 }}
            w="full"
          >
            {panels.map((panel) => {
              const statusMeta = getInterviewPanelStatusMeta(panel.status);
              const memberCount = (panel.members || []).length;
              const scheduleCount = getPanelScheduleCount(panel);
              return (
                <Box
                  key={panel._id}
                  border="1px solid"
                  borderColor="#E0E8EC"
                  borderRadius="2xl"
                  bg="white"
                  p={{ base: 4, md: 5 }}
                  display="flex"
                  flexDirection="column"
                  gap={{ base: 3, md: 4 }}
                  minW={0}
                  w="full"
                  overflow="hidden"
                  transition="box-shadow 0.2s ease, border-color 0.2s ease"
                  _hover={{
                    borderColor: "#E3B574",
                    boxShadow: "0 8px 24px rgba(133, 101, 45, 0.08)",
                  }}
                >
                  <Flex justify="space-between" align="flex-start" gap={3}>
                    <Box flex={1} minW={0}>
                      <Text
                        fontWeight="700"
                        fontSize={{ base: "md", md: "lg" }}
                        color="#2D3748"
                        noOfLines={2}
                        wordBreak="break-word"
                      >
                        {panel.title}
                      </Text>
                      <Text fontSize="sm" color="gray.500" mt={1} noOfLines={2}>
                        {panel.description || "No description"}
                      </Text>
                    </Box>
                    <Badge
                      colorScheme={statusMeta.colorScheme}
                      borderRadius="md"
                      px={2}
                      py={1}
                      flexShrink={0}
                    >
                      {statusMeta.label}
                    </Badge>
                  </Flex>

                  <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={2}>
                    <MetaRow
                      icon={<CalendarDays size={15} />}
                      label={
                        panel.date
                          ? moment(panel.date).format("DD MMM YYYY")
                          : "—"
                      }
                    />
                    <MetaRow
                      icon={<Clock3 size={15} />}
                      label={formatPanelDuration(panel)}
                    />
                    <MetaRow
                      icon={<MapPin size={15} />}
                      label={panel.venue || "No venue"}
                    />
                    <MetaRow
                      icon={<Users size={15} />}
                      label={`${memberCount} member${memberCount === 1 ? "" : "s"}`}
                    />
                    <MetaRow
                      icon={<CalendarPlus size={15} />}
                      label={`${scheduleCount} schedule${scheduleCount === 1 ? "" : "s"}`}
                    />
                  </SimpleGrid>

                  {(panel.members || []).length > 0 ? (
                    <VStack align="stretch" spacing={2} minW={0}>
                      {(panel.members || []).slice(0, 3).map((member, idx) => (
                        <Box
                          key={`${member.name}-${idx}`}
                          border="1px solid"
                          borderColor="#F0E4D0"
                          borderRadius="lg"
                          px={3}
                          py={2}
                          bg="#FFFDF9"
                          minW={0}
                        >
                          <Flex
                            justify="space-between"
                            align="flex-start"
                            gap={2}
                          >
                            <Text
                              fontWeight="600"
                              fontSize="sm"
                              color="#2D3748"
                              noOfLines={1}
                              minW={0}
                            >
                              {member.name}
                            </Text>
                            {member.role ? (
                              <Badge
                                variant="subtle"
                                colorScheme="orange"
                                borderRadius="md"
                                fontSize="10px"
                                flexShrink={0}
                              >
                                {member.role}
                              </Badge>
                            ) : null}
                          </Flex>
                          {member.description ? (
                            <Text
                              fontSize="xs"
                              color="gray.500"
                              mt={1}
                              noOfLines={2}
                            >
                              {member.description}
                            </Text>
                          ) : null}
                        </Box>
                      ))}
                      {memberCount > 3 ? (
                        <Text fontSize="xs" color="gray.500">
                          +{memberCount - 3} more member
                          {memberCount - 3 === 1 ? "" : "s"}
                        </Text>
                      ) : null}
                    </VStack>
                  ) : (
                    <Text fontSize="sm" color="gray.400">
                      No members added
                    </Text>
                  )}

                  <Flex
                    direction={{ base: "column", sm: "row" }}
                    gap={2}
                    pt={2}
                    borderTop="1px solid"
                    borderColor="#F0F2F5"
                    justify="flex-end"
                    align={{ base: "stretch", sm: "center" }}
                    flexWrap="wrap"
                  >
                    <Button
                      size="sm"
                      leftIcon={<CalendarPlus size={14} />}
                      variant="outline"
                      borderRadius="lg"
                      borderColor="#E3B574"
                      color="#85652D"
                      _hover={{ bg: "#FFF8EE" }}
                      w={{ base: "full", sm: "auto" }}
                      onClick={() => openSchedules(panel)}
                    >
                      Schedules
                    </Button>
                    <HStack
                      spacing={2}
                      justify={{ base: "space-between", sm: "flex-end" }}
                      w={{ base: "full", sm: "auto" }}
                    >
                      <IconButton
                        aria-label="View panel"
                        icon={<Eye size={16} />}
                        size="sm"
                        variant="ghost"
                        borderRadius="lg"
                        flex={{ base: 1, sm: "none" }}
                        onClick={() => openView(panel)}
                      />
                      <IconButton
                        aria-label="Edit panel"
                        icon={<Pencil size={16} />}
                        size="sm"
                        variant="ghost"
                        borderRadius="lg"
                        flex={{ base: 1, sm: "none" }}
                        onClick={() => openEdit(panel)}
                      />
                      <IconButton
                        aria-label="Delete panel"
                        icon={<Trash2 size={16} />}
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                        borderRadius="lg"
                        flex={{ base: 1, sm: "none" }}
                        onClick={() => openDelete(panel)}
                      />
                    </HStack>
                  </Flex>
                </Box>
              );
            })}
          </SimpleGrid>
        )}
      </Box>

      {fetchStatus !== "loading" && (
        <Box mt={4} w="full" overflowX="auto">
          <TablePagination
            pagination={pagination}
            setLimitFilter={setLimitFilter}
            setPageFilter={setPageFilter}
            method={fetchInterviewPanels}
          />
        </Box>
      )}

      <AddInterviewPanelModal isOpen={isAddOpen} onClose={onAddClose} />
      <ViewInterviewPanelModal
        isOpen={isViewOpen}
        onClose={onViewClose}
        panel={selectedPanel}
      />
      <UpdateInterviewPanelModal
        isOpen={isEditOpen}
        onClose={onEditClose}
        panel={selectedPanel}
      />
      <DeleteInterviewPanelModal
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        panel={selectedPanel}
      />
      <ScheduleInterviewPanelModal
        isOpen={isSchedulesOpen}
        onClose={closeSchedules}
        panel={selectedPanel}
      />
    </Box>
  );
}

function MetaRow({ icon, label }) {
  return (
    <HStack spacing={2} color="gray.600" align="flex-start" minW={0}>
      <Box color="#85652D" flexShrink={0} mt="2px">
        {icon}
      </Box>
      <Text fontSize="sm" noOfLines={2} wordBreak="break-word">
        {label}
      </Text>
    </HStack>
  );
}

export default InterviewPanel;
