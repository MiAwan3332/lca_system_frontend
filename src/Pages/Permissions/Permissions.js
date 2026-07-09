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
  selectAllPermissions,
  fetchPermissions,
  setLimitFilter,
  setPageFilter,
  setQueryFilter,
} from "../../Features/permissionSlice";
import TableRowLoading from "../../Components/TableRowLoading";
import TableSearch from "../../Components/TableSearch";
import TablePagination from "../../Components/TablePagination";
import PageHeader, { DataTableShell, FilterStack } from "../../Components/PageHeader";
import ActionMenu from "../../Components/ActionMenu";

function Permissions() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const onAddOpen = () => setIsAddOpen(true);
  const onAddClose = () => setIsAddOpen(false);

  const [authToken, setAuthToken] = useState(Cookies.get("authToken"));

  const { fetchStatus, pagination } = useSelector((state) => state.permissions);
  const permissions = useSelector(selectAllPermissions);
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
    dispatch(fetchPermissions({ authToken }));
  }, []);
  return (
    <>
      <PageHeader title="All Permissions">
        <FilterStack className="filter-stack--actions">
          {hasPermission(["Add_Permission"]) && (
            <button
              className="table-action-btn"
              onClick={onAddOpen}
            >
              <Plus size={18} />
              Add Permission
            </button>
          )}
        </FilterStack>
      </PageHeader>
      <FilterStack className="filter-stack--panel filter-stack--table mt-3">
        <div className="w-full sm:max-w-xs">
          <TableSearch setQueryFilter={setQueryFilter} method={fetchPermissions} />
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
              {fetchStatus === "loading" ? (
                <TableRowLoading nOfColumns={3} actions={["w-10", "w-10"]} />
              ) : (
                permissions.length === 0 ? (
                  <Tr>
                    <Td colSpan={4}>
                      <span className="flex justify-center items-center gap-2 text-[#A1A1A1]">
                        <FileX />
                        No permission records found
                      </span>
                    </Td>
                  </Tr>
                ) :
                permissions.map((perm) => (
                  <Tr key={perm._id}>
                    <Td>{permissions.indexOf(perm) + 1}</Td>
                    <Td>{perm.name}</Td>
                    <Td>{perm.description}</Td>
                    <Td className="space-x-3" isNumeric>
                      <ActionMenu>
                        {hasPermission(["Update_Permission"]) && (
                          <UpdateModal perm={perm} />
                        )}
                        {hasPermission(["Delete_Permission"]) && (
                          <DeleteModal permId={perm._id} />
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
          method={fetchPermissions}
        />
      )}
      <AddModel isOpen={isAddOpen} onClose={onAddClose} />
    </>
  );
}

export default Permissions;
