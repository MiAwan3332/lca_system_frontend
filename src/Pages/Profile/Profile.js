import React, { useEffect } from "react";
import {
  Avatar,
  Badge,
  Box,
  Divider,
  HStack,
  SimpleGrid,
  Text,
  VStack,
  createStandaloneToast,
} from "@chakra-ui/react";
import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { Mail, Shield, UserRound } from "lucide-react";
import PageHeader from "../../Components/PageHeader";
import GoogleAccountCard from "../../Components/GoogleAccountCard";
import { selectUser } from "../../Features/authSlice";
import { getMediaUrl } from "../../utlls/useful";

const { toast } = createStandaloneToast();

function DetailRow({ icon: Icon, label, value }) {
  return (
    <HStack align="flex-start" spacing={3}>
      <Box color="#85652D" mt={0.5}>
        <Icon size={18} />
      </Box>
      <Box>
        <Text fontSize="xs" color="gray.500" textTransform="uppercase" fontWeight="semibold">
          {label}
        </Text>
        <Text color="#2D3748" fontWeight="medium">
          {value || "Not available"}
        </Text>
      </Box>
    </HStack>
  );
}

function Profile() {
  const user = useSelector(selectUser);
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const googleStatus = params.get("google");
    const reason = params.get("reason");
    if (googleStatus === "connected") {
      toast({
        title: "Google account connected",
        status: "success",
        duration: 4000,
        isClosable: true,
      });
    }
    if (googleStatus === "error") {
      toast({
        title: "Google connection failed",
        description: reason || "Google did not return a successful connection.",
        status: "error",
        duration: 7000,
        isClosable: true,
      });
    }
  }, [location.search]);

  return (
    <>
      <PageHeader
        title="Profile"
        subtitle="Manage your account details and connected services."
      />

      <SimpleGrid columns={{ base: 1, xl: 3 }} spacing={5}>
        <Box borderWidth="1px" borderColor="#E0E8EC" borderRadius="xl" bg="white" p={5}>
          <VStack align="stretch" spacing={5}>
            <HStack spacing={4} align="center">
              <Avatar
                size="lg"
                name={user?.name}
                src={getMediaUrl(user?.avatar)}
              />
              <Box minW={0}>
                <Text fontSize="xl" fontWeight="semibold" color="#2D3748" noOfLines={1}>
                  {user?.name || "LCA Portal User"}
                </Text>
                <Badge colorScheme="yellow" borderRadius="md" mt={2}>
                  {user?.role || "User"}
                </Badge>
              </Box>
            </HStack>

            <Divider />

            <VStack align="stretch" spacing={4}>
              <DetailRow icon={Mail} label="Email" value={user?.email} />
              <DetailRow icon={Shield} label="Role" value={user?.role} />
              <DetailRow icon={UserRound} label="Username" value={user?.username} />
            </VStack>
          </VStack>
        </Box>

        <Box gridColumn={{ base: "auto", xl: "span 2" }}>
          <GoogleAccountCard />
        </Box>
      </SimpleGrid>
    </>
  );
}

export default Profile;
