import React from "react";
import { Box, Flex, HStack, Text, VStack } from "@chakra-ui/react";
import { CircleDollarSign, GraduationCap } from "lucide-react";

function FeesPageHero({ viewOnly }) {
  return (
    <Box
      mb={6}
      borderRadius="2xl"
      overflow="hidden"
      border="1px solid"
      borderColor="#E0E8EC"
      boxShadow="sm"
      position="relative"
    >
      <Box
        position="absolute"
        inset={0}
        bg="linear-gradient(135deg, #1a1a2e 0%, #2d3748 45%, #4a5568 100%)"
      />
      <Box
        position="absolute"
        top="-40px"
        right="-20px"
        w="200px"
        h="200px"
        borderRadius="full"
        bg="rgba(255, 203, 130, 0.15)"
        filter="blur(2px)"
      />
      <Box
        position="absolute"
        bottom="-60px"
        left="10%"
        w="160px"
        h="160px"
        borderRadius="full"
        bg="rgba(130, 180, 255, 0.12)"
      />

      <Flex
        position="relative"
        px={{ base: 5, md: 8 }}
        py={{ base: 6, md: 8 }}
        direction={{ base: "column", md: "row" }}
        align={{ base: "flex-start", md: "center" }}
        justify="space-between"
        gap={4}
      >
        <HStack spacing={4} align="flex-start">
          <Box
            p={3}
            borderRadius="2xl"
            bg="linear-gradient(135deg, #FFCB82 0%, #E3B574 100%)"
            color="#654E26"
            boxShadow="0 8px 24px rgba(255, 203, 130, 0.35)"
          >
            {viewOnly ? <GraduationCap size={28} /> : <CircleDollarSign size={28} />}
          </Box>
          <VStack align="flex-start" spacing={1}>
            <HStack spacing={2}>
              <Text
                fontSize="xs"
                fontWeight="bold"
                letterSpacing="wider"
                color="#FFCB82"
              >
                LCA FINANCE
              </Text>
            </HStack>
            <Text
              fontSize={{ base: "2xl", md: "3xl" }}
              fontWeight="bold"
              color="white"
              lineHeight="1.2"
            >
              {viewOnly ? "My Finance" : "Student Fees"}
            </Text>
            <Text fontSize="sm" color="rgba(255,255,255,0.75)" maxW="lg">
              {viewOnly
                ? "View your total fee, payments made, pending balance, and full finance history."
                : "Track collections, manage student payments, and generate batch-wise fee reports."}
            </Text>
          </VStack>
        </HStack>

        {!viewOnly && (
          <Box
            px={4}
            py={3}
            borderRadius="xl"
            bg="rgba(255,255,255,0.08)"
            border="1px solid rgba(255,255,255,0.12)"
            backdropFilter="blur(8px)"
          >
            <Text fontSize="xs" color="rgba(255,255,255,0.6)" mb={1}>
              Quick tip
            </Text>
            <Text fontSize="sm" color="white" fontWeight="medium">
              Use period + batch filters, then export PDF
            </Text>
          </Box>
        )}
      </Flex>
    </Box>
  );
}

export default FeesPageHero;
