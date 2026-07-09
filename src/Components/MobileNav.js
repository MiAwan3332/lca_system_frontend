// MobileNav.jsx
import React from "react";
import {
  Flex,
  Text,
  IconButton,
  HStack,
  Box,
  MenuDivider,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { FiMenu } from "react-icons/fi";
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Avatar,
  VStack,
} from "@chakra-ui/react";
import { useSelector } from "react-redux";
import { selectUser } from "../Features/authSlice.js";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setUser } from "../Features/authSlice.js";
import { clearAuthSession } from "../utlls/authSession";
import ChangeAvatarModal from "./Modals/User/ChangeAvatarModal";
import NotificationBell from "./NotificationBell";
import GlobalSearch from "./Dashboard/GlobalSearch";
import { ChevronDown, Info } from "lucide-react";
import { isStudentViewOnly } from "../utlls/studentAccess";
import { getMediaUrl } from "../utlls/useful.js";

export default function MobileNav({ onOpen, ...rest }) {
  const viewOnly = isStudentViewOnly();
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();

  const handleLogout = () => {
    clearAuthSession();
    dispatch(setUser(null));

    toast({
      title: "Logged out",
      status: "success",
      duration: 3000,
      isClosable: true,
    });

    navigate("/login");
  };

  return (
    <Flex
      ml={{ base: 0, md: 60 }}
      px={{ base: 3, sm: 4 }}
      minH={{ base: 16, md: 20 }}
      py={2}
      alignItems="center"
      bg={useColorModeValue("transparent", "gray.900")}
      justifyContent="space-between"
      gap={2}
      flexWrap="nowrap"
      maxW="100%"
      {...rest}
    >
      <IconButton
        display={{ base: "flex", md: "none" }}
        onClick={onOpen}
        variant="outline"
        aria-label="open menu"
        icon={<FiMenu />}
        flexShrink={0}
      />

      <Box
        display={{ base: "none", sm: "flex" }}
        className="dash-surface-card text-[var(--dash-muted)] px-3 text-sm py-1 rounded-lg items-center gap-1 min-w-0 flex-1 max-w-md"
      >
        <Info size={16} className="shrink-0" />
        <Text fontSize="sm" noOfLines={1}>
          Welcome to LCA Dashboard
        </Text>
      </Box>

      <HStack spacing={2} ml="auto" flexShrink={0}>
        <Box display={{ base: "none", md: "block" }}>
          <GlobalSearch />
        </Box>
        <NotificationBell />
        <Menu>
          <MenuButton
            h="44px"
            py={0}
            px={{ base: 2, sm: 4 }}
            borderRadius="xl"
            transition="all 0.3s"
            className="dash-surface-card"
            _focus={{ boxShadow: "none" }}
            _hover={{ bg: useColorModeValue("gray.100", "gray.700") }}
            flexShrink={0}
          >
            <HStack spacing={2}>
              <Avatar
                size="sm"
                src={
                  getMediaUrl(user?.avatar) ||
                  "https://images.unsplash.com/photo-1619946794135-5bc917a27793?ixlib=rb-0.3.5&q=80&fm=jpg&crop=faces&fit=crop&h=200&w=200&s=b616b2c5b373a80ffc9636ba24f7a4a9"
                }
              />
              <VStack
                display={{ base: "none", lg: "flex" }}
                alignItems="flex-start"
                spacing="1px"
                ml="1"
                className="font-medium"
              >
                <Text fontSize="sm" noOfLines={1} maxW="120px">
                  {user?.name}
                </Text>
                <Text fontSize="xs" color="gray.600" className="uppercase">
                  {user?.role}
                </Text>
              </VStack>
              <Box display={{ base: "none", lg: "flex" }}>
                <ChevronDown />
              </Box>
            </HStack>
          </MenuButton>
          <MenuList
            bg={useColorModeValue("white", "gray.900")}
            borderColor={useColorModeValue("gray.200", "gray.700")}
            className="p-2"
          >
            {!viewOnly && <ChangeAvatarModal user={user} />}
            <MenuDivider />
            <MenuItem
              onClick={handleLogout}
              className="rounded-lg hover:bg-[#FF8A8A] hover:text-[#6D1F1F]"
            >
              Sign out
            </MenuItem>
          </MenuList>
        </Menu>
      </HStack>
    </Flex>
  );
}
