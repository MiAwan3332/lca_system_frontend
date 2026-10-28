import { Input } from './AccessInputs';
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Box, List, ListItem, Text } from '@chakra-ui/react';
import { useAccessForm } from './AccessForm';
import { accessSnapshot, subscribeAccess, canUseField } from '../utlls/accessCapabilities';

function CourseSelectInput({
  courses = [],
  value = "",
  onChange,
  placeholder = "Search or select course",
  width = "12rem",
}) {
  const containerRef = useRef(null);
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const sortedCourses = useMemo(
    () =>
      [...courses].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
      ),
    [courses]
  );

  const filteredCourses = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return sortedCourses;

    return sortedCourses.filter((course) =>
      course.name.toLowerCase().includes(query)
    );
  }, [sortedCourses, search]);

  const selectedCourse = useMemo(
    () => sortedCourses.find((course) => course._id === value),
    [sortedCourses, value]
  );

  useEffect(() => {
    if (!value) {
      setSearch("");
      return;
    }

    if (selectedCourse) {
      setSearch(selectedCourse.name);
    }
  }, [value, selectedCourse]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        if (value && selectedCourse) {
          setSearch(selectedCourse.name);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value, selectedCourse]);

  const handleInputChange = (e) => {
    const nextSearch = e.target.value;
    setSearch(nextSearch);
    setIsOpen(true);

    if (!nextSearch.trim()) {
      onChange("");
    }
  };

  const handleSelectCourse = (course) => {
    setSearch(course.name);
    setIsOpen(false);
    onChange(course._id);
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
      {isOpen && filteredCourses.length > 0 && (
        <List
          position="absolute"
          top="100%"
          left={0}
          right={0}
          mt={1}
          bg="var(--dash-surface)"
          border="1px solid"
          borderColor="#E0E8EC"
          borderRadius="xl"
          maxH="240px"
          overflowY="auto"
          zIndex={10}
          boxShadow="md"
        >
          {filteredCourses.map((course) => (
            <ListItem
              key={course._id}
              px={4}
              py={2}
              cursor="pointer"
              bg={value === course._id ? "#FFCB82" : "var(--dash-surface)"} color={value === course._id ? "#263238" : "var(--dash-text)"}
              _hover={{ bg: "#FFCB82", color: "#263238" }}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelectCourse(course)}
            >
              {course.name}
            </ListItem>
          ))}
        </List>
      )}
      {isOpen && search.trim() && filteredCourses.length === 0 && (
        <Box
          position="absolute"
          top="100%"
          left={0}
          right={0}
          mt={1}
          bg="var(--dash-surface)"
          border="1px solid"
          borderColor="#E0E8EC"
          borderRadius="xl"
          px={4}
          py={3}
          zIndex={10}
          boxShadow="md"
        >
          <Text fontSize="sm" color="gray.500">
            No courses found
          </Text>
        </Box>
      )}
    </Box>
  );
}

export default function SearchableCourseSelect(props) {
  React.useSyncExternalStore(subscribeAccess, accessSnapshot);
  const mode = useAccessForm();
  const field = props.permissionField || 'course';
  if (!mode || canUseField(field, mode === 'read' ? 'read' : 'write')) return <CourseSelectInput {...props} />;
  if (!canUseField(field, 'read')) return null;
  return <Text fontSize="sm">{(props.courses || []).find((course) => course._id === props.value)?.name || '-'}</Text>;
}
