import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  Badge,
  Box,
  Button,
  HStack,
  Text,
  VStack,
  createStandaloneToast,
} from "@chakra-ui/react";
import { Link2, PlugZap, RefreshCw, Unplug } from "lucide-react";
import { config } from "../utlls/config";
import { getAuthToken } from "../utlls/authSession";

const { toast } = createStandaloneToast();
const BASE_URL = config.BASE_URL;

const authHeaders = (authToken) => ({
  Authorization: `Bearer ${authToken}`,
});

function GoogleAccountCard({ onStatusChange }) {
  const authToken = getAuthToken();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState("");

  const connected = Boolean(status?.connected);

  const loadStatus = useCallback(async () => {
    if (!authToken) return;
    setLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/google/status`, {
        headers: authHeaders(authToken),
      });
      setStatus(response.data);
      onStatusChange?.(response.data);
    } catch (error) {
      toast({
        title: "Unable to load Google status",
        description: error.response?.data?.message || error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [authToken, onStatusChange]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const connectGoogle = async () => {
    setWorking("connect");
    try {
      const response = await axios.get(`${BASE_URL}/google/connect-url`, {
        headers: authHeaders(authToken),
      });
      window.location.assign(response.data.url);
    } catch (error) {
      toast({
        title: "Google connection is not ready",
        description: error.response?.data?.message || error.message,
        status: "error",
        duration: 7000,
        isClosable: true,
      });
      setWorking("");
    }
  };

  const disconnectGoogle = async () => {
    setWorking("disconnect");
    try {
      await axios.delete(`${BASE_URL}/google/disconnect`, {
        headers: authHeaders(authToken),
      });
      await loadStatus();
      toast({
        title: "Google account disconnected",
        status: "success",
        duration: 4000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Unable to disconnect Google",
        description: error.response?.data?.message || error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setWorking("");
    }
  };

  return (
    <Box borderWidth="1px" borderColor="#E0E8EC" borderRadius="xl" bg="white" p={5}>
      <HStack align="flex-start" justify="space-between" gap={4} mb={4}>
        <HStack align="flex-start" spacing={3}>
          <Box bg="#FFF7E8" color="#85652D" borderRadius="lg" p={2} flexShrink={0}>
            <PlugZap size={20} />
          </Box>
          <Box>
            <Text fontWeight="semibold" color="#2D3748">
              Google Account
            </Text>
            <Text fontSize="sm" color="gray.600" mt={1}>
              Connect the account used for Classroom courses, Calendar events, and Meet links.
            </Text>
          </Box>
        </HStack>
        <Button
          aria-label="Refresh Google connection"
          leftIcon={<RefreshCw size={16} />}
          variant="outline"
          borderRadius="xl"
          size="sm"
          isLoading={loading}
          onClick={loadStatus}
        >
          Refresh
        </Button>
      </HStack>

      <VStack align="stretch" spacing={4}>
        <HStack spacing={3} flexWrap="wrap">
          <Badge colorScheme={status?.configured ? "green" : "red"} borderRadius="md">
            {status?.configured ? "Configured" : "Missing env"}
          </Badge>
          <Badge colorScheme={connected ? "green" : "gray"} borderRadius="md">
            {connected ? "Connected" : "Not connected"}
          </Badge>
        </HStack>

        {connected ? (
          <Box fontSize="sm" color="gray.600">
            Connected as{" "}
            <Text as="span" fontWeight="semibold" color="#2D3748">
              {status.account?.email || status.account?.name || "Google account"}
            </Text>
            {status.account?.updatedAt && (
              <Text mt={1}>
                Last updated {new Date(status.account.updatedAt).toLocaleString()}
              </Text>
            )}
          </Box>
        ) : (
          <Text fontSize="sm" color="gray.600">
            No Google account is connected for this portal user yet.
          </Text>
        )}

        <HStack spacing={3} flexWrap="wrap">
          <Button
            leftIcon={<Link2 size={16} />}
            bg="#FFCB82"
            color="#222222"
            borderRadius="xl"
            isLoading={working === "connect"}
            onClick={connectGoogle}
          >
            {connected ? "Reconnect Google" : "Connect Google"}
          </Button>
          {connected && (
            <Button
              leftIcon={<Unplug size={16} />}
              variant="outline"
              borderRadius="xl"
              isLoading={working === "disconnect"}
              onClick={disconnectGoogle}
            >
              Disconnect
            </Button>
          )}
        </HStack>
      </VStack>
    </Box>
  );
}

export default GoogleAccountCard;
