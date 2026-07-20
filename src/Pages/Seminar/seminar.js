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
  Input,
  Button,
} from "@chakra-ui/react";
import AddModel from "./AddModel";
import DeleteModal from "./DeleteModal";
import UpdateModal from "./UpdateModal";
import { FileX, FilterX, Plus } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchSeminars,
  selectAllSeminars,
  setLimitFilter,
  setPageFilter,
  setQueryFilter,
  setStartDateFilter,
  setEndDateFilter,
  clearSeminarFilters,
} from "../../Features/seminarSlice";
import TableRowLoading from "../../Components/TableRowLoading";
import moment from "moment";
import AttendeesModal from "./AttendeesModal";
import TableSearch from "../../Components/TableSearch";
import TablePagination from "../../Components/TablePagination";
import PageHeader, { DataTableShell, FilterStack } from "../../Components/PageHeader";
import ActionMenu from "../../Components/ActionMenu";
import { hasPermission } from "../../utlls/useful";

function Seminar() {
  const tableSearchRef = useRef();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const onAddOpen = () => setIsAddOpen(true);
  const onAddClose = () => setIsAddOpen(false);

  const [authToken, setAuthToken] = useState(Cookies.get("authToken"));

  const { fetchStatus, pagination, filters } = useSelector((state) => state.seminars);
  const { seminars } = useSelector((state) => state.seminars);
  const dispatch = useDispatch();

  const loadSeminars = () => {
    dispatch(fetchSeminars({ authToken }));
  };

  useEffect(() => {
    loadSeminars();
  }, []);

  const handleStartDateChange = (e) => {
    dispatch(setStartDateFilter(e.target.value));
    loadSeminars();
  };

  const handleEndDateChange = (e) => {
    dispatch(setEndDateFilter(e.target.value));
    loadSeminars();
  };

  const handleClearFilters = () => {
    tableSearchRef.current?.clearSearch?.();
    dispatch(clearSeminarFilters());
    loadSeminars();
  };

  return (
    <>
      <PageHeader title="All Seminars">
        <FilterStack className="filter-stack--actions">
          {hasPermission(["Add_Seminar"]) && (
            <button
              className="table-action-btn"
              onClick={onAddOpen}
            >
              <Plus size={18} />
              Add Seminar
            </button>
          )}
        </FilterStack>
      </PageHeader>
      <FilterStack className="filter-stack--panel filter-stack--table mt-3">
        <div className="w-full sm:max-w-xs">
          <TableSearch
            ref={tableSearchRef}
            setQueryFilter={setQueryFilter}
            method={fetchSeminars}
          />
        </div>
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
        {(filters.start_date || filters.end_date || filters.query) && (
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
                <Th data-searchable>Name</Th>
                <Th data-searchable>Description</Th>
                <Th>Time</Th>
                <Th>Date</Th>
                <Th isNumeric>Action</Th>
              </Tr>
            </Thead>
            <Tbody>
              {fetchStatus === "loading" ? (
                <TableRowLoading nOfColumns={5} actions={["w-10", "w-10"]} />
              ) : (
                seminars.length === 0 ? (
                  <Tr>
                    <Td colSpan={6}>
                      <span className="flex justify-center items-center gap-2 text-[#A1A1A1]">
                        <FileX />
                        No seminar records found
                      </span>
                    </Td>
                  </Tr>
                ) :
                seminars?.map((seminar) => (
                  <Tr key={seminar._id}>
                    <Td>{seminars.indexOf(seminar) + 1}</Td>
                    <Td>
                      <p className="line-clamp-2 w-[200px] text-wrap">
                        {seminar.name}
                      </p>
                    </Td>
                    <Td>
                      <p className="line-clamp-2 w-[300px] text-wrap">
                        {seminar.description}
                      </p>
                    </Td>
                    <Td>{moment(seminar.time, "HH:mm").format("hh:mm A")}</Td>
                    <Td>{moment(seminar.date).format("DD MMM YYYY")}</Td>

                    <Td className="space-x-3" isNumeric>
                      <ActionMenu>
                        <AttendeesModal seminar={seminar} />
                        {hasPermission(["Update_Seminar"]) && (
                          <UpdateModal seminar={seminar} />
                        )}
                        {hasPermission(["Delete_Seminar"]) && (
                          <DeleteModal seminarId={seminar._id} />
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
          method={fetchSeminars}
        />
      )}
      <AddModel isOpen={isAddOpen} onClose={onAddClose} />
    </>
  );
}

export default Seminar;
