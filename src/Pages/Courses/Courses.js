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
  fetchCourses,
  selectAllCourses,
  setLimitFilter,
  setPageFilter,
  setQueryFilter,
} from "../../Features/courseSlice";
import TableRowLoading from "../../Components/TableRowLoading";
import TableSearch from "../../Components/TableSearch";
import TablePagination from "../../Components/TablePagination";
import { isStudentViewOnly } from "../../utlls/studentAccess";

function Course() {
  const viewOnly = isStudentViewOnly();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const onAddOpen = () => setIsAddOpen(true);
  const onAddClose = () => setIsAddOpen(false);

  const [authToken, setAuthToken] = useState(Cookies.get("authToken"));

  const courses = useSelector(selectAllCourses);
  const { fetchStatus, pagination } = useSelector((state) => state.courses);
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
    dispatch(fetchCourses({ authToken }));
  }, []);
  return (
    <>
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold ml-6 text-nowrap">
          {viewOnly ? "My Courses" : "All Courses"}
        </h1>
        <div className="w-full flex justify-end gap-3">
          {!viewOnly && (
          <div>
            <TableSearch setQueryFilter={setQueryFilter} method={fetchCourses} />
          </div>
          )}
          {!viewOnly && hasPermission(["Add_Course"]) && (
            <button
              className="bg-white hover:bg-[#FFCB82] hover:text-[#85652D] font-medium pl-[14px] pr-[18px] py-[10px] rounded-xl flex gap-1.5 transition-colors duration-300 border border-[#E0E8EC] hover:border-[#FFCB82]"
              onClick={onAddOpen}
            >
              <Plus size={24} />
              Add Course
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
                {!viewOnly && <Th>Course Fee</Th>}
                {!viewOnly && <Th isNumeric>Action</Th>}
              </Tr>
            </Thead>
            <Tbody>
              {fetchStatus === "loading" ? (
                <TableRowLoading
                  nOfColumns={viewOnly ? 3 : 4}
                  actions={viewOnly ? [] : ["w-10", "w-10"]}
                />
              ) : courses.length === 0 ? (
                <Tr>
                  <Td colSpan={viewOnly ? 3 : 5}>
                    <span className="flex justify-center items-center gap-2 text-[#A1A1A1]">
                      <FileX />
                      No course records found
                    </span>
                  </Td>
                </Tr>
              ) : (
                courses.map((course) => (
                  <Tr key={course._id}>
                    <Td>{courses.indexOf(course) + 1}</Td>
                    <Td>{course.name}</Td>
                    <Td>{course.description}</Td>
                    {!viewOnly && <Td>{course.fee || "N/A"}</Td>}
                    {!viewOnly && (
                    <Td className="space-x-3" isNumeric>
                      {hasPermission(["Update_Course"]) && (
                        <UpdateModal course={course} />
                      )}
                      {hasPermission(["Delete_Course"]) && (
                        <DeleteModal courseId={course._id} />
                      )}
                    </Td>
                    )}
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
          method={fetchCourses}
        />
      )}
      {!viewOnly && <AddModel isOpen={isAddOpen} onClose={onAddClose} />}
    </>
  );
}

export default Course;
