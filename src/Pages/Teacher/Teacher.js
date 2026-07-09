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
} from "@chakra-ui/react";
import AddModel from "./AddModel";
import DeleteModal from "./DeleteModal";
import UpdateModal from "./UpdateModal";
import { FileDown, FileX, FilterX, Plus } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchTeachers,
  setLimitFilter,
  setPageFilter,
  setQueryFilter,
  setSearchFieldFilter,
  setBatchFilter,
  clearTeacherFilters,
} from "../../Features/teacherSlice";
import { selectAllTeachers } from "../../Features/teacherSlice";
import { fetchBatches, selectActiveBatches } from "../../Features/batchSlice";
import TableRowLoading from "../../Components/TableRowLoading";
import TableSearch from "../../Components/TableSearch";
import TablePagination from "../../Components/TablePagination";
import SearchableBatchSelect from "../../Components/SearchableBatchSelect";
import { isStudentViewOnly } from "../../utlls/studentAccess";
import { isTeacherRole, isInstitutionAdmin } from "../../utlls/teacherAccess";
import PageHeader, { DataTableShell, FilterStack } from "../../Components/PageHeader";
import ActionMenu from "../../Components/ActionMenu";

const defaultAvatar =
  "https://images.unsplash.com/photo-1619946794135-5bc917a27793?ixlib=rb-0.3.5&q=80&fm=jpg&crop=faces&fit=crop&h=200&w=200&s=b616b2c5b373a80ffc9636ba24f7a4a9";

function Teacher() {
  const viewOnly = isStudentViewOnly();
  const isTeacher = isTeacherRole();
  const canManageInstitution = isInstitutionAdmin();
  const tableSearchRef = useRef();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const onAddOpen = () => setIsAddOpen(true);
  const onAddClose = () => setIsAddOpen(false);

  const [authToken, setAuthToken] = useState(Cookies.get("authToken"));

  const teachers = useSelector(selectAllTeachers);
  const batches = useSelector(selectActiveBatches);
  const { fetchStatus, pagination, filters } = useSelector((state) => state.teachers);
  const dispatch = useDispatch();

  const loadTeachers = () => {
    dispatch(fetchTeachers({ authToken }));
  };

  const hasPermission = (permissionsToCheck) => {
    const storedPermissions = sessionStorage.getItem("permissions");
    const permissionsArray = storedPermissions
      ? storedPermissions.split(",")
      : [];
    return permissionsToCheck.some((permission) =>
      permissionsArray.includes(permission)
    );
  };

  useEffect(() => {
    if (canManageInstitution) {
      dispatch(fetchBatches({ authToken, queryParams: { limit: 200, page: 1, query: "" } }));
    }
    loadTeachers();
  }, []);

  const handleSearchFieldChange = (e) => {
    dispatch(setSearchFieldFilter(e.target.value));
    if (filters.query) {
      loadTeachers();
    }
  };

  const handleBatchChange = (batchId) => {
    dispatch(setBatchFilter(batchId));
    loadTeachers();
  };

  const handleClearFilters = () => {
    tableSearchRef.current?.clearSearch?.();
    dispatch(clearTeacherFilters());
    loadTeachers();
  };

  const searchPlaceholder =
    filters.search_field === "name"
      ? "Search by teacher name..."
      : filters.search_field === "email"
      ? "Search by email..."
      : filters.search_field === "phone"
      ? "Search by phone..."
      : "Search by name, email, or phone...";

  return (
    <>
      <PageHeader title={isTeacher ? "My Profile" : "All Teachers"}>
        {canManageInstitution && (
          <FilterStack className="filter-stack--actions">
            {hasPermission(["Add_Teacher"]) && (
              <button
                className="table-action-btn"
                onClick={onAddOpen}
              >
                <Plus size={18} />
                Add Teacher
              </button>
            )}
          </FilterStack>
        )}
      </PageHeader>
      {canManageInstitution && (
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
              <option value="email">Email</option>
              <option value="phone">Phone</option>
            </Select>
          </FormControl>
          <div className="w-full sm:max-w-xs">
            <TableSearch
              ref={tableSearchRef}
              setQueryFilter={setQueryFilter}
              method={fetchTeachers}
              placeholder={searchPlaceholder}
            />
          </div>
          <SearchableBatchSelect
            batches={batches}
            value={filters.batch_id}
            onChange={handleBatchChange}
            placeholder="All Batches"
            width="100%"
          />
          {(filters.batch_id || filters.query || filters.search_field !== "all") && (
            <Button size="icon" p={4} borderRadius="xl" onClick={handleClearFilters}>
              <FilterX className="h-4 w-4" />
            </Button>
          )}
        </FilterStack>
      )}
      <DataTableShell>
        <TableContainer>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>No</Th>
                <Th data-searchable>Image/Name</Th>
                <Th data-searchable>Email</Th>
                {!viewOnly && <Th data-searchable>Phone</Th>}
                {!viewOnly && <Th>Resume</Th>}
                {!viewOnly && <Th isNumeric>Actions</Th>}
              </Tr>
            </Thead>
            <Tbody>
              {fetchStatus === "loading" ? (
                <TableRowLoading
                  nOfColumns={viewOnly ? 3 : 5}
                  actions={viewOnly ? [] : ["w-10", "w-10"]}
                />
              ) : teachers.length === 0 ? (
                <Tr>
                  <Td colSpan={viewOnly ? 3 : 6}>
                    <span className="flex justify-center items-center gap-2 text-[#A1A1A1]">
                      <FileX />
                      No teacher records found
                    </span>
                  </Td>
                </Tr>
              ) : (
                teachers.map((teacher) => (
                  <Tr key={teacher._id}>
                    <Td>{teachers.indexOf(teacher) + 1}</Td>
                    <Td>
                      <div className="flex items-center gap-3">
                        <img
                          src={teacher.image || defaultAvatar}
                          alt={teacher.name}
                          className="w-10 h-10 rounded-full"
                        />
                        <span>{teacher.name}</span>
                      </div>
                    </Td>
                    <Td>{teacher.email}</Td>
                    {!viewOnly && <Td>{teacher.phone}</Td>}
                    {!viewOnly && (
                    <Td>
                      <a
                        href={teacher.resume}
                        className="hover:bg-[#7AEF85] hover:text-[#257947] border hover:border-[#7AEF85] font-medium p-[10px] rounded-xl transition-colors duration-300 flex flex-nowrap items-center gap-1.5 pr-3 max-w-min"
                      >
                        <FileDown />
                        <span>Resume</span>
                      </a>
                    </Td>
                    )}
                    {!viewOnly && canManageInstitution && (
                    <Td className="space-x-3" isNumeric>
                      <ActionMenu>
                        {hasPermission(["Update_Teacher"]) && (
                          <UpdateModal teacher={teacher} />
                        )}
                        {hasPermission(["Delete_Teacher"]) && (
                          <DeleteModal teacherId={teacher._id} />
                        )}
                      </ActionMenu>
                    </Td>
                    )}
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
          method={fetchTeachers}
        />
      )}
      {!viewOnly && canManageInstitution && <AddModel isOpen={isAddOpen} onClose={onAddClose} />}
    </>
  );
}

export default Teacher;
