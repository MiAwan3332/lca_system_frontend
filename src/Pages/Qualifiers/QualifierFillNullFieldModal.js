import React, { useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, Button, Text, FormControl, FormLabel, Input, Alert, AlertIcon, Table, Thead, Tbody, Tr, Th, Td, TableContainer, Box, Flex, HStack, VStack, Badge, SimpleGrid, Divider, useToast } from "@chakra-ui/react";
import { useDispatch, useSelector } from "react-redux";
import { FormInput, Users, Sparkles } from "lucide-react";
import {
  fillNullQualifierField,
  fetchQualifiers,
} from "../../Features/qualifierSlice";
import {
  fetchBatches,
  selectActiveInterviewBatches,
} from "../../Features/batchSlice";
import SearchableBatchSelect from "../../Components/SearchableBatchSelect";
import SearchableTextSelect from "../../Components/SearchableTextSelect";
import {
  provinceSelectOptions,
  citySelectOptions,
  getCitiesForProvince,
} from "../../utlls/pakistanProvinces";
import LcaLogoLoading from "../../Components/LcaLogoLoading";
import {
  getResponsiveModalSize,
  responsiveModalContentProps,
} from "../../utlls/responsiveModal";

const FIELD_OPTIONS = [
  { value: "exam_type", label: "CSS/PMS", hint: "Exam track" },
  { value: "class_type", label: "Mode", hint: "Online / On Campus" },
  { value: "province", label: "Province", hint: "Pakistan province" },
  { value: "city", label: "City", hint: "By province" },
  { value: "father_name", label: "Father name", hint: "Guardian" },
  { value: "father_phone", label: "Father phone", hint: "Contact" },
  { value: "css_pms_roll_no", label: "CSS/PMS roll", hint: "Roll number" },
  { value: "cnic", label: "CNIC", hint: "National ID" },
  { value: "latest_degree", label: "Latest degree", hint: "Education" },
];

const accent = {
  soft: "#FFF8EE",
  border: "#F0D9B0",
  solid: "#FFCB82",
  solidHover: "#E3B574",
  text: "#654E26",
  muted: "#8A7350",
};

function QualifierFillNullFieldModal({ isOpen, onClose }) {
  const toast = useToast();
  const dispatch = useDispatch();
  const [authToken] = useState(Cookies.get("authToken"));
  const [field, setField] = useState("exam_type");
  const [value, setValue] = useState("");
  const [cityProvince, setCityProvince] = useState("");
  const [batchId, setBatchId] = useState("");
  const [matchedQualifiers, setMatchedQualifiers] = useState([]);
  const [matchedCount, setMatchedCount] = useState(null);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState("");
  const { fillNullFieldStatus } = useSelector((state) => state.qualifiers);
  const interviewBatches = useSelector(selectActiveInterviewBatches);

  const fieldMeta =
    FIELD_OPTIONS.find((item) => item.value === field) || FIELD_OPTIONS[0];
  const fieldLabel = fieldMeta.label;
  const hasValue = Boolean(String(value || "").trim());
  const canApply =
    hasValue && Boolean(matchedCount) && !listLoading && !listError;

  useEffect(() => {
    if (!isOpen) return;
    dispatch(
      fetchBatches({
        authToken,
        queryParams: { limit: 200, page: 1, query: "" },
      })
    );
  }, [isOpen, authToken, dispatch]);

  const resetState = () => {
    setField("exam_type");
    setValue("");
    setCityProvince("");
    setBatchId("");
    setMatchedQualifiers([]);
    setMatchedCount(null);
    setListLoading(false);
    setListError("");
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const listArgs = useMemo(
    () => ({
      field,
      batch_id: batchId || undefined,
    }),
    [field, batchId]
  );

  useEffect(() => {
    if (!isOpen || !listArgs.field) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      setListLoading(true);
      setListError("");
      try {
        const result = await dispatch(
          fillNullQualifierField({
            authToken,
            field: listArgs.field,
            batch_id: listArgs.batch_id,
            value: "",
            preview: true,
          })
        ).unwrap();
        if (!cancelled) {
          setMatchedQualifiers(
            Array.isArray(result?.qualifiers) ? result.qualifiers : []
          );
          setMatchedCount(Number(result?.matched_count) || 0);
        }
      } catch (error) {
        if (!cancelled) {
          setMatchedQualifiers([]);
          setMatchedCount(null);
          setListError(
            typeof error === "string"
              ? error
              : error?.message ||
                  "Could not load qualifiers with an empty value for this field."
          );
        }
      } finally {
        if (!cancelled) setListLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isOpen, listArgs, authToken, dispatch]);

  const handleFieldSelect = (nextField) => {
    if (nextField === field) return;
    setField(nextField);
    setValue("");
    setCityProvince("");
    setMatchedQualifiers([]);
    setMatchedCount(null);
    setListError("");
  };

  const handleApply = async () => {
    if (!hasValue) {
      toast({
        title: "Value required",
        description: `Enter a ${fieldLabel.toLowerCase()} to apply.`,
        status: "warning",
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    if (!matchedCount) {
      toast({
        title: "No qualifiers to update",
        description: `No qualifiers have an empty ${fieldLabel.toLowerCase()}.`,
        status: "info",
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    try {
      const result = await dispatch(
        fillNullQualifierField({
          authToken,
          field,
          value: String(value).trim(),
          batch_id: batchId || undefined,
          preview: false,
        })
      ).unwrap();

      if ((Number(result?.modified_count) || 0) > 0) {
        dispatch(fetchQualifiers({ authToken }));
      }
      handleClose();
    } catch {
      // Toast handled in slice
    }
  };

  const renderValueInput = () => {
    if (field === "exam_type") {
      return (
        <HStack spacing={3} w="full">
          {["CSS", "PMS"].map((option) => {
            const selected = value === option;
            return (
              <Button
                key={option}
                type="button"
                flex={1}
                h="3.25rem"
                borderRadius="xl"
                border="1px solid"
                borderColor={selected ? accent.solidHover : "#E0E8EC"}
                bg={selected ? accent.solid : "white"}
                color={selected ? accent.text : "gray.700"}
                fontWeight="700"
                fontSize="md"
                _hover={{ bg: selected ? accent.solidHover : accent.soft }}
                onClick={() => setValue(option)}
              >
                {option}
              </Button>
            );
          })}
        </HStack>
      );
    }

    if (field === "class_type") {
      return (
        <HStack spacing={3} w="full">
          {["Online", "On Campus"].map((option) => {
            const selected = value === option;
            return (
              <Button
                key={option}
                type="button"
                flex={1}
                h="3.25rem"
                borderRadius="xl"
                border="1px solid"
                borderColor={selected ? accent.solidHover : "#E0E8EC"}
                bg={selected ? accent.solid : "white"}
                color={selected ? accent.text : "gray.700"}
                fontWeight="600"
                _hover={{ bg: selected ? accent.solidHover : accent.soft }}
                onClick={() => setValue(option)}
              >
                {option}
              </Button>
            );
          })}
        </HStack>
      );
    }

    if (field === "province") {
      return (
        <SearchableTextSelect
          name="province"
          placeholder="Type to search province"
          emptyMessage="No province found"
          options={provinceSelectOptions(value)}
          value={value}
          onChange={(next) => setValue(next)}
        />
      );
    }

    if (field === "city") {
      return (
        <VStack align="stretch" spacing={3}>
          <FormControl>
            <FormLabel fontSize="sm" color={accent.muted} mb={1}>
              Province (to list cities)
            </FormLabel>
            <SearchableTextSelect
              name="city_province"
              placeholder="Type to search province"
              emptyMessage="No province found"
              options={provinceSelectOptions(cityProvince)}
              value={cityProvince}
              onChange={(next) => {
                setCityProvince(next);
                if (value && !getCitiesForProvince(next).includes(value)) {
                  setValue("");
                }
              }}
            />
          </FormControl>
          <SearchableTextSelect
            name="city"
            placeholder={
              cityProvince ? "Type to search city" : "Select province first"
            }
            emptyMessage="No city found"
            options={citySelectOptions(cityProvince, value)}
            value={value}
            onChange={(next) => setValue(next)}
            isDisabled={!cityProvince}
          />
        </VStack>
      );
    }

    return (
      <Input
        size="lg"
        borderRadius="xl"
        borderColor="#E0E8EC"
        bg="white"
        placeholder={`Enter ${fieldLabel.toLowerCase()}`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        _focusVisible={{ borderColor: accent.solid, boxShadow: "0 0 0 1px #FFCB82" }}
      />
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      isCentered
      scrollBehavior="inside"
      {...getResponsiveModalSize("4xl")}
    >
      <ModalOverlay bg="blackAlpha.500" backdropFilter="blur(2px)" />
      <ModalContent
        {...responsiveModalContentProps}
        borderRadius="2xl"
        overflow="hidden"
        border="1px solid"
        borderColor={accent.border}
      >
        <Box
          bg={accent.soft}
          borderBottom="1px solid"
          borderColor={accent.border}
          px={6}
          py={5}
          pr={12}
        >
          <HStack spacing={3} align="flex-start">
            <Flex
              w={11}
              h={11}
              borderRadius="xl"
              bg={accent.solid}
              color={accent.text}
              align="center"
              justify="center"
              flexShrink={0}
            >
              <FormInput size={22} />
            </Flex>
            <Box>
              <ModalHeader p={0} fontSize="xl" color={accent.text}>
                Fill empty qualifier field
              </ModalHeader>
              <Text fontSize="sm" color={accent.muted} mt={1} lineHeight="1.45">
                Pick a field, review who is missing it, then apply one value.
                Existing data is never overwritten.
              </Text>
            </Box>
          </HStack>
        </Box>
        <ModalCloseButton top={4} right={4} borderRadius="lg" />

        <ModalBody px={6} py={5}>
          <VStack align="stretch" spacing={5}>
            <Box>
              <Text
                fontSize="xs"
                fontWeight="700"
                letterSpacing="0.04em"
                textTransform="uppercase"
                color={accent.muted}
                mb={2}
              >
                1 · Choose field
              </Text>
              <SimpleGrid columns={{ base: 2, sm: 3 }} spacing={2}>
                {FIELD_OPTIONS.map((option) => {
                  const selected = field === option.value;
                  return (
                    <Button
                      key={option.value}
                      type="button"
                      h="auto"
                      py={3}
                      px={3}
                      borderRadius="xl"
                      border="1px solid"
                      borderColor={selected ? accent.solidHover : "#E0E8EC"}
                      bg={selected ? accent.solid : "white"}
                      color={selected ? accent.text : "gray.700"}
                      _hover={{
                        bg: selected ? accent.solidHover : accent.soft,
                        borderColor: selected ? accent.solidHover : accent.border,
                      }}
                      onClick={() => handleFieldSelect(option.value)}
                    >
                      <VStack spacing={0} align="flex-start" w="full">
                        <Text fontSize="sm" fontWeight="700" lineHeight="1.2">
                          {option.label}
                        </Text>
                        <Text
                          fontSize="xs"
                          fontWeight="500"
                          opacity={0.75}
                          lineHeight="1.2"
                        >
                          {option.hint}
                        </Text>
                      </VStack>
                    </Button>
                  );
                })}
              </SimpleGrid>
            </Box>

            <Box>
              <Text
                fontSize="xs"
                fontWeight="700"
                letterSpacing="0.04em"
                textTransform="uppercase"
                color={accent.muted}
                mb={2}
              >
                2 · Optional batch filter
              </Text>
              <SearchableBatchSelect
                batches={interviewBatches}
                value={batchId}
                onChange={setBatchId}
                placeholder="All interview batches"
                width="100%"
              />
              <Text fontSize="xs" color="gray.500" mt={1.5}>
                Leave blank to include every interview batch.
              </Text>
            </Box>

            <Box
              border="1px solid"
              borderColor={accent.border}
              borderRadius="2xl"
              overflow="hidden"
              bg="white"
            >
              <Flex
                px={4}
                py={3}
                bg={accent.soft}
                borderBottom="1px solid"
                borderColor={accent.border}
                align="center"
                justify="space-between"
                gap={3}
                wrap="wrap"
              >
                <HStack spacing={2}>
                  <Users size={16} color={accent.text} />
                  <Text fontWeight="700" fontSize="sm" color={accent.text}>
                    Empty {fieldLabel}
                  </Text>
                </HStack>
                <Badge
                  borderRadius="full"
                  px={3}
                  py={1}
                  bg={
                    listError
                      ? "red.100"
                      : matchedCount
                        ? accent.solid
                        : "gray.100"
                  }
                  color={
                    listError
                      ? "red.700"
                      : matchedCount
                        ? accent.text
                        : "gray.600"
                  }
                  fontWeight="700"
                >
                  {listLoading
                    ? "…"
                    : listError
                      ? "Error"
                      : matchedCount == null
                        ? "—"
                        : `${matchedCount} qualifier${matchedCount === 1 ? "" : "s"}`}
                </Badge>
              </Flex>

              {listLoading ? (
                <LcaLogoLoading size="sm" label="Loading" />
              ) : listError ? (
                <Alert status="error" borderRadius="none" variant="subtle">
                  <AlertIcon />
                  {listError}
                </Alert>
              ) : matchedCount === 0 ? (
                <Flex
                  direction="column"
                  align="center"
                  justify="center"
                  py={10}
                  px={4}
                  textAlign="center"
                  gap={2}
                >
                  <Sparkles size={28} color={accent.solidHover} />
                  <Text fontWeight="600" color={accent.text}>
                    All set for {fieldLabel}
                  </Text>
                  <Text fontSize="sm" color="gray.500" maxW="sm">
                    No qualifiers are missing this field
                    {batchId ? " in the selected batch" : ""}.
                  </Text>
                </Flex>
              ) : (
                <TableContainer maxH="280px" overflowY="auto">
                  <Table size="sm" variant="simple">
                    <Thead
                      position="sticky"
                      top={0}
                      bg="white"
                      zIndex={1}
                      boxShadow="inset 0 -1px 0 #EDF2F7"
                    >
                      <Tr>
                        <Th color={accent.muted}>No</Th>
                        <Th color={accent.muted}>Name</Th>
                        <Th color={accent.muted}>Phone</Th>
                        <Th color={accent.muted}>Batch</Th>
                        <Th color={accent.muted}>CSS/PMS</Th>
                        <Th color={accent.muted}>Status</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {matchedQualifiers.map((qualifier, index) => (
                        <Tr
                          key={qualifier._id}
                          _hover={{ bg: accent.soft }}
                        >
                          <Td color="gray.500">{index + 1}</Td>
                          <Td fontWeight="600">{qualifier.name || "—"}</Td>
                          <Td>{qualifier.phone || "—"}</Td>
                          <Td>{qualifier.batch?.name || "—"}</Td>
                          <Td>{qualifier.exam_type || "—"}</Td>
                          <Td>
                            <Badge
                              colorScheme="orange"
                              borderRadius="md"
                              px={2}
                              textTransform="none"
                            >
                              Empty
                            </Badge>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              )}
              {matchedCount > matchedQualifiers.length ? (
                <Text fontSize="xs" color="gray.500" px={4} py={2} bg="gray.50">
                  Showing first {matchedQualifiers.length} of {matchedCount}.
                  Apply still updates all {matchedCount}.
                </Text>
              ) : null}
            </Box>

            <Box>
              <Text
                fontSize="xs"
                fontWeight="700"
                letterSpacing="0.04em"
                textTransform="uppercase"
                color={accent.muted}
                mb={2}
              >
                3 · Value to apply
              </Text>
              {renderValueInput()}
              {hasValue && matchedCount > 0 ? (
                <Alert
                  status="success"
                  variant="subtle"
                  borderRadius="xl"
                  mt={3}
                  bg="#F0FFF4"
                  border="1px solid"
                  borderColor="#C6F6D5"
                >
                  <AlertIcon />
                  <Text fontSize="sm">
                    <Text as="span" fontWeight="700">
                      {matchedCount}
                    </Text>{" "}
                    qualifier{matchedCount === 1 ? "" : "s"} will get{" "}
                    <Text as="span" fontWeight="700">
                      {fieldLabel}
                    </Text>
                    : “{String(value).trim()}”
                  </Text>
                </Alert>
              ) : null}
            </Box>
          </VStack>
        </ModalBody>

        <Divider borderColor={accent.border} />
        <ModalFooter gap={2} bg={accent.soft} px={6} py={4}>
          <Button
            variant="ghost"
            borderRadius="xl"
            onClick={handleClose}
            color={accent.muted}
          >
            Cancel
          </Button>
          <Button
            borderRadius="xl"
            backgroundColor={accent.solid}
            color={accent.text}
            fontWeight="700"
            px={6}
            _hover={{ backgroundColor: accent.solidHover }}
            _disabled={{ opacity: 0.5, cursor: "not-allowed" }}
            onClick={handleApply}
            isLoading={fillNullFieldStatus === "loading"}
            isDisabled={!canApply}
            leftIcon={<Sparkles size={16} />}
          >
            Update {matchedCount || 0} empty record
            {matchedCount === 1 ? "" : "s"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default QualifierFillNullFieldModal;
