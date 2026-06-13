import React, { useEffect, useMemo, useRef, useState } from "react";
import { Box, Input, List, ListItem, Text } from "@chakra-ui/react";

function SearchableBatchSelect({
  batches = [],
  value = "",
  onChange,
  placeholder = "Search or select batch",
  width = "12rem",
}) {
  const containerRef = useRef(null);
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const sortedBatches = useMemo(
    () =>
      [...batches].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
      ),
    [batches]
  );

  const filteredBatches = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return sortedBatches;

    return sortedBatches.filter((batch) =>
      batch.name.toLowerCase().includes(query)
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

  return (
    <Box ref={containerRef} position="relative" w={width}>
      <Input
        value={search}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        size="lg"
        borderRadius="xl"
      />
      {isOpen && filteredBatches.length > 0 && (
        <List
          position="absolute"
          top="100%"
          left={0}
          right={0}
          mt={1}
          bg="white"
          border="1px solid"
          borderColor="#E0E8EC"
          borderRadius="xl"
          maxH="240px"
          overflowY="auto"
          zIndex={10}
          boxShadow="md"
        >
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
      {isOpen && search.trim() && filteredBatches.length === 0 && (
        <Box
          position="absolute"
          top="100%"
          left={0}
          right={0}
          mt={1}
          bg="white"
          border="1px solid"
          borderColor="#E0E8EC"
          borderRadius="xl"
          px={4}
          py={3}
          zIndex={10}
          boxShadow="md"
        >
          <Text fontSize="sm" color="gray.500">
            No batches found
          </Text>
        </Box>
      )}
    </Box>
  );
}

export default SearchableBatchSelect;
