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
import AssignPermissions from "./AssignPermissions";
import { FileX, Plus } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchRoles,
  selectAllRoles,
  setLimitFilter,
  setPageFilter,
  setQueryFilter,
} from "../../Features/roleSlice";
import TableRowLoading from "../../Components/TableRowLoading";
import TableSearch from "../../Components/TableSearch";
import TablePagination from "../../Components/TablePagination";
import PageHeader, { DataTableShell, FilterStack } from "../../Components/PageHeader";
import ActionMenu from "../../Components/ActionMenu";

function Roles() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const onAddOpen = () => setIsAddOpen(true);
  const onAddClose = () => setIsAddOpen(false);

  const [authToken, setAuthToken] = useState(Cookies.get("authToken"));

  const { fetchStatus, pagination } = useSelector((state) => state.roles);
  const roles = useSelector(selectAllRoles);
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
    dispatch(fetchRoles({ authToken }));
  }, []);

  return (
    <>
      <PageHeader title="All Roles">
        <FilterStack className="filter-stack--actions">
          {hasPermission(["Add_Role"]) && (
            <button
              className="table-action-btn"
              onClick={onAddOpen}
            >
              <Plus size={18} />
              Add Role
            </button>
          )}
        </FilterStack>
      </PageHeader>
      <FilterStack className="filter-stack--panel filter-stack--table mt-3">
        <div className="w-full sm:max-w-xs">
          <TableSearch setQueryFilter={setQueryFilter} method={fetchRoles} />
        </div>
      </FilterStack>
      <DataTableShell>
        <TableContainer>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>No</Th>
                <Th data-searchable>Name</Th>
                <Th data-searchable>Description</Th>
                <Th isNumeric>Action</Th>
              </Tr>
            </Thead>
            <Tbody>
              {fetchStatus == "loading" ? (
                <TableRowLoading
                  nOfColumns={3}
                  actions={["w-10", "w-10", "w-20"]}
                />
              ) : (
                roles.length === 0 ? (
                  <Tr>
                    <Td colSpan={4}>
                      <span className="flex justify-center items-center gap-2 text-[#A1A1A1]">
                        <FileX />
                        No role records found
                      </span>
                    </Td>
                  </Tr>
                ) :
                roles.map((role) => (
                  <Tr key={role._id}>
                    <Td>{roles.indexOf(role) + 1}</Td>
                    <Td>{role.name}</Td>
                    <Td>{role.description}</Td>
                    <Td className="space-x-3 flex justify-end" isNumeric>
                      <ActionMenu>
                        {hasPermission(["Update_Role"]) && (
                          <UpdateModal role={role} />
                        )}
                        {hasPermission(["Delete_Role"]) && (
                          <DeleteModal roleId={role._id} />
                        )}
                        {hasPermission(["Assign_Permissions"]) && (
                          <AssignPermissions roleId={role._id} />
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
          method={fetchRoles}
        />
      )}
      <AddModel isOpen={isAddOpen} onClose={onAddClose} />
    </>
  );
}

export default Roles;
