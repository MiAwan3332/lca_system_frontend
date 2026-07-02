import React, { useEffect, useMemo, useRef, useState } from "react";
import { Box, Input, List, ListItem, Text } from "@chakra-ui/react";
import { filterActiveBatches } from "../Features/batchSlice";

function SearchableBatchSelect({
  batches = [],
  value = "",
  onChange,
  placeholder = "Search or select batch",
  width = "12rem",
  activeOnly = true,
  size = "lg",
}) {
  const containerRef = useRef(null);
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

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
    () => sortedBatches.find((batch) => batch._id === value),
    [sortedBatches, value]
  );

  useEffect(() => {
    if (!value) {
      setSearch("");
      return;
    }

    if (selectedBatch) {
      setSearch(selectedBatch.name);
    }
  }, [value, selectedBatch]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        if (value && selectedBatch) {
          setSearch(selectedBatch.name);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value, selectedBatch]);

  const handleInputChange = (e) => {
    const nextSearch = e.target.value;
    setSearch(nextSearch);
    setIsOpen(true);

    if (!nextSearch.trim()) {
      onChange("");
    }
  };

  const handleSelectBatch = (batch) => {
    setSearch(batch.name);
    setIsOpen(false);
    onChange(batch._id);
  };

  const handleClearSelection = () => {
    setSearch("");
    setIsOpen(false);
    onChange("");
  };

  const showEmptySearch =
    isOpen && search.trim() && filteredBatches.length === 0;
  const showEmptyList = isOpen && !search.trim() && sortedBatches.length === 0;
  const showList = isOpen && filteredBatches.length > 0;

  return (
    <Box ref={containerRef} position="relative" w={width} zIndex={isOpen ? 1500 : "auto"}>
      <Input
        value={search}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        onClick={() => setIsOpen(true)}
        placeholder={placeholder}
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
          {!search.trim() && (
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
              All batches
            </ListItem>
          )}
          {filteredBatches.map((batch) => (
            <ListItem
              key={batch._id}
              px={4}
              py={2}
              cursor="pointer"
              bg={value === batch._id ? "#FFCB82" : "white"}
              _hover={{ bg: "#FFCB82" }}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelectBatch(batch)}
            >
              {batch.name}
            </ListItem>
          ))}
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
