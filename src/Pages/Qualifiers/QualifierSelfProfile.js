import React, { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Checkbox,
  FormControl,
  FormLabel,
  Image,
  Input,
  Text,
  Textarea,
  VStack,
  SimpleGrid,
  Spinner,
  Center,
  Wrap,
  WrapItem,
  Tag,
  TagLabel,
  TagCloseButton,
  Flex,
  Select,
  IconButton,
  Divider,
} from "@chakra-ui/react";
import { Plus, Trash2 } from "lucide-react";
import { useFormik } from "formik";
import * as Yup from "yup";
import Cookies from "js-cookie";
import { useDispatch, useSelector } from "react-redux";
import PageHeader, { FilterStack } from "../../Components/PageHeader";
import CameraCapture from "../../Components/CameraCapture";
import { getMediaUrl } from "../../utlls/useful";
import { CSS_OPTIONAL_SUBJECTS } from "../../utlls/cssOptionalSubjects";
import { provinceSelectOptions, citySelectOptions, getCitiesForProvince } from "../../utlls/pakistanProvinces";
import SearchableTextSelect from "../../Components/SearchableTextSelect";
import {
  updateQualifier,
  fetchQualifiers,
} from "../../Features/qualifierSlice";
import {
  QUALIFICATION_OPTIONS,
  createEmptyEducationEntry,
  educationEntriesToFormRows,
  educationEntryHasContent,
  educationEntryIsComplete,
  formRowsToEducationPayload,
} from "../../utlls/qualifierEducation";

const defaultAvatar =
  "https://images.unsplash.com/photo-1619946794135-5bc917a27793?ixlib=rb-0.3.5&q=80&fm=jpg&crop=faces&fit=crop&h=200&w=200&s=b616b2c5b373a80ffc9636ba24f7a4a9";

const fieldStyles = {
  borderRadius: "0.5rem",
  bg: "white",
};

/** Hide auto-generated qualifier login emails (e.g. qualifier.03…@lca.local). */
const isDefaultQualifierEmail = (email) => {
  const value = String(email || "")
    .trim()
    .toLowerCase();
  if (!value) return true;
  return (
    value.endsWith("@lca.local") || value.startsWith("qualifier.")
  );
};

/** Full-page editable profile for logged-in qualifiers. */
function QualifierSelfProfile({ qualifier, loading }) {
  const [authToken] = useState(Cookies.get("authToken"));
  const [isEditing, setIsEditing] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [customSubject, setCustomSubject] = useState("");
  const { updateStatus } = useSelector((state) => state.qualifiers);
  const dispatch = useDispatch();

  const initialSubjects = useMemo(
    () =>
      Array.isArray(qualifier?.optional_subjects)
        ? qualifier.optional_subjects.filter(Boolean)
        : [],
    [qualifier]
  );

  const initialEducationEntries = useMemo(
    () => educationEntriesToFormRows(qualifier?.education_background),
    [qualifier]
  );

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: qualifier?.name || "",
      phone: qualifier?.phone || "",
      cnic: qualifier?.cnic || "",
      city: qualifier?.city || "",
      province: qualifier?.province || "",
      father_name: qualifier?.father_name || "",
      father_phone: qualifier?.father_phone || "",
      description: qualifier?.description || "",
      latest_degree: qualifier?.latest_degree || "",
      education_entries: initialEducationEntries,
      optional_subjects: initialSubjects,
      no_of_attempts:
        qualifier?.no_of_attempts != null
          ? String(qualifier.no_of_attempts)
          : "0",
    },
    validationSchema: Yup.object({
      name: Yup.string().trim().required("Required"),
      phone: Yup.string().trim().required("Required"),
      cnic: Yup.string().trim().required("Required"),
      city: Yup.string().trim().required("Required"),
      province: Yup.string().trim().required("Required"),
      father_name: Yup.string().trim().required("Required"),
      father_phone: Yup.string().trim().required("Required"),
      description: Yup.string().trim().required("Required"),
      latest_degree: Yup.string().trim().required("Required"),
      education_entries: Yup.array()
        .min(1, "Add at least one qualification")
        .test(
          "education-complete",
          "Add at least one complete qualification (level + institution)",
          (rows) => {
            const filled = formRowsToEducationPayload(rows || []);
            return filled.length > 0 && filled.every(educationEntryIsComplete);
          }
        )
        .test("education-rows-valid", function validateEducationRows(rows) {
          const list = rows || [];
          for (let index = 0; index < list.length; index += 1) {
            const row = list[index];
            if (!educationEntryHasContent(row)) continue;
            if (!String(row?.qualification || "").trim()) {
              return this.createError({
                path: `${this.path}[${index}].qualification`,
                message: "Required",
              });
            }
            if (!String(row?.institution || "").trim()) {
              return this.createError({
                path: `${this.path}[${index}].institution`,
                message: "Required",
              });
            }
          }
          return true;
        }),
      optional_subjects: Yup.array()
        .of(Yup.string().trim())
        .min(1, "Select at least one optional subject")
        .required("Required"),
      no_of_attempts: Yup.number()
        .transform((_value, original) => {
          if (original === "" || original === null || original === undefined) {
            return undefined;
          }
          const n = Number(original);
          return Number.isFinite(n) ? n : NaN;
        })
        .typeError("Must be a number")
        .required("Required")
        .min(0, "Must be 0 or more")
        .integer("Must be a whole number"),
    }),
    onSubmit: async (values) => {
      if (!qualifier?._id) return;
      if (!qualifier.photo && !photoFile) {
        formik.setStatus({ photo: "Photo is required" });
        return;
      }
      formik.setStatus(undefined);
      const formData = new FormData();
      formData.append("name", values.name.trim());
      formData.append("phone", values.phone.trim());
      formData.append("cnic", values.cnic.trim());
      formData.append("city", values.city.trim());
      formData.append("province", values.province.trim());
      formData.append("father_name", values.father_name.trim());
      formData.append("father_phone", values.father_phone.trim());
      formData.append("description", values.description.trim());
      formData.append("latest_degree", values.latest_degree.trim());
      formData.append(
        "education_background",
        JSON.stringify(formRowsToEducationPayload(values.education_entries))
      );
      formData.append(
        "no_of_attempts",
        String(Number(values.no_of_attempts))
      );
      formData.append(
        "optional_subjects",
        JSON.stringify(values.optional_subjects || [])
      );
      if (photoFile) {
        formData.append("photo", photoFile);
      }

      dispatch(
        updateQualifier({
          qualifierId: qualifier._id,
          formData,
          authToken,
        })
      )
        .unwrap()
        .then(() => {
          setIsEditing(false);
          setPhotoFile(null);
          dispatch(fetchQualifiers({ authToken }));
        })
        .catch(() => {});
    },
  });

  useEffect(() => {
    if (!isEditing) {
      setPhotoFile(null);
      setCustomSubject("");
    }
  }, [isEditing]);

  const toggleSubject = (subject) => {
    if (!isEditing) return;
    const current = formik.values.optional_subjects || [];
    const exists = current.some(
      (item) => item.toLowerCase() === subject.toLowerCase()
    );
    formik.setFieldValue(
      "optional_subjects",
      exists
        ? current.filter((item) => item.toLowerCase() !== subject.toLowerCase())
        : [...current, subject]
    );
  };

  const addCustomSubject = () => {
    if (!isEditing) return;
    const name = customSubject.trim();
    if (!name) return;
    const current = formik.values.optional_subjects || [];
    if (current.some((item) => item.toLowerCase() === name.toLowerCase())) {
      setCustomSubject("");
      return;
    }
    formik.setFieldValue("optional_subjects", [...current, name]);
    setCustomSubject("");
  };

  const removeSubject = (subject) => {
    if (!isEditing) return;
    formik.setFieldValue(
      "optional_subjects",
      (formik.values.optional_subjects || []).filter(
        (item) => item.toLowerCase() !== subject.toLowerCase()
      )
    );
  };

  const updateEducationEntry = (index, field, value) => {
    const rows = [...(formik.values.education_entries || [])];
    rows[index] = { ...rows[index], [field]: value };
    formik.setFieldValue("education_entries", rows);
  };

  const addEducationEntry = (presetQualification = "") => {
    if (!isEditing) return;
    formik.setFieldValue("education_entries", [
      ...(formik.values.education_entries || []),
      {
        ...createEmptyEducationEntry(),
        qualification: presetQualification,
      },
    ]);
  };

  const removeEducationEntry = (index) => {
    if (!isEditing) return;
    const rows = [...(formik.values.education_entries || [])];
    if (rows.length <= 1) return;
    rows.splice(index, 1);
    formik.setFieldValue("education_entries", rows);
  };

  if (loading) {
    return (
      <Center py={16}>
        <Spinner size="lg" color="#85652D" />
      </Center>
    );
  }

  if (!qualifier) {
    return (
      <>
        <PageHeader
          title="My Profile"
          subtitle="Your qualifier registration details"
        />
        <Box
          borderWidth="1px"
          borderColor="#E0E8EC"
          borderRadius="xl"
          bg="white"
          p={8}
          textAlign="center"
        >
          <Text color="gray.500">
            Qualifier profile not found. Please contact the academy.
          </Text>
        </Box>
      </>
    );
  }

  const isActive = qualifier.is_active !== false;
  const selectedSubjects = formik.values.optional_subjects || [];
  const showEmail = !isDefaultQualifierEmail(qualifier.email);

  return (
    <Box w="full" minW={0} maxW="100%" overflowX="hidden">
      <PageHeader
        title="My Profile"
        subtitle="Update your details, education, and optional subjects"
      >
        <FilterStack className="filter-stack--actions">
          {!isEditing ? (
            <button
              className="table-action-btn w-full sm:w-auto justify-center"
              type="button"
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </button>
          ) : (
            <>
              <Button
                variant="ghost"
                borderRadius="0.75rem"
                w={{ base: "full", sm: "auto" }}
                minH="44px"
                onClick={() => {
                  formik.resetForm();
                  setIsEditing(false);
                  setPhotoFile(null);
                }}
              >
                Cancel
              </Button>
              <Button
                borderRadius="0.75rem"
                backgroundColor="#FFCB82"
                color="#85652D"
                _hover={{ backgroundColor: "#E3B574", color: "#654E26" }}
                fontWeight="500"
                w={{ base: "full", sm: "auto" }}
                minH="44px"
                isLoading={updateStatus === "loading"}
                loadingText="Saving"
                onClick={formik.handleSubmit}
              >
                Save Changes
              </Button>
            </>
          )}
        </FilterStack>
      </PageHeader>

      <Box
        as="form"
        onSubmit={isEditing ? formik.handleSubmit : (e) => e.preventDefault()}
        borderWidth="1px"
        borderColor="#E0E8EC"
        borderRadius="xl"
        bg="white"
        p={{ base: 3, sm: 4, md: 6 }}
        w="full"
        minW={0}
        overflowX="hidden"
      >
        <VStack align="stretch" spacing={{ base: 5, md: 6 }}>
          <Flex
            direction={{ base: "column", sm: "row" }}
            spacing={4}
            gap={4}
            align={{ base: "flex-start", sm: "center" }}
          >
            <Image
              src={
                photoFile
                  ? URL.createObjectURL(photoFile)
                  : getMediaUrl(qualifier.photo) || defaultAvatar
              }
              alt={qualifier.name || "Qualifier"}
              boxSize={{ base: "80px", md: "96px" }}
              objectFit="cover"
              borderRadius="full"
              flexShrink={0}
            />
            <Box minW={0}>
              <Text
                fontSize={{ base: "lg", md: "2xl" }}
                fontWeight="600"
                noOfLines={2}
                wordBreak="break-word"
              >
                {formik.values.name || "—"}
              </Text>
              <Badge
                mt={1}
                colorScheme={isActive ? "green" : "gray"}
                borderRadius="md"
                px={2}
                py={0.5}
              >
                {isActive ? "Active" : "Inactive"}
              </Badge>
            </Box>
          </Flex>

          {isEditing ? (
            <Box>
              <CameraCapture
                onCapture={(file) => {
                  setPhotoFile(file);
                  formik.setStatus(undefined);
                }}
                label="Update Photo *"
              />
              {formik.status?.photo ? (
                <Text color="red" fontSize="sm" mt={1}>
                  {formik.status.photo}
                </Text>
              ) : !qualifier.photo && !photoFile ? (
                <Text color="gray.500" fontSize="xs" mt={1}>
                  Photo is required
                </Text>
              ) : null}
            </Box>
          ) : null}

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <FormControl isRequired={isEditing}>
              <FormLabel fontSize={14}>Name</FormLabel>
              <Input
                name="name"
                {...fieldStyles}
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                isReadOnly={!isEditing}
                bg={isEditing ? "white" : "gray.50"}
              />
              {isEditing && formik.touched.name && formik.errors.name ? (
                <Text color="red" fontSize="sm">
                  {formik.errors.name}
                </Text>
              ) : null}
            </FormControl>

            <FormControl isRequired={isEditing}>
              <FormLabel fontSize={14}>Phone</FormLabel>
              <Input
                name="phone"
                {...fieldStyles}
                value={formik.values.phone}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                isReadOnly={!isEditing}
                bg={isEditing ? "white" : "gray.50"}
              />
              {isEditing && formik.touched.phone && formik.errors.phone ? (
                <Text color="red" fontSize="sm">
                  {formik.errors.phone}
                </Text>
              ) : null}
            </FormControl>

            {showEmail ? (
              <FormControl>
                <FormLabel fontSize={14}>Email</FormLabel>
                <Input
                  {...fieldStyles}
                  value={qualifier.email || ""}
                  isReadOnly
                  bg="gray.50"
                />
              </FormControl>
            ) : null}

            <FormControl isRequired={isEditing}>
              <FormLabel fontSize={14}>CNIC</FormLabel>
              <Input
                name="cnic"
                {...fieldStyles}
                value={formik.values.cnic}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                isReadOnly={!isEditing}
                bg={isEditing ? "white" : "gray.50"}
              />
              {isEditing && formik.touched.cnic && formik.errors.cnic ? (
                <Text color="red" fontSize="sm">
                  {formik.errors.cnic}
                </Text>
              ) : null}
            </FormControl>

            <FormControl isRequired={isEditing}>
              <FormLabel fontSize={14}>Province</FormLabel>
              {isEditing ? (
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
                  onBlur={() => formik.setFieldTouched("province", true)}
                />
              ) : (
                <Input
                  {...fieldStyles}
                  value={formik.values.province || "—"}
                  isReadOnly
                  bg="gray.50"
                />
              )}
              {isEditing && formik.touched.province && formik.errors.province ? (
                <Text color="red" fontSize="sm">
                  {formik.errors.province}
                </Text>
              ) : null}
            </FormControl>

            <FormControl isRequired={isEditing}>
              <FormLabel fontSize={14}>City</FormLabel>
              {isEditing ? (
                <SearchableTextSelect
                  name="city"
                  placeholder={
                    formik.values.province
                      ? "Type to search city"
                      : "Select province first"
                  }
                  emptyMessage="No city found"
                  options={citySelectOptions(
                    formik.values.province,
                    formik.values.city
                  )}
                  value={formik.values.city}
                  onChange={(nextCity) => formik.setFieldValue("city", nextCity)}
                  onBlur={() => formik.setFieldTouched("city", true)}
                  isDisabled={!formik.values.province}
                />
              ) : (
                <Input
                  {...fieldStyles}
                  value={formik.values.city || "—"}
                  isReadOnly
                  bg="gray.50"
                />
              )}
              {isEditing && formik.touched.city && formik.errors.city ? (
                <Text color="red" fontSize="sm">
                  {formik.errors.city}
                </Text>
              ) : null}
            </FormControl>

            <FormControl isRequired={isEditing}>
              <FormLabel fontSize={14}>Father Name</FormLabel>
              <Input
                name="father_name"
                {...fieldStyles}
                value={formik.values.father_name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                isReadOnly={!isEditing}
                bg={isEditing ? "white" : "gray.50"}
              />
              {isEditing &&
              formik.touched.father_name &&
              formik.errors.father_name ? (
                <Text color="red" fontSize="sm">
                  {formik.errors.father_name}
                </Text>
              ) : null}
            </FormControl>

            <FormControl isRequired={isEditing}>
              <FormLabel fontSize={14}>Father Phone</FormLabel>
              <Input
                name="father_phone"
                {...fieldStyles}
                value={formik.values.father_phone}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                isReadOnly={!isEditing}
                bg={isEditing ? "white" : "gray.50"}
              />
              {isEditing &&
              formik.touched.father_phone &&
              formik.errors.father_phone ? (
                <Text color="red" fontSize="sm">
                  {formik.errors.father_phone}
                </Text>
              ) : null}
            </FormControl>

            <FormControl isRequired={isEditing}>
              <FormLabel fontSize={14}>No. of Attempts</FormLabel>
              <Input
                type="number"
                name="no_of_attempts"
                min={0}
                step={1}
                {...fieldStyles}
                value={formik.values.no_of_attempts}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                isReadOnly={!isEditing}
                bg={isEditing ? "white" : "gray.50"}
              />
              {isEditing &&
              formik.touched.no_of_attempts &&
              formik.errors.no_of_attempts ? (
                <Text color="red" fontSize="sm">
                  {formik.errors.no_of_attempts}
                </Text>
              ) : null}
            </FormControl>

            <FormControl>
              <FormLabel fontSize={14}>Interview Batch</FormLabel>
              <Input
                {...fieldStyles}
                value={qualifier.batch?.name || ""}
                isReadOnly
                bg="gray.50"
              />
            </FormControl>
          </SimpleGrid>

          <FormControl isRequired={isEditing}>
            <FormLabel fontSize={14}>Latest Degree</FormLabel>
            <Input
              name="latest_degree"
              {...fieldStyles}
              placeholder="e.g. BS Economics, Lahore University"
              value={formik.values.latest_degree}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              isReadOnly={!isEditing}
              bg={isEditing ? "white" : "gray.50"}
            />
            {isEditing &&
            formik.touched.latest_degree &&
            formik.errors.latest_degree ? (
              <Text color="red" fontSize="sm">
                {formik.errors.latest_degree}
              </Text>
            ) : null}
          </FormControl>

          <Box
            borderWidth="1px"
            borderColor={
              isEditing && formik.errors.education_entries
                ? "red.300"
                : "gray.200"
            }
            borderRadius="lg"
            p={{ base: 3, md: 4 }}
            bg="gray.50"
          >
            <Flex
              justify="space-between"
              align={{ base: "stretch", sm: "center" }}
              direction={{ base: "column", sm: "row" }}
              gap={3}
              mb={4}
            >
              <Box minW={0}>
                <Text fontWeight="600" fontSize="sm">
                  Education Background{isEditing ? " *" : ""}
                </Text>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Add one section for each qualification. You can add as many as
                  you need (Matric, Intermediate, Bachelor&apos;s, etc.).
                </Text>
              </Box>
              {isEditing ? (
                <Button
                  type="button"
                  size="sm"
                  leftIcon={<Plus size={14} />}
                  borderRadius="0.75rem"
                  onClick={() => addEducationEntry()}
                  flexShrink={0}
                  w={{ base: "full", sm: "auto" }}
                  minH="40px"
                >
                  Add Qualification
                </Button>
              ) : null}
            </Flex>

            {isEditing ? (
              <Wrap spacing={2} mb={4}>
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
            ) : null}

            {isEditing && typeof formik.errors.education_entries === "string" ? (
              <Text color="red" fontSize="sm" mb={3}>
                {formik.errors.education_entries}
              </Text>
            ) : null}

            <VStack align="stretch" spacing={4}>
              {(formik.values.education_entries || []).map((entry, index) => {
                const entryErrors =
                  Array.isArray(formik.errors.education_entries) &&
                  formik.errors.education_entries[index]
                    ? formik.errors.education_entries[index]
                    : {};
                const entryTouched =
                  Array.isArray(formik.touched.education_entries) &&
                  formik.touched.education_entries[index]
                    ? formik.touched.education_entries[index]
                    : {};

                return (
                  <Box
                    key={entry.id || `education_${index}`}
                    borderWidth="1px"
                    borderColor="#E0E8EC"
                    borderRadius="lg"
                    bg="white"
                    p={{ base: 3, md: 4 }}
                    minW={0}
                  >
                    <Flex justify="space-between" align="center" mb={3}>
                      <Text fontWeight="600" fontSize="sm" color="#85652D">
                        Qualification {index + 1}
                      </Text>
                      {isEditing &&
                      (formik.values.education_entries || []).length > 1 ? (
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

                    <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
                      <FormControl isRequired={isEditing}>
                        <FormLabel fontSize={14}>Qualification</FormLabel>
                        {isEditing ? (
                          <Select
                            {...fieldStyles}
                            placeholder="Select qualification"
                            value={entry.qualification || ""}
                            onChange={(e) =>
                              updateEducationEntry(
                                index,
                                "qualification",
                                e.target.value
                              )
                            }
                            onBlur={() =>
                              formik.setFieldTouched(
                                `education_entries[${index}].qualification`,
                                true
                              )
                            }
                          >
                            {QUALIFICATION_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </Select>
                        ) : (
                          <Input
                            {...fieldStyles}
                            value={entry.qualification || "—"}
                            isReadOnly
                            bg="gray.50"
                          />
                        )}
                        {isEditing &&
                        entryTouched.qualification &&
                        entryErrors.qualification ? (
                          <Text color="red" fontSize="sm">
                            {entryErrors.qualification}
                          </Text>
                        ) : null}
                      </FormControl>

                      <FormControl isRequired={isEditing}>
                        <FormLabel fontSize={14}>Institution</FormLabel>
                        <Input
                          {...fieldStyles}
                          value={entry.institution || ""}
                          onChange={(e) =>
                            updateEducationEntry(
                              index,
                              "institution",
                              e.target.value
                            )
                          }
                          onBlur={() =>
                            formik.setFieldTouched(
                              `education_entries[${index}].institution`,
                              true
                            )
                          }
                          isReadOnly={!isEditing}
                          bg={isEditing ? "white" : "gray.50"}
                          placeholder="School / College / University"
                        />
                        {isEditing &&
                        entryTouched.institution &&
                        entryErrors.institution ? (
                          <Text color="red" fontSize="sm">
                            {entryErrors.institution}
                          </Text>
                        ) : null}
                      </FormControl>

                      <FormControl>
                        <FormLabel fontSize={14}>Board / University</FormLabel>
                        <Input
                          {...fieldStyles}
                          value={entry.board_or_university || ""}
                          onChange={(e) =>
                            updateEducationEntry(
                              index,
                              "board_or_university",
                              e.target.value
                            )
                          }
                          isReadOnly={!isEditing}
                          bg={isEditing ? "white" : "gray.50"}
                          placeholder="e.g. BISE Lahore, PU"
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel fontSize={14}>Year</FormLabel>
                        <Input
                          {...fieldStyles}
                          value={entry.year || ""}
                          onChange={(e) =>
                            updateEducationEntry(
                              index,
                              "year",
                              e.target.value
                            )
                          }
                          isReadOnly={!isEditing}
                          bg={isEditing ? "white" : "gray.50"}
                          placeholder="e.g. 2022"
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel fontSize={14}>Grade / Division</FormLabel>
                        <Input
                          {...fieldStyles}
                          value={entry.grade || ""}
                          onChange={(e) =>
                            updateEducationEntry(
                              index,
                              "grade",
                              e.target.value
                            )
                          }
                          isReadOnly={!isEditing}
                          bg={isEditing ? "white" : "gray.50"}
                          placeholder="e.g. A+, 1st Division"
                        />
                      </FormControl>
                    </SimpleGrid>

                    <FormControl mt={4}>
                      <FormLabel fontSize={14}>Additional Details</FormLabel>
                      <Textarea
                        {...fieldStyles}
                        rows={2}
                        value={entry.details || ""}
                        onChange={(e) =>
                          updateEducationEntry(index, "details", e.target.value)
                        }
                        isReadOnly={!isEditing}
                        bg={isEditing ? "white" : "gray.50"}
                        placeholder="Subjects, achievements, or other notes"
                      />
                    </FormControl>

                    {index <
                    (formik.values.education_entries || []).length - 1 ? (
                      <Divider mt={4} borderColor="gray.200" />
                    ) : null}
                  </Box>
                );
              })}
            </VStack>

            {isEditing ? (
              <Button
                type="button"
                mt={4}
                w="full"
                variant="outline"
                borderRadius="0.75rem"
                borderColor="#E3B574"
                color="#85652D"
                leftIcon={<Plus size={16} />}
                _hover={{ bg: "#FFF8EE" }}
                onClick={() => addEducationEntry()}
              >
                Add Another Qualification
              </Button>
            ) : null}
          </Box>

          <FormControl isRequired={isEditing}>
            <FormLabel fontSize={14}>Remarks</FormLabel>
            <Textarea
              name="description"
              {...fieldStyles}
              rows={3}
              value={formik.values.description}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              isReadOnly={!isEditing}
              bg={isEditing ? "white" : "gray.50"}
            />
            {isEditing &&
            formik.touched.description &&
            formik.errors.description ? (
              <Text color="red" fontSize="sm">
                {formik.errors.description}
              </Text>
            ) : null}
          </FormControl>

          <Box
            borderWidth="1px"
            borderColor={
              isEditing && formik.errors.optional_subjects
                ? "red.300"
                : "gray.200"
            }
            borderRadius="lg"
            p={{ base: 3, md: 4 }}
            bg="gray.50"
          >
            <Text fontWeight="600" fontSize="sm" mb={1}>
              Optional Subjects{isEditing ? " *" : ""}
            </Text>
            <Text fontSize="xs" color="gray.500" mb={3}>
              {isEditing
                ? "Select at least one CSS optional subject, or add a custom subject."
                : "Your selected optional subjects."}
            </Text>
            {isEditing && formik.errors.optional_subjects ? (
              <Text color="red" fontSize="sm" mb={2}>
                {formik.errors.optional_subjects}
              </Text>
            ) : null}

            {selectedSubjects.length > 0 && (
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
                      {isEditing ? (
                        <TagCloseButton
                          onClick={() => removeSubject(subject)}
                        />
                      ) : null}
                    </Tag>
                  </WrapItem>
                ))}
              </Wrap>
            )}

            {isEditing ? (
              <>
                <SimpleGrid
                  columns={{ base: 1, sm: 2, md: 3 }}
                  spacing={2}
                  mb={4}
                >
                  {CSS_OPTIONAL_SUBJECTS.map((subject) => {
                    const checked = selectedSubjects.some(
                      (item) =>
                        item.toLowerCase() === subject.toLowerCase()
                    );
                    return (
                      <Checkbox
                        key={subject}
                        isChecked={checked}
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
                    w={{ base: "full", sm: "auto" }}
                    minH="44px"
                  >
                    Add Subject
                  </Button>
                </Flex>
              </>
            ) : selectedSubjects.length === 0 ? (
              <Input
                {...fieldStyles}
                value=""
                placeholder="No optional subjects"
                isReadOnly
                bg="gray.50"
              />
            ) : null}
          </Box>
        </VStack>
      </Box>
    </Box>
  );
}

export default QualifierSelfProfile;
