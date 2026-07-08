import React, { useEffect } from "react";
import Cookies from "js-cookie";
import {
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Text,
  Badge,
  Box,
  Button,
} from "@chakra-ui/react";
import { Bell } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../Features/notificationSlice";
import { isInstitutionAdmin } from "../utlls/teacherAccess";
import {
  getNotificationActionHint,
  getNotificationColorScheme,
  getNotificationLabel,
  isNotificationOverdue,
  navigateForNotification,
} from "../utlls/notificationHelpers";
import { getOverdueMessage } from "../utlls/feeDueDate";

function NotificationBell() {
  const authToken = Cookies.get("authToken");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAdmin = isInstitutionAdmin();
  const { notifications, unreadCount } = useSelector((state) => state.notifications);

  useEffect(() => {
    if (authToken) {
      dispatch(fetchNotifications({ authToken, page: 1, limit: 20, read_filter: "all" }));
      const interval = setInterval(() => {
        dispatch(fetchNotifications({ authToken, page: 1, limit: 20, read_filter: "all" }));
      }, 60000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [authToken, dispatch]);

  const handleOpen = () => {
    dispatch(fetchNotifications({ authToken, page: 1, limit: 20, read_filter: "all" }));
  };

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      dispatch(markNotificationRead({ authToken, id: notification._id }));
    }
    navigateForNotification(notification, navigate);
  };

  return (
    <Menu onOpen={handleOpen}>
      <MenuButton
        as={IconButton}
        aria-label="Notifications"
        icon={
          <Box position="relative">
            <Bell size={18} />
            {unreadCount > 0 && (
              <Badge
                position="absolute"
                top="-6px"
                right="-8px"
                colorScheme="red"
                borderRadius="full"
                fontSize="0.6rem"
                px={1}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
          </Box>
        }
        variant="outline"
        size="sm"
        borderRadius="xl"
        flexShrink={0}
      />
      <MenuList maxH="320px" overflowY="auto" minW="300px">
        <Box px={3} py={2} display="flex" justifyContent="space-between" alignItems="center">
          <Text fontWeight="semibold" fontSize="sm">Notifications</Text>
          {unreadCount > 0 && (
            <Text
              fontSize="xs"
              color="blue.500"
              cursor="pointer"
              onClick={() => dispatch(markAllNotificationsRead({ authToken }))}
            >
              Mark all read
            </Text>
          )}
        </Box>
        <MenuDivider />
        {notifications.length === 0 ? (
          <MenuItem isDisabled>No notifications</MenuItem>
        ) : (
          notifications.slice(0, 8).map((n) => {
            const actionHint = getNotificationActionHint(n.type);
            const overdue = isNotificationOverdue(n);
            return (
              <MenuItem
                key={n._id}
                onClick={() => handleNotificationClick(n)}
                bg={overdue ? "red.50" : n.is_read ? undefined : "blue.50"}
              >
                <Box w="full">
                  <Box display="flex" alignItems="center" gap={2} mb={1}>
                    <Badge
                      colorScheme={overdue ? "red" : getNotificationColorScheme(n.type)}
                      fontSize="0.6rem"
                      borderRadius="md"
                    >
                      {overdue ? "Overdue" : getNotificationLabel(n.type)}
                    </Badge>
                    {!n.is_read && (
                      <Badge colorScheme="red" fontSize="0.6rem" borderRadius="md">
                        New
                      </Badge>
                    )}
                  </Box>
                  <Text
                    fontSize="sm"
                    fontWeight={n.is_read ? "normal" : "semibold"}
                    color={overdue ? "red.700" : undefined}
                  >
                    {n.title}
                  </Text>
                  <Text fontSize="xs" color={overdue ? "red.600" : "gray.500"} noOfLines={2}>
                    {n.message}
                  </Text>
                  {overdue && n.metadata?.due_date && (
                    <Text fontSize="xs" color="red.600" mt={1} fontWeight="semibold">
                      {getOverdueMessage(n.metadata.due_date)}
                    </Text>
                  )}
                  {actionHint && (
                    <Text fontSize="xs" color="blue.500" mt={1}>
                      {actionHint}
                    </Text>
                  )}
                </Box>
              </MenuItem>
            );
          })
        )}
        {isAdmin && (
          <>
            <MenuDivider />
            <Box px={3} py={2}>
              <Button
                size="sm"
                width="full"
                variant="outline"
                colorScheme="blue"
                onClick={() => navigate("/notifications")}
              >
                View all notifications
              </Button>
            </Box>
          </>
        )}
      </MenuList>
    </Menu>
  );
}

export default NotificationBell;
