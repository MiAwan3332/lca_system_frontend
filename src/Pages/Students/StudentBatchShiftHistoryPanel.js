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
  Text,
  Th,
  Thead,
  Tr,
  VStack,
} from "@chakra-ui/react";
import { ArrowRightLeft, FileX, FilterX } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import TableSearch from "../../Components/TableSearch";
import TableRowLoading from "../../Components/TableRowLoading";
import TablePagination from "../../Components/TablePagination";
import { DataTableShell, FilterStack } from "../../Components/PageHeader";
import {
  fetchBatchShifts,
  selectBatchShifts,
  setBatchShiftsLimit,
  setBatchShiftsPage,
  setBatchShiftsQuery,
} from "../../Features/studentSlice";

/**
 * All Students → Batch Shift History table.
 */
export default function StudentBatchShiftHistoryPanel() {
  const tableSearchRef = useRef();
  const [authToken] = useState(Cookies.get("authToken"));
  const dispatch = useDispatch();
  const shifts = useSelector(selectBatchShifts);
  const { fetchBatchShiftsStatus, batchShiftsPagination } = useSelector(
    (state) => state.students
  );

  const loadShifts = () => {
    dispatch(fetchBatchShifts({ authToken }));
  };

  useEffect(() => {
    dispatch(setBatchShiftsLimit(20));
    dispatch(fetchBatchShifts({ authToken }));
  }, [authToken, dispatch]);

  return (
    <>
      <FilterStack className="filter-stack--panel filter-stack--table mt-2">
        <div className="w-full sm:max-w-xs">
          <TableSearch
            ref={tableSearchRef}
            setQueryFilter={setBatchShiftsQuery}
            method={fetchBatchShifts}
            placeholder="Search student, batch, roll, or shifted-by..."
          />
        </div>
        <Button
          size="icon"
          p={4}
          borderRadius="xl"
          onClick={() => {
            tableSearchRef.current?.clearSearch?.();
            dispatch(setBatchShiftsQuery(""));
            loadShifts();
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
                <Th>#</Th>
                <Th>Student</Th>
                <Th>From batch</Th>
                <Th>To batch</Th>
                <Th>Roll change</Th>
                <Th>Shifted by</Th>
                <Th>Date</Th>
              </Tr>
            </Thead>
            <Tbody>
              {fetchBatchShiftsStatus === "loading" ? (
                <TableRowLoading nOfColumns={7} actions={[]} />
              ) : shifts.length === 0 ? (
                <Tr>
                  <Td colSpan={7}>
                    <span className="flex justify-center items-center gap-2 text-[#A1A1A1] py-8">
                      <FileX />
                      No batch shift history yet
                    </span>
                  </Td>
                </Tr>
              ) : (
                shifts.map((row, index) => (
                  <Tr key={row._id}>
                    <Td>
                      {(batchShiftsPagination.page - 1) *
                        batchShiftsPagination.limit +
                        index +
                        1}
                    </Td>
                    <Td>
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="600">
                          {row.student_name || row.student?.name || "—"}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {row.student_phone || row.student?.phone || "—"}
                        </Text>
                      </VStack>
                    </Td>
                    <Td>
                      <Text fontSize="sm">
                        {row.from_batch_name ||
                          row.from_batch?.name ||
                          "Unassigned"}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        Roll: {row.from_roll_number || "—"}
                      </Text>
                    </Td>
                    <Td>
                      <Badge
                        colorScheme="green"
                        borderRadius="md"
                        display="inline-flex"
                        alignItems="center"
                        gap={1}
                      >
                        <ArrowRightLeft size={12} />
                        {row.to_batch_name || row.to_batch?.name || "—"}
                      </Badge>
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        Roll: {row.to_roll_number || "—"}
                      </Text>
                    </Td>
                    <Td>
                      <Text fontSize="sm">
                        {row.from_roll_number || "—"} →{" "}
                        {row.to_roll_number || "—"}
                      </Text>
                    </Td>
                    <Td>
                      <Text fontWeight="500">
                        {row.shifted_by_name ||
                          row.shifted_by?.name ||
                          "—"}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {row.shifted_by_role || ""}
                      </Text>
                    </Td>
                    <Td>
                      {row.shifted_at
                        ? moment(row.shifted_at).format(
                            "DD MMM YYYY, hh:mm A"
                          )
                        : "—"}
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </TableContainer>

        {fetchBatchShiftsStatus !== "loading" && (
          <TablePagination
            pagination={batchShiftsPagination}
            setLimitFilter={setBatchShiftsLimit}
            setPageFilter={setBatchShiftsPage}
            method={fetchBatchShifts}
          />
        )}
      </DataTableShell>
    </>
  );
}
