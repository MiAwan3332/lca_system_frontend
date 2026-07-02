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
import { isTeacherRole, isInstitutionAdmin } from "../../utlls/teacherAccess";
import PageHeader, { DataTableShell, FilterStack } from "../../Components/PageHeader";
import ActionMenu from "../../Components/ActionMenu";

function Course() {
  const viewOnly = isStudentViewOnly();
  const isTeacher = isTeacherRole();
  const canManageInstitution = isInstitutionAdmin();
  const showFeeAndActions = canManageInstitution;
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
      <PageHeader title={viewOnly || isTeacher ? "My Courses" : "All Courses"}>
        {canManageInstitution && (
          <FilterStack>
            <div className="w-full sm:max-w-xs">
              <TableSearch setQueryFilter={setQueryFilter} method={fetchCourses} />
            </div>
            {hasPermission(["Add_Course"]) && (
              <button
                className="w-full sm:w-auto bg-white hover:bg-[#FFCB82] hover:text-[#85652D] font-medium pl-[14px] pr-[18px] py-[10px] rounded-xl flex gap-1.5 justify-center transition-colors duration-300 border border-[#E0E8EC] hover:border-[#FFCB82]"
                onClick={onAddOpen}
              >
                <Plus size={24} />
                Add Course
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
                <Th data-searchable>Name</Th>
                <Th data-searchable>Description</Th>
                {showFeeAndActions && <Th>Course Fee</Th>}
                {showFeeAndActions && <Th isNumeric>Action</Th>}
              </Tr>
            </Thead>
            <Tbody>
              {fetchStatus === "loading" ? (
                <TableRowLoading
                  nOfColumns={showFeeAndActions ? 5 : 3}
                  actions={showFeeAndActions ? ["w-10", "w-10"] : []}
                />
              ) : courses.length === 0 ? (
                <Tr>
                  <Td colSpan={showFeeAndActions ? 5 : 3}>
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
                    {showFeeAndActions && <Td>{course.fee || "N/A"}</Td>}
                    {showFeeAndActions && (
                    <Td className="space-x-3" isNumeric>
                      <ActionMenu>
                        {hasPermission(["Update_Course"]) && (
                          <UpdateModal course={course} />
                        )}
                        {hasPermission(["Delete_Course"]) && (
                          <DeleteModal courseId={course._id} />
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
          method={fetchCourses}
        />
      )}
      {canManageInstitution && <AddModel isOpen={isAddOpen} onClose={onAddClose} />}
    </>
  );
}

export default Course;
