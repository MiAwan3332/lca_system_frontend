import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Flex,
  Text,
  VStack,
} from "@chakra-ui/react";
import { ChevronDown } from "lucide-react";

/**
 * Compact multi-select dropdown for filter bars.
 * options: [{ value, label }]
 * value: string[]
 */
function FilterMultiSelect({
  options = [],
  value = [],
  onChange,
  placeholder = "All",
  width = "100%",
  size = "md",
  emptyLabel = "No options",
}) {
  const containerRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);

  const selectableOptions = useMemo(
    () => options.filter((option) => String(option.value ?? "") !== ""),
    [options]
  );

  const selectedSet = useMemo(() => new Set(value.map(String)), [value]);

  const selectedLabels = useMemo(
    () =>
      selectableOptions
        .filter((option) => selectedSet.has(String(option.value)))
        .map((option) => option.label),
    [selectableOptions, selectedSet]
  );

  const displayText =
    selectedLabels.length === 0
      ? placeholder
      : selectedLabels.length === 1
        ? selectedLabels[0]
        : `${selectedLabels.length} selected`;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleValue = (optionValue) => {
    const id = String(optionValue);
    if (selectedSet.has(id)) {
      onChange(value.filter((item) => String(item) !== id));
    } else {
      onChange([...value.map(String), id]);
    }
  };

  const clearSelection = () => {
    onChange([]);
    setIsOpen(false);
  };

  return (
    <Box
      ref={containerRef}
      position="relative"
      w={width}
      zIndex={isOpen ? 1600 : "auto"}
    >
      <Button
        type="button"
        w="100%"
        size={size}
        borderRadius="xl"
        variant="outline"
        borderColor="#E0E8EC"
        bg="#FAFBFC"
        fontWeight="500"
        justifyContent="space-between"
        rightIcon={<ChevronDown size={16} />}
        onClick={() => setIsOpen((open) => !open)}
        _hover={{ bg: "#FFFBF5", borderColor: "#FFCB82" }}
        _active={{ bg: "#FFF8EE" }}
      >
        <Text
          as="span"
          noOfLines={1}
          textAlign="left"
          flex="1"
          color={selectedLabels.length ? "gray.800" : "gray.500"}
        >
          {displayText}
        </Text>
      </Button>

      {isOpen && (
        <Box
          position="absolute"
          top="calc(100% + 4px)"
          left={0}
          right={0}
          minW="12rem"
          bg="white"
          border="1px solid"
          borderColor="#E0E8EC"
          borderRadius="xl"
          boxShadow="lg"
          zIndex={1600}
          overflow="hidden"
        >
          <Flex
            px={3}
            py={2}
            borderBottomWidth="1px"
            borderColor="#E0E8EC"
            justify="space-between"
            align="center"
            bg="#FFFBF5"
          >
            <Text fontSize="xs" color="gray.600">
              {value.length
                ? `${value.length} selected`
                : "Select one or more"}
            </Text>
            {value.length > 0 && (
              <Button
                type="button"
                size="xs"
                variant="ghost"
                colorScheme="yellow"
                onClick={clearSelection}
              >
                Clear
              </Button>
            )}
          </Flex>
          <VStack
            align="stretch"
            spacing={0}
            maxH="240px"
            overflowY="auto"
            px={3}
            py={2}
          >
            {selectableOptions.length === 0 ? (
              <Text fontSize="sm" color="gray.500" py={2} textAlign="center">
                {emptyLabel}
              </Text>
            ) : (
              selectableOptions.map((option) => {
                const optionValue = String(option.value);
                return (
                  <Checkbox
                    key={optionValue}
                    isChecked={selectedSet.has(optionValue)}
                    onChange={() => toggleValue(optionValue)}
                    py={2}
                    colorScheme="yellow"
                  >
                    <Text fontSize="sm">{option.label}</Text>
                  </Checkbox>
                );
              })
            )}
          </VStack>
        </Box>
      )}
    </Box>
  );
}

export default FilterMultiSelect;
