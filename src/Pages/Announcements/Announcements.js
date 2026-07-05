import React, { useEffect, useRef, useState } from "react";
import Cookies from "js-cookie";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  Button,
  useDisclosure,
  Wrap,
  WrapItem,
  Box,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { Eye, FileX, FilterX, Megaphone, Pencil, Plus, Trash2 } from "lucide-react";
import moment from "moment";
import TableRowLoading from "../../Components/TableRowLoading";
import TableSearch from "../../Components/TableSearch";
import TablePagination from "../../Components/TablePagination";
import SearchableBatchSelect from "../../Components/SearchableBatchSelect";
import PageHeader, { DataTableShell, FilterStack } from "../../Components/PageHeader";
import ActionMenu from "../../Components/ActionMenu";
import { isStudentViewOnly } from "../../utlls/studentAccess";
import { isTeacherRole, isInstitutionAdmin } from "../../utlls/teacherAccess";
import { fetchBatches, selectActiveBatches } from "../../Features/batchSlice";
import { fetchNotifications } from "../../Features/notificationSlice";
import {
  fetchAnnouncements,
  fetchAnnouncementById,
  selectAllAnnouncements,
  setLimitFilter,
  setPageFilter,
  setQueryFilter,
  setBatchFilter,
  clearAnnouncementFilters,
  markAnnouncementRead,
} from "../../Features/announcementSlice";
import AddAnnouncementModal from "./AddAnnouncementModal";
import UpdateAnnouncementModal from "./UpdateAnnouncementModal";
import ViewAnnouncementModal from "./ViewAnnouncementModal";
import DeleteAnnouncementModal from "./DeleteAnnouncementModal";

const truncateText = (text, maxLength = 80) => {
  if (!text) return "";
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
};

const getCreatorName = (announcement) => {
  const creator = announcement?.created_by;
  if (!creator) return "Unknown";
  if (typeof creator === "object") {
    return creator.name || creator.email || "Unknown";
  }
  return "Unknown";
};

function StudentAnnouncementCard({ item, onOpen }) {
  return (
    <Box
      borderWidth="1px"
      borderColor={item.is_read ? "#E0E8EC" : "#FFCB82"}
      borderRadius="xl"
      bg="white"
      p={4}
      cursor="pointer"
      onClick={() => onOpen(item)}
      _hover={{ borderColor: "#FFCB82", shadow: "sm" }}
    >
      <Box display="flex" alignItems="flex-start" gap={3}>
        <Box
          bg={item.is_read ? "#F3F4F6" : "#FFF7E8"}
          color={item.is_read ? "#6B7280" : "#85652D"}
          borderRadius="lg"
          p={2}
          flexShrink={0}
        >
          <Megaphone size={18} />
        </Box>
        <Box flex="1" minW={0}>
          <Box display="flex" alignItems="center" gap={2} mb={1}>
            <Text fontWeight="semibold" noOfLines={1}>
              {item.title}
            </Text>
            {!item.is_read && (
              <Badge colorScheme="red" borderRadius="md" fontSize="0.65rem">
                New
              </Badge>
            )}
          </Box>
          <Text fontSize="sm" color="gray.600" noOfLines={3} mb={2}>
            {item.message}
          </Text>
          <Text fontSize="xs" color="gray.500">
            By {getCreatorName(item)} · {moment(item.createdAt).format("DD MMM YYYY, hh:mm A")}
          </Text>
        </Box>
      </Box>
    </Box>
  );
}

function Announcements() {
  const viewOnly = isStudentViewOnly();
  const isTeacher = isTeacherRole();
  const canManage = isInstitutionAdmin() || isTeacher;
  const authToken = Cookies.get("authToken");
  const tableSearchRef = useRef();
  const dispatch = useDispatch();
  const location = useLocation();

  const announcements = useSelector(selectAllAnnouncements);
  const batches = useSelector(selectActiveBatches);
  const { fetchStatus, pagination, filters } = useSelector((state) => state.announcements);

  const addDisclosure = useDisclosure();
  const updateDisclosure = useDisclosure();
  const viewDisclosure = useDisclosure();
  const deleteDisclosure = useDisclosure();
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  const loadAnnouncements = () => {
    dispatch(fetchAnnouncements({ authToken }));
  };

  useEffect(() => {
    if (canManage) {
      dispatch(fetchBatches({ authToken, queryParams: { limit: 200, page: 1, query: "" } }));
    }
    loadAnnouncements();
    if (viewOnly) {
      dispatch(fetchNotifications({ authToken }));
    }
  }, [authToken, dispatch]);

  useEffect(() => {
    const openAnnouncementId = location.state?.openAnnouncementId;
    if (!openAnnouncementId || !authToken) return;

    dispatch(fetchAnnouncementById({ authToken, id: openAnnouncementId }))
      .unwrap()
      .then((announcement) => {
        setSelectedAnnouncement(announcement);
        viewDisclosure.onOpen();
        dispatch(fetchNotifications({ authToken }));
      })
      .catch(() => {
        loadAnnouncements();
      });

    window.history.replaceState({}, document.title);
  }, [location.state?.openAnnouncementId, authToken, dispatch]);

  const handleBatchChange = (batchId) => {
    dispatch(setBatchFilter(batchId));
    loadAnnouncements();
  };

  const handleClearFilters = () => {
    tableSearchRef.current?.clearSearch?.();
    dispatch(clearAnnouncementFilters());
    loadAnnouncements();
  };

  const openView = (announcement) => {
    setSelectedAnnouncement(announcement);
    viewDisclosure.onOpen();

    if (viewOnly && !announcement.is_read) {
      dispatch(markAnnouncementRead({ authToken, id: announcement._id }))
        .unwrap()
        .then(() => {
          dispatch(fetchNotifications({ authToken }));
        });
    }
  };

  const openDelete = (announcement) => {
    setSelectedAnnouncement(announcement);
    deleteDisclosure.onOpen();
  };

  const openEdit = (announcement) => {
    setSelectedAnnouncement(announcement);
    updateDisclosure.onOpen();
  };

  const unreadCount = announcements.filter((item) => !item.is_read).length;

  return (
    <>
      <PageHeader
        title="Announcements"
        subtitle={
          viewOnly
            ? unreadCount > 0
              ? `You have ${unreadCount} new announcement${unreadCount === 1 ? "" : "s"}.`
              : "Updates and notices sent to your batch."
            : "Send announcements to one or more batches at once."
        }
      >
        <FilterStack>
          <div className="w-full sm:max-w-xs">
            <TableSearch
              ref={tableSearchRef}
              setQueryFilter={setQueryFilter}
              method={fetchAnnouncements}
              placeholder="Search announcements..."
            />
          </div>
          {canManage && (
            <SearchableBatchSelect
              batches={batches}
              value={filters.batch_id}
              onChange={handleBatchChange}
              placeholder="All Batches"
              width="100%"
            />
          )}
          {(filters.batch_id || filters.query) && (
            <Button size="icon" p={4} borderRadius="xl" onClick={handleClearFilters}>
              <FilterX className="h-4 w-4" />
            </Button>
          )}
          {canManage && (
            <button
              className="w-full sm:w-auto bg-white hover:bg-[#FFCB82] hover:text-[#85652D] font-medium pl-[14px] pr-[18px] py-[10px] rounded-xl flex gap-1.5 justify-center transition-colors duration-300 border border-[#E0E8EC] hover:border-[#FFCB82]"
              onClick={addDisclosure.onOpen}
            >
              <Plus size={24} />
              Send Announcement
            </button>
          )}
        </FilterStack>
      </PageHeader>

      {viewOnly ? (
        <Box px={{ base: 2, md: 4 }}>
          {fetchStatus === "loading" ? (
            <Text color="gray.500" py={8} textAlign="center">
              Loading announcements...
            </Text>
          ) : announcements.length === 0 ? (
            <Box
              borderWidth="1px"
              borderColor="#E0E8EC"
              borderRadius="xl"
              bg="white"
              py={12}
              textAlign="center"
            >
              <FileX className="mx-auto mb-3 text-[#A1A1A1]" />
              <Text color="gray.500">No announcements for your batch yet.</Text>
            </Box>
          ) : (
            <VStack spacing={3} align="stretch">
              {announcements.map((item) => (
                <StudentAnnouncementCard key={item._id} item={item} onOpen={openView} />
              ))}
            </VStack>
          )}
          {fetchStatus !== "loading" && announcements.length > 0 && (
            <TablePagination
              pagination={pagination}
              setLimitFilter={setLimitFilter}
              setPageFilter={setPageFilter}
              method={fetchAnnouncements}
            />
          )}
        </Box>
      ) : (
        <>
          <DataTableShell>
            <TableContainer>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>No</Th>
                    <Th data-searchable>Title</Th>
                    <Th>Message</Th>
                    <Th>Batches</Th>
                    <Th>Created By</Th>
                    <Th>Sent On</Th>
                    <Th>Recipients</Th>
                    <Th isNumeric>Action</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {fetchStatus === "loading" ? (
                    <TableRowLoading nOfColumns={8} actions={["w-10", "w-10"]} />
                  ) : announcements.length === 0 ? (
                    <Tr>
                      <Td colSpan={8}>
                        <span className="flex justify-center items-center gap-2 text-[#A1A1A1]">
                          <FileX />
                          No announcements found
                        </span>
                      </Td>
                    </Tr>
                  ) : (
                    announcements.map((item, index) => (
                      <Tr key={item._id}>
                        <Td>{(pagination.page - 1) * pagination.limit + index + 1}</Td>
                        <Td fontWeight="medium">{item.title}</Td>
                        <Td title={item.message}>{truncateText(item.message)}</Td>
                        <Td>
                          <Wrap spacing={1}>
                            {(item.batches || []).slice(0, 2).map((batch) => (
                              <WrapItem key={batch._id || batch}>
                                <Badge colorScheme="yellow" borderRadius="md">
                                  {batch.name || "Batch"}
                                </Badge>
                              </WrapItem>
                            ))}
                            {(item.batches || []).length > 2 && (
                              <WrapItem>
                                <Badge borderRadius="md">+{item.batches.length - 2}</Badge>
                              </WrapItem>
                            )}
                          </Wrap>
                        </Td>
                        <Td fontWeight="medium">{getCreatorName(item)}</Td>
                        <Td>{moment(item.createdAt).format("DD MMM YYYY")}</Td>
                        <Td>{item.recipient_count ?? 0}</Td>
                        <Td isNumeric>
                          <ActionMenu>
                            <Button
                              size="sm"
                              leftIcon={<Eye size={14} />}
                              variant="ghost"
                              onClick={() => openView(item)}
                            >
                              View
                            </Button>
                            {canManage && (
                              <>
                                <Button
                                  size="sm"
                                  leftIcon={<Pencil size={14} />}
                                  variant="ghost"
                                  onClick={() => openEdit(item)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  leftIcon={<Trash2 size={14} />}
                                  colorScheme="red"
                                  variant="ghost"
                                  onClick={() => openDelete(item)}
                                >
                                  Delete
                                </Button>
                              </>
                            )}
                          </ActionMenu>
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
              method={fetchAnnouncements}
            />
          )}
        </>
      )}

      {canManage && (
        <AddAnnouncementModal isOpen={addDisclosure.isOpen} onClose={addDisclosure.onClose} />
      )}
      {canManage && selectedAnnouncement && (
        <UpdateAnnouncementModal
          isOpen={updateDisclosure.isOpen}
          onClose={updateDisclosure.onClose}
          announcement={selectedAnnouncement}
        />
      )}
      <ViewAnnouncementModal
        isOpen={viewDisclosure.isOpen}
        onClose={viewDisclosure.onClose}
        announcement={selectedAnnouncement}
      />
      {canManage && selectedAnnouncement && (
        <DeleteAnnouncementModal
          announcement={selectedAnnouncement}
          isOpen={deleteDisclosure.isOpen}
          onClose={deleteDisclosure.onClose}
        />
      )}
    </>
  );
}

export default Announcements;
