import React, { useState, useEffect, useMemo } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Box,
  IconButton,
  Image,
  Grid,
  GridItem,
  Flex,
  Text,
  Link,
  Spinner,
  useToast,
} from "@chakra-ui/react";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { LogOut, Paperclip, View } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchStudents,
  fetchStudentHistory,
  selectStudentHistory,
  updateStudentInfo,
} from "../../Features/studentSlice";
import { setUser } from "../../Features/authSlice";
import { isStudentViewOnly, setProfileUpdatedOnce } from "../../utlls/studentAccess";
import { clearAuthSession } from "../../utlls/authSession";
import { getMediaUrl } from "../../utlls/useful.js";
import { getPaymentEvidenceUrls } from "../../utlls/paymentEvidence";
import {
  responsiveModalContentProps,
  responsiveModalProps,
  getResponsiveModalSize,
} from "../../utlls/responsiveModal";
import { formatStudentEmail } from "../../utlls/studentEmail";
import { provinceSelectOptions, citySelectOptions, getCitiesForProvince } from "../../utlls/pakistanProvinces";
import SearchableTextSelect from "../../Components/SearchableTextSelect";

function ViewModal({ student, forced = false, onComplete }) {
  const [isOpen, setIsOpen] = useState(forced);
  const [authToken] = useState(Cookies.get("authToken"));
  const [files, setFiles] = useState({
    image: null,
    cnic_image: null,
    cnic_back_image: null,
    latest_degree_image: null,
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const { updateStatus, fetchStudentHistoryStatus } = useSelector(
    (state) => state.students
  );
  const history = useSelector(selectStudentHistory);

  const viewOnlyStudent = isStudentViewOnly();
  const canEditProfile =
    viewOnlyStudent && !student.profile_updated_once;
  const profileLocked = viewOnlyStudent && student.profile_updated_once;
  const isForcedCompletion = forced && canEditProfile;

  const historyReady =
    fetchStudentHistoryStatus === "succeeded" &&
    history?.student &&
    String(history.student._id) === String(student._id);

  const paymentEvidenceItems = useMemo(() => {
    if (!historyReady || !Array.isArray(history?.payment_logs)) return [];
    const items = [];
    history.payment_logs.forEach((log) => {
      if (log.action_type !== "Paid") return;
      const urls = getPaymentEvidenceUrls(log.payment_evidence);
      urls.forEach((url, idx) => {
        items.push({
          url,
          key: `${log._id}-${idx}`,
          paymentMethod: log.payment_method || "Online Payment",
          date: log.action_date,
        });
      });
    });
    return items;
  }, [historyReady, history]);

  useEffect(() => {
    if (forced && canEditProfile) {
      setIsOpen(true);
    }
  }, [forced, canEditProfile]);

  useEffect(() => {
    if (!isOpen || !student?._id || !authToken) return;
    dispatch(fetchStudentHistory({ authToken, studentId: student._id }));
  }, [isOpen, student?._id, authToken, dispatch]);

  const onOpen = () => {
    setFiles({
      image: null,
      cnic_image: null,
      cnic_back_image: null,
      latest_degree_image: null,
    });
    setIsOpen(true);
  };
  const onClose = () => {
    if (isForcedCompletion) return;
    setIsOpen(false);
  };

  const handleLogout = () => {
    clearAuthSession();
    dispatch(setUser(null));
    setIsOpen(false);
    toast({
      title: "Logged out",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
    navigate("/login");
  };

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      cnic: student.cnic || "",
      city: student.city || "",
      province: student.province || "",
      date_of_birth: student.date_of_birth || "",
      father_name: student.father_name || "",
      father_phone: student.father_phone || "",
      latest_degree: student.latest_degree || "",
      university: student.university || "",
      completion_year: student.completion_year || "",
      marks_cgpa: student.marks_cgpa || "",
    },
    validationSchema: canEditProfile
      ? Yup.object({
          cnic: Yup.string().required("Required"),
          city: Yup.string().required("Required"),
          province: Yup.string().required("Required"),
          date_of_birth: Yup.string().required("Required"),
          father_name: Yup.string().required("Required"),
          father_phone: Yup.string().required("Required"),
          latest_degree: Yup.string().required("Required"),
          university: Yup.string().required("Required"),
          completion_year: Yup.string().required("Required"),
          marks_cgpa: Yup.string().required("Required"),
        })
      : Yup.object({}),
    onSubmit: async (values) => {
      if (!canEditProfile) return;

      const missingImages = [];
      if (!student.image && !files.image) missingImages.push("Student image");
      if (!student.cnic_image && !files.cnic_image)
        missingImages.push("CNIC front image");
      if (!student.cnic_back_image && !files.cnic_back_image)
        missingImages.push("CNIC back image");
      if (!student.latest_degree_image && !files.latest_degree_image)
        missingImages.push("Latest degree image");

      if (missingImages.length > 0) {
        toast({
          title: "Missing images",
          description: `Please upload: ${missingImages.join(", ")}`,
          status: "error",
          duration: 4000,
          isClosable: true,
        });
        return;
      }

      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        formData.append(key, value);
      });
      Object.entries(files).forEach(([key, file]) => {
        if (file) formData.append(key, file);
      });

      dispatch(
        updateStudentInfo({ authToken, studentId: student._id, formData })
      )
        .unwrap()
        .then(() => {
          setProfileUpdatedOnce(true);
          dispatch(fetchStudents({ authToken }));
          setIsOpen(false);
          onComplete?.();
        });
    },
  });

  const handleFileChange = (field) => (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setFiles((prev) => ({ ...prev, [field]: file }));
    }
  };

  const renderTextField = (id, label, type = "text") => {
    const value = canEditProfile ? formik.values[id] : student[id] || "";
    return (
      <FormControl id={id} isInvalid={formik.touched[id] && formik.errors[id]}>
        <FormLabel fontSize={14}>{label}</FormLabel>
        <Input
          type={type}
          name={id}
          borderRadius="0.5rem"
          value={value}
          onChange={canEditProfile ? formik.handleChange : undefined}
          onBlur={canEditProfile ? formik.handleBlur : undefined}
          isReadOnly={!canEditProfile}
        />
        {canEditProfile && formik.touched[id] && formik.errors[id] ? (
          <Box color="red" fontSize="sm">
            {formik.errors[id]}
          </Box>
        ) : null}
      </FormControl>
    );
  };

  const renderImageField = (id, label) => {
    const imageUrl = student[id];
    const selectedFile = files[id];

    return (
      <FormControl id={id}>
        <FormLabel fontSize={14}>{label}</FormLabel>
        {imageUrl ? (
          <Flex align="center" mb={canEditProfile ? 2 : 0}>
            <Image
              src={getMediaUrl(imageUrl)}
              alt={label}
              boxSize="150px"
              objectFit="cover"
            />
            <IconButton
              icon={<View />}
              onClick={() => window.open(getMediaUrl(imageUrl), "_blank")}
              colorScheme="blue"
              aria-label={`View ${label}`}
              size="sm"
              ml={2}
            />
          </Flex>
        ) : (
          <Box color="red.500" mb={canEditProfile ? 2 : 0}>
            No image available
          </Box>
        )}
        {canEditProfile && (
          <>
            <Input
              type="file"
              accept="image/*"
              pt={1}
              onChange={handleFileChange(id)}
            />
            {selectedFile && (
              <Text fontSize="sm" color="green.600" mt={1}>
                Selected: {selectedFile.name}
              </Text>
            )}
          </>
        )}
      </FormControl>
    );
  };

  return (
    <>
      {!forced && (
      <IconButton
        onClick={onOpen}
        aria-label="View student"
        title="View Student"
        className="icon-action-btn icon-action-btn--view"
        icon={<View size={18} />}
      />
      )}

      <Modal
        isOpen={isOpen}
        onClose={onClose}
        {...responsiveModalProps}
        {...getResponsiveModalSize("6xl")}
        closeOnOverlayClick={!isForcedCompletion}
        closeOnEsc={!isForcedCompletion}
      >
        <ModalOverlay />
        <ModalContent
          {...responsiveModalContentProps}
          as="form"
          onSubmit={formik.handleSubmit}
          display="flex"
          flexDirection="column"
          maxH={{ base: "100dvh", sm: "92vh" }}
        >
          <ModalHeader className="text-xl font-semibold" flexShrink={0}>
            {canEditProfile ? "Complete Your Profile" : "View Student"}
          </ModalHeader>
          {!isForcedCompletion && <ModalCloseButton />}
            <ModalBody flex="1" overflowY="auto" py={4}>
              {canEditProfile && (
                <Box
                  mb={4}
                  p={3}
                  borderRadius="md"
                  bg="orange.50"
                  border="1px solid"
                  borderColor="orange.200"
                >
                  <Text fontSize="sm" color="orange.800">
                    {isForcedCompletion
                      ? "Welcome! Please complete your profile before continuing. This is your one-time profile update."
                      : "You can update your profile information only once. Please review all details carefully before saving."}
                  </Text>
                </Box>
              )}
              {profileLocked && (
                <Box
                  mb={4}
                  p={3}
                  borderRadius="md"
                  bg="gray.50"
                  border="1px solid"
                  borderColor="gray.200"
                >
                  <Text fontSize="sm" color="gray.600">
                    Your profile has already been updated and can no longer be
                    changed.
                  </Text>
                </Box>
              )}

              <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6}>
                <GridItem colSpan={1}>
                  <VStack spacing={4}>
                    <FormControl id="name">
                      <FormLabel fontSize={14}>Name</FormLabel>
                      <Input
                        type="text"
                        borderRadius="0.5rem"
                        value={student.name}
                        isReadOnly
                      />
                    </FormControl>
                    <FormControl id="phone">
                      <FormLabel fontSize={14}>Phone</FormLabel>
                      <Input
                        type="phone"
                        borderRadius="0.5rem"
                        value={student.phone}
                        isReadOnly
                      />
                    </FormControl>
                    <FormControl id="email">
                      <FormLabel fontSize={14}>Email</FormLabel>
                      <Input
                        type="email"
                        borderRadius="0.5rem"
                        value={formatStudentEmail(student.email)}
                        isReadOnly
                      />
                    </FormControl>
                    {renderTextField("university", "University")}
                    {renderTextField("date_of_birth", "Date of Birth")}
                    {renderTextField("father_name", "Father's Name")}
                    {renderTextField("father_phone", "Father's Phone")}
                    {renderTextField("cnic", "CNIC")}
                    <FormControl
                      id="province"
                      isInvalid={
                        formik.touched.province && formik.errors.province
                      }
                      isRequired={canEditProfile}
                    >
                      <FormLabel fontSize={14}>Province</FormLabel>
                      {canEditProfile ? (
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
                          borderRadius="0.5rem"
                          value={student.province || ""}
                          isReadOnly
                        />
                      )}
                      {canEditProfile &&
                      formik.touched.province &&
                      formik.errors.province ? (
                        <Box color="red" fontSize="sm">
                          {formik.errors.province}
                        </Box>
                      ) : null}
                    </FormControl>
                    <FormControl
                      id="city"
                      isInvalid={formik.touched.city && formik.errors.city}
                      isRequired={canEditProfile}
                    >
                      <FormLabel fontSize={14}>City</FormLabel>
                      {canEditProfile ? (
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
                          onChange={(nextCity) =>
                            formik.setFieldValue("city", nextCity)
                          }
                          onBlur={() => formik.setFieldTouched("city", true)}
                          isDisabled={!formik.values.province}
                        />
                      ) : (
                        <Input
                          borderRadius="0.5rem"
                          value={student.city || ""}
                          isReadOnly
                        />
                      )}
                      {canEditProfile &&
                      formik.touched.city &&
                      formik.errors.city ? (
                        <Box color="red" fontSize="sm">
                          {formik.errors.city}
                        </Box>
                      ) : null}
                    </FormControl>
                    {renderTextField("latest_degree", "Latest Degree")}
                    {renderTextField("completion_year", "Completion Year")}
                    {renderTextField("marks_cgpa", "Marks / CGPA")}
                  </VStack>
                </GridItem>

                <GridItem colSpan={1}>
                  <VStack spacing={4} align="stretch">
                    {renderImageField("image", "Student Image")}
                    {renderImageField("cnic_image", "CNIC Front Image")}
                    {renderImageField("cnic_back_image", "CNIC Back Image")}
                    {renderImageField(
                      "latest_degree_image",
                      "Latest Degree Image"
                    )}

                    <FormControl>
                      <FormLabel fontSize={14}>
                        Online Payment Evidence
                      </FormLabel>
                      {fetchStudentHistoryStatus === "loading" && !historyReady ? (
                        <Flex align="center" gap={2} py={2}>
                          <Spinner size="sm" color="#2D4185" />
                          <Text fontSize="sm" color="gray.500">
                            Loading attachments…
                          </Text>
                        </Flex>
                      ) : paymentEvidenceItems.length === 0 ? (
                        <Text fontSize="sm" color="gray.500">
                          No payment evidence attached
                        </Text>
                      ) : (
                        <VStack align="stretch" spacing={2}>
                          {paymentEvidenceItems.map((item, index) => {
                            const href = getMediaUrl(item.url);
                            const isImage = /\.(jpe?g|png|webp|gif)$/i.test(
                              item.url
                            );
                            return (
                              <Flex
                                key={item.key}
                                align="center"
                                gap={3}
                                p={2}
                                border="1px solid"
                                borderColor="gray.200"
                                borderRadius="md"
                              >
                                {isImage ? (
                                  <Image
                                    src={href}
                                    alt={`Payment evidence ${index + 1}`}
                                    boxSize="64px"
                                    objectFit="cover"
                                    borderRadius="md"
                                    flexShrink={0}
                                  />
                                ) : (
                                  <Flex
                                    boxSize="64px"
                                    align="center"
                                    justify="center"
                                    bg="gray.50"
                                    borderRadius="md"
                                    flexShrink={0}
                                  >
                                    <Paperclip size={20} color="#2D4185" />
                                  </Flex>
                                )}
                                <Box flex="1" minW={0}>
                                  <Text fontSize="sm" fontWeight="600" noOfLines={1}>
                                    Evidence {index + 1}
                                  </Text>
                                  <Text fontSize="xs" color="gray.500" noOfLines={1}>
                                    {item.paymentMethod}
                                  </Text>
                                  <Link
                                    href={href}
                                    isExternal
                                    fontSize="sm"
                                    color="#2D4185"
                                    fontWeight="600"
                                  >
                                    View attachment
                                  </Link>
                                </Box>
                                <IconButton
                                  icon={<View size={16} />}
                                  onClick={() => window.open(href, "_blank")}
                                  colorScheme="blue"
                                  aria-label={`View evidence ${index + 1}`}
                                  size="sm"
                                />
                              </Flex>
                            );
                          })}
                        </VStack>
                      )}
                    </FormControl>
                  </VStack>
                </GridItem>
              </Grid>
            </ModalBody>

            <ModalFooter
              flexShrink={0}
              borderTopWidth="1px"
              borderColor="gray.100"
              justifyContent="space-between"
              gap={3}
              flexWrap="wrap"
            >
              <div>
                {(isForcedCompletion || canEditProfile) && (
                  <Button
                    leftIcon={<LogOut size={16} />}
                    variant="outline"
                    colorScheme="red"
                    borderRadius="0.75rem"
                    onClick={handleLogout}
                  >
                    Sign out
                  </Button>
                )}
              </div>
              <div className="flex gap-3 flex-wrap">
              {!isForcedCompletion && (
              <Button
                variant="ghost"
                borderRadius="0.75rem"
                onClick={onClose}
              >
                Close
              </Button>
              )}
              {canEditProfile && (
                <Button
                  borderRadius="0.75rem"
                  backgroundColor="#82B4FF"
                  color="#2D4185"
                  _hover={{
                    backgroundColor: "#74A0E3",
                    color: "#223163",
                  }}
                  fontWeight="500"
                  type="submit"
                  loadingText="Saving"
                  isLoading={updateStatus === "loading"}
                >
                  Save Profile
                </Button>
              )}
              </div>
            </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

export default ViewModal;
