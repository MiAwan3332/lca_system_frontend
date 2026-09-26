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
import LcaLogoLoading from "../LcaLogoLoading";

const buildChartParams = (filters = {}) => {
  const params = new URLSearchParams();
  const { batch_id, start_date, end_date } = filters;

  if (batch_id) params.append("batch_id", batch_id);
  if (start_date) params.append("start_date", start_date);
  if (end_date) params.append("end_date", end_date);

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
};

function BatchStudentStatusSection({ filters = {} }) {
  const [rows, setRows] = useState([]);
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
          `${config.BASE_URL}/students/students/Batchesgraph${buildChartParams(
            filters
          )}`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );

        const list = Array.isArray(data) ? data : [];
        setRows(
          list.map((item) => ({
            batch: item.batch || "Untitled batch",
            batch_id: item.batch_id || "",
            total: Number(item.total ?? item.count) || 0,
            active: Number(item.active) || 0,
            inactive: Number(item.inactive) || 0,
          }))
        );
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            err.message ||
            "Could not load batch student counts"
        );
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters.batch_id, filters.start_date, filters.end_date]);

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, row) => {
          acc.total += row.total;
          acc.active += row.active;
          acc.inactive += row.inactive;
          return acc;
        },
        { total: 0, active: 0, inactive: 0 }
      ),
    [rows]
  );

  return (
    <div className="dash-surface-card p-4 sm:p-5">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold dash-text">
            Students by Batch
          </h2>
          <p className="text-sm dash-text-muted">
            Total, active, and inactive student counts for each batch
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge colorScheme="gray" borderRadius="md" px={2} py={1}>
            Total: {totals.total}
          </Badge>
          <Badge colorScheme="green" borderRadius="md" px={2} py={1}>
            Active: {totals.active}
          </Badge>
          <Badge colorScheme="red" borderRadius="md" px={2} py={1}>
            Inactive: {totals.inactive}
          </Badge>
        </div>
      </div>

      {loading ? (
        <LcaLogoLoading size="sm" label="Loading" />
      ) : error ? (
        <Text color="red.500" py={8} textAlign="center">
          {error}
        </Text>
      ) : rows.length === 0 ? (
        <Text className="dash-text-muted" py={8} textAlign="center">
          No batch student data found for selected filters.
        </Text>
      ) : (
        <TableContainer>
          <Table size="sm">
            <Thead>
              <Tr>
                <Th>Batch</Th>
                <Th isNumeric>Total</Th>
                <Th isNumeric>Active</Th>
                <Th isNumeric>Inactive</Th>
              </Tr>
            </Thead>
            <Tbody>
              {rows.map((row) => (
                <Tr key={row.batch_id || row.batch}>
                  <Td>
                    <Text fontWeight="medium">{row.batch}</Text>
                  </Td>
                  <Td isNumeric fontWeight="semibold">
                    {row.total}
                  </Td>
                  <Td isNumeric>
                    <Badge colorScheme="green" borderRadius="md">
                      {row.active}
                    </Badge>
                  </Td>
                  <Td isNumeric>
                    <Badge colorScheme="red" borderRadius="md">
                      {row.inactive}
                    </Badge>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      )}
    </div>
  );
}

export default BatchStudentStatusSection;
