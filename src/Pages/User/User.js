import React, { useEffect, useState } from "react";
import axios from "axios";
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
  fetchUsers,
  selectAllUsers,
  setLimitFilter,
  setPageFilter,
  setQueryFilter,
} from "../../Features/userSlice";
import TableRowLoading from "../../Components/TableRowLoading";
import TableSearch from "../../Components/TableSearch";
import TablePagination from "../../Components/TablePagination";
import { isStudentViewOnly } from "../../utlls/studentAccess";
import PageHeader, { DataTableShell, FilterStack } from "../../Components/PageHeader";
import ActionMenu from "../../Components/ActionMenu";

const defaultAvatar =
  "https://images.unsplash.com/photo-1619946794135-5bc917a27793?ixlib=rb-0.3.5&q=80&fm=jpg&crop=faces&fit=crop&h=200&w=200&s=b616b2c5b373a80ffc9636ba24f7a4a9";

function User() {
  const viewOnly = isStudentViewOnly();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const onAddOpen = () => setIsAddOpen(true);
  const onAddClose = () => setIsAddOpen(false);

  const [authToken, setAuthToken] = useState(Cookies.get("authToken"));

  const { fetchStatus, pagination } = useSelector((state) => state.users);
  const users = useSelector(selectAllUsers);
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
    dispatch(fetchUsers({ authToken }));
  }, []);

  return (
    <div>
      <PageHeader title={viewOnly ? "My Account" : "All Users"}>
        {!viewOnly && (
          <FilterStack>
            <div className="w-full sm:max-w-xs">
              <TableSearch setQueryFilter={setQueryFilter} method={fetchUsers} />
            </div>
            {hasPermission(["Add_User"]) && (
              <button
                className="w-full sm:w-auto bg-white hover:bg-[#FFCB82] hover:text-[#85652D] font-medium pl-[14px] pr-[18px] py-[10px] rounded-xl flex gap-1.5 justify-center transition-colors duration-300 border border-[#E0E8EC] hover:border-[#FFCB82]"
                onClick={onAddOpen}
              >
                <Plus size={24} />
                Add User
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
                <Th data-searchable>Avatar/Name</Th>
                <Th data-searchable>Email</Th>
                <Th>User Role</Th>
                {!viewOnly && <Th isNumeric>Actions</Th>}
              </Tr>
            </Thead>
            <Tbody>
              {fetchStatus === "loading" ? (
                <TableRowLoading nOfColumns={4} actions={["w-10", "w-10"]} />
              ) : users.length === 0 ? (
                <Tr>
                  <Td colSpan={5}>
                    <span className="flex justify-center items-center gap-2 text-[#A1A1A1]">
                      <FileX />
                      No user records found
                    </span>
                  </Td>
                </Tr>
              ) : (
                users.map((user) => (
                  <Tr key={user._id}>
                    <Td>{users.indexOf(user) + 1}</Td>
                    <Td>
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatar || defaultAvatar}
                          alt={user.name}
                          className="h-10 w-10 rounded-full"
                        />
                        <span>{user.name}</span>
                      </div>
                    </Td>
                    <Td>{user.email}</Td>
                    <Td>
                      <span className="uppercase bg-gray-200 text-gray-500 font-medium px-2 py-1 text-xs rounded-lg">
                        {user.role}
                      </span>
                    </Td>
                    {!viewOnly && (
                    <Td className="space-x-3" isNumeric>
                      <ActionMenu>
                        {hasPermission(["Update_User"]) && (
                          <UpdateModal user={user} />
                        )}
                        {hasPermission(["Delete_User"]) && (
                          <DeleteModal userId={user._id} />
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
          method={fetchUsers}
        />
      )}
      {!viewOnly && <AddModel isOpen={isAddOpen} onClose={onAddClose} />}
    </div>
  );
}

export default User;
