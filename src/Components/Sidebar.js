import React from "react";
import {
  Box,
  Flex,
  CloseButton,
  useColorModeValue,
} from "@chakra-ui/react";
import { Link, useLocation } from "react-router-dom";
import { routes } from "../routes";
import { getVisibleRoutes } from "../utlls/studentAccess";
import { Image } from "@chakra-ui/react";

export default function Sidebar({ onClose, isMobileDrawer = false, ...rest }) {
  const visibleRoutes = getVisibleRoutes(routes);
  const location = useLocation();

  return (
    <Box
      transition="3s ease"
      bg={useColorModeValue("#222222", "gray.900")}
      borderRight="1px"
      borderRightColor={useColorModeValue("#E0E0E0", "gray.700")}
      w={{ base: "full", md: 60 }}
      pos={isMobileDrawer ? "relative" : "fixed"}
      top={isMobileDrawer ? undefined : 0}
      left={isMobileDrawer ? undefined : 0}
      h={isMobileDrawer ? "100%" : "100vh"}
      maxH={isMobileDrawer ? "100dvh" : "100vh"}
      display={isMobileDrawer ? "flex" : { base: "none", md: "flex" }}
      flexDirection="column"
      overflow="hidden"
      zIndex={isMobileDrawer ? undefined : 10}
      {...rest}
    >
      <Flex
        alignItems="center"
        mx={{ base: 4, md: 8 }}
        my={0}
        justifyContent="space-between"
        flexShrink={0}
      >
        <Box boxSize="sm" h={{ base: 20, md: 32 }} className="flex justify-center items-center">
          <Image src="./logo_dark.svg" alt="LCA Logo" className="w-28 sm:w-40 mx-auto" />
        </Box>
        <CloseButton display={{ base: "flex", md: "none" }} onClick={onClose} />
      </Flex>
      <Box
        flex="1 1 auto"
        minH={0}
        overflowY="auto"
        overflowX="hidden"
        pb={4}
        className="sidebar-scroll"
        sx={{ WebkitOverflowScrolling: "touch" }}
      >
        <div className="flex flex-col gap-2">
          {visibleRoutes.map((link) => (
            <NavItem
              key={link.name}
              icon={link.icon}
              to={link.path}
              isActive={location.pathname === link.path}
            >
              {link.name}
            </NavItem>
          ))}
        </div>
      </Box>
    </Box>
  );
}

const NavItem = ({ icon: Icon, children, to, isActive, ...rest }) => {
  return (
    <Link to={to} style={{ textDecoration: "none" }}>
      <Flex
        align="center"
        px="4"
        py="2"
        mx="4"
        borderRadius="xl"
        role="group"
        cursor="pointer"
        _hover={{
          bg: !isActive ? "#2C2C2C" : "",
          color: !isActive ? "white" : "",
        }}
        bg={isActive ? "#FFCB82" : ""}
        color={isActive ? "#222222" : "#D0D0D0"}
        fontWeight={isActive ? "semibold" : "normal"}
        {...rest}
      >
        {Icon && (
          <Box as="span" mr="5" display="inline-flex" flexShrink={0}>
            <Icon size={20} />
          </Box>
        )}
        {children}
      </Flex>
    </Link>
  );
};
