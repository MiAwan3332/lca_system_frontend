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
import { FiMenu, FiBell, FiChevronDown } from "react-icons/fi";
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
import { setUser } from "../Features/authSlice.js";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import ChangeAvatarModal from "./Modals/User/ChangeAvatarModal";
import { ChevronDown, Info } from "lucide-react";
import { isStudentViewOnly } from "../utlls/studentAccess";

export default function MobileNav({ onOpen, ...rest }) {
  const viewOnly = isStudentViewOnly();
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();

  const handleLogout = () => {
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("permissions");
    sessionStorage.removeItem("role");
    sessionStorage.removeItem("studentId");
    sessionStorage.removeItem("profileUpdatedOnce");
    sessionStorage.removeItem("skipProfileCompletion");
    Cookies.remove("authToken");
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
      px={{ base: 4, md: 4 }}
      height="20"
      alignItems="center"
      bg={useColorModeValue("transparent", "gray.900")}
      // borderBottomWidth="1px"
      // borderBottomColor={useColorModeValue("gray.200", "gray.700")}
      justifyContent={{ base: "space-between", md: "flex-end" }}
      {...rest}
    >
      <IconButton
        display={{ base: "flex", md: "none" }}
        onClick={onOpen}
        variant="outline"
        aria-label="open menu"
        icon={<FiMenu />}
      />

      <HStack spacing={{ base: "0", md: "6" }} width={"100%"}>
        <Flex width={"100%"} alignItems={"center"} justifyContent={"space-between"}>
          <div className="bg-white border capitalize border-[#E0E8EC] text-[#6E879C] px-3 text-sm py-1 rounded-lg ml-2 flex justify-center items-center gap-1">
            <Info size={16} className="inline-block mr-1" />
            Welcome back to Lahore CSS academy Dashboard
          </div>
          <Menu>
            <MenuButton
              py={2}
              px={4}
              borderRadius={"xl"}
              transition="all 0.3s"
              className="bg-white border border-[#E0E8EC] mr-2"
              _focus={{ boxShadow: "none" }}
              _hover={{ bg: useColorModeValue("gray.100", "gray.700") }}
            >
              <HStack>
                <Avatar
                  size={"sm"}
                  src={
                    user?.avatar ||
                    "https://images.unsplash.com/photo-1619946794135-5bc917a27793?ixlib=rb-0.3.5&q=80&fm=jpg&crop=faces&fit=crop&h=200&w=200&s=b616b2c5b373a80ffc9636ba24f7a4a9"
                  }
                  key={
                    user?.avatar ||
                    "https://images.unsplash.com/photo-1619946794135-5bc917a27793?ixlib=rb-0.3.5&q=80&fm=jpg&crop=faces&fit=crop&h=200&w=200&s=b616b2c5b373a80ffc9636ba24f7a4a9"
                  }
                />
                <VStack
                  display={{ base: "none", md: "flex" }}
                  alignItems="flex-start"
                  spacing="1px"
                  ml="2"
                  className="font-medium"
                >
                  <Text fontSize="sm">{user?.name}</Text>
                  <Text fontSize="xs" color="gray.600" className="uppercase">
                    {user?.role}
                  </Text>
                </VStack>
                <Box display={{ base: "none", md: "flex" }}>
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
              <MenuItem onClick={handleLogout} className="rounded-lg hover:bg-[#FF8A8A] hover:text-[#6D1F1F]">Sign out</MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </HStack>
    </Flex>
  );
}
