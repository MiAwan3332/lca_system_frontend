import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Badge,
  Center,
  Flex,
  Spinner,
  Text,
  VStack,
  SimpleGrid,
} from "@chakra-ui/react";
import { CheckCircle2, ShieldAlert, ShieldCheck } from "lucide-react";
import axios from "axios";
import moment from "moment";
import { config } from "../../utlls/config";

const formatRs = (value) =>
  `Rs. ${Number(value || 0).toLocaleString("en-PK", {
    maximumFractionDigits: 0,
  })}`;

function Detail({ label, value }) {
  return (
    <Box
      border="1px solid"
      borderColor="#E8EEF2"
      borderRadius="xl"
      px={4}
      py={3}
      bg="white"
    >
      <Text fontSize="xs" color="gray.500" fontWeight="600" mb={1}>
        {label}
      </Text>
      <Text fontSize="sm" fontWeight="700" color="#2D3748" wordBreak="break-word">
        {value || "—"}
      </Text>
    </Box>
  );
}

function VerifySlip() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await axios.get(
          `${config.BASE_URL}/admission-slips/verify/${encodeURIComponent(
            token || ""
          )}`
        );
        if (!cancelled) setResult(response.data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.response?.data?.message ||
              "Could not verify this slip. Please try again."
          );
          setResult({
            authentic: false,
            status: "fake",
            message: "Verification request failed.",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const authentic = Boolean(result?.authentic);
  const slip = result?.slip || {};

  return (
    <Box
      minH="100dvh"
      bg="linear-gradient(180deg, #FFF8EE 0%, #F7F9FC 45%, #FFFFFF 100%)"
      px={4}
      py={{ base: 8, md: 12 }}
    >
      <Center>
        <Box w="full" maxW="32rem">
          <VStack spacing={2} mb={6} textAlign="center">
            <Text fontSize="sm" fontWeight="700" color="#85652D">
              Lahore CSS Academy
            </Text>
            <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="800" color="#2D3748">
              Admission Slip Verification
            </Text>
            <Text fontSize="sm" color="gray.500">
              Scan result for authenticity check
            </Text>
          </VStack>

          {loading ? (
            <Center py={16}>
              <VStack spacing={3}>
                <Spinner size="lg" color="#85652D" />
                <Text fontSize="sm" color="gray.500">
                  Checking authenticity…
                </Text>
              </VStack>
            </Center>
          ) : (
            <Box
              border="1px solid"
              borderColor={authentic ? "#C6F6D5" : "#FED7D7"}
              borderRadius="2xl"
              bg="white"
              overflow="hidden"
              boxShadow="0 12px 40px rgba(15, 23, 42, 0.08)"
            >
              <Flex
                direction="column"
                align="center"
                gap={2}
                px={5}
                py={6}
                bg={authentic ? "#F0FFF4" : "#FFF5F5"}
                borderBottom="1px solid"
                borderColor={authentic ? "#C6F6D5" : "#FED7D7"}
              >
                {authentic ? (
                  <ShieldCheck size={42} color="#276749" />
                ) : (
                  <ShieldAlert size={42} color="#C53030" />
                )}
                <Badge
                  colorScheme={authentic ? "green" : "red"}
                  borderRadius="full"
                  px={3}
                  py={1}
                  fontSize="sm"
                >
                  {authentic ? "REAL · AUTHENTIC" : "FAKE · NOT FOUND"}
                </Badge>
                <Text
                  fontSize="sm"
                  color={authentic ? "green.700" : "red.600"}
                  textAlign="center"
                  px={2}
                >
                  {result?.message || error}
                </Text>
              </Flex>

              {authentic ? (
                <Box p={5}>
                  <Flex align="center" gap={2} mb={4}>
                    <CheckCircle2 size={16} color="#276749" />
                    <Text fontWeight="700" fontSize="sm" color="#2D3748">
                      Issued slip details
                    </Text>
                  </Flex>
                  <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
                    <Detail label="Student" value={slip.student_name} />
                    <Detail label="Phone" value={slip.phone} />
                    <Detail label="CNIC" value={slip.cnic} />
                    <Detail label="Batch" value={slip.batch_name} />
                    <Detail label="Total fee" value={formatRs(slip.total_fee)} />
                    <Detail
                      label="Amount received"
                      value={formatRs(slip.amount_received)}
                    />
                    <Detail
                      label="Remaining"
                      value={formatRs(slip.remaining_fee)}
                    />
                    <Detail label="Payment method" value={slip.payment_method} />
                    <Detail label="Class time" value={slip.class_time} />
                    <Detail label="Authorized by" value={slip.authorized_by} />
                    <Detail
                      label="Issued at"
                      value={
                        slip.issued_at
                          ? moment(slip.issued_at).format("DD MMM YYYY, hh:mm A")
                          : "—"
                      }
                    />
                  </SimpleGrid>
                </Box>
              ) : (
                <Box p={5}>
                  <Text fontSize="sm" color="gray.600" textAlign="center">
                    Do not accept this slip. Only slips with a valid LCA
                    verification QR are authentic.
                  </Text>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Center>
    </Box>
  );
}

export default VerifySlip;
