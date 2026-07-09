import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import {
  Badge,
  Button,
  FormControl,
  Select,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useDisclosure,
  ButtonGroup,
} from "@chakra-ui/react";
import { useDispatch, useSelector } from "react-redux";
import { FileX, Plus, Eye, Trash2 } from "lucide-react";
import TableRowLoading from "../../Components/TableRowLoading";
import TablePagination from "../../Components/TablePagination";
import PageHeader, { DataTableShell, FilterStack } from "../../Components/PageHeader";
import ActionMenu from "../../Components/ActionMenu";
import { isStudentViewOnly } from "../../utlls/studentAccess";
import { isTeacherRole } from "../../utlls/teacherAccess";
import {
  fetchComplaintMeta,
  fetchComplaints,
  selectAllComplaints,
  setComplaintView,
  setComplaintStatusFilter,
  setComplaintTargetFilter,
  setComplaintPageFilter,
  setComplaintLimitFilter,
  deleteComplaint,
} from "../../Features/complaintSlice";
import {
  COMPLAINT_STATUSES,
  getComplaintTargetLabel,
  getStatusColor,
} from "../../utlls/complaintConstants";
import AddComplaintModal from "./AddComplaintModal";
import ComplaintDetailModal from "./ComplaintDetailModal";

function Complaints() {
  const authToken = Cookies.get("authToken");
  const dispatch = useDispatch();
  const viewOnlyStudent = isStudentViewOnly();
  const isTeacher = isTeacherRole();

  const complaints = useSelector(selectAllComplaints);
  const { fetchStatus, pagination, filters, meta } = useSelector((state) => state.complaints);

  const addDisclosure = useDisclosure();
  const detailDisclosure = useDisclosure();
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  const loadComplaints = () => {
    dispatch(fetchComplaints({ authToken }));
  };

  useEffect(() => {
    dispatch(fetchComplaintMeta({ authToken }));
    loadComplaints();
  }, [dispatch, authToken]);

  useEffect(() => {
    loadComplaints();
  }, [filters.view, filters.status, filters.target_role]);

  const handleTabChange = (index) => {
    setActiveTab(index);
    const views = ["mine"];
    if (meta.can_view_inbox) views.push("inbox");
    if (meta.can_view_all) views.push("all");
    dispatch(setComplaintView(views[index] || "mine"));
  };

  const openDetail = (complaint, canRespond = false) => {
    setSelectedComplaint({ ...complaint, _canRespond: canRespond });
    detailDisclosure.onOpen();
  };

  const tabViews = ["mine"];
  if (meta.can_view_inbox) tabViews.push("inbox");
  if (meta.can_view_all) tabViews.push("all");

  const tabLabels = {
    mine: "My Complaints",
    inbox: "Inbox",
    all: "All Complaints",
  };

  const currentView = tabViews[activeTab] || "mine";
  const canRespondInDetail = currentView === "inbox" || currentView === "all";

  return (
    <>
      <PageHeader
        title="Complaint Management"
        subtitle={
          viewOnlyStudent
            ? "Submit complaints to Teacher, Principal, Vice Principal, or CEO."
            : isTeacher
              ? "Submit complaints to leadership and review student complaints assigned to teachers."
              : "Submit complaints to Principal, Vice Principal, or CEO and manage received complaints."
        }
      >
        <FilterStack className="filter-stack--actions">
          <Button
            leftIcon={<Plus size={18} />}
            colorScheme="yellow"
            borderRadius="xl"
            w={{ base: "full", sm: "auto" }}
            onClick={addDisclosure.onOpen}
          >
            New Complaint
          </Button>
        </FilterStack>
      </PageHeader>

      <FilterStack className="filter-stack--panel filter-stack--table mt-3">
        <FormControl className="responsive-input" w={{ base: "full", md: "12rem" }}>
          <Select
            size="lg"
            borderRadius="xl"
            value={filters.status}
            onChange={(e) => {
              dispatch(setComplaintStatusFilter(e.target.value));
            }}
          >
            <option value="">All Statuses</option>
            {COMPLAINT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </Select>
        </FormControl>
        {(currentView === "all" || currentView === "inbox") && (
          <FormControl className="responsive-input" w={{ base: "full", md: "12rem" }}>
            <Select
              size="lg"
              borderRadius="xl"
              value={filters.target_role}
              onChange={(e) => {
                dispatch(setComplaintTargetFilter(e.target.value));
              }}
            >
              <option value="">All Recipients</option>
              <option value="teacher">Teacher</option>
              <option value="principal">Principal</option>
              <option value="vice_principal">Vice Principal</option>
              <option value="ceo">CEO</option>
            </Select>
          </FormControl>
        )}
      </FilterStack>

      <Tabs index={activeTab} onChange={handleTabChange} colorScheme="yellow" mb={4}>
        <TabList>
          {tabViews.map((view) => (
            <Tab key={view}>{tabLabels[view]}</Tab>
          ))}
        </TabList>
        <TabPanels>
          {tabViews.map((view) => (
            <TabPanel key={view} px={0}>
              <DataTableShell>
                <TableContainer>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>No</Th>
                        <Th>Subject</Th>
                        <Th>Category</Th>
                        <Th>Submit To</Th>
                        {view !== "mine" && <Th>Submitted By</Th>}
                        {view !== "mine" && <Th>Batch</Th>}
                        <Th>Status</Th>
                        <Th>Date</Th>
                        <Th>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {fetchStatus === "loading" ? (
                        <TableRowLoading
                          nOfColumns={view === "mine" ? 6 : 8}
                          actions={["w-10", "w-10"]}
                        />
                      ) : complaints.length === 0 ? (
                        <Tr>
                          <Td colSpan={view === "mine" ? 8 : 10} textAlign="center" py={8}>
                            <FileX className="mx-auto mb-2 text-gray-400" />
                            No complaints found
                          </Td>
                        </Tr>
                      ) : (
                        complaints.map((item, index) => (
                          <Tr key={item._id}>
                            <Td>{(pagination.page - 1) * pagination.limit + index + 1}</Td>
                            <Td fontWeight="medium">{item.subject}</Td>
                            <Td>{item.category}</Td>
                            <Td>{getComplaintTargetLabel(item.target_role)}</Td>
                            {view !== "mine" && <Td>{item.submitted_by?.name}</Td>}
                            {view !== "mine" && (
                              <Td>{item.submitted_by_student?.batch?.name || "—"}</Td>
                            )}
                            <Td>
                              <Badge colorScheme={getStatusColor(item.status)}>{item.status}</Badge>
                            </Td>
                            <Td>{new Date(item.createdAt).toLocaleDateString()}</Td>
                            <Td>
                              <ActionMenu>
                                <Button
                                  leftIcon={<Eye size={14} />}
                                  onClick={() => openDetail(item, view === "inbox" || view === "all")}
                                >
                                  {view === "inbox" || view === "all" ? "Review" : "View"}
                                </Button>
                                {view === "mine" && item.status === "Open" && (
                                  <Button
                                    colorScheme="red"
                                    leftIcon={<Trash2 size={14} />}
                                    onClick={() =>
                                      dispatch(deleteComplaint({ authToken, id: item._id }))
                                    }
                                  >
                                    Delete
                                  </Button>
                                )}
                              </ActionMenu>
                            </Td>
                          </Tr>
                        ))
                      )}
                    </Tbody>
                  </Table>
                </TableContainer>
                <TablePagination
                  pagination={pagination}
                  setPageFilter={setComplaintPageFilter}
                  setLimitFilter={setComplaintLimitFilter}
                  method={fetchComplaints}
                />
              </DataTableShell>
            </TabPanel>
          ))}
        </TabPanels>
      </Tabs>

      <AddComplaintModal
        isOpen={addDisclosure.isOpen}
        onClose={addDisclosure.onClose}
        authToken={authToken}
        onSubmitted={loadComplaints}
      />

      <ComplaintDetailModal
        isOpen={detailDisclosure.isOpen}
        onClose={detailDisclosure.onClose}
        authToken={authToken}
        complaint={selectedComplaint}
        canRespond={selectedComplaint?._canRespond}
        onUpdated={loadComplaints}
      />
    </>
  );
}

export default Complaints;
