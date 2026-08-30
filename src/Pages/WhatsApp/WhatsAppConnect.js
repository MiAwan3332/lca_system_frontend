import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Cookies from "js-cookie";
import axios from "axios";
import {
  Badge,
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
  Image,
  Input,
  Spinner,
  Text,
  VStack,
  useToast,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import {
  Link2,
  LogOut,
  Phone,
  Power,
  PowerOff,
  QrCode,
  RefreshCw,
  Trash2,
} from "lucide-react";
import PageHeader, { DataTableShell } from "../../Components/PageHeader";
import { config } from "../../utlls/config";

const STATUS_COLOR = {
  ready: "green",
  qr_ready: "orange",
  authenticating: "yellow",
  initializing: "blue",
  created: "gray",
  disconnected: "red",
  failed: "red",
  action_required: "purple",
};

const normalizeSessions = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.sessions)) return payload.sessions;
  return [];
};

const getSessionId = (session) => session?.id || session?._id || "";

function WhatsAppConnect() {
  const authToken = Cookies.get("authToken");
  const toast = useToast();
  const pollRef = useRef(null);

  const [gatewayConfig, setGatewayConfig] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [sessionName, setSessionName] = useState("lca-portal");
  const [qrCode, setQrCode] = useState("");
  const [pairingPhone, setPairingPhone] = useState("");
  const [pairingCode, setPairingCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState("");

  const headers = useMemo(
    () => ({ Authorization: `Bearer ${authToken}` }),
    [authToken]
  );

  const selectedSession = useMemo(
    () => sessions.find((s) => getSessionId(s) === selectedId) || null,
    [sessions, selectedId]
  );

  const statusLabel = String(selectedSession?.status || "unknown").toLowerCase();
  const isReady = statusLabel === "ready";

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const fetchQr = useCallback(
    async (sessionId) => {
      if (!sessionId) return;
      try {
        const { data } = await axios.get(
          `${config.BASE_URL}/whatsapp/sessions/${sessionId}/qr`,
          { headers }
        );
        const code = data?.qrCode || data?.qr_code || "";
        if (code) setQrCode(code);
      } catch {
        // QR only exists while linking — ignore 400 once authenticated
      }
    },
    [headers]
  );

  const refreshSessions = useCallback(async () => {
    const [{ data: cfg }, { data: listPayload }] = await Promise.all([
      axios.get(`${config.BASE_URL}/whatsapp/config`, { headers }),
      axios.get(`${config.BASE_URL}/whatsapp/sessions`, { headers }),
    ]);

    setGatewayConfig(cfg);
    if (cfg?.default_session_name) {
      setSessionName((prev) => prev || cfg.default_session_name);
    }

    const list = normalizeSessions(listPayload);
    setSessions(list);

    setSelectedId((prev) => {
      if (prev && list.some((s) => getSessionId(s) === prev)) return prev;
      const preferred =
        list.find((s) => s.name === (cfg?.default_session_name || "lca-portal")) ||
        list[0];
      return preferred ? getSessionId(preferred) : "";
    });

    return list;
  }, [headers]);

  const refreshSelected = useCallback(async () => {
    if (!selectedId) return null;
    const { data } = await axios.get(
      `${config.BASE_URL}/whatsapp/sessions/${selectedId}`,
      { headers }
    );
    setSessions((prev) => {
      const id = getSessionId(data);
      const others = prev.filter((s) => getSessionId(s) !== id);
      return [data, ...others];
    });
    const status = String(data?.status || "").toLowerCase();
    if (status === "qr_ready" || status === "initializing") {
      await fetchQr(selectedId);
    }
    if (status === "ready") {
      setQrCode("");
      setPairingCode("");
    }
    return data;
  }, [selectedId, headers, fetchQr]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await refreshSessions();
      } catch (error) {
        if (!cancelled) {
          toast({
            title: "Could not load WhatsApp gateway",
            description:
              error?.response?.data?.message ||
              error.message ||
              "Check OpenWA env settings and restart the backend.",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      stopPolling();
    };
  }, [refreshSessions, toast]);

  useEffect(() => {
    stopPolling();
    if (!selectedId || isReady) return undefined;

    pollRef.current = setInterval(() => {
      refreshSelected().catch(() => {});
    }, 4000);

    return stopPolling;
  }, [selectedId, isReady, refreshSelected]);

  const runAction = async (actionKey, fn, successTitle) => {
    setBusyAction(actionKey);
    try {
      await fn();
      if (successTitle) {
        toast({
          title: successTitle,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: "WhatsApp action failed",
        description:
          error?.response?.data?.message || error.message || "Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setBusyAction("");
    }
  };

  const handleConnect = () =>
    runAction(
      "connect",
      async () => {
        const { data } = await axios.post(
          `${config.BASE_URL}/whatsapp/connect`,
          { name: sessionName },
          { headers }
        );
        const session = data?.session;
        const id = getSessionId(session);
        if (session) {
          setSessions((prev) => {
            const others = prev.filter((s) => getSessionId(s) !== id);
            return [session, ...others];
          });
          setSelectedId(id);
        }
        const code = data?.qr?.qrCode || data?.qr?.qr_code || "";
        setQrCode(code || "");
        if (!code && id) await fetchQr(id);
        await refreshSessions();
      },
      "Session started — scan the QR if shown"
    );

  const handleStart = () =>
    runAction(
      "start",
      async () => {
        await axios.post(
          `${config.BASE_URL}/whatsapp/sessions/${selectedId}/start`,
          {},
          { headers }
        );
        await refreshSelected();
        await fetchQr(selectedId);
      },
      "Session start requested"
    );

  const handleStop = () =>
    runAction(
      "stop",
      async () => {
        await axios.post(
          `${config.BASE_URL}/whatsapp/sessions/${selectedId}/stop`,
          {},
          { headers }
        );
        setQrCode("");
        await refreshSelected();
      },
      "Session stopped"
    );

  const handleLogout = () =>
    runAction(
      "logout",
      async () => {
        await axios.post(
          `${config.BASE_URL}/whatsapp/sessions/${selectedId}/logout`,
          {},
          { headers }
        );
        setQrCode("");
        setPairingCode("");
        await refreshSessions();
      },
      "Logged out — scan a new QR to reconnect"
    );

  const handleDelete = () =>
    runAction(
      "delete",
      async () => {
        await axios.delete(
          `${config.BASE_URL}/whatsapp/sessions/${selectedId}`,
          { headers }
        );
        setQrCode("");
        setPairingCode("");
        setSelectedId("");
        await refreshSessions();
      },
      "Session deleted"
    );

  const handlePairingCode = () =>
    runAction(
      "pair",
      async () => {
        const { data } = await axios.post(
          `${config.BASE_URL}/whatsapp/sessions/${selectedId}/pairing-code`,
          { phoneNumber: pairingPhone },
          { headers }
        );
        setPairingCode(data?.code || data?.pairingCode || data?.pairing_code || "");
        await refreshSelected();
      },
      "Pairing code ready"
    );

  if (loading) {
    return (
      <Box py={16} textAlign="center">
        <Spinner size="lg" color="#85652D" />
        <Text mt={3} className="dash-text-muted">
          Loading WhatsApp gateway…
        </Text>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="WhatsApp Connect"
        subtitle="Link LCA Portal to WhatsApp via your self-hosted OpenWA gateway."
      >
        <Button
          leftIcon={<RefreshCw size={16} />}
          variant="outline"
          onClick={() =>
            runAction("refresh", async () => {
              await refreshSessions();
              if (selectedId) await refreshSelected();
            })
          }
          isLoading={busyAction === "refresh"}
        >
          Refresh
        </Button>
      </PageHeader>

      <DataTableShell>
        <VStack align="stretch" spacing={5} p={{ base: 3, md: 5 }}>
          <HStack justify="space-between" flexWrap="wrap" gap={3}>
            <Box>
              <Text fontSize="sm" className="dash-text-muted">
                Gateway
              </Text>
              <Text fontWeight="semibold" className="dash-text">
                {gatewayConfig?.base_url || "Not configured"}
              </Text>
            </Box>
            <Badge
              colorScheme={gatewayConfig?.configured ? "green" : "red"}
              fontSize="0.8rem"
              px={3}
              py={1}
              borderRadius="md"
            >
              {gatewayConfig?.configured ? "API key loaded" : "Missing env"}
            </Badge>
          </HStack>

          {!gatewayConfig?.configured ? (
            <Box
              borderWidth="1px"
              borderColor="red.200"
              bg="red.50"
              borderRadius="lg"
              p={4}
            >
              <Text fontWeight="semibold" color="red.700">
                OpenWA env not set
              </Text>
              <Text fontSize="sm" color="red.600" mt={1}>
                Add OPENWA_BASE_URL and OPENWA_API_KEY to the backend .env, then
                restart the API server.
              </Text>
            </Box>
          ) : null}

          <HStack align="end" flexWrap="wrap" gap={3}>
            <FormControl maxW="280px">
              <FormLabel fontSize="sm">Session name</FormLabel>
              <Input
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="lca-portal"
              />
            </FormControl>
            <Button
              leftIcon={<Link2 size={16} />}
              colorScheme="yellow"
              bg="#85652D"
              _hover={{ bg: "#6f5324" }}
              color="white"
              onClick={handleConnect}
              isLoading={busyAction === "connect"}
              isDisabled={!gatewayConfig?.configured}
            >
              Connect / Show QR
            </Button>
          </HStack>

          {sessions.length > 0 ? (
            <Box>
              <Text fontSize="sm" mb={2} className="dash-text-muted">
                Sessions
              </Text>
              <Wrap>
                {sessions.map((session) => {
                  const id = getSessionId(session);
                  const active = id === selectedId;
                  const st = String(session.status || "").toLowerCase();
                  return (
                    <WrapItem key={id}>
                      <Button
                        size="sm"
                        variant={active ? "solid" : "outline"}
                        colorScheme={active ? "yellow" : "gray"}
                        onClick={() => {
                          setSelectedId(id);
                          setQrCode("");
                          setPairingCode("");
                          fetchQr(id);
                        }}
                      >
                        {session.name || id.slice(0, 8)}
                        <Badge ml={2} colorScheme={STATUS_COLOR[st] || "gray"}>
                          {st || "—"}
                        </Badge>
                      </Button>
                    </WrapItem>
                  );
                })}
              </Wrap>
            </Box>
          ) : (
            <Text fontSize="sm" className="dash-text-muted">
              No sessions yet. Click Connect to create and start one.
            </Text>
          )}

          {selectedSession ? (
            <Box
              borderWidth="1px"
              borderColor="#E0E8EC"
              borderRadius="xl"
              bg="white"
              p={{ base: 4, md: 5 }}
            >
              <HStack justify="space-between" flexWrap="wrap" gap={3} mb={4}>
                <Box>
                  <Text fontWeight="bold" fontSize="lg" className="dash-text">
                    {selectedSession.name}
                  </Text>
                  <Text fontSize="xs" className="dash-text-muted">
                    ID: {getSessionId(selectedSession)}
                  </Text>
                </Box>
                <Badge
                  colorScheme={STATUS_COLOR[statusLabel] || "gray"}
                  fontSize="0.85rem"
                  px={3}
                  py={1}
                >
                  {statusLabel}
                </Badge>
              </HStack>

              <Wrap mb={4}>
                <WrapItem>
                  <Button
                    leftIcon={<Power size={16} />}
                    size="sm"
                    onClick={handleStart}
                    isLoading={busyAction === "start"}
                    isDisabled={isReady}
                  >
                    Start
                  </Button>
                </WrapItem>
                <WrapItem>
                  <Button
                    leftIcon={<PowerOff size={16} />}
                    size="sm"
                    variant="outline"
                    onClick={handleStop}
                    isLoading={busyAction === "stop"}
                  >
                    Stop
                  </Button>
                </WrapItem>
                <WrapItem>
                  <Button
                    leftIcon={<QrCode size={16} />}
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      runAction("qr", async () => {
                        await fetchQr(selectedId);
                      })
                    }
                    isLoading={busyAction === "qr"}
                    isDisabled={isReady}
                  >
                    Refresh QR
                  </Button>
                </WrapItem>
                <WrapItem>
                  <Button
                    leftIcon={<LogOut size={16} />}
                    size="sm"
                    colorScheme="orange"
                    variant="outline"
                    onClick={handleLogout}
                    isLoading={busyAction === "logout"}
                  >
                    Logout device
                  </Button>
                </WrapItem>
                <WrapItem>
                  <Button
                    leftIcon={<Trash2 size={16} />}
                    size="sm"
                    colorScheme="red"
                    variant="outline"
                    onClick={handleDelete}
                    isLoading={busyAction === "delete"}
                  >
                    Delete session
                  </Button>
                </WrapItem>
              </Wrap>

              {isReady ? (
                <Box
                  borderRadius="lg"
                  bg="green.50"
                  borderWidth="1px"
                  borderColor="green.200"
                  p={4}
                >
                  <Text fontWeight="semibold" color="green.700">
                    WhatsApp is connected
                  </Text>
                  <Text fontSize="sm" color="green.600" mt={1}>
                    Session is ready. You can send messages through OpenWA.
                  </Text>
                </Box>
              ) : (
                <HStack
                  align="start"
                  spacing={6}
                  flexDir={{ base: "column", md: "row" }}
                >
                  <Box flex="1" textAlign="center">
                    <Text fontWeight="semibold" mb={2} className="dash-text">
                      Scan QR in WhatsApp
                    </Text>
                    <Text fontSize="sm" mb={3} className="dash-text-muted">
                      WhatsApp → Linked devices → Link a device
                    </Text>
                    {qrCode ? (
                      <Image
                        src={qrCode}
                        alt="WhatsApp QR"
                        mx="auto"
                        maxW="240px"
                        borderRadius="md"
                        borderWidth="1px"
                        borderColor="#E0E8EC"
                        bg="white"
                        p={2}
                      />
                    ) : (
                      <Box
                        h="240px"
                        maxW="240px"
                        mx="auto"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        borderWidth="1px"
                        borderStyle="dashed"
                        borderColor="#D1D5DB"
                        borderRadius="md"
                        bg="#F9FAFB"
                      >
                        <Text fontSize="sm" className="dash-text-muted" px={4}>
                          QR appears after Start / Connect. Refresh if it
                          expires.
                        </Text>
                      </Box>
                    )}
                  </Box>

                  <Box flex="1">
                    <Text fontWeight="semibold" mb={2} className="dash-text">
                      Or link with phone number
                    </Text>
                    <Text fontSize="sm" mb={3} className="dash-text-muted">
                      Digits only, international format (e.g. 923001234567)
                    </Text>
                    <HStack>
                      <Input
                        value={pairingPhone}
                        onChange={(e) => setPairingPhone(e.target.value)}
                        placeholder="923001234567"
                      />
                      <Button
                        leftIcon={<Phone size={16} />}
                        onClick={handlePairingCode}
                        isLoading={busyAction === "pair"}
                        isDisabled={!pairingPhone.trim()}
                      >
                        Get code
                      </Button>
                    </HStack>
                    {pairingCode ? (
                      <Box
                        mt={4}
                        p={4}
                        borderRadius="lg"
                        bg="#FFF7E8"
                        borderWidth="1px"
                        borderColor="#FFCB82"
                        textAlign="center"
                      >
                        <Text fontSize="sm" className="dash-text-muted">
                          Enter this code in WhatsApp
                        </Text>
                        <Text
                          fontSize="2xl"
                          fontWeight="bold"
                          letterSpacing="0.2em"
                          mt={1}
                          className="dash-text"
                        >
                          {pairingCode}
                        </Text>
                      </Box>
                    ) : null}
                  </Box>
                </HStack>
              )}
            </Box>
          ) : null}

          <Text fontSize="xs" className="dash-text-muted">
            Powered by OpenWA (
            <a
              href="https://docs.open-wa.org/api-reference"
              target="_blank"
              rel="noreferrer"
              style={{ textDecoration: "underline" }}
            >
              API reference
            </a>
            ). API key is stored only in backend environment variables.
          </Text>
        </VStack>
      </DataTableShell>
    </Box>
  );
}

export default WhatsAppConnect;
