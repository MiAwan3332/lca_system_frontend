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
import { useSelector, useDispatch } from "react-redux";
import {
  fetchMcqs,
  selectAllMcqs,
  setLimitFilter,
  setPageFilter,
  setQueryFilter,
} from "../../Features/mcqSlice";
import TableRowLoading from "../../Components/TableRowLoading";
import TableSearch from "../../Components/TableSearch";
import TablePagination from "../../Components/TablePagination";

function Mcq() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const onAddOpen = () => setIsAddOpen(true);
  const onAddClose = () => setIsAddOpen(false);

  const [authToken, setAuthToken] = useState(Cookies.get("authToken"));

  const mcqs = useSelector(selectAllMcqs);
  const { fetchStatus, pagination } = useSelector((state) => state.mcqs);
  const dispatch = useDispatch();

  const hasPermission = (permissionsToCheck) => {
    const storedPermissions = sessionStorage.getItem("permissions");
    const permissionsArray = storedPermissions ? storedPermissions.split(",") : [];
    return permissionsToCheck.some((permission) => permissionsArray.includes(permission));
  };

  useEffect(() => {
    dispatch(fetchMcqs({ authToken }));
  }, [authToken, dispatch]);

  return (
    <>
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold ml-6 text-nowrap">All Mcqs</h1>
        <div className="w-full flex justify-end gap-3">
          <div>
            <TableSearch setQueryFilter={setQueryFilter} method={fetchMcqs} />
          </div>
          {hasPermission(["Add_Mcq"]) && (
            <button
              className="bg-white hover:bg-[#FFCB82] hover:text-[#85652D] font-medium pl-[14px] pr-[18px] py-[10px] rounded-xl flex gap-1.5 transition-colors duration-300 border border-[#E0E8EC] hover:border-[#FFCB82]"
              onClick={onAddOpen}
            >
              <Plus size={24} />
              Add Mcq
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
                <Th>Questions</Th>
                <Th>Option-A</Th>
                <Th>Option-B</Th>
                <Th>Option-C</Th>
                <Th>Option-D</Th>
                <Th isNumeric>Action</Th>
              </Tr>
            </Thead>
            <Tbody>
              {fetchStatus === "loading" ? (
                <TableRowLoading nOfColumns={7} />
              ) : mcqs?.length === 0 ? (
                <Tr>
                  <Td colSpan={7}>
                    <span className="flex justify-center items-center gap-2 text-[#A1A1A1]">
                      <FileX />
                      No mcq records found
                    </span>
                  </Td>
                </Tr>
              ) : (
                mcqs?.map((mcq, index) => (
                  <Tr key={mcq._id}>
                    <Td>{index + 1}</Td>
                    <Td>{mcq.question}</Td>
                    <Td>{mcq.option1}</Td>
                    <Td>{mcq.option2}</Td>
                    <Td>{mcq.option3}</Td>
                    <Td>{mcq.option4}</Td>
                    <Td className="space-x-3" isNumeric>
                      {hasPermission(["Update_mcq"]) && <UpdateModal mcq={mcq} />}
                      {hasPermission(["Delete_mcq"]) && <DeleteModal mcqId={mcq._id} />}
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
          method={fetchMcqs}
        />
      )}
      <AddModel isOpen={isAddOpen} onClose={onAddClose} />
    </>
  );
}

export default Mcq;
