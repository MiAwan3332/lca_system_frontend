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
  Badge,
  ButtonGroup,
  useDisclosure,
  HStack,
  FormControl,
  Input,
  Select,
} from "@chakra-ui/react";
import { useSelector, useDispatch } from "react-redux";
import TableRowLoading from "../../Components/TableRowLoading";
import TableSearch from "../../Components/TableSearch";
import TablePagination from "../../Components/TablePagination";
import { FileX } from "lucide-react";
import {
  selectAllFees,
  setLimitFilter,
  setPageFilter,
  setQueryFilter,
  fetchFees,
} from "../../Features/feeSlice";
import FeeHistoryModal from "./FeeHistoryModal";
import PayFeeModal from "./PayFeeModal";
import DeleteFeeModal from "./DeleteFeeModal";
import DiscountFeeModal from "./DiscountFeeModal";
import { isStudentViewOnly } from "../../utlls/studentAccess";

function Fees() {
  const viewOnly = isStudentViewOnly();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [authToken, setAuthToken] = useState(Cookies.get("authToken"));

  const [formDate, setFormDate] = useState("");

  const { fetchStatus, pagination } = useSelector((state) => state.fees);
  const fees = useSelector(selectAllFees);
  const dispatch = useDispatch();

  const handleFormDateChange = (e) => {
    setFormDate(e.target.value);
    dispatch(fetchFees({ authToken, date: e.target.value }));
  };

  useEffect(() => {
    dispatch(fetchFees({ authToken }));
  }, [dispatch, authToken]);

  return (
    <>
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold ml-6 text-nowrap">
          {viewOnly ? "My Fees" : "Student Fees"}
        </h1>
        <div className="w-full flex items-center justify-end gap-3">
          {!viewOnly && (
          <div>
            <TableSearch setQueryFilter={setQueryFilter} method={fetchFees} />
          </div>
          )}
          <HStack spacing={3}>
            <FormControl>
              <Input
                type="date"
                w={48}
                size={"lg"}
                borderRadius="xl"
                value={formDate}
                onChange={(e) => handleFormDateChange(e)}
              />
            </FormControl>
            <FormControl>
              <Select
                w={48}
                size={"lg"}
                borderRadius="xl"
                onChange={(e) => {
                  dispatch(fetchFees({ authToken, status: e.target.value }));
                }}
              >
                <option value="">All Statuses</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
              </Select>
            </FormControl>
          </HStack>
        </div>
      </div>
      <div className="w-full bg-white mt-3 rounded-xl border border-[#E0E8EC]">
        <TableContainer>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>No</Th>
                <Th>History</Th>
                <Th data-searchable>Student Name</Th>
                <Th>Batch</Th>
                <Th>Fee Amount</Th>
                <Th>Due Date</Th>
                <Th>Status</Th>
                {!viewOnly && <Th isNumeric>Action</Th>}
              </Tr>
            </Thead>
            <Tbody>
              {fetchStatus === "loading" ? (
                <TableRowLoading
                  nOfColumns={8}
                  actions={[
                    "w-10",
                    "w-10",
                    "w-10",
                    "w-10",
                    "w-10",
                    "w-10",
                    "w-10",
                    "w-20",
                  ]}
                />
              ) : Array.isArray(fees) && fees.length > 0 ? (
                fees.map((fee) => (
                  <Tr key={fee._id}>
                    <Td>{fees.indexOf(fee) + 1}</Td>
                    <Td>
                      <ButtonGroup variant="outline">
                        <FeeHistoryModal
                          isOpen={isOpen}
                          onClose={onClose}
                          onOpen={onOpen}
                          fee={fee}
                        />
                      </ButtonGroup>
                    </Td>
                    <Td>{fee.student?.name}</Td>
                    <Td>{fee.batch?.name}</Td>
                    <Td>{fee?.amount}</Td>
                    <Td>{fee?.due_date}</Td>
                    <Td>
                      <Badge
                        colorScheme={fee.status === "Paid" ? "green" : "red"}
                      >
                        {fee?.status}
                      </Badge>
                    </Td>
                    {!viewOnly && (
                    <Td className="space-x-3" isNumeric>
                      <div className="flex flex-nowrap justify-end items-center gap-2">
                        <PayFeeModal
                          fee={fee}
                          isDisabled={fee.amount === 0 || fee.status === "Paid"}
                        />
                        <DiscountFeeModal
                          fee={fee}
                          isDisabled={fee.amount === 0 || fee.status === "Paid"}
                        />
                        <DeleteFeeModal fee={fee} />
                      </div>
                    </Td>
                    )}
                  </Tr>
                ))
              ) : (
                <Tr>
                  <Td colSpan={8}>
                    <span className="flex justify-center items-center gap-2 text-[#A1A1A1]">
                      <FileX />
                      No fee records found
                    </span>
                  </Td>
                </Tr>
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
          method={fetchFees}
        />
      )}
    </>
  );
}

export default Fees;