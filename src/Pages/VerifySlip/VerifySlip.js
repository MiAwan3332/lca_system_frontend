import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Badge,
  Center,
  Flex,
  Image,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { CheckCircle2, MapPin, Phone, ShieldAlert } from "lucide-react";
import axios from "axios";
import { config } from "../../utlls/config";
import { ACADEMY_BRANDING } from "../../utlls/academyBranding";

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
  const isFeeSlip = (result?.slip_type || slip.slip_type) === "fee";
  const slipLabel = isFeeSlip ? "Fee Slip" : "Admission Slip";

  return (
    <Box
      minH="100dvh"
      bg="linear-gradient(180deg, #FFF8EE 0%, #F7F9FC 45%, #FFFFFF 100%)"
      px={4}
      py={{ base: 8, md: 12 }}
    >
      <Center>
        <Box w="full" maxW="26rem">
          <VStack spacing={3} mb={6} textAlign="center">
            <Image
              src={ACADEMY_BRANDING.logoSrc}
              alt={ACADEMY_BRANDING.name}
              h={{ base: "64px", md: "80px" }}
              mx="auto"
              objectFit="contain"
            />
            <Text fontSize="sm" fontWeight="800" letterSpacing="0.08em" color="#85652D">
              {ACADEMY_BRANDING.name.toUpperCase()}
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
                py={7}
                bg={authentic ? "#F0FFF4" : "#FFF5F5"}
                borderBottom="1px solid"
                borderColor={authentic ? "#C6F6D5" : "#FED7D7"}
              >
                {authentic ? (
                  <CheckCircle2 size={52} color="#276749" />
                ) : (
                  <ShieldAlert size={52} color="#C53030" />
                )}
                <Badge
                  colorScheme={authentic ? "green" : "red"}
                  borderRadius="full"
                  px={4}
                  py={1.5}
                  fontSize="md"
                  letterSpacing="0.12em"
                >
                  {authentic ? "VERIFIED" : "NOT VERIFIED"}
                </Badge>
                {authentic && (
                  <Text fontSize="xs" fontWeight="700" color="green.700">
                    Authentic {slipLabel}
                  </Text>
                )}
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
                <Box p={6} textAlign="center">
                  <Text fontSize="xs" fontWeight="700" color="gray.500" letterSpacing="0.08em">
                    STUDENT NAME
                  </Text>
                  <Text
                    fontSize={{ base: "xl", md: "2xl" }}
                    fontWeight="800"
                    color="#1A202C"
                    mt={1}
                    wordBreak="break-word"
                  >
                    {slip.student_name || "—"}
                  </Text>
                  <Text fontSize="xs" fontWeight="700" color="gray.500" letterSpacing="0.08em" mt={5}>
                    BATCH
                  </Text>
                  <Text
                    fontSize="lg"
                    fontWeight="700"
                    color="#2D3748"
                    mt={1}
                    wordBreak="break-word"
                  >
                    {slip.batch_name || "—"}
                  </Text>
                </Box>
              ) : (
                <Box p={5}>
                  <Text fontSize="sm" color="gray.600" textAlign="center">
                    Do not accept this slip. Only slips with a valid LCA
                    verification QR are authentic.
                  </Text>
                </Box>
              )}

              <Box
                px={5}
                py={5}
                borderTop="1px solid"
                borderColor="#EDF2F7"
                bg="#FAFBFC"
              >
                <VStack spacing={2.5} align="stretch">
                  <Flex align="flex-start" gap={2.5}>
                    <Box mt="2px" color="#85652D">
                      <Phone size={16} />
                    </Box>
                    <Box>
                      <Text fontSize="xs" fontWeight="700" color="gray.500">
                        Contact
                      </Text>
                      <Text fontSize="sm" fontWeight="700" color="#2D3748">
                        {ACADEMY_BRANDING.phonesLine}
                      </Text>
                    </Box>
                  </Flex>
                  <Flex align="flex-start" gap={2.5}>
                    <Box mt="2px" color="#85652D">
                      <MapPin size={16} />
                    </Box>
                    <Box>
                      <Text fontSize="xs" fontWeight="700" color="gray.500">
                        Address
                      </Text>
                      <Text fontSize="sm" fontWeight="600" color="#2D3748">
                        {ACADEMY_BRANDING.address}
                      </Text>
                    </Box>
                  </Flex>
                </VStack>
              </Box>
            </Box>
          )}
        </Box>
      </Center>
    </Box>
  );
}

export default VerifySlip;
