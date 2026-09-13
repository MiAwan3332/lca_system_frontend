import React, { useEffect, useRef, useState } from "react";
import Cookies from "js-cookie";
import moment from "moment";
import {
  Badge,
  Button,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Text,
  Box,
} from "@chakra-ui/react";
import { Archive, FileX, FilterX } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import TableSearch from "../../Components/TableSearch";
import TableRowLoading from "../../Components/TableRowLoading";
import TablePagination from "../../Components/TablePagination";
import { DataTableShell, FilterStack } from "../../Components/PageHeader";
import {
  fetchDeletionArchives,
  selectDeletionArchives,
  setDeletionArchivesLimit,
  setDeletionArchivesPage,
  setDeletionArchivesQuery,
} from "../../Features/studentSlice";
import DeletedStudentDetailModal from "./DeletedStudentDetailModal";

const formatRs = (value) =>
  `Rs. ${Number(value || 0).toLocaleString("en-PK", {
    maximumFractionDigits: 0,
  })}`;

/**
 * Deleted-students table panel for embedding on All Students.
 */
export default function DeletedStudentsPanel() {
  const tableSearchRef = useRef();
  const [authToken] = useState(Cookies.get("authToken"));
  const [selectedArchiveId, setSelectedArchiveId] = useState(null);
  const dispatch = useDispatch();
  const archives = useSelector(selectDeletionArchives);
  const { fetchDeletionArchivesStatus, deletionArchivesPagination } =
    useSelector((state) => state.students);

  const loadArchives = () => {
    dispatch(fetchDeletionArchives({ authToken }));
  };

  useEffect(() => {
    dispatch(setDeletionArchivesLimit(20));
    dispatch(fetchDeletionArchives({ authToken }));
  }, [authToken, dispatch]);

  return (
    <>
      <FilterStack className="filter-stack--panel filter-stack--table mt-2">
        <div className="w-full sm:max-w-xs">
          <TableSearch
            ref={tableSearchRef}
            setQueryFilter={setDeletionArchivesQuery}
            method={fetchDeletionArchives}
            placeholder="Search name, phone, roll, or deleted-by..."
          />
        </div>
        <Button
          size="icon"
          p={4}
          borderRadius="xl"
          onClick={() => {
            tableSearchRef.current?.clearSearch?.();
            dispatch(setDeletionArchivesQuery(""));
            loadArchives();
          }}
        >
          <FilterX className="h-4 w-4" />
        </Button>
      </FilterStack>

      <DataTableShell className="mt-2">
        <TableContainer>
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th>Student</Th>
                <Th>Batch</Th>
                <Th isNumeric>Total</Th>
                <Th isNumeric>Paid</Th>
                <Th isNumeric>Remaining</Th>
                <Th>Deleted by</Th>
                <Th>Deleted at</Th>
                <Th>Source</Th>
                <Th>Action</Th>
              </Tr>
            </Thead>
            <Tbody>
              {fetchDeletionArchivesStatus === "loading" ? (
                <TableRowLoading nOfColumns={9} actions={[]} />
              ) : archives.length === 0 ? (
                <Tr>
                  <Td colSpan={9}>
                    <Box py={8} textAlign="center" color="gray.500">
                      <FileX size={28} style={{ margin: "0 auto 8px" }} />
                      <Text>No deleted student archives yet.</Text>
                    </Box>
                  </Td>
                </Tr>
              ) : (
                archives.map((row) => {
                  const student = row.student || {};
                  const summary = row.finance?.summary || {};
                  return (
                    <Tr key={row._id}>
                      <Td>
                        <Text fontWeight="600">{student.name || "—"}</Text>
                        <Text fontSize="xs" color="gray.500">
                          {student.roll_number || "—"} · {student.phone || "—"}
                        </Text>
                      </Td>
                      <Td>{row.batch_snapshot?.name || "—"}</Td>
                      <Td isNumeric>
                        {formatRs(summary.total_fee ?? student.total_fee)}
                      </Td>
                      <Td isNumeric>
                        {formatRs(summary.paid_fee ?? student.paid_fee)}
                      </Td>
                      <Td isNumeric>
                        {formatRs(summary.pending_fee ?? student.pending_fee)}
                      </Td>
                      <Td>
                        <Text fontWeight="500">
                          {row.deleted_by_name || row.deleted_by?.name || "—"}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {row.deleted_by_role || ""}
                        </Text>
                      </Td>
                      <Td>
                        {row.deleted_at
                          ? moment(row.deleted_at).format(
                              "DD MMM YYYY, hh:mm A"
                            )
                          : "—"}
                      </Td>
                      <Td>
                        <Badge
                          colorScheme={
                            row.deletion_source === "batch_delete"
                              ? "purple"
                              : "red"
                          }
                        >
                          {row.deletion_source === "batch_delete"
                            ? "Batch"
                            : "Student"}
                        </Badge>
                      </Td>
                      <Td>
                        <Button
                          size="sm"
                          leftIcon={<Archive size={14} />}
                          onClick={() => setSelectedArchiveId(row._id)}
                          borderRadius="xl"
                        >
                          View
                        </Button>
                      </Td>
                    </Tr>
                  );
                })
              )}
            </Tbody>
          </Table>
        </TableContainer>

        <TablePagination
          pagination={deletionArchivesPagination}
          setLimitFilter={setDeletionArchivesLimit}
          setPageFilter={setDeletionArchivesPage}
          method={fetchDeletionArchives}
        />
      </DataTableShell>

      {selectedArchiveId ? (
        <DeletedStudentDetailModal
          archiveId={selectedArchiveId}
          isOpen={Boolean(selectedArchiveId)}
          onClose={() => setSelectedArchiveId(null)}
        />
      ) : null}
    </>
  );
}
