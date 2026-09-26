import React from "react";
import {
  Box,
  Button,
  Checkbox,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  IconButton,
  Input,
  Select,
  SimpleGrid,
  Text,
  Textarea,
  VStack,
  Wrap,
  WrapItem,
  Tag,
  TagLabel,
  TagCloseButton,
} from "@chakra-ui/react";
import { Plus, Trash2 } from "lucide-react";
import {
  provinceSelectOptions,
  citySelectOptions,
  getCitiesForProvince,
} from "../../utlls/pakistanProvinces";
import SearchableTextSelect from "../../Components/SearchableTextSelect";
import { CSS_OPTIONAL_SUBJECTS, MAX_OPTIONAL_SUBJECTS } from "../../utlls/cssOptionalSubjects";
import {
  QUALIFICATION_OPTIONS,
  createEmptyEducationEntry,
} from "../../utlls/qualifierEducation";

/**
 * Shared profile detail fields for staff Add / Update qualifier modals.
 * Matches My Profile fields (optional for staff; required on self-profile).
 */
function QualifierProfileDetailsFields({
  formik,
  customSubject,
  setCustomSubject,
  showEmail = false,
}) {
  const selectedSubjects = Array.isArray(formik.values.optional_subjects)
    ? formik.values.optional_subjects
    : [];
  const atSubjectLimit = selectedSubjects.length >= MAX_OPTIONAL_SUBJECTS;

  const toggleSubject = (subject) => {
    const exists = selectedSubjects.some(
      (item) => item.toLowerCase() === subject.toLowerCase()
    );
    if (!exists && atSubjectLimit) return;
    const next = exists
      ? selectedSubjects.filter(
          (item) => item.toLowerCase() !== subject.toLowerCase()
        )
      : [...selectedSubjects, subject];
    formik.setFieldValue("optional_subjects", next);
  };

  const removeSubject = (subject) => {
    formik.setFieldValue(
      "optional_subjects",
      selectedSubjects.filter(
        (item) => item.toLowerCase() !== subject.toLowerCase()
      )
    );
  };

  const addCustomSubject = () => {
    const name = String(customSubject || "").trim();
    if (!name) return;
    if (atSubjectLimit) return;
    const exists = selectedSubjects.some(
      (item) => item.toLowerCase() === name.toLowerCase()
    );
    if (!exists) {
      formik.setFieldValue("optional_subjects", [...selectedSubjects, name]);
    }
    setCustomSubject("");
  };

  const addEducationEntry = (qualification = "") => {
    const next = [
      ...(formik.values.education_entries || []),
      {
        ...createEmptyEducationEntry(),
        qualification: qualification || "",
      },
    ];
    formik.setFieldValue("education_entries", next);
  };

  const removeEducationEntry = (index) => {
    const list = [...(formik.values.education_entries || [])];
    if (list.length <= 1) return;
    list.splice(index, 1);
    formik.setFieldValue("education_entries", list);
  };

  const updateEducationEntry = (index, field, value) => {
    const list = [...(formik.values.education_entries || [])];
    list[index] = { ...list[index], [field]: value };
    formik.setFieldValue("education_entries", list);
  };

  return (
    <>
      <GridItem colSpan={{ base: 1, md: 2 }}>
        <Text fontWeight="600" fontSize="sm" color="#2D3748" mt={1}>
          Profile details
        </Text>
        <Text fontSize="xs" color="gray.500">
          Same fields as My Profile. Fill as much as available at registration.
        </Text>
      </GridItem>

      {showEmail ? (
        <GridItem>
          <FormControl id="email">
            <FormLabel fontSize={14}>Email</FormLabel>
            <Input
              type="email"
              name="email"
              borderRadius="0.5rem"
              placeholder="Optional"
              value={formik.values.email}
              onChange={formik.handleChange}
            />
            {formik.touched.email && formik.errors.email ? (
              <Box color="red" fontSize="sm">
                {formik.errors.email}
              </Box>
            ) : null}
          </FormControl>
        </GridItem>
      ) : null}

      <GridItem>
        <FormControl id="province">
          <FormLabel fontSize={14}>Province</FormLabel>
          <SearchableTextSelect
            name="province"
            placeholder="Type to search province"
            emptyMessage="No province found"
            options={provinceSelectOptions(formik.values.province)}
            value={formik.values.province}
            onChange={(nextProvince) => {
              formik.setFieldValue("province", nextProvince);
              const cities = getCitiesForProvince(nextProvince);
              if (
                formik.values.city &&
                !cities.includes(formik.values.city)
              ) {
                formik.setFieldValue("city", "");
              }
            }}
          />
        </FormControl>
      </GridItem>

      <GridItem>
        <FormControl id="city">
          <FormLabel fontSize={14}>City</FormLabel>
          <SearchableTextSelect
            name="city"
            placeholder={
              formik.values.province
                ? "Type to search or add city"
                : "Select province first"
            }
            emptyMessage="No city found"
            options={citySelectOptions(
              formik.values.province,
              formik.values.city
            )}
            value={formik.values.city}
            onChange={(nextCity) => formik.setFieldValue("city", nextCity)}
            isDisabled={!formik.values.province}
            allowCustom
          />
          {formik.values.province ? (
            <Text fontSize="xs" color="gray.500" mt={1}>
              If the city is not listed, type the name and choose Add.
            </Text>
          ) : null}
        </FormControl>
      </GridItem>

      <GridItem>
        <FormControl id="father_name">
          <FormLabel fontSize={14}>Father Name</FormLabel>
          <Input
            name="father_name"
            borderRadius="0.5rem"
            placeholder="Optional"
            value={formik.values.father_name}
            onChange={formik.handleChange}
          />
        </FormControl>
      </GridItem>

      <GridItem>
        <FormControl id="father_phone">
          <FormLabel fontSize={14}>Father Phone</FormLabel>
          <Input
            type="tel"
            name="father_phone"
            borderRadius="0.5rem"
            placeholder="Optional"
            value={formik.values.father_phone}
            onChange={formik.handleChange}
          />
        </FormControl>
      </GridItem>

      <GridItem>
        <FormControl id="latest_degree">
          <FormLabel fontSize={14}>Latest Degree</FormLabel>
          <Input
            name="latest_degree"
            borderRadius="0.5rem"
            placeholder="e.g. BS Economics"
            value={formik.values.latest_degree}
            onChange={formik.handleChange}
          />
        </FormControl>
      </GridItem>

      <GridItem>
        <FormControl id="no_of_attempts">
          <FormLabel fontSize={14}>No. of Attempts</FormLabel>
          <Input
            type="number"
            name="no_of_attempts"
            min={0}
            step={1}
            borderRadius="0.5rem"
            value={formik.values.no_of_attempts}
            onChange={formik.handleChange}
          />
          {formik.touched.no_of_attempts && formik.errors.no_of_attempts ? (
            <Box color="red" fontSize="sm">
              {formik.errors.no_of_attempts}
            </Box>
          ) : null}
        </FormControl>
      </GridItem>

      <GridItem colSpan={{ base: 1, md: 2 }}>
        <Box
          borderWidth="1px"
          borderColor="gray.200"
          borderRadius="lg"
          p={{ base: 3, md: 4 }}
          bg="gray.50"
        >
          <Flex
            justify="space-between"
            align={{ base: "stretch", sm: "center" }}
            direction={{ base: "column", sm: "row" }}
            gap={3}
            mb={3}
          >
            <Box>
              <Text fontWeight="600" fontSize="sm">
                Education Background
              </Text>
              <Text fontSize="xs" color="gray.500" mt={1}>
                Add qualifications (Matric, Intermediate, Bachelor&apos;s, etc.).
              </Text>
            </Box>
            <Button
              type="button"
              size="sm"
              leftIcon={<Plus size={14} />}
              borderRadius="0.75rem"
              onClick={() => addEducationEntry()}
              flexShrink={0}
            >
              Add Qualification
            </Button>
          </Flex>

          <Wrap spacing={2} mb={3}>
            {QUALIFICATION_OPTIONS.map((option) => (
              <WrapItem key={option}>
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  borderRadius="full"
                  borderColor="#E3B574"
                  color="#85652D"
                  _hover={{ bg: "#FFF8EE" }}
                  onClick={() => addEducationEntry(option)}
                >
                  + {option}
                </Button>
              </WrapItem>
            ))}
          </Wrap>

          <VStack align="stretch" spacing={3}>
            {(formik.values.education_entries || []).map((entry, index) => (
              <Box
                key={entry.id || `education_${index}`}
                borderWidth="1px"
                borderColor="#E0E8EC"
                borderRadius="lg"
                bg="white"
                p={3}
              >
                <Flex justify="space-between" align="center" mb={2}>
                  <Text fontWeight="600" fontSize="sm" color="#85652D">
                    Qualification {index + 1}
                  </Text>
                  {(formik.values.education_entries || []).length > 1 ? (
                    <IconButton
                      aria-label="Remove qualification"
                      size="sm"
                      variant="ghost"
                      colorScheme="red"
                      icon={<Trash2 size={16} />}
                      onClick={() => removeEducationEntry(index)}
                    />
                  ) : null}
                </Flex>

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                  <FormControl>
                    <FormLabel fontSize={13}>Qualification</FormLabel>
                    <Select
                      borderRadius="0.5rem"
                      placeholder="Select"
                      value={entry.qualification || ""}
                      onChange={(e) =>
                        updateEducationEntry(
                          index,
                          "qualification",
                          e.target.value
                        )
                      }
                    >
                      {QUALIFICATION_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize={13}>Institution</FormLabel>
                    <Input
                      borderRadius="0.5rem"
                      value={entry.institution || ""}
                      onChange={(e) =>
                        updateEducationEntry(
                          index,
                          "institution",
                          e.target.value
                        )
                      }
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize={13}>Board / University</FormLabel>
                    <Input
                      borderRadius="0.5rem"
                      value={entry.board_or_university || ""}
                      onChange={(e) =>
                        updateEducationEntry(
                          index,
                          "board_or_university",
                          e.target.value
                        )
                      }
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize={13}>Year</FormLabel>
                    <Input
                      borderRadius="0.5rem"
                      value={entry.year || ""}
                      onChange={(e) =>
                        updateEducationEntry(index, "year", e.target.value)
                      }
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize={13}>Grade / Division</FormLabel>
                    <Input
                      borderRadius="0.5rem"
                      value={entry.grade || ""}
                      onChange={(e) =>
                        updateEducationEntry(index, "grade", e.target.value)
                      }
                    />
                  </FormControl>
                </SimpleGrid>
                <FormControl mt={3}>
                  <FormLabel fontSize={13}>Additional Details</FormLabel>
                  <Textarea
                    borderRadius="0.5rem"
                    rows={2}
                    value={entry.details || ""}
                    onChange={(e) =>
                      updateEducationEntry(index, "details", e.target.value)
                    }
                  />
                </FormControl>
                {index < (formik.values.education_entries || []).length - 1 ? (
                  <Divider mt={3} />
                ) : null}
              </Box>
            ))}
          </VStack>
        </Box>
      </GridItem>

      <GridItem colSpan={{ base: 1, md: 2 }}>
        <Box
          borderWidth="1px"
          borderColor="gray.200"
          borderRadius="lg"
          p={{ base: 3, md: 4 }}
          bg="gray.50"
        >
          <Text fontWeight="600" fontSize="sm" mb={1}>
            Optional Subjects
          </Text>
          <Text fontSize="xs" color="gray.500" mb={3}>
            Select up to {MAX_OPTIONAL_SUBJECTS} CSS optional subjects, or add a
            custom subject. ({selectedSubjects.length}/{MAX_OPTIONAL_SUBJECTS})
          </Text>
          {atSubjectLimit ? (
            <Text fontSize="xs" color="orange.600" mb={2}>
              Maximum of {MAX_OPTIONAL_SUBJECTS} subjects selected.
            </Text>
          ) : null}

          {selectedSubjects.length > 0 ? (
            <Wrap mb={3}>
              {selectedSubjects.map((subject) => (
                <WrapItem key={subject}>
                  <Tag
                    size="md"
                    borderRadius="full"
                    variant="solid"
                    bg="#FFCB82"
                    color="#85652D"
                  >
                    <TagLabel>{subject}</TagLabel>
                    <TagCloseButton onClick={() => removeSubject(subject)} />
                  </Tag>
                </WrapItem>
              ))}
            </Wrap>
          ) : null}

          <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={2} mb={3}>
            {CSS_OPTIONAL_SUBJECTS.map((subject) => {
              const checked = selectedSubjects.some(
                (item) => item.toLowerCase() === subject.toLowerCase()
              );
              return (
                <Checkbox
                  key={subject}
                  isChecked={checked}
                  isDisabled={!checked && atSubjectLimit}
                  onChange={() => toggleSubject(subject)}
                  colorScheme="orange"
                >
                  <Text fontSize="sm">{subject}</Text>
                </Checkbox>
              );
            })}
          </SimpleGrid>

          <Flex gap={2} direction={{ base: "column", sm: "row" }}>
            <Input
              borderRadius="0.5rem"
              placeholder="Add custom optional subject"
              value={customSubject}
              onChange={(e) => setCustomSubject(e.target.value)}
              bg="white"
              isDisabled={atSubjectLimit}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustomSubject();
                }
              }}
            />
            <Button
              type="button"
              borderRadius="0.75rem"
              onClick={addCustomSubject}
              flexShrink={0}
              isDisabled={atSubjectLimit}
            >
              Add Subject
            </Button>
          </Flex>
        </Box>
      </GridItem>
    </>
  );
}

export default QualifierProfileDetailsFields;
