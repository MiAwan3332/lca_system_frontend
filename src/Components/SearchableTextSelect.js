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
  allowCustom = false,
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

  const trimmedSearch = search.trim();
  const hasExactMatch = useMemo(() => {
    if (!trimmedSearch) return false;
    const query = trimmedSearch.toLowerCase();
    return options.some(
      (option) => String(option).toLowerCase() === query
    );
  }, [options, trimmedSearch]);

  const canCreate =
    allowCustom && Boolean(trimmedSearch) && !hasExactMatch;

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
        if (allowCustom) {
          const next = search.trim();
          if (next && next !== (value || "")) {
            onChange(next);
            setSearch(next);
          } else if (!next) {
            onChange("");
            setSearch("");
          } else {
            setSearch(value || "");
          }
        } else {
          setSearch(value || "");
        }
        onBlur?.();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value, onBlur, allowCustom, search, onChange]);

  const handleInputChange = (event) => {
    const nextSearch = event.target.value;
    setSearch(nextSearch);
    setIsOpen(true);
    if (!nextSearch.trim()) {
      onChange("");
    }
  };

  const handleSelect = (option) => {
    const next = String(option || "").trim();
    setSearch(next);
    setIsOpen(false);
    onChange(next);
    onBlur?.();
  };

  const handleKeyDown = (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (canCreate) {
      handleSelect(trimmedSearch);
      return;
    }
    if (filteredOptions.length > 0) {
      handleSelect(filteredOptions[0]);
    }
  };

  const showList =
    isOpen &&
    !isDisabled &&
    (filteredOptions.length > 0 || canCreate);
  const showEmpty =
    isOpen &&
    !isDisabled &&
    trimmedSearch &&
    filteredOptions.length === 0 &&
    !canCreate;

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
        onKeyDown={handleKeyDown}
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
          {canCreate ? (
            <ListItem
              key={`__create__${trimmedSearch}`}
              px={4}
              py={2}
              cursor="pointer"
              bg="white"
              color="#85652D"
              fontWeight="600"
              borderTop={
                filteredOptions.length > 0 ? "1px solid #E0E8EC" : undefined
              }
              _hover={{ bg: "#FFF8EE" }}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => handleSelect(trimmedSearch)}
            >
              Add &quot;{trimmedSearch}&quot;
            </ListItem>
          ) : null}
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
