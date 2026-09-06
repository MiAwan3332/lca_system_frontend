import React, { useCallback, useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import axios from "axios";
import {
  Badge,
  Box,
  Button,
  ButtonGroup,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Text,
  Textarea,
  useToast,
  VStack,
  Spinner,
} from "@chakra-ui/react";
import {
  Ban,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  ListOrdered,
  RefreshCw,
  Send,
} from "lucide-react";
import { Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import PageHeader, {
  DataTableShell,
  FilterStack,
} from "../../Components/PageHeader";
import SearchableBatchSelect from "../../Components/SearchableBatchSelect";
import {
  fetchBatches,
  selectActiveStudentBatches,
  selectActiveInterviewBatches,
} from "../../Features/batchSlice";
import { config } from "../../utlls/config";
import { isPlatformSuperAdminRole } from "../../utlls/useful";

const STATUS_META = {
  in_queue: { label: "In-Queue", color: "orange" },
  sending: { label: "Sending", color: "blue" },
  sent: { label: "Sent", color: "green" },
  failed: { label: "Failed", color: "red" },
  cancelled: { label: "Cancelled", color: "gray" },
};

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function WhatsAppQueue() {
  const authToken = Cookies.get("authToken");
  const toast = useToast();
  const dispatch = useDispatch();
  const canView = isPlatformSuperAdminRole();

  const activeBatches = useSelector(selectActiveStudentBatches);
  const interviewBatches = useSelector(selectActiveInterviewBatches);

  const [loading, setLoading] = useState(true);
  const [queueing, setQueueing] = useState(false);
  const [cancellingAll, setCancellingAll] = useState(false);
  const [busyId, setBusyId] = useState("");

  const [docs, setDocs] = useState([]);
  const [pagination, setPagination] = useState({
    totalDocs: 0,
    limit: 20,
    totalPages: 1,
    page: 1,
    hasPrevPage: false,
    hasNextPage: false,
    prevPage: null,
    nextPage: null,
  });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [stats, setStats] = useState({
    in_queue: 0,
    sending: 0,
    sent: 0,
    failed: 0,
    cancelled: 0,
    delay_ms: 10000,
  });
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [audience, setAudience] = useState("qualifiers");
  const [batchId, setBatchId] = useState("");
  const [templates, setTemplates] = useState([]);
  const [templateKey, setTemplateKey] = useState("");
  const [customBody, setCustomBody] = useState("");

  const headers = useMemo(
    () => ({ Authorization: `Bearer ${authToken}` }),
    [authToken]
  );

  const batchOptions =
    audience === "qualifiers" ? interviewBatches : activeBatches;

  const loadQueue = useCallback(async () => {
    try {
      const { data } = await axios.get(`${config.BASE_URL}/whatsapp/queue`, {
        headers,
        params: {
          page,
          limit,
          status: statusFilter,
          query: search.trim() || undefined,
        },
      });
      setDocs(Array.isArray(data.docs) ? data.docs : []);
      setPagination({
        totalDocs: data.totalDocs || 0,
        limit: data.limit || limit,
        totalPages: data.totalPages || 1,
        page: data.page || page,
        hasPrevPage: Boolean(data.hasPrevPage),
        hasNextPage: Boolean(data.hasNextPage),
        prevPage: data.prevPage ?? null,
        nextPage: data.nextPage ?? null,
      });
      if (data.stats) setStats(data.stats);
    } catch (error) {
      toast({
        title: "Could not load WhatsApp queue",
        description:
          error?.response?.data?.message || error.message || "Please try again.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [headers, limit, page, search, statusFilter, toast]);

  const loadTemplates = useCallback(async () => {
    try {
      const { data } = await axios.get(`${config.BASE_URL}/whatsapp/templates`, {
        headers,
      });
      const list = Array.isArray(data.templates) ? data.templates : [];
      setTemplates(list.filter((t) => t.is_active !== false));
      if (!templateKey && list.length) {
        const preferred =
          list.find((t) => t.process === "qualifier_welcome") ||
          list.find((t) => t.process === "custom") ||
          list[0];
        if (preferred) setTemplateKey(preferred.key);
      }
    } catch {
      // ignore — queue page still works without templates list
    }
  }, [headers, templateKey]);

  useEffect(() => {
    if (!canView || !authToken) return;
    dispatch(
      fetchBatches({
        authToken,
        queryParams: { limit: 200, page: 1, query: "", is_active: "true" },
      })
    );
    loadTemplates();
  }, [authToken, canView, dispatch, loadTemplates]);

  useEffect(() => {
    if (!canView) return;
    setLoading(true);
    loadQueue();
  }, [canView, loadQueue]);

  useEffect(() => {
    if (!canView) return undefined;
    const timer = setInterval(() => {
      loadQueue();
    }, 5000);
    return () => clearInterval(timer);
  }, [canView, loadQueue]);

  useEffect(() => {
    setBatchId("");
  }, [audience]);

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    setPage(1);
  };

  const applySearch = () => {
    setSearch(searchInput.trim());
    setPage(1);
  };

  const handlePageChange = (nextPage) => {
    if (!nextPage || nextPage === page) return;
    setPage(nextPage);
    setLoading(true);
  };

  const handleLimitChange = (value) => {
    setLimit(Number(value) || 20);
    setPage(1);
    setLoading(true);
  };

  const renderPageButtons = () => {
    const { totalPages } = pagination;
    if (!totalPages || totalPages < 1) return null;

    if (totalPages < 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1).map((item) => (
        <Button
          key={item}
          onClick={() => handlePageChange(item)}
          isDisabled={page === item}
          borderRadius="xl"
        >
          {item}
        </Button>
      ));
    }

    if (page < 3) {
      return Array.from({ length: 5 }, (_, i) => i + 1).map((item) => (
        <Button
          key={item}
          onClick={() => handlePageChange(item)}
          isDisabled={page === item}
          borderRadius="xl"
        >
          {item}
        </Button>
      ));
    }

    if (page > totalPages - 2) {
      return (
        <>
          <Button borderRadius="xl">...</Button>
          {Array.from({ length: 5 }, (_, i) => totalPages - 4 + i).map(
            (item) => (
              <Button
                key={item}
                onClick={() => handlePageChange(item)}
                isDisabled={page === item}
                borderRadius="xl"
              >
                {item}
              </Button>
            )
          )}
        </>
      );
    }

    return (
      <>
        {page !== 3 && <Button borderRadius="xl">...</Button>}
        {Array.from({ length: 5 }, (_, i) => page - 2 + i).map((item) => (
          <Button
            key={item}
            onClick={() => handlePageChange(item)}
            isDisabled={page === item}
            borderRadius="xl"
          >
            {item}
          </Button>
        ))}
        <Button borderRadius="xl">...</Button>
      </>
    );
  };

  if (!canView) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleEnqueue = async () => {
    if (!batchId) {
      toast({
        title: "Select a batch",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    if (!customBody.trim() && !templateKey) {
      toast({
        title: "Select a template or write a custom message",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setQueueing(true);
    try {
      const payload = {
        audience,
        batch_id: batchId,
        source: "bulk_page",
      };
      if (customBody.trim()) {
        payload.body = customBody.trim();
      } else {
        payload.template_key = templateKey;
      }

      const { data } = await axios.post(
        `${config.BASE_URL}/whatsapp/queue/bulk`,
        payload,
        { headers }
      );

      toast({
        title: "Messages added to queue",
        description: data.message,
        status: "success",
        duration: 6000,
        isClosable: true,
      });
      setCustomBody("");
      await loadQueue();
    } catch (error) {
      toast({
        title: "Could not queue messages",
        description:
          error?.response?.data?.message || error.message || "Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setQueueing(false);
    }
  };

  const handleCancelOne = async (id) => {
    setBusyId(id);
    try {
      await axios.post(
        `${config.BASE_URL}/whatsapp/queue/${id}/cancel`,
        {},
        { headers }
      );
      await loadQueue();
    } catch (error) {
      toast({
        title: "Cancel failed",
        description:
          error?.response?.data?.message || error.message || "Please try again.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setBusyId("");
    }
  };

  const handleCancelAll = async () => {
    setCancellingAll(true);
    try {
      const { data } = await axios.post(
        `${config.BASE_URL}/whatsapp/queue/cancel-all`,
        {},
        { headers }
      );
      toast({
        title: "Queue cleared",
        description: data.message,
        status: "info",
        duration: 4000,
        isClosable: true,
      });
      await loadQueue();
    } catch (error) {
      toast({
        title: "Could not cancel queue",
        description:
          error?.response?.data?.message || error.message || "Please try again.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setCancellingAll(false);
    }
  };

  const delaySeconds = Math.round((stats.delay_ms || 10000) / 1000);

  return (
    <Box>
      <PageHeader
        title="WhatsApp Queue"
        subtitle={`Automatic and manual WhatsApp messages go to this queue by default, then send one-by-one every ${delaySeconds} seconds. Track In-Queue, Sent, and Cancelled status here.`}
      >
        <FilterStack className="filter-stack--actions">
          <Button
            leftIcon={<RefreshCw size={16} />}
            variant="outline"
            onClick={() => {
              setLoading(true);
              loadQueue();
            }}
          >
            Refresh
          </Button>
          <Button
            leftIcon={<Ban size={16} />}
            variant="outline"
            colorScheme="red"
            onClick={handleCancelAll}
            isLoading={cancellingAll}
            isDisabled={!stats.in_queue}
          >
            Cancel All In-Queue
          </Button>
        </FilterStack>
      </PageHeader>

      <HStack spacing={3} flexWrap="wrap" mt={3} mb={4}>
        {[
          ["in_queue", stats.in_queue],
          ["sending", stats.sending],
          ["sent", stats.sent],
          ["failed", stats.failed],
          ["cancelled", stats.cancelled],
        ].map(([key, count]) => (
          <Badge
            key={key}
            colorScheme={STATUS_META[key]?.color || "gray"}
            fontSize="0.85rem"
            px={3}
            py={1}
            borderRadius="md"
          >
            {STATUS_META[key]?.label || key}: {count || 0}
          </Badge>
        ))}
      </HStack>

      <DataTableShell>
        <VStack align="stretch" spacing={4} p={{ base: 3, md: 5 }}>
          <Text fontWeight="semibold" display="flex" alignItems="center" gap={2}>
            <Send size={18} />
            Queue bulk messages
          </Text>
          <Text fontSize="sm" color="gray.600">
            Choose students or qualifiers in a batch, pick a template (or custom
            text), then queue. Messages appear below as In-Queue and send every{" "}
            {delaySeconds}s.
          </Text>

          <HStack align="end" flexWrap="wrap" gap={3}>
            <FormControl maxW="200px">
              <FormLabel fontSize="sm">Audience</FormLabel>
              <Select
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
              >
                <option value="qualifiers">Qualifiers</option>
                <option value="students">Students</option>
              </Select>
            </FormControl>

            <FormControl maxW="320px" isRequired>
              <FormLabel fontSize="sm">
                {audience === "qualifiers" ? "Interview batch" : "Batch"}
              </FormLabel>
              <SearchableBatchSelect
                batches={batchOptions}
                value={batchId}
                onChange={setBatchId}
                placeholder="Select batch"
                width="100%"
              />
            </FormControl>

            <FormControl maxW="280px">
              <FormLabel fontSize="sm">Template</FormLabel>
              <Select
                value={templateKey}
                onChange={(e) => setTemplateKey(e.target.value)}
                isDisabled={Boolean(customBody.trim())}
              >
                <option value="">Select template</option>
                {templates.map((tpl) => (
                  <option key={tpl.key} value={tpl.key}>
                    {tpl.name}
                  </option>
                ))}
              </Select>
            </FormControl>
          </HStack>

          <FormControl>
            <FormLabel fontSize="sm">
              Custom message (optional — overrides template)
            </FormLabel>
            <Textarea
              value={customBody}
              onChange={(e) => setCustomBody(e.target.value)}
              placeholder="Assalam o Alaikum {{name}}! ..."
              rows={4}
            />
          </FormControl>

          <Button
            alignSelf="flex-start"
            leftIcon={<ListOrdered size={16} />}
            backgroundColor="#7AEF85"
            color="#257947"
            _hover={{ backgroundColor: "#65C76E", color: "#184E2E" }}
            onClick={handleEnqueue}
            isLoading={queueing}
            loadingText="Queuing..."
          >
            Add to Queue
          </Button>
        </VStack>
      </DataTableShell>

      <FilterStack className="filter-stack--panel filter-stack--table mt-4">
        <FormControl maxW="200px">
          <Select
            value={statusFilter}
            onChange={(e) => handleStatusFilterChange(e.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="in_queue">In-Queue</option>
            <option value="sending">Sending</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </FormControl>
        <FormControl maxW="260px">
          <Input
            placeholder="Search name or phone..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onBlur={applySearch}
            onKeyDown={(e) => {
              if (e.key === "Enter") applySearch();
            }}
          />
        </FormControl>
      </FilterStack>

      <DataTableShell className="mt-3">
        {loading ? (
          <Box py={12} textAlign="center">
            <Spinner size="lg" color="#85652D" />
          </Box>
        ) : (
          <TableContainer>
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th>Recipient</Th>
                  <Th>Phone</Th>
                  <Th>Template / Source</Th>
                  <Th>Status</Th>
                  <Th>Queued</Th>
                  <Th>Sent / Cancelled</Th>
                  <Th isNumeric>Action</Th>
                </Tr>
              </Thead>
              <Tbody>
                {docs.length === 0 ? (
                  <Tr>
                    <Td colSpan={7}>
                      <Text py={6} textAlign="center" color="gray.500">
                        No messages in the queue yet.
                      </Text>
                    </Td>
                  </Tr>
                ) : (
                  docs.map((item) => {
                    const meta = STATUS_META[item.status] || {
                      label: item.status,
                      color: "gray",
                    };
                    return (
                      <Tr key={item._id}>
                        <Td>
                          <Text fontWeight="medium">
                            {item.recipient_name || "—"}
                          </Text>
                          {item.batch_name ? (
                            <Text fontSize="xs" color="gray.500">
                              {item.batch_name}
                            </Text>
                          ) : null}
                        </Td>
                        <Td>{item.phone}</Td>
                        <Td>
                          <Text fontSize="sm">
                            {item.template_name || item.process || "—"}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            {item.source || ""}
                          </Text>
                        </Td>
                        <Td>
                          <Badge colorScheme={meta.color} borderRadius="md">
                            {meta.label}
                          </Badge>
                          {item.error ? (
                            <Text fontSize="xs" color="red.500" mt={1} maxW="220px">
                              {item.error}
                            </Text>
                          ) : null}
                        </Td>
                        <Td fontSize="sm">{formatDate(item.createdAt)}</Td>
                        <Td fontSize="sm">
                          {item.status === "sent"
                            ? formatDate(item.sent_at)
                            : item.status === "cancelled"
                              ? formatDate(item.cancelled_at)
                              : "—"}
                        </Td>
                        <Td isNumeric>
                          {item.status === "in_queue" ? (
                            <Button
                              size="xs"
                              variant="outline"
                              colorScheme="red"
                              onClick={() => handleCancelOne(item._id)}
                              isLoading={busyId === item._id}
                            >
                              Cancel
                            </Button>
                          ) : (
                            "—"
                          )}
                        </Td>
                      </Tr>
                    );
                  })
                )}
              </Tbody>
            </Table>
          </TableContainer>
        )}
      </DataTableShell>

      {!loading && pagination.totalDocs > 0 && (
        <div className="flex flex-wrap justify-between items-center gap-4 my-5 px-2 sm:px-4 lg:px-8 w-full max-w-full overflow-x-auto">
          <div className="flex items-center gap-4">
            <p className="text-md">
              {`${page * limit - limit + 1} - ${
                page * limit > pagination.totalDocs
                  ? pagination.totalDocs
                  : page * limit
              } of ${pagination.totalDocs} records`}
            </p>
            <Select
              value={limit}
              onChange={(e) => handleLimitChange(e.target.value)}
              w="24"
              borderRadius="xl"
              backgroundColor="white"
              cursor="pointer"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
              <option value={40}>40</option>
              <option value={50}>50</option>
            </Select>
          </div>
          <ButtonGroup
            size="md"
            isAttached
            variant="outline"
            backgroundColor="white"
          >
            <Button
              onClick={() => handlePageChange(1)}
              isDisabled={!pagination.hasPrevPage}
              borderRadius="xl"
            >
              <ChevronFirst />
            </Button>
            <Button
              onClick={() => handlePageChange(pagination.prevPage)}
              isDisabled={!pagination.hasPrevPage}
              borderRadius="xl"
            >
              <ChevronLeft />
            </Button>
            {renderPageButtons()}
            <Button
              onClick={() => handlePageChange(pagination.nextPage)}
              isDisabled={!pagination.hasNextPage}
              borderRadius="xl"
            >
              <ChevronRight />
            </Button>
            <Button
              onClick={() => handlePageChange(pagination.totalPages)}
              isDisabled={!pagination.hasNextPage}
              borderRadius="xl"
            >
              <ChevronLast />
            </Button>
          </ButtonGroup>
        </div>
      )}
    </Box>
  );
}

export default WhatsAppQueue;
