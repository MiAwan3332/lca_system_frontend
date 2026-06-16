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
import { FileDown, FileX, Plus } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchTeachers,
  setLimitFilter,
  setPageFilter,
  setQueryFilter,
} from "../../Features/teacherSlice";
import { selectAllTeachers } from "../../Features/teacherSlice";
import TableRowLoading from "../../Components/TableRowLoading";
import TableSearch from "../../Components/TableSearch";
import TablePagination from "../../Components/TablePagination";
import { isStudentViewOnly } from "../../utlls/studentAccess";
import PageHeader, { DataTableShell, FilterStack } from "../../Components/PageHeader";

const defaultAvatar =
  "https://images.unsplash.com/photo-1619946794135-5bc917a27793?ixlib=rb-0.3.5&q=80&fm=jpg&crop=faces&fit=crop&h=200&w=200&s=b616b2c5b373a80ffc9636ba24f7a4a9";

function Teacher() {
  const viewOnly = isStudentViewOnly();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const onAddOpen = () => setIsAddOpen(true);
  const onAddClose = () => setIsAddOpen(false);

  const [authToken, setAuthToken] = useState(Cookies.get("authToken"));

  const teachers = useSelector(selectAllTeachers);
  const { fetchStatus, pagination } = useSelector((state) => state.teachers);
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
    dispatch(fetchTeachers({ authToken }));
  }, []);

  return (
    <>
      <PageHeader title="All Teachers">
        {!viewOnly && (
          <FilterStack>
            <div className="w-full sm:max-w-xs">
              <TableSearch setQueryFilter={setQueryFilter} method={fetchTeachers} />
            </div>
            {hasPermission(["Add_Teacher"]) && (
              <button
                className="w-full sm:w-auto bg-white hover:bg-[#FFCB82] hover:text-[#85652D] font-medium pl-[14px] pr-[18px] py-[10px] rounded-xl flex gap-1.5 justify-center transition-colors duration-300 border border-[#E0E8EC] hover:border-[#FFCB82]"
                onClick={onAddOpen}
              >
                <Plus size={24} />
                Add Teacher
              </button>
            )}
          </FilterStack>
        )}
      </PageHeader>
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
                    {!viewOnly && (
                    <Td className="space-x-3" isNumeric>
                      {hasPermission(["Update_Teacher"]) && (
                        <UpdateModal teacher={teacher} />
                      )}
                      {hasPermission(["Delete_Teacher"]) && (
                        <DeleteModal teacherId={teacher._id} />
                      )}
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
      {!viewOnly && <AddModel isOpen={isAddOpen} onClose={onAddClose} />}
    </>
  );
}

export default Teacher;
