import React from "react";
import {
  Box,
  Flex,
  Image,
  Link,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Paperclip } from "lucide-react";
import { getPaymentEvidenceUrls } from "../utlls/paymentEvidence";
import { getMediaUrl } from "../utlls/useful";

const isImageUrl = (url) =>
  /\.(jpe?g|png|webp|gif)(\?|$)/i.test(String(url || ""));

/**
 * Renders payment evidence thumbnails/links for history views.
 */
function PaymentEvidenceGallery({
  value,
  paymentMethod = "",
  title = "Payment evidence",
}) {
  const urls = getPaymentEvidenceUrls(value);
  if (!urls.length) return null;

  return (
    <Box mt={2}>
      <Text fontSize="xs" fontWeight="600" color="gray.600" mb={1}>
        {title}
        {paymentMethod ? ` · ${paymentMethod}` : ""}
      </Text>
      <SimpleGrid columns={{ base: 2, sm: 3 }} spacing={2}>
        {urls.map((url, index) => {
          const href = getMediaUrl(url);
          const image = isImageUrl(url);
          return (
            <Link
              key={`${url}-${index}`}
              href={href}
              isExternal
              _hover={{ textDecoration: "none", opacity: 0.9 }}
            >
              {image ? (
                <Image
                  src={href}
                  alt={`Payment evidence ${index + 1}`}
                  w="100%"
                  h="72px"
                  objectFit="cover"
                  borderRadius="md"
                  border="1px solid"
                  borderColor="gray.200"
                />
              ) : (
                <Flex
                  h="72px"
                  align="center"
                  justify="center"
                  gap={1}
                  borderRadius="md"
                  border="1px solid"
                  borderColor="gray.200"
                  bg="gray.50"
                  px={2}
                >
                  <Paperclip size={14} color="#2D4185" />
                  <Text fontSize="xs" color="#2D4185" fontWeight="600">
                    File {index + 1}
                  </Text>
                </Flex>
              )}
            </Link>
          );
        })}
      </SimpleGrid>
    </Box>
  );
}

export default PaymentEvidenceGallery;
