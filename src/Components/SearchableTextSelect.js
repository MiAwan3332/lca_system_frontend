import React, { useEffect, useMemo, useRef, useState } from "react";
import { Box, Input, List, ListItem, Text } from "@chakra-ui/react";

function SearchableTextSelect({
  options = [],
  value = "",
  onChange,
  onBlur,
  placeholder = "Type to search",
  emptyMessage = "No matches",
  isDisabled = false,
  name,
}) {
  const containerRef = useRef(null);
  const [search, setSearch] = useState(value || "");
  const [isOpen, setIsOpen] = useState(false);

  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return options;
    return options.filter((option) =>
      String(option).toLowerCase().includes(query)
    );
  }, [options, search]);

  useEffect(() => {
    setSearch(value || "");
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        setSearch(value || "");
        onBlur?.();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value, onBlur]);

  const handleInputChange = (event) => {
    const nextSearch = event.target.value;
    setSearch(nextSearch);
    setIsOpen(true);
    if (!nextSearch.trim()) {
      onChange("");
    }
  };

  const handleSelect = (option) => {
    setSearch(option);
    setIsOpen(false);
    onChange(option);
    onBlur?.();
  };

  const showList = isOpen && !isDisabled && filteredOptions.length > 0;
  const showEmpty =
    isOpen && !isDisabled && search.trim() && filteredOptions.length === 0;

  return (
    <Box
      ref={containerRef}
      position="relative"
      w="full"
      zIndex={isOpen ? 1500 : "auto"}
    >
      <Input
        name={name}
        value={search}
        onChange={handleInputChange}
        onFocus={() => {
          if (!isDisabled) setIsOpen(true);
        }}
        onClick={() => {
          if (!isDisabled) setIsOpen(true);
        }}
        placeholder={placeholder}
        isDisabled={isDisabled}
        borderRadius="0.5rem"
        bg="white"
        autoComplete="off"
      />
      {showList ? (
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
          {filteredOptions.map((option) => (
            <ListItem
              key={option}
              px={4}
              py={2}
              cursor="pointer"
              bg={option === value ? "#FFCB82" : "white"}
              _hover={{ bg: "#FFCB82" }}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => handleSelect(option)}
            >
              {option}
            </ListItem>
          ))}
        </List>
      ) : null}
      {showEmpty ? (
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
            {emptyMessage}
          </Text>
        </Box>
      ) : null}
    </Box>
  );
}

export default SearchableTextSelect;
