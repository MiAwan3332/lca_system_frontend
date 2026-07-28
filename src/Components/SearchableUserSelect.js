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

function SearchableUserSelect({
  users = [],
  value = "",
  onChange,
  placeholder = "Search or select user",
  width = "12rem",
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

  const sortedUsers = useMemo(
    () =>
      [...users].sort((a, b) =>
        (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" })
      ),
    [users]
  );

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return sortedUsers;

    return sortedUsers.filter(
      (user) =>
        user.name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query)
    );
  }, [sortedUsers, search]);

  const selectedUser = useMemo(
    () => sortedUsers.find((user) => String(user._id) === String(value)),
    [sortedUsers, value]
  );

  const selectedUsers = useMemo(
    () => sortedUsers.filter((user) => selectedSet.has(String(user._id))),
    [sortedUsers, selectedSet]
  );

  useEffect(() => {
    if (isMulti) return;
    if (!value) {
      setSearch("");
      return;
    }
    if (selectedUser) {
      setSearch(selectedUser.name);
    }
  }, [value, selectedUser, isMulti]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        if (!isMulti && value && selectedUser) {
          setSearch(selectedUser.name);
        }
        if (isMulti) {
          setSearch("");
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value, selectedUser, isMulti]);

  const handleInputChange = (e) => {
    const nextSearch = e.target.value;
    setSearch(nextSearch);
    setIsOpen(true);

    if (!isMulti && !nextSearch.trim()) {
      onChange("");
    }
  };

  const handleSelectUser = (user) => {
    if (isMulti) {
      const id = String(user._id);
      const next = selectedSet.has(id)
        ? selectedIds.filter((item) => item !== id)
        : [...selectedIds, id];
      onChange(next);
      setSearch("");
      return;
    }
    setSearch(user.name);
    setIsOpen(false);
    onChange(user._id);
  };

  const handleClearSelection = () => {
    setSearch("");
    setIsOpen(false);
    onChange(isMulti ? [] : "");
  };

  const removeSelected = (userId) => {
    const id = String(userId);
    onChange(selectedIds.filter((item) => item !== id));
  };

  const multiPlaceholder =
    selectedIds.length === 0
      ? placeholder
      : selectedIds.length === 1
        ? selectedUsers[0]?.name || "1 user selected"
        : `${selectedIds.length} users selected`;

  return (
    <Box ref={containerRef} position="relative" w={width} zIndex={isOpen ? 1500 : "auto"}>
      {isMulti && selectedUsers.length > 0 && (
        <Wrap spacing={1} mb={2}>
          {selectedUsers.map((user) => (
            <WrapItem key={user._id}>
              <Badge
                colorScheme="yellow"
                borderRadius="md"
                px={2}
                py={1}
                display="flex"
                alignItems="center"
                gap={1}
              >
                {user.name}
                <Box
                  as="button"
                  type="button"
                  aria-label={`Remove ${user.name}`}
                  onClick={() => removeSelected(user._id)}
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
        value={search}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        onClick={() => setIsOpen(true)}
        placeholder={isMulti ? multiPlaceholder : placeholder}
        size="lg"
        borderRadius="xl"
      />
      {isOpen && filteredUsers.length > 0 && (
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
          {isMulti && (
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
              Clear selection
            </ListItem>
          )}
          {filteredUsers.map((user) => {
            const isSelected = selectedSet.has(String(user._id));
            return (
              <ListItem
                key={user._id}
                px={4}
                py={2}
                cursor="pointer"
                bg={isSelected ? "#FFCB82" : "white"}
                _hover={{ bg: "#FFCB82" }}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelectUser(user)}
              >
                {isMulti ? (
                  <Flex align="center" gap={2}>
                    <Checkbox
                      isChecked={isSelected}
                      pointerEvents="none"
                      colorScheme="yellow"
                    />
                    <Text fontSize="sm">{user.name}</Text>
                  </Flex>
                ) : (
                  user.name
                )}
              </ListItem>
            );
          })}
        </List>
      )}
      {isOpen && search.trim() && filteredUsers.length === 0 && (
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
            No users found
          </Text>
        </Box>
      )}
    </Box>
  );
}

export default SearchableUserSelect;
