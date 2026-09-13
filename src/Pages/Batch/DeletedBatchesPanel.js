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
} from "../../Features/batchSlice";
import DeletedBatchDetailModal from "./DeletedBatchDetailModal";

const formatRs = (value) =>
  `Rs. ${Number(value || 0).toLocaleString("en-PK", {
    maximumFractionDigits: 0,
  })}`;

/**
 * Deleted-batches history panel (batch + enrolled students snapshot).
 */
export default function DeletedBatchesPanel() {
  const tableSearchRef = useRef();
  const [authToken] = useState(Cookies.get("authToken"));
  const [selectedArchiveId, setSelectedArchiveId] = useState(null);
  const dispatch = useDispatch();
  const archives = useSelector(selectDeletionArchives);
  const { fetchDeletionArchivesStatus, deletionArchivesPagination } =
    useSelector((state) => state.batches);

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
            placeholder="Search batch, student, or deleted-by..."
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
                <Th>Batch</Th>
                <Th>Type</Th>
                <Th isNumeric>Students</Th>
                <Th isNumeric>Total</Th>
                <Th isNumeric>Paid</Th>
                <Th isNumeric>Remaining</Th>
                <Th>Deleted by</Th>
                <Th>Deleted at</Th>
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
                      <Text>No deleted batch archives yet.</Text>
                    </Box>
                  </Td>
                </Tr>
              ) : (
                archives.map((row) => {
                  const batch = row.batch || {};
                  const summary = row.summary || {};
                  return (
                    <Tr key={row._id}>
                      <Td>
                        <Text fontWeight="600">{batch.name || "—"}</Text>
                        <Text fontSize="xs" color="gray.500" noOfLines={1}>
                          {batch.description || "—"}
                        </Text>
                      </Td>
                      <Td>
                        <Badge>{batch.batch_type || "N/A"}</Badge>
                      </Td>
                      <Td isNumeric>
                        {summary.students_count ??
                          row.cascade_summary?.students_deleted ??
                          0}
                      </Td>
                      <Td isNumeric>{formatRs(summary.total_fee)}</Td>
                      <Td isNumeric>{formatRs(summary.paid_fee)}</Td>
                      <Td isNumeric>{formatRs(summary.pending_fee)}</Td>
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
        <DeletedBatchDetailModal
          archiveId={selectedArchiveId}
          isOpen={Boolean(selectedArchiveId)}
          onClose={() => setSelectedArchiveId(null)}
        />
      ) : null}
    </>
  );
}
