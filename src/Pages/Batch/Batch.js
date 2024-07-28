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
  fetchBatches,
  selectAllBatches,
  selectCurrentActiveBatch,
  setLimitFilter,
  setPageFilter,
  setQueryFilter,
} from "../../Features/batchSlice";
import TableRowLoading from "../../Components/TableRowLoading";
import AssignCoursesModal from "./AssignCoursesModal";
import AssignTeachersModal from "./AssignTeachersModal";
import TableSearch from "../../Components/TableSearch";
import TablePagination from "../../Components/TablePagination";

function Batch() {
  const [authToken, setAuthToken] = useState(Cookies.get("authToken"));
  const [isAddOpen, setIsAddOpen] = useState(false);

  const onAddOpen = () => setIsAddOpen(true);
  const onAddClose = () => setIsAddOpen(false);

  const { fetchStatus, pagination } = useSelector((state) => state.batches);
  const batches = useSelector(selectAllBatches);
  
  const activeBatch = useSelector(selectCurrentActiveBatch);
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
    dispatch(fetchBatches({ authToken }));
  }, []);

  return (
    <>
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold ml-6 text-nowrap">All Batchs</h1>
        <div className="w-full flex justify-end gap-3">
          <div>
            <TableSearch setQueryFilter={setQueryFilter} method={fetchBatches} />
          </div>
          {hasPermission(["Add_Batch"]) && (
            <button
              className="bg-white hover:bg-[#FFCB82] hover:text-[#85652D] font-medium pl-[14px] pr-[18px] py-[10px] rounded-xl flex gap-1.5 transition-colors duration-300 border border-[#E0E8EC] hover:border-[#FFCB82]"
              onClick={onAddOpen}
            >
              <Plus size={24} />
              Add Batch
            </button>
          )}
        </div>
      </div>
      <div className="w-full bg-white mt-3 rounded-xl border border-[#E0E8EC]">
        <TableContainer>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>No</Th>
                <Th data-searchable>Name</Th>
                <Th data-searchable>Description</Th>
                <Th data-searchable>Batch Type</Th>
                <Th>Start Date</Th>
                <Th>End Date</Th>
                <Th isNumeric>Action</Th>
              </Tr>
            </Thead>
            <Tbody>
              {fetchStatus === "loading" ? (
                <TableRowLoading
                  nOfColumns={6}
                  actions={["w-10", "w-10", "w-20", "w-20"]}
                />
              ) : batches.length === 0 ? (
                <Tr>
                  <Td colSpan={7}>
                    <span className="flex justify-center items-center gap-2 text-[#A1A1A1]">
                      <FileX />
                      No batch records found
                    </span>
                  </Td>
                </Tr>
              ) : (
                batches.map((batch) => (
                  <Tr
                    key={batch._id}
                    className={
                      activeBatch?._id === batch._id ? "bg-[#FFCB82]/20" : ""
                    }
                  >
                    <Td>{batches.indexOf(batch) + 1}</Td>
                    <Td>{batch.name}</Td>
                    <Td>{batch.description}</Td>
                    <Td>{batch.batch_type ? batch.batch_type : "N/A"}</Td>
                    <Td>{batch.startdate}</Td>
                    <Td>{batch.enddate}</Td>
                    <Td className="space-x-3 flex justify-end" isNumeric>
                      {hasPermission(["Update_Batch"]) && (
                        <UpdateModal batch={batch} />
                      )}
                      {hasPermission(["Delete_Batch"]) && (
                        <DeleteModal batchId={batch._id} />
                      )}
                      {hasPermission(["Delete_Batch"]) && (
                        <AssignCoursesModal batchId={batch._id} />
                      )}
                      {hasPermission(["Delete_Batch"]) && (
                        <AssignTeachersModal batchId={batch._id} />
                      )}
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </TableContainer>
      </div>
      {fetchStatus !== "loading" && (
        <TablePagination
          pagination={pagination}
          setLimitFilter={setLimitFilter}
          setPageFilter={setPageFilter}
          method={fetchBatches}
        />
      )}
      <AddModel isOpen={isAddOpen} onClose={onAddClose} />
    </>
  );
}

export default Batch;
