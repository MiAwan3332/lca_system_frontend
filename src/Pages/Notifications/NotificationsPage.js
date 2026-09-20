import React, { useCallback, useEffect, useState } from "react";
import Cookies from "js-cookie";
import moment from "moment";
import axios from "axios";
import {
  Badge,
  Box,
  Button,
  ButtonGroup,
  FormControl,
  Input,
  Select,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  Bell,
  CheckCheck,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  FileX,
  FilterX,
} from "lucide-react";
import { useDispatch } from "react-redux";
import { Navigate, useNavigate } from "react-router-dom";
import PageHeader, { FilterStack } from "../../Components/PageHeader";
import FeeDueReportPanel from "./FeeDueReportPanel";
import { config } from "../../utlls/config";
import { isInstitutionAdmin } from "../../utlls/teacherAccess";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../../Features/notificationSlice";
import {
  getNotificationActionHint,
  getNotificationColorScheme,
  getNotificationLabel,
  isNotificationOverdue,
  navigateForNotification,
  NOTIFICATION_TYPE_OPTIONS,
} from "../../utlls/notificationHelpers";
import { getOverdueMessage } from "../../utlls/feeDueDate";

const BASE_URL = config.BASE_URL;

function NotificationCard({ item, onOpen }) {
  const actionHint = getNotificationActionHint(item.type);
  const overdue = isNotificationOverdue(item);
  const dueToday = item.type === "fee_due_today_admin_alert";
  const isDailyReport = item.type === "fee_daily_due_report";
  const accentBorder = overdue
    ? "#FCA5A5"
    : dueToday
      ? "#FFCB82"
      : isDailyReport
        ? "#D6BCFA"
        : item.is_read
          ? "#E0E8EC"
          : "#FFCB82";
  const accentBg = overdue
    ? "#FFF5F5"
    : dueToday
      ? "#FFFBF5"
      : isDailyReport
        ? "#FAF5FF"
        : "white";

  return (
    <Box
      borderWidth="1px"
      borderColor={accentBorder}
      borderRadius="xl"
      bg={accentBg}
      p={4}
      cursor="pointer"
      onClick={() => onOpen(item)}
      _hover={{ borderColor: overdue ? "#F87171" : "#FFCB82", shadow: "sm" }}
    >
      <Box display="flex" alignItems="flex-start" gap={3}>
        <Box
          bg={overdue ? "#FEE2E2" : item.is_read ? "#F3F4F6" : "#FFF7E8"}
          color={overdue ? "#DC2626" : item.is_read ? "#6B7280" : "#85652D"}
          borderRadius="lg"
          p={2}
          flexShrink={0}
        >
          <Bell size={18} />
        </Box>
        <Box flex="1" minW={0}>
          <Box display="flex" alignItems="center" gap={2} mb={1} flexWrap="wrap">
            <Badge
              colorScheme={overdue ? "red" : getNotificationColorScheme(item.type)}
              borderRadius="md"
              fontSize="0.65rem"
            >
              {overdue ? "Overdue" : getNotificationLabel(item.type)}
            </Badge>
            {!item.is_read && (
              <Badge colorScheme="red" borderRadius="md" fontSize="0.65rem">
                New
              </Badge>
            )}
            <Text fontSize="xs" color="gray.500" ml="auto">
              {moment(item.createdAt).format("DD MMM YYYY, hh:mm A")}
            </Text>
          </Box>
          <Text
            fontWeight="semibold"
            mb={1}
            noOfLines={2}
            color={overdue ? "#991B1B" : undefined}
          >
            {item.title}
          </Text>
          <Text
            fontSize="sm"
            color={overdue ? "#B91C1C" : "gray.600"}
            noOfLines={4}
          >
            {item.message}
          </Text>
          {item.metadata?.due_date && (
            <Text
              fontSize="xs"
              color={overdue ? "#DC2626" : "#C05621"}
              mt={2}
              fontWeight={overdue ? "bold" : "normal"}
            >
              Due date: {moment(item.metadata.due_date).format("DD MMM YYYY")}
              {overdue ? ` · ${getOverdueMessage(item.metadata.due_date)}` : ""}
            </Text>
          )}
          {actionHint && (
            <Text fontSize="xs" color="blue.500" mt={2}>
              {actionHint}
            </Text>
          )}
        </Box>
      </Box>
    </Box>
  );
}

function NotificationsPage() {
  const authToken = Cookies.get("authToken");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const canView = isInstitutionAdmin();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [fetchStatus, setFetchStatus] = useState("idle");
  const [markingAll, setMarkingAll] = useState(false);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    read_filter: "all",
    type: "all",
    date: "",
  });
  const [reportDate, setReportDate] = useState(moment().format("YYYY-MM-DD"));
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalDocs: 0,
    hasPrevPage: false,
    hasNextPage: false,
    prevPage: null,
    nextPage: null,
    pagingCounter: 1,
  });
  const [feeDueReport, setFeeDueReport] = useState(null);
  const [feeReportStatus, setFeeReportStatus] = useState("idle");

  const loadFeeDueReport = useCallback(async () => {
    if (!authToken || !canView) return;

    setFeeReportStatus("loading");
    try {
      const response = await axios.get(`${BASE_URL}/notifications/fee-due-report`, {
        headers: { Authorization: `Bearer ${authToken}` },
        params: { date: reportDate },
      });
      setFeeDueReport(response.data);
      setFeeReportStatus("success");
    } catch {
      setFeeDueReport(null);
      setFeeReportStatus("failed");
    }
  }, [authToken, canView, reportDate]);

  // Backend pagination via GET /notifications?page=&limit=
  const loadNotifications = useCallback(async () => {
    if (!authToken || !canView) return;

    setFetchStatus("loading");
    try {
      const params = {
        page: filters.page,
        limit: filters.limit,
      };
      if (filters.read_filter === "unread") params.unread_only = "true";
      if (filters.read_filter === "read") params.read_only = "true";
      if (filters.type !== "all") params.type = filters.type;
      if (filters.date) params.date = filters.date;

      const response = await axios.get(`${BASE_URL}/notifications`, {
        headers: { Authorization: `Bearer ${authToken}` },
        params,
      });
      const data = response.data;

      setNotifications(data.docs || []);
      setUnreadCount(
        typeof data.unreadCount === "number"
          ? data.unreadCount
          : (data.docs || []).filter((n) => !n.is_read).length
      );
      setPagination({
        totalDocs: data.totalDocs || 0,
        limit: data.limit || filters.limit,
        totalPages: data.totalPages || 1,
        page: data.page || filters.page,
        pagingCounter: data.pagingCounter || 1,
        hasPrevPage: Boolean(data.hasPrevPage),
        hasNextPage: Boolean(data.hasNextPage),
        prevPage: data.prevPage ?? null,
        nextPage: data.nextPage ?? null,
      });
      setFetchStatus("success");
    } catch {
      setFetchStatus("failed");
      setNotifications([]);
    }
  }, [authToken, canView, filters]);

  useEffect(() => {
    loadNotifications();
    loadFeeDueReport();
  }, [loadNotifications, loadFeeDueReport]);

  const handleOpen = async (notification) => {
    if (!notification.is_read) {
      await dispatch(markNotificationRead({ authToken, id: notification._id }));
      // Keep bell badge in sync (small page) without affecting this page's local list
      dispatch(
        fetchNotifications({ authToken, page: 1, limit: 8, read_filter: "all" })
      );
      await loadNotifications();
    }
    navigateForNotification(notification, navigate);
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await dispatch(markAllNotificationsRead({ authToken })).unwrap();
      dispatch(
        fetchNotifications({ authToken, page: 1, limit: 8, read_filter: "all" })
      );
      await loadNotifications();
    } finally {
      setMarkingAll(false);
    }
  };

  const handlePageChange = (page) => {
    if (!page || page === filters.page) return;
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleLimitChange = (limit) => {
    setFilters((prev) => ({ ...prev, limit: Number(limit) || 10, page: 1 }));
  };

  const renderPageButtons = () => {
    const { totalPages, page } = pagination;
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
          {Array.from({ length: 5 }, (_, i) => totalPages - 4 + i).map((item) => (
            <Button
              key={item}
              onClick={() => handlePageChange(item)}
              isDisabled={page === item}
              borderRadius="xl"
            >
              {item}
            </Button>
          ))}
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

  const loading = fetchStatus === "loading" && notifications.length === 0;
  const { page, limit, totalDocs, totalPages, hasPrevPage, hasNextPage, prevPage, nextPage } =
    pagination;

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="Daily fee due report, overdue alerts, complaints, and system updates."
      >
        <FilterStack className="filter-stack--actions">
          <Button
            leftIcon={<CheckCheck size={16} />}
            size="md"
            borderRadius="xl"
            variant="outline"
            isDisabled={unreadCount === 0}
            isLoading={markingAll}
            onClick={handleMarkAllRead}
          >
            Mark all read
          </Button>
        </FilterStack>
      </PageHeader>

      <FeeDueReportPanel
        report={feeDueReport}
        loading={feeReportStatus === "loading"}
        reportDate={reportDate}
        onReportDateChange={setReportDate}
        onRefresh={loadFeeDueReport}
      />

      <Text fontSize="md" fontWeight="semibold" color="#2D3748" mb={3}>
        Notification Inbox
      </Text>

      <FilterStack className="filter-stack--panel filter-stack--table">
        <FormControl className="responsive-input" w={{ base: "full", md: "12rem" }}>
          <Select
            size="lg"
            borderRadius="xl"
            value={filters.read_filter}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                read_filter: e.target.value,
                page: 1,
              }))
            }
          >
            <option value="all">All notifications</option>
            <option value="unread">Unread only</option>
            <option value="read">Read only</option>
          </Select>
        </FormControl>
        <FormControl className="responsive-input" w={{ base: "full", md: "12rem" }}>
          <Select
            size="lg"
            borderRadius="xl"
            value={filters.type}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                type: e.target.value,
                page: 1,
              }))
            }
          >
            {NOTIFICATION_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormControl>
        <FormControl className="responsive-input" w={{ base: "full", md: "12rem" }}>
          <Input
            type="date"
            size="lg"
            borderRadius="xl"
            bg="#FAFBFC"
            value={filters.date}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                date: e.target.value,
                page: 1,
              }))
            }
            placeholder="Notification date"
          />
        </FormControl>
        {(filters.read_filter !== "all" ||
          filters.type !== "all" ||
          filters.date) && (
          <Button
            leftIcon={<FilterX size={16} />}
            size="md"
            borderRadius="xl"
            variant="outline"
            onClick={() =>
              setFilters({
                page: 1,
                limit: filters.limit,
                read_filter: "all",
                type: "all",
                date: "",
              })
            }
          >
            Clear filters
          </Button>
        )}
      </FilterStack>

      <Box mt={4}>
        {unreadCount > 0 && (
          <Text fontSize="sm" color="gray.600" mb={3}>
            {unreadCount} unread notification{unreadCount === 1 ? "" : "s"}
          </Text>
        )}

        {loading ? (
          <VStack spacing={3} align="stretch">
            {[1, 2, 3].map((key) => (
              <Box
                key={key}
                borderWidth="1px"
                borderColor="#E0E8EC"
                borderRadius="xl"
                bg="white"
                p={4}
              >
                <div className="h-4 w-28 dash-skeleton rounded-md mb-3" />
                <div className="h-5 w-2/3 dash-skeleton rounded-md mb-2" />
                <div className="h-4 w-full dash-skeleton rounded-md mb-1" />
                <div className="h-4 w-5/6 dash-skeleton rounded-md" />
              </Box>
            ))}
          </VStack>
        ) : notifications.length === 0 ? (
          <Box
            borderWidth="1px"
            borderColor="#E0E8EC"
            borderRadius="xl"
            bg="white"
            py={12}
            textAlign="center"
          >
            <FileX size={40} color="#9CA3AF" style={{ margin: "0 auto 12px" }} />
            <Text fontWeight="semibold" color="gray.700">
              No notifications found
            </Text>
            <Text fontSize="sm" color="gray.500" mt={1}>
              Alerts for fee installments and complaints will appear here.
            </Text>
          </Box>
        ) : (
          <VStack spacing={3} align="stretch">
            {notifications.map((item) => (
              <NotificationCard key={item._id} item={item} onOpen={handleOpen} />
            ))}
          </VStack>
        )}
      </Box>

      {fetchStatus !== "loading" && totalDocs > 0 && (
        <div className="flex flex-wrap justify-between items-center gap-4 my-5 px-2 sm:px-4 lg:px-8 w-full max-w-full overflow-x-auto">
          <div className="flex items-center gap-4">
            <p className="text-md">
              {`${page * limit - limit + 1} - ${
                page * limit > totalDocs ? totalDocs : page * limit
              } of ${totalDocs} records`}
            </p>
            <Select
              value={filters.limit}
              onChange={(e) => handleLimitChange(e.target.value)}
              w="24"
              borderRadius="xl"
              backgroundColor="white"
              cursor="pointer"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
            </Select>
          </div>
          <ButtonGroup size="md" isAttached variant="outline" backgroundColor="white">
            <Button
              onClick={() => handlePageChange(1)}
              isDisabled={!hasPrevPage}
              borderRadius="xl"
            >
              <ChevronFirst />
            </Button>
            <Button
              onClick={() => handlePageChange(prevPage)}
              isDisabled={!hasPrevPage}
              borderRadius="xl"
            >
              <ChevronLeft />
            </Button>
            {renderPageButtons()}
            <Button
              onClick={() => handlePageChange(nextPage)}
              isDisabled={!hasNextPage}
              borderRadius="xl"
            >
              <ChevronRight />
            </Button>
            <Button
              onClick={() => handlePageChange(totalPages)}
              isDisabled={!hasNextPage}
              borderRadius="xl"
            >
              <ChevronLast />
            </Button>
          </ButtonGroup>
        </div>
      )}
    </>
  );
}

export default NotificationsPage;
