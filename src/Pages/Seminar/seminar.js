import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
} from "@chakra-ui/react";
import AddModel from "./AddModel";
import DeleteModal from "./DeleteModal";
import UpdateModal from "./UpdateModal";
import { FileX, Plus } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchSeminars,
  selectAllSeminars,
  setLimitFilter,
  setPageFilter,
  setQueryFilter,
} from "../../Features/seminarSlice";
import TableRowLoading from "../../Components/TableRowLoading";
import moment from "moment";
import AttendeesModal from "./AttendeesModal";
import TableSearch from "../../Components/TableSearch";
import TablePagination from "../../Components/TablePagination";
import PageHeader, { DataTableShell, FilterStack } from "../../Components/PageHeader";
import ActionMenu from "../../Components/ActionMenu";

function Seminar() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const onAddOpen = () => setIsAddOpen(true);
  const onAddClose = () => setIsAddOpen(false);

  const [authToken, setAuthToken] = useState(Cookies.get("authToken"));

  const { fetchStatus, pagination } = useSelector((state) => state.seminars);
  const { seminars } = useSelector((state) => state.seminars);
  const dispatch = useDispatch();

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
    dispatch(fetchSeminars({ authToken }));
  }, []);

  return (
    <>
      <PageHeader title="All Seminars">
        <FilterStack>
          <div className="w-full sm:max-w-xs">
            <TableSearch setQueryFilter={setQueryFilter} method={fetchSeminars} />
          </div>
          {hasPermission(["Add_Seminar"]) && (
            <button
              className="w-full sm:w-auto bg-white hover:bg-[#FFCB82] hover:text-[#85652D] font-medium pl-[14px] pr-[18px] py-[10px] rounded-xl flex gap-1.5 justify-center transition-colors duration-300 border border-[#E0E8EC] hover:border-[#FFCB82]"
              onClick={onAddOpen}
            >
              <Plus size={24} />
              Add Seminar
            </button>
          )}
        </FilterStack>
      </PageHeader>
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
