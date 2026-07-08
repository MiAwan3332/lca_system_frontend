import React from "react";
import {
  Box,
  Button,
  ButtonGroup,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Select,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  Calendar,
  Download,
  FileText,
  Filter,
  Layers,
  RotateCw,
  Search,
} from "lucide-react";
import TableSearch from "./TableSearch";
import SearchableBatchSelect from "./SearchableBatchSelect";
import { setQueryFilter, fetchFees } from "../Features/feeSlice";

const PERIOD_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

function FeesFiltersCard({
  viewOnly,
  period,
  reportDate,
  formBatch,
  formStatus,
  batches,
  reportFilters,
  isLoading,
  isGeneratingReport,
  onPeriodChange,
  onDateChange,
  onBatchChange,
  onStatusChange,
  onRefresh,
  onDownload,
  onPrint,
  onClearFilters,
}) {
  return (
    <Box
      bg="white"
      border="1px solid"
      borderColor="#E0E8EC"
      borderRadius="2xl"
      overflow="visible"
      boxShadow="sm"
      mb={6}
      position="relative"
      zIndex={2}
    >
      <Flex
        px={{ base: 4, md: 5 }}
        py={3}
        bg="#FAFBFC"
        borderBottom="1px solid"
        borderColor="#E0E8EC"
        borderTopRadius="2xl"
        align="center"
        justify="space-between"
        flexWrap="wrap"
        gap={2}
      >
        <HStack spacing={2}>
          <Box p={1.5} borderRadius="lg" bg="#FFCB82" color="#85652D">
            <Filter size={16} />
          </Box>
          <Text fontWeight="semibold" color="#2D3748" fontSize="sm">
            Filters & Reports
          </Text>
        </HStack>
        {!viewOnly && (
          <HStack spacing={2}>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              borderRadius="lg"
              leftIcon={<RotateCw size={14} />}
              onClick={onRefresh}
              isLoading={isLoading}
            >
              Refresh
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              borderRadius="lg"
              onClick={onClearFilters}
            >
              Clear
            </Button>
          </HStack>
        )}
      </Flex>

      <Box px={{ base: 4, md: 5 }} py={5} overflow="visible" borderBottomRadius="2xl">
        <VStack spacing={5} align="stretch">
          {!viewOnly && (
            <Box>
              <Text fontSize="xs" fontWeight="semibold" color="#718096" mb={2} letterSpacing="wider">
                PERIOD
              </Text>
              <ButtonGroup
                isAttached
                flexWrap="wrap"
                gap={2}
                sx={{ "& > button": { borderRadius: "12px !important", margin: "2px" } }}
              >
                {PERIOD_OPTIONS.map((option) => {
                  const isActive = period === option.value;
                  return (
                    <Button
                      key={option.value}
                      type="button"
                      size="sm"
                      variant={isActive ? "solid" : "outline"}
                      bg={isActive ? "#FFCB82" : "white"}
                      color={isActive ? "#654E26" : "#4A5568"}
                      borderColor={isActive ? "#FFCB82" : "#E0E8EC"}
                      _hover={{
                        bg: isActive ? "#E3B574" : "#FFFBF5",
                      }}
                      onClick={() => onPeriodChange(option.value)}
                    >
                      {option.label}
                    </Button>
                  );
                })}
              </ButtonGroup>
            </Box>
          )}

          <Flex
            direction={{ base: "column", lg: "row" }}
            gap={4}
            align={{ base: "stretch", lg: "flex-end" }}
            flexWrap="wrap"
          >
            {!viewOnly && (
              <FormControl flex={{ base: "1", lg: "1 1 220px" }} minW="200px">
                <FormLabel fontSize="xs" color="#718096" mb={1}>
                  <HStack spacing={1}>
                    <Search size={12} />
                    <Text>Search student</Text>
                  </HStack>
                </FormLabel>
                <TableSearch
                  setQueryFilter={setQueryFilter}
                  method={fetchFees}
                  payload={reportFilters}
                  placeholder="Search by student name..."
                />
              </FormControl>
            )}

            <FormControl flex={{ base: "1", lg: "0 1 160px" }} minW="140px">
              <FormLabel fontSize="xs" color="#718096" mb={1}>
                <HStack spacing={1}>
                  <Calendar size={12} />
                  <Text>Due date</Text>
                </HStack>
              </FormLabel>
              <Input
                type="date"
                size="md"
                borderRadius="xl"
                borderColor="#E0E8EC"
                bg="#FAFBFC"
                value={reportDate}
                onChange={onDateChange}
                _focus={{ borderColor: "#FFCB82", boxShadow: "0 0 0 1px #FFCB82" }}
              />
            </FormControl>

            {!viewOnly && (
              <FormControl
                flex={{ base: "1", lg: "0 1 200px" }}
                minW="180px"
                position="relative"
                zIndex={20}
              >
                <FormLabel fontSize="xs" color="#718096" mb={1}>
                  <HStack spacing={1}>
                    <Layers size={12} />
                    <Text>Batch</Text>
                  </HStack>
                </FormLabel>
                <SearchableBatchSelect
                  batches={batches}
                  value={formBatch}
                  onChange={onBatchChange}
                  placeholder="All batches"
                  width="100%"
                  size="md"
                />
              </FormControl>
            )}

            <FormControl flex={{ base: "1", lg: "0 1 140px" }} minW="130px">
              <FormLabel fontSize="xs" color="#718096" mb={1}>
                Status
              </FormLabel>
              <Select
                size="md"
                borderRadius="xl"
                borderColor="#E0E8EC"
                bg="#FAFBFC"
                value={formStatus}
                onChange={onStatusChange}
                _focus={{ borderColor: "#FFCB82", boxShadow: "0 0 0 1px #FFCB82" }}
              >
                <option value="">All statuses</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
              </Select>
            </FormControl>

            {!viewOnly && (
              <HStack spacing={2} flex={{ base: "1", lg: "0 0 auto" }} pt={{ lg: 6 }}>
                <Button
                  type="button"
                  leftIcon={<Download size={16} />}
                  size="md"
                  borderRadius="xl"
                  backgroundColor="#82B4FF"
                  color="#2D4185"
                  _hover={{ backgroundColor: "#74A0E3", color: "#223163" }}
                  isLoading={isGeneratingReport}
                  loadingText="..."
                  onClick={onDownload}
                >
                  PDF
                </Button>
                <Button
                  type="button"
                  leftIcon={<FileText size={16} />}
                  size="md"
                  borderRadius="xl"
                  backgroundColor="#FFCB82"
                  color="#85652D"
                  _hover={{ backgroundColor: "#E3B574", color: "#654E26" }}
                  isLoading={isGeneratingReport}
                  loadingText="..."
                  onClick={onPrint}
                >
                  Print
                </Button>
              </HStack>
            )}
          </Flex>
        </VStack>
      </Box>
    </Box>
  );
}

export default FeesFiltersCard;
