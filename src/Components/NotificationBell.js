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
} from "@chakra-ui/react";
import { Bell } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../Features/notificationSlice";

function NotificationBell() {
  const authToken = Cookies.get("authToken");
  const dispatch = useDispatch();
  const { notifications, unreadCount } = useSelector((state) => state.notifications);

  useEffect(() => {
    if (authToken) {
      dispatch(fetchNotifications({ authToken }));
      const interval = setInterval(() => {
        dispatch(fetchNotifications({ authToken }));
      }, 60000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [authToken, dispatch]);

  const handleOpen = () => {
    dispatch(fetchNotifications({ authToken }));
  };

  const handleRead = (id) => {
    dispatch(markNotificationRead({ authToken, id }));
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
                {unreadCount}
              </Badge>
            )}
          </Box>
        }
        variant="outline"
        size="sm"
        borderRadius="xl"
        flexShrink={0}
      />
      <MenuList maxH="320px" overflowY="auto" minW="280px">
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
          notifications.map((n) => (
            <MenuItem
              key={n._id}
              onClick={() => !n.is_read && handleRead(n._id)}
              bg={n.is_read ? undefined : "blue.50"}
            >
              <Box>
                <Text fontSize="sm" fontWeight={n.is_read ? "normal" : "semibold"}>
                  {n.title}
                </Text>
                <Text fontSize="xs" color="gray.500" noOfLines={2}>
                  {n.message}
                </Text>
              </Box>
            </MenuItem>
          ))
        )}
      </MenuList>
    </Menu>
  );
}

export default NotificationBell;
