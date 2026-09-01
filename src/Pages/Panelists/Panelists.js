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
  FormControl,
  Select,
  Button,
  Badge,
} from "@chakra-ui/react";
import { FileX, FilterX, Plus } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchPanelists,
  selectAllPanelists,
  setLimitFilter,
  setPageFilter,
  setQueryFilter,
  setSearchFieldFilter,
  setIsActiveFilter,
  clearPanelistFilters,
} from "../../Features/panelistSlice";
import TableRowLoading from "../../Components/TableRowLoading";
import TableSearch from "../../Components/TableSearch";
import TablePagination from "../../Components/TablePagination";
import PageHeader, { DataTableShell, FilterStack } from "../../Components/PageHeader";
import ActionMenu from "../../Components/ActionMenu";
import { getMediaUrl } from "../../utlls/useful";
import { canAccessPanelists } from "../../utlls/interviewPanelAccess";
import { Navigate } from "react-router-dom";
import AddPanelistModal from "./AddPanelistModal";
import UpdatePanelistModal from "./UpdatePanelistModal";
import DeletePanelistModal from "./DeletePanelistModal";
import ViewPanelistModal from "./ViewPanelistModal";
import ChangePasswordModal from "./ChangePasswordModal";

const defaultAvatar =
  "https://images.unsplash.com/photo-1619946794135-5bc917a27793?ixlib=rb-0.3.5&q=80&fm=jpg&crop=faces&fit=crop&h=200&w=200&s=b616b2c5b373a80ffc9636ba24f7a4a9";

function Panelists() {
  const canView = canAccessPanelists();
  const tableSearchRef = useRef();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [authToken] = useState(Cookies.get("authToken"));

  const panelists = useSelector(selectAllPanelists);
  const { fetchStatus, pagination, filters } = useSelector(
    (state) => state.panelists
  );
  const dispatch = useDispatch();

  const loadPanelists = () => {
    dispatch(fetchPanelists({ authToken }));
  };

  useEffect(() => {
    if (!canView) return;
    loadPanelists();
  }, []);

  if (!canView) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSearchFieldChange = (e) => {
    dispatch(setSearchFieldFilter(e.target.value));
    if (filters.query) {
      loadPanelists();
    }
  };

  const handleStatusFilterChange = (e) => {
    dispatch(setIsActiveFilter(e.target.value));
    loadPanelists();
  };

  const handleClearFilters = () => {
    tableSearchRef.current?.clearSearch?.();
    dispatch(clearPanelistFilters());
    loadPanelists();
  };

  const searchPlaceholder =
    filters.search_field === "name"
      ? "Search by name..."
      : filters.search_field === "phone"
      ? "Search by phone..."
      : filters.search_field === "description"
      ? "Search by description..."
      : "Search by name, phone, or description...";

  const hasFilters =
    filters.query ||
    filters.search_field !== "all" ||
    filters.is_active === "true" ||
    filters.is_active === "false";

  return (
    <>
      <PageHeader title="Panelists">
        <FilterStack className="filter-stack--actions">
          <button className="table-action-btn" onClick={() => setIsAddOpen(true)}>
            <Plus size={18} />
            Add Panelist
          </button>
        </FilterStack>
      </PageHeader>

      <FilterStack className="filter-stack--panel filter-stack--table mt-3">
        <FormControl className="responsive-input" w={{ base: "full", sm: "10rem" }}>
          <Select
            size="lg"
            borderRadius="xl"
            value={filters.search_field}
            onChange={handleSearchFieldChange}
          >
            <option value="all">All Fields</option>
            <option value="name">Name</option>
            <option value="phone">Phone</option>
            <option value="description">Description</option>
          </Select>
        </FormControl>
        <div className="w-full sm:max-w-xs">
          <TableSearch
            ref={tableSearchRef}
            setQueryFilter={setQueryFilter}
            method={fetchPanelists}
            placeholder={searchPlaceholder}
          />
        </div>
        <FormControl className="responsive-input" w={{ base: "full", sm: "10rem" }}>
          <Select
            size="lg"
            borderRadius="xl"
            value={filters.is_active}
            onChange={handleStatusFilterChange}
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </Select>
        </FormControl>
        {hasFilters && (
          <Button size="icon" p={4} borderRadius="xl" onClick={handleClearFilters}>
            <FilterX className="h-4 w-4" />
          </Button>
        )}
      </FilterStack>

      <DataTableShell>
        <TableContainer>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>No</Th>
                <Th data-searchable>Photo / Name</Th>
                <Th data-searchable>Phone</Th>
                <Th data-searchable>Description</Th>
                <Th>Status</Th>
                <Th isNumeric>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {fetchStatus === "loading" ? (
                <TableRowLoading nOfColumns={5} actions={["w-10"]} />
              ) : panelists.length === 0 ? (
                <Tr>
                  <Td colSpan={6}>
                    <span className="flex justify-center items-center gap-2 text-[#A1A1A1]">
                      <FileX />
                      No panelist records found
                    </span>
                  </Td>
                </Tr>
              ) : (
                panelists.map((panelist, index) => {
                  const isActive = panelist.is_active !== false;
                  const descriptionPreview =
                    String(panelist.description || "").length > 80
                      ? `${String(panelist.description).slice(0, 80)}...`
                      : panelist.description || "—";

                  return (
                    <Tr key={panelist._id}>
                      <Td>
                        {(pagination?.pagingCounter || 1) + index}
                      </Td>
                      <Td>
                        <div className="flex items-center gap-3">
                          <img
                            src={getMediaUrl(panelist.photo) || defaultAvatar}
                            alt={panelist.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <span>{panelist.name}</span>
                        </div>
                      </Td>
                      <Td>{panelist.phone}</Td>
                      <Td>
                        <span title={panelist.description || ""}>
                          {descriptionPreview}
                        </span>
                      </Td>
                      <Td>
                        <Badge
                          colorScheme={isActive ? "green" : "gray"}
                          borderRadius="md"
                          px={2}
                          py={0.5}
                        >
                          {isActive ? "Active" : "Inactive"}
                        </Badge>
                      </Td>
                      <Td isNumeric>
                        <ActionMenu>
                          <ViewPanelistModal panelist={panelist} />
                          <UpdatePanelistModal panelist={panelist} />
                          <ChangePasswordModal panelist={panelist} />
                          <DeletePanelistModal panelistId={panelist._id} />
                        </ActionMenu>
                      </Td>
                    </Tr>
                  );
                })
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
          method={fetchPanelists}
        />
      )}

      <AddPanelistModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
      />
    </>
  );
}

export default Panelists;
