import React, { useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import axios from "axios";
import {
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Text,
} from "@chakra-ui/react";
import { config } from "../../utlls/config";

const formatRs = (value) =>
  `Rs. ${Number(value || 0).toLocaleString("en-PK", {
    maximumFractionDigits: 0,
  })}`;

const formatCount = (value) =>
  Number(value || 0).toLocaleString("en-PK", { maximumFractionDigits: 0 });

const buildParams = (filters = {}) => {
  const params = {};
  if (filters.batch_id) {
    params.batch_id = Array.isArray(filters.batch_id)
      ? filters.batch_id.filter(Boolean).join(",")
      : filters.batch_id;
  }
  if (filters.start_date) params.start_date = filters.start_date;
  if (filters.end_date) params.end_date = filters.end_date;
  return params;
};

/**
 * Dashboard table: active batches — students, fee created, discount,
 * received, refund, pending.
 */
function BatchFinanceSection({ filters = {} }) {
  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState({
    active_students: 0,
    total_fee_created: 0,
    discount: 0,
    received: 0,
    refund: 0,
    pending: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const authToken = Cookies.get("authToken");
        if (!authToken) {
          setError("Not authenticated");
          setRows([]);
          return;
        }

        const { data } = await axios.get(
          `${config.BASE_URL}/statistics/batch-finance`,
          {
            headers: { Authorization: `Bearer ${authToken}` },
            params: buildParams(filters),
          }
        );

        setRows(Array.isArray(data?.batches) ? data.batches : []);
        setTotals(
          data?.totals || {
            active_students: 0,
            total_fee_created: 0,
            discount: 0,
            received: 0,
            refund: 0,
            pending: 0,
          }
        );
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            err.message ||
            "Could not load batch finance summary"
        );
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters.batch_id, filters.start_date, filters.end_date]);

  const summaryBadges = useMemo(
    () => [
      {
        label: "Active Students",
        value: formatCount(totals.active_students),
        color: "purple",
        isMoney: false,
      },
      {
        label: "Created",
        value: totals.total_fee_created,
        color: "blue",
        isMoney: true,
      },
      {
        label: "Discount",
        value: totals.discount,
        color: "orange",
        isMoney: true,
      },
      {
        label: "Received",
        value: totals.received,
        color: "green",
        isMoney: true,
      },
      {
        label: "Refund",
        value: totals.refund,
        color: "pink",
        isMoney: true,
      },
      {
        label: "Pending",
        value: totals.pending,
        color: "red",
        isMoney: true,
      },
    ],
    [totals]
  );

  return (
    <div className="dash-surface-card p-4 sm:p-5">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold dash-text">
            Batch-wise Fee Summary
          </h2>
          <p className="text-sm dash-text-muted">
            Active students, fee created, discount, received, refund, and
            pending dues for active batches only
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {summaryBadges.map((item) => (
            <Badge
              key={item.label}
              colorScheme={item.color}
              borderRadius="md"
              px={2}
              py={1}
            >
              {item.label}:{" "}
              {item.isMoney === false ? item.value : formatRs(item.value)}
            </Badge>
          ))}
        </div>
      </div>

      {loading ? (
        <Text className="dash-text-muted" py={8} textAlign="center">
          Loading batch fee summary...
        </Text>
      ) : error ? (
        <Text color="red.500" py={8} textAlign="center">
          {error}
        </Text>
      ) : rows.length === 0 ? (
        <Text className="dash-text-muted" py={8} textAlign="center">
          No active batch fee data found.
        </Text>
      ) : (
        <TableContainer>
          <Table size="sm">
            <Thead>
              <Tr>
                <Th>Batch</Th>
                <Th isNumeric>Active Students</Th>
                <Th isNumeric>Total Fee Created</Th>
                <Th isNumeric>Discount</Th>
                <Th isNumeric>Received</Th>
                <Th isNumeric>Refund</Th>
                <Th isNumeric>Pending Dues</Th>
              </Tr>
            </Thead>
            <Tbody>
              {rows.map((row) => (
                <Tr key={row.batch_id || row.batch_name}>
                  <Td>
                    <Text fontWeight="medium">{row.batch_name}</Text>
                  </Td>
                  <Td isNumeric fontWeight="semibold">
                    {formatCount(row.active_students)}
                  </Td>
                  <Td isNumeric fontWeight="semibold">
                    {formatRs(row.total_fee_created)}
                  </Td>
                  <Td isNumeric>
                    <Badge colorScheme="orange" borderRadius="md">
                      {formatRs(row.discount)}
                    </Badge>
                  </Td>
                  <Td isNumeric>
                    <Badge colorScheme="green" borderRadius="md">
                      {formatRs(row.received)}
                    </Badge>
                  </Td>
                  <Td isNumeric>
                    <Badge
                      colorScheme={row.refund > 0 ? "pink" : "gray"}
                      borderRadius="md"
                    >
                      {formatRs(row.refund)}
                    </Badge>
                  </Td>
                  <Td isNumeric>
                    <Badge
                      colorScheme={row.pending > 0 ? "red" : "gray"}
                      borderRadius="md"
                    >
                      {formatRs(row.pending)}
                    </Badge>
                  </Td>
                </Tr>
              ))}
              <Tr>
                <Td fontWeight="700">Total</Td>
                <Td isNumeric fontWeight="700">
                  {formatCount(totals.active_students)}
                </Td>
                <Td isNumeric fontWeight="700">
                  {formatRs(totals.total_fee_created)}
                </Td>
                <Td isNumeric fontWeight="700">
                  {formatRs(totals.discount)}
                </Td>
                <Td isNumeric fontWeight="700">
                  {formatRs(totals.received)}
                </Td>
                <Td isNumeric fontWeight="700">
                  {formatRs(totals.refund)}
                </Td>
                <Td isNumeric fontWeight="700">
                  {formatRs(totals.pending)}
                </Td>
              </Tr>
            </Tbody>
          </Table>
        </TableContainer>
      )}
    </div>
  );
}

export default BatchFinanceSection;
