// Sidebar.jsx
import React from "react";
import {
  Box,
  Flex,
  Text,
  CloseButton,
  Icon,
  useColorModeValue,
} from "@chakra-ui/react";
import {
  FiHome,
  FiTrendingUp,
  FiCompass,
  FiStar,
  FiSettings,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import { routes } from "../routes";
import { getVisibleRoutes } from "../utlls/studentAccess";
import { Image } from "@chakra-ui/react";
// const LinkItems = [
//   { name: 'Home', icon: FiHome },
// ];
export default function Sidebar({ onClose, ...rest }) {
  const visibleRoutes = getVisibleRoutes(routes);

  return (
    <Box
      transition="3s ease"
      bg={useColorModeValue("#222222", "gray.900")}
      borderRight="1px"
      borderRightColor={useColorModeValue("#E0E0E0", "gray.700")}
      w={{ base: "full", md: 60 }}
      pos="fixed"
      h="full"
      {...rest}
    >
      <Flex alignItems="center" mx={{ base: 4, md: 8 }} my={0} justifyContent="space-between">
        <Box boxSize="sm" h={{ base: 20, md: 32 }} className="flex justify-center items-center">
          <Image src="./logo_dark.svg" alt="LCA Logo" className="w-28 sm:w-40 mx-auto" />
        </Box>
        <CloseButton display={{ base: "flex", md: "none" }} onClick={onClose} />
      </Flex>
      <div className="flex flex-col gap-2">
      {visibleRoutes.map((link) => (
        <NavItem key={link.name} icon={link.icon} to={link.path}>
          {link.name}
        </NavItem>
      ))}
      </div>
    </Box>
  );
}

const NavItem = ({ icon, children, to, ...rest }) => {
  return (
    <Link
      to={to}
      style={{ textDecoration: "none" }}
      _focus={{ boxShadow: "none" }}
    >
      <Flex
        align="center"
        px="4"
        py="2"
        mx="4"
        borderRadius="xl"
        role="group"
        cursor="pointer"
        _hover={{
          bg: to !== window.location.pathname ? "#2C2C2C" : "",
          color: to !== window.location.pathname ? "white" : "",
        }}
        bg={to === window.location.pathname ? "#FFCB82" : ""}
        color={to === window.location.pathname ? "#222222" : "#D0D0D0"}
        fontWeight={to === window.location.pathname ? "semibold" : "normal"}
        {...rest}
      >
        {icon && (
          <Icon
            mr="5"
            fontSize="20"
            _groupHover={{
              color: to !== window.location.pathname ? "white" : "",
            }}
            as={icon}
          />
        )}
        {children}
      </Flex>
    </Link>
  );
};
