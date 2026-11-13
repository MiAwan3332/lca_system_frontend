import AccessForm from "../../Components/AccessForm";
import React, { useMemo, useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Badge,
  Box,
  Image,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Flex,
  useToast,
  Wrap,
  WrapItem,
  Tag,
} from "@chakra-ui/react";
import {
  Eye,
  Printer,
  Download,
  GraduationCap,
  BookOpen,
  IdCard,
  ClipboardList,
} from "lucide-react";
import ActionButton from "../../Components/ActionButton";
import { getMediaUrl } from "../../utlls/useful";
import { normalizeEducationBackground } from "../../utlls/qualifierEducation";
import { generateQualifierCvPdf } from "../../utlls/generateQualifierCvPdf";
import {
  getResponsiveModalSize,
  responsiveModalContentProps,
  responsiveModalProps,
} from "../../utlls/responsiveModal";

const defaultAvatar =
  "https://images.unsplash.com/photo-1619946794135-5bc917a27793?ixlib=rb-0.3.5&q=80&fm=jpg&crop=faces&fit=crop&h=200&w=200&s=b616b2c5b373a80ffc9636ba24f7a4a9";

function ProfileSection({ icon: Icon, title, children }) {
  return (
    <Box
      bg="white"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="blackAlpha.100"
      overflow="hidden"
      boxShadow="sm"
    >
      <Flex
        align="center"
        gap={3}
        px={{ base: 4, md: 5 }}
        py={3}
        bg="#F3F6F9"
        borderBottomWidth="1px"
        borderColor="blackAlpha.100"
      >
        <Flex
          align="center"
          justify="center"
          w="28px"
          h="28px"
          borderRadius="md"
          bg="#163150"
          color="white"
          flexShrink={0}
        >
          <Icon size={14} />
        </Flex>
        <Text
          fontSize="xs"
          fontWeight="700"
          letterSpacing="0.08em"
          textTransform="uppercase"
          color="#163150"
        >
          {title}
        </Text>
        <Box flex="1" h="1px" bg="#C4954A" opacity={0.45} />
      </Flex>
      <Box px={{ base: 4, md: 5 }} py={{ base: 4, md: 5 }}>
        {children}
      </Box>
    </Box>
  );
}

function FieldCell({ label, value }) {
  return (
    <Box
      borderWidth="1px"
      borderColor="blackAlpha.100"
      borderRadius="lg"
      bg="#FAFBFC"
      px={3.5}
      py={3}
      minH="64px"
    >
      <Text
        fontSize="10px"
        fontWeight="700"
        letterSpacing="0.06em"
        textTransform="uppercase"
        color="gray.500"
        mb={1}
      >
        {label}
      </Text>
      <Text
        fontWeight="600"
        color="#1C242C"
        fontSize="sm"
        whiteSpace="pre-wrap"
        lineHeight="1.35"
      >
        {value || "—"}
      </Text>
    </Box>
  );
}

function ViewQualifierModal({ qualifier }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const toast = useToast();
  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);

  const isActive = qualifier?.is_active !== false;
  const education = useMemo(
    () => normalizeEducationBackground(qualifier?.education_background),
    [qualifier?.education_background]
  );
  const subjects = useMemo(
    () =>
      Array.isArray(qualifier?.optional_subjects)
        ? qualifier.optional_subjects.filter(Boolean)
        : [],
    [qualifier?.optional_subjects]
  );

  const subtitle = [
    qualifier?.exam_type,
    qualifier?.class_type,
    qualifier?.batch?.name,
  ]
    .filter(Boolean)
    .join(" · ");

  const handlePdf = async (mode) => {
    setPdfBusy(true);
    try {
      const result = await generateQualifierCvPdf(qualifier, { mode });
      toast({
        title: mode === "print" ? "CV opened for printing" : "CV downloaded",
        description: result?.fileName,
        status: "success",
        duration: 3500,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Could not generate CV PDF",
        description: error?.message || "Please try again.",
        status: "error",
        duration: 4500,
        isClosable: true,
      });
    } finally {
      setPdfBusy(false);
    }
  };

  return (
    <>
      <ActionButton
        variant="slate"
        icon={<Eye size={16} />}
        label="View Details"
        onClick={onOpen}
      />

      <Modal
        isOpen={isOpen}
        onClose={onClose}
        {...responsiveModalProps}
        {...getResponsiveModalSize("3xl")}
      >
        <ModalOverlay bg="blackAlpha.500" backdropFilter="blur(2px)" />
        <AccessForm
          permissionMode="read"
          component={ModalContent}
          {...responsiveModalContentProps}
          borderRadius={{ base: 0, sm: "1.25rem" }}
          overflow="hidden"
          bg="#EEF1F5"
        >
          <Box
            bg="#163150"
            color="white"
            px={{ base: 5, md: 7 }}
            pt={{ base: 5, md: 6 }}
            pb={{ base: 5, md: 6 }}
            position="relative"
          >
            <Box
              position="absolute"
              left={0}
              right={0}
              bottom={0}
              h="3px"
              bg="#C4954A"
            />
            <Flex
              direction={{ base: "column", sm: "row" }}
              align={{ base: "flex-start", sm: "center" }}
              gap={4}
              pr={8}
            >
              <Box
                p="3px"
                borderRadius="xl"
                bg="whiteAlpha.300"
                flexShrink={0}
              >
                <Image
                  src={getMediaUrl(qualifier?.photo) || defaultAvatar}
                  alt={qualifier?.name || "Qualifier"}
                  boxSize={{ base: "96px", md: "112px" }}
                  objectFit="cover"
                  borderRadius="lg"
                  bg="white"
                />
              </Box>
              <Box flex="1" minW={0}>
                <Text
                  fontSize="11px"
                  fontWeight="700"
                  letterSpacing="0.1em"
                  textTransform="uppercase"
                  color="#C4954A"
                  mb={1}
                >
                  Official Candidate Profile
                </Text>
                <Text
                  fontSize={{ base: "xl", md: "2xl" }}
                  fontWeight="700"
                  letterSpacing="-0.02em"
                  noOfLines={2}
                >
                  {qualifier?.name || "—"}
                </Text>
                <Text mt={1} fontSize="sm" color="whiteAlpha.800" noOfLines={2}>
                  {subtitle || "Interview Qualifier"}
                </Text>
                <HStack mt={3} spacing={2} flexWrap="wrap">
                  <Badge
                    bg={isActive ? "#E8F8EC" : "whiteAlpha.300"}
                    color={isActive ? "#257947" : "white"}
                    borderRadius="md"
                    px={2.5}
                    py={0.5}
                  >
                    {isActive ? "Active" : "Inactive"}
                  </Badge>
                  {qualifier?.exam_type ? (
                    <Badge
                      bg="whiteAlpha.200"
                      color="white"
                      borderRadius="md"
                      px={2.5}
                      py={0.5}
                    >
                      {qualifier.exam_type}
                    </Badge>
                  ) : null}
                  {qualifier?.class_type ? (
                    <Badge
                      bg="whiteAlpha.200"
                      color="white"
                      borderRadius="md"
                      px={2.5}
                      py={0.5}
                    >
                      {qualifier.class_type}
                    </Badge>
                  ) : null}
                  {qualifier?.batch?.name ? (
                    <Badge
                      bg="whiteAlpha.200"
                      color="white"
                      borderRadius="md"
                      px={2.5}
                      py={0.5}
                    >
                      {qualifier.batch.name}
                    </Badge>
                  ) : null}
                </HStack>
              </Box>
            </Flex>
            <ModalCloseButton color="white" top={3} right={3} />
          </Box>

          <ModalBody px={{ base: 4, md: 6 }} py={{ base: 5, md: 6 }}>
            <VStack align="stretch" spacing={4}>
              <ProfileSection icon={IdCard} title="Personal Information">
                <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
                  <FieldCell label="Phone" value={qualifier?.phone} />
                  <FieldCell label="Email" value={qualifier?.email} />
                  <FieldCell label="CNIC" value={qualifier?.cnic} />
                  <FieldCell label="City" value={qualifier?.city} />
                  <FieldCell label="Province" value={qualifier?.province} />
                  <FieldCell
                    label="Father Name"
                    value={qualifier?.father_name}
                  />
                  <FieldCell
                    label="Father Phone"
                    value={qualifier?.father_phone}
                  />
                  <FieldCell
                    label="Interview Batch"
                    value={qualifier?.batch?.name}
                  />
                </SimpleGrid>
              </ProfileSection>

              <ProfileSection icon={ClipboardList} title="Exam Profile">
                <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
                  <FieldCell label="CSS / PMS" value={qualifier?.exam_type} />
                  <FieldCell
                    label="CSS/PMS Roll No"
                    value={qualifier?.css_pms_roll_no}
                  />
                  <FieldCell label="Mode" value={qualifier?.class_type} />
                  <FieldCell
                    label="No. of Attempts"
                    value={
                      qualifier?.no_of_attempts != null
                        ? String(qualifier.no_of_attempts)
                        : "0"
                    }
                  />
                  <FieldCell
                    label="Latest Degree"
                    value={qualifier?.latest_degree}
                  />
                </SimpleGrid>
              </ProfileSection>

              <ProfileSection icon={BookOpen} title="Optional Subjects">
                {subjects.length ? (
                  <Wrap spacing={2}>
                    {subjects.map((subject) => (
                      <WrapItem key={subject}>
                        <Tag
                          size="lg"
                          borderRadius="md"
                          bg="#FFF6E8"
                          color="#6F5224"
                          borderWidth="1px"
                          borderColor="#E8D2A8"
                          fontWeight="600"
                          px={3}
                          py={1.5}
                        >
                          {subject}
                        </Tag>
                      </WrapItem>
                    ))}
                  </Wrap>
                ) : (
                  <Text fontSize="sm" color="gray.500">
                    No optional subjects listed
                  </Text>
                )}
              </ProfileSection>

              <ProfileSection icon={GraduationCap} title="Education">
                {education.length ? (
                  <VStack align="stretch" spacing={3}>
                    {education.map((entry, index) => (
                      <Box
                        key={`${entry.qualification}-${index}`}
                        borderWidth="1px"
                        borderColor="blackAlpha.100"
                        borderRadius="lg"
                        overflow="hidden"
                        bg="#FAFBFC"
                      >
                        <Flex>
                          <Box w="4px" bg="#C4954A" flexShrink={0} />
                          <Box px={4} py={3.5} flex="1">
                            <Text
                              fontWeight="700"
                              color="#163150"
                              fontSize="sm"
                            >
                              {entry.qualification || "Qualification"}
                            </Text>
                            <Text fontSize="sm" color="#1C242C" mt={0.5}>
                              {entry.institution || "—"}
                            </Text>
                            <Text fontSize="xs" color="gray.500" mt={1.5}>
                              {[
                                entry.board_or_university,
                                entry.year,
                                entry.grade ? `Grade: ${entry.grade}` : "",
                              ]
                                .filter(Boolean)
                                .join(" · ") || "—"}
                            </Text>
                            {entry.details ? (
                              <Text fontSize="sm" color="gray.600" mt={2}>
                                {entry.details}
                              </Text>
                            ) : null}
                          </Box>
                        </Flex>
                      </Box>
                    ))}
                  </VStack>
                ) : (
                  <Text fontSize="sm" color="gray.500">
                    No education details recorded
                  </Text>
                )}
              </ProfileSection>
            </VStack>
          </ModalBody>

          <ModalFooter
            bg="white"
            borderTopWidth="1px"
            borderColor="blackAlpha.100"
            gap={2}
            flexWrap="wrap"
          >
            <Button
              variant="ghost"
              borderRadius="0.75rem"
              onClick={onClose}
              mr="auto"
            >
              Close
            </Button>
            <Button
              leftIcon={<Download size={16} />}
              borderRadius="0.75rem"
              variant="outline"
              borderColor="#C4954A"
              color="#85652D"
              _hover={{ bg: "#FFF3E0" }}
              onClick={() => handlePdf("download")}
              isLoading={pdfBusy}
              loadingText="Preparing..."
            >
              Download CV
            </Button>
            <Button
              leftIcon={<Printer size={16} />}
              borderRadius="0.75rem"
              bg="#163150"
              color="white"
              _hover={{ bg: "#0F2438" }}
              onClick={() => handlePdf("print")}
              isLoading={pdfBusy}
              loadingText="Preparing..."
            >
              Print CV PDF
            </Button>
          </ModalFooter>
        </AccessForm>
      </Modal>
    </>
  );
}

export default ViewQualifierModal;
