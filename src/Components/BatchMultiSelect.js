import React, { useMemo, useState } from "react";
import {
  Badge,
  Box,
  Checkbox,
  Input,
  InputGroup,
  InputLeftElement,
  Text,
  VStack,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import { Search, X } from "lucide-react";
import { filterActiveBatches } from "../Features/batchSlice";

function BatchMultiSelect({
  batches = [],
  value = [],
  onChange,
  activeOnly = true,
  maxH = "220px",
  searchable = true,
  showSelectAll = true,
  helperText,
}) {
  const [search, setSearch] = useState("");

  const visibleBatches = useMemo(
    () => (activeOnly ? filterActiveBatches(batches) : batches),
    [batches, activeOnly]
  );

  const sortedBatches = useMemo(
    () =>
      [...visibleBatches].sort((a, b) =>
        (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" })
      ),
    [visibleBatches]
  );

  const batchMap = useMemo(() => {
    const map = new Map();
    sortedBatches.forEach((batch) => map.set(String(batch._id), batch));
    batches.forEach((batch) => {
      if (!map.has(String(batch._id))) {
        map.set(String(batch._id), batch);
      }
    });
    return map;
  }, [sortedBatches, batches]);

  const filteredBatches = useMemo(() => {
    if (!searchable) return sortedBatches;
    const query = search.trim().toLowerCase();
    if (!query) return sortedBatches;
    return sortedBatches.filter((batch) =>
      (batch.name || "").toLowerCase().includes(query)
    );
  }, [sortedBatches, search, searchable]);

  const selectedSet = useMemo(() => new Set(value.map(String)), [value]);

  const selectedBatchItems = useMemo(
    () =>
      value
        .map((id) => batchMap.get(String(id)))
        .filter(Boolean),
    [value, batchMap]
  );

  const toggleBatch = (batchId) => {
    const id = String(batchId);
    if (selectedSet.has(id)) {
      onChange(value.filter((item) => String(item) !== id));
    } else {
      onChange([...value.map(String), id]);
    }
  };

  const removeBatch = (batchId) => {
    const id = String(batchId);
    onChange(value.filter((item) => String(item) !== id));
  };

  const toggleAllVisible = () => {
    const visibleIds = filteredBatches.map((batch) => batch._id);
    const allSelected = visibleIds.every((id) => selectedSet.has(String(id)));
    if (allSelected) {
      const visibleSet = new Set(visibleIds.map(String));
      onChange(value.filter((id) => !visibleSet.has(String(id))));
    } else {
      const merged = new Set(value.map(String));
      visibleIds.forEach((id) => merged.add(String(id)));
      onChange(
        sortedBatches
          .filter((batch) => merged.has(String(batch._id)))
          .map((batch) => batch._id)
      );
    }
  };

  const allVisibleSelected =
    filteredBatches.length > 0 &&
    filteredBatches.every((batch) => selectedSet.has(String(batch._id)));

  return (
    <Box
      borderWidth="1px"
      borderColor="#E0E8EC"
      borderRadius="xl"
      bg="white"
      overflow="hidden"
    >
      {selectedBatchItems.length > 0 && (
        <Box p={3} borderBottomWidth="1px" borderColor="#E0E8EC" bg="#FFFBF5">
          <Text fontSize="xs" color="gray.600" mb={2} fontWeight="medium">
            Selected batches
          </Text>
          <Wrap spacing={2}>
            {selectedBatchItems.map((batch) => (
              <WrapItem key={batch._id}>
                <Badge
                  colorScheme="yellow"
                  borderRadius="md"
                  px={2}
                  py={1}
                  display="flex"
                  alignItems="center"
                  gap={1}
                >
                  {batch.name}
                  <Box
                    as="button"
                    type="button"
                    aria-label={`Remove ${batch.name}`}
                    onClick={() => removeBatch(batch._id)}
                    lineHeight={0}
                  >
                    <X size={12} />
                  </Box>
                </Badge>
              </WrapItem>
            ))}
          </Wrap>
        </Box>
      )}

      {searchable && (
        <Box p={3} borderBottomWidth="1px" borderColor="#E0E8EC">
          <InputGroup size="md">
            <InputLeftElement pointerEvents="none">
              <Search size={16} color="#A1A1A1" />
            </InputLeftElement>
            <Input
              placeholder="Search batches (optional)..."
              borderRadius="lg"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </InputGroup>
        </Box>
      )}

      {showSelectAll && (
        <Box px={3} py={2} borderBottomWidth="1px" borderColor="#E0E8EC">
          <Checkbox
            isChecked={allVisibleSelected}
            isIndeterminate={
              !allVisibleSelected &&
              filteredBatches.some((batch) => selectedSet.has(String(batch._id)))
            }
            onChange={toggleAllVisible}
            colorScheme="yellow"
          >
            <Text fontSize="sm" fontWeight="medium">
              Select all {searchable && search ? "matching" : ""} batches
            </Text>
          </Checkbox>
        </Box>
      )}

      <VStack
        align="stretch"
        spacing={0}
        maxH={maxH}
        overflowY="auto"
        px={3}
        py={2}
      >
        {filteredBatches.length === 0 ? (
          <Text fontSize="sm" color="gray.500" py={3} textAlign="center">
            {sortedBatches.length === 0
              ? "No active batches available"
              : "No batches found"}
          </Text>
        ) : (
          filteredBatches.map((batch) => (
            <Checkbox
              key={batch._id}
              isChecked={selectedSet.has(String(batch._id))}
              onChange={() => toggleBatch(batch._id)}
              py={2}
              colorScheme="yellow"
            >
              <Text fontSize="sm">{batch.name}</Text>
            </Checkbox>
          ))
        )}
      </VStack>

      <Box px={3} py={2} borderTopWidth="1px" borderColor="#E0E8EC" bg="#F9FBFC">
        <Text fontSize="xs" color="gray.600">
          {helperText ||
            `${value.length} batch${value.length === 1 ? "" : "es"} selected`}
        </Text>
      </Box>
    </Box>
  );
}

export default BatchMultiSelect;
