import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Badge,
  Box,
  Checkbox,
  Flex,
  Input,
  List,
  ListItem,
  Text,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import { X } from "lucide-react";
import { filterActiveBatches } from "../Features/batchSlice";

function SearchableBatchSelect({
  batches = [],
  value = "",
  onChange,
  placeholder = "Search or select batch",
  width = "12rem",
  activeOnly = true,
  showClearOption = true,
  size = "lg",
  isMulti = false,
}) {
  const containerRef = useRef(null);
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const selectedIds = useMemo(() => {
    if (isMulti) {
      return Array.isArray(value) ? value.map(String) : [];
    }
    return value ? [String(value)] : [];
  }, [isMulti, value]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

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

  const filteredBatches = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return sortedBatches;

    return sortedBatches.filter((batch) =>
      (batch.name || "").toLowerCase().includes(query)
    );
  }, [sortedBatches, search]);

  const selectedBatch = useMemo(
    () => sortedBatches.find((batch) => String(batch._id) === String(value)),
    [sortedBatches, value]
  );

  const selectedBatches = useMemo(
    () =>
      sortedBatches.filter((batch) => selectedSet.has(String(batch._id))),
    [sortedBatches, selectedSet]
  );

  useEffect(() => {
    if (isMulti) return;
    if (!value) {
      setSearch("");
      return;
    }
    if (selectedBatch) {
      setSearch(selectedBatch.name);
    }
  }, [value, selectedBatch, isMulti]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        if (!isMulti && value && selectedBatch) {
          setSearch(selectedBatch.name);
        }
        if (isMulti) {
          setSearch("");
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value, selectedBatch, isMulti]);

  const handleInputChange = (e) => {
    const nextSearch = e.target.value;
    setSearch(nextSearch);
    setIsOpen(true);

    if (!isMulti && !nextSearch.trim()) {
      onChange("");
    }
  };

  const handleSelectBatch = (batch) => {
    if (isMulti) {
      const id = String(batch._id);
      const next = selectedSet.has(id)
        ? selectedIds.filter((item) => item !== id)
        : [...selectedIds, id];
      onChange(next);
      setSearch("");
      return;
    }
    setSearch(batch.name);
    setIsOpen(false);
    onChange(batch._id);
  };

  const handleClearSelection = () => {
    setSearch("");
    setIsOpen(false);
    onChange(isMulti ? [] : "");
  };

  const removeSelected = (batchId) => {
    const id = String(batchId);
    onChange(selectedIds.filter((item) => item !== id));
  };

  const showEmptySearch =
    isOpen && search.trim() && filteredBatches.length === 0;
  const showEmptyList = isOpen && !search.trim() && sortedBatches.length === 0;
  const showList = isOpen && filteredBatches.length > 0;

  const multiPlaceholder =
    selectedIds.length === 0
      ? placeholder
      : selectedIds.length === 1
        ? selectedBatches[0]?.name || "1 batch selected"
        : `${selectedIds.length} batches selected`;

  return (
    <Box ref={containerRef} position="relative" w={width} zIndex={isOpen ? 1500 : "auto"}>
      {isMulti && selectedBatches.length > 0 && (
        <Wrap spacing={1} mb={2}>
          {selectedBatches.map((batch) => (
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
                  onClick={() => removeSelected(batch._id)}
                  lineHeight={0}
                >
                  <X size={12} />
                </Box>
              </Badge>
            </WrapItem>
          ))}
        </Wrap>
      )}
      <Input
        value={isMulti ? search : search}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        onClick={() => setIsOpen(true)}
        placeholder={isMulti ? multiPlaceholder : placeholder}
        size={size}
        borderRadius="xl"
        borderColor="#E0E8EC"
        bg="#FAFBFC"
        _focus={{ borderColor: "#FFCB82", boxShadow: "0 0 0 1px #FFCB82" }}
      />
      {showList && (
        <List
          position="absolute"
          top="calc(100% + 4px)"
          left={0}
          right={0}
          bg="white"
          border="1px solid"
          borderColor="#E0E8EC"
          borderRadius="xl"
          maxH="240px"
          overflowY="auto"
          zIndex={1500}
          boxShadow="lg"
        >
          {!search.trim() && showClearOption && (
            <ListItem
              px={4}
              py={2}
              cursor="pointer"
              color="#718096"
              fontSize="sm"
              fontStyle="italic"
              _hover={{ bg: "#FFFBF5" }}
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleClearSelection}
            >
              {isMulti ? "Clear selection" : "All batches"}
            </ListItem>
          )}
          {filteredBatches.map((batch) => {
            const isSelected = selectedSet.has(String(batch._id));
            return (
              <ListItem
                key={batch._id}
                px={4}
                py={2}
                cursor="pointer"
                bg={isSelected ? "#FFCB82" : "white"}
                _hover={{ bg: "#FFCB82" }}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelectBatch(batch)}
              >
                {isMulti ? (
                  <Flex align="center" gap={2}>
                    <Checkbox
                      isChecked={isSelected}
                      pointerEvents="none"
                      colorScheme="yellow"
                    />
                    <Text fontSize="sm">{batch.name}</Text>
                  </Flex>
                ) : (
                  batch.name
                )}
              </ListItem>
            );
          })}
        </List>
      )}
      {showEmptySearch && (
        <Box
          position="absolute"
          top="calc(100% + 4px)"
          left={0}
          right={0}
          bg="white"
          border="1px solid"
          borderColor="#E0E8EC"
          borderRadius="xl"
          px={4}
          py={3}
          zIndex={1500}
          boxShadow="lg"
        >
          <Text fontSize="sm" color="gray.500">
            No batches found
          </Text>
        </Box>
      )}
      {showEmptyList && (
        <Box
          position="absolute"
          top="calc(100% + 4px)"
          left={0}
          right={0}
          bg="white"
          border="1px solid"
          borderColor="#E0E8EC"
          borderRadius="xl"
          px={4}
          py={3}
          zIndex={1500}
          boxShadow="lg"
        >
          <Text fontSize="sm" color="gray.500">
            No active batches available
          </Text>
        </Box>
      )}
    </Box>
  );
}

export default SearchableBatchSelect;
