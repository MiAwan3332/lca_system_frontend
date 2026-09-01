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
  Input,
} from "@chakra-ui/react";
import { FileX, FilterX, Plus } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchQualifiers,
  selectAllQualifiers,
  setLimitFilter,
  setPageFilter,
  setQueryFilter,
  setSearchFieldFilter,
  setIsActiveFilter,
  setCityFilter,
  clearQualifierFilters,
} from "../../Features/qualifierSlice";
import TableRowLoading from "../../Components/TableRowLoading";
import TableSearch from "../../Components/TableSearch";
import TablePagination from "../../Components/TablePagination";
import PageHeader, {
  DataTableShell,
  FilterStack,
} from "../../Components/PageHeader";
import ActionMenu from "../../Components/ActionMenu";
import { getMediaUrl } from "../../utlls/useful";
import { isStudentViewOnly } from "../../utlls/studentAccess";
import { isQualifierRole } from "../../utlls/qualifierAccess";
import AddQualifierModal from "./AddQualifierModal";
import UpdateQualifierModal from "./UpdateQualifierModal";
import DeleteQualifierModal from "./DeleteQualifierModal";
import ViewQualifierModal from "./ViewQualifierModal";
import ChangePasswordModal from "./ChangePasswordModal";
import QualifierSelfProfile from "./QualifierSelfProfile";

const defaultAvatar =
  "https://images.unsplash.com/photo-1619946794135-5bc917a27793?ixlib=rb-0.3.5&q=80&fm=jpg&crop=faces&fit=crop&h=200&w=200&s=b616b2c5b373a80ffc9636ba24f7a4a9";

function Qualifiers() {
  const isQualifier = isQualifierRole();
  const canManage = !isStudentViewOnly() && !isQualifier;
  const showActions = canManage;
  const tableSearchRef = useRef();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [authToken] = useState(Cookies.get("authToken"));

  const qualifiers = useSelector(selectAllQualifiers);
  const { fetchStatus, pagination, filters } = useSelector(
    (state) => state.qualifiers
  );
  const dispatch = useDispatch();

  const loadQualifiers = () => {
    dispatch(fetchQualifiers({ authToken }));
  };

  useEffect(() => {
    loadQualifiers();
  }, []);

  if (isQualifier) {
    return (
      <QualifierSelfProfile
        qualifier={qualifiers[0] || null}
        loading={fetchStatus === "loading"}
      />
    );
  }

  const handleSearchFieldChange = (e) => {
    dispatch(setSearchFieldFilter(e.target.value));
    if (filters.query) {
      loadQualifiers();
    }
  };

  const handleStatusFilterChange = (e) => {
    dispatch(setIsActiveFilter(e.target.value));
    loadQualifiers();
  };

  const handleCityFilterChange = (e) => {
    dispatch(setCityFilter(e.target.value));
  };

  const handleCityFilterBlur = () => {
    loadQualifiers();
  };

  const handleCityKeyDown = (e) => {
    if (e.key === "Enter") {
      loadQualifiers();
    }
  };

  const handleClearFilters = () => {
    tableSearchRef.current?.clearSearch?.();
    dispatch(clearQualifierFilters());
    loadQualifiers();
  };

  const searchPlaceholder =
    filters.search_field === "name"
      ? "Search by name..."
      : filters.search_field === "phone"
        ? "Search by phone..."
        : filters.search_field === "email"
          ? "Search by email..."
          : filters.search_field === "cnic"
            ? "Search by CNIC..."
            : filters.search_field === "city"
              ? "Search by city..."
              : "Search by name, phone, email, CNIC, or city...";

  const hasFilters =
    filters.query ||
    filters.search_field !== "all" ||
    filters.is_active === "true" ||
    filters.is_active === "false" ||
    Boolean(filters.city);

  return (
    <>
      <PageHeader title="Qualifiers">
        {canManage && (
          <FilterStack className="filter-stack--actions">
            <button
              className="table-action-btn"
              onClick={() => setIsAddOpen(true)}
            >
              <Plus size={18} />
              Add Qualifier
            </button>
          </FilterStack>
        )}
      </PageHeader>

      <FilterStack className="filter-stack--panel filter-stack--table mt-3">
        <FormControl
          className="responsive-input"
          w={{ base: "full", sm: "10rem" }}
        >
          <Select
            size="lg"
            borderRadius="xl"
            value={filters.search_field}
            onChange={handleSearchFieldChange}
          >
            <option value="all">All Fields</option>
            <option value="name">Name</option>
            <option value="phone">Phone</option>
            <option value="email">Email</option>
            <option value="cnic">CNIC</option>
            <option value="city">City</option>
          </Select>
        </FormControl>
        <div className="w-full sm:max-w-xs">
          <TableSearch
            ref={tableSearchRef}
            setQueryFilter={setQueryFilter}
            method={fetchQualifiers}
            placeholder={searchPlaceholder}
          />
        </div>
        <FormControl
          className="responsive-input"
          w={{ base: "full", sm: "10rem" }}
        >
          <Input
            size="lg"
            borderRadius="xl"
            placeholder="Filter by city"
            value={filters.city}
            onChange={handleCityFilterChange}
            onBlur={handleCityFilterBlur}
            onKeyDown={handleCityKeyDown}
          />
        </FormControl>
        <FormControl
          className="responsive-input"
          w={{ base: "full", sm: "10rem" }}
        >
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
          <Button
            size="icon"
            p={4}
            borderRadius="xl"
            onClick={handleClearFilters}
          >
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
                <Th data-searchable>Batch</Th>
                <Th data-searchable>Phone</Th>
                <Th data-searchable>Email</Th>
                <Th data-searchable>City</Th>
                <Th>Status</Th>
                {showActions && <Th isNumeric>Actions</Th>}
              </Tr>
            </Thead>
            <Tbody>
              {fetchStatus === "loading" ? (
                <TableRowLoading
                  nOfColumns={showActions ? 7 : 6}
                  actions={showActions ? ["w-10"] : []}
                />
              ) : qualifiers.length === 0 ? (
                <Tr>
                  <Td colSpan={showActions ? 8 : 7}>
                    <span className="flex justify-center items-center gap-2 text-[#A1A1A1]">
                      <FileX />
                      No qualifier records found
                    </span>
                  </Td>
                </Tr>
              ) : (
                qualifiers.map((qualifier, index) => {
                  const isActive = qualifier.is_active !== false;
                  return (
                    <Tr key={qualifier._id}>
                      <Td>{(pagination?.pagingCounter || 1) + index}</Td>
                      <Td>
                        <div className="flex items-center gap-3">
                          <img
                            src={getMediaUrl(qualifier.photo) || defaultAvatar}
                            alt={qualifier.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <span>{qualifier.name}</span>
                        </div>
                      </Td>
                      <Td>{qualifier.batch?.name || "—"}</Td>
                      <Td>{qualifier.phone}</Td>
                      <Td>{qualifier.email || "—"}</Td>
                      <Td>{qualifier.city || "—"}</Td>
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
                      {showActions && (
                        <Td isNumeric>
                          <ActionMenu>
                            <ViewQualifierModal qualifier={qualifier} />
                            {canManage && (
                              <>
                                <UpdateQualifierModal qualifier={qualifier} />
                                <ChangePasswordModal qualifier={qualifier} />
                                <DeleteQualifierModal
                                  qualifierId={qualifier._id}
                                />
                              </>
                            )}
                          </ActionMenu>
                        </Td>
                      )}
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
          method={fetchQualifiers}
        />
      )}

      {canManage && (
        <AddQualifierModal
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
        />
      )}
    </>
  );
}

export default Qualifiers;
