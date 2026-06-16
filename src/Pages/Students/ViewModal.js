import React, { useState, useEffect } from "react";
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
  useToast,
} from "@chakra-ui/react";
import Cookies from "js-cookie";
import { useFormik } from "formik";
import * as Yup from "yup";
import { View } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { fetchStudents, updateStudentInfo } from "../../Features/studentSlice";
import { isStudentViewOnly, setProfileUpdatedOnce } from "../../utlls/studentAccess";
import {
  responsiveModalContentProps,
  getResponsiveModalSize,
} from "../../utlls/responsiveModal";

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
  const toast = useToast();
  const { updateStatus } = useSelector((state) => state.students);

  const viewOnlyStudent = isStudentViewOnly();
  const canEditProfile =
    viewOnlyStudent && !student.profile_updated_once;
  const profileLocked = viewOnlyStudent && student.profile_updated_once;
  const isForcedCompletion = forced && canEditProfile;

  useEffect(() => {
    if (forced && canEditProfile) {
      setIsOpen(true);
    }
  }, [forced, canEditProfile]);

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

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      cnic: student.cnic || "",
      city: student.city || "",
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
              src={imageUrl}
              alt={label}
              boxSize="150px"
              objectFit="cover"
            />
            <IconButton
              icon={<View />}
              onClick={() => window.open(imageUrl, "_blank")}
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
        colorScheme="gray"
        style={student.image ? { backgroundColor: "#ffcb82" } : {}}
      >
        <View />
      </IconButton>
      )}

      <Modal
        isOpen={isOpen}
        onClose={onClose}
        {...getResponsiveModalSize("6xl")}
        closeOnOverlayClick={!isForcedCompletion}
        closeOnEsc={!isForcedCompletion}
      >
        <ModalOverlay />
        <ModalContent {...responsiveModalContentProps}>
          <ModalHeader className="text-xl font-semibold">
            {canEditProfile ? "Complete Your Profile" : "View Student"}
          </ModalHeader>
          {!isForcedCompletion && <ModalCloseButton />}
          <form onSubmit={formik.handleSubmit}>
            <ModalBody>
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
                        value={student.email}
                        isReadOnly
                      />
                    </FormControl>
                    {renderTextField("university", "University")}
                    {renderTextField("date_of_birth", "Date of Birth")}
                    {renderTextField("father_name", "Father's Name")}
                    {renderTextField("father_phone", "Father's Phone")}
                    {renderTextField("cnic", "CNIC")}
                    {renderTextField("city", "City")}
                    {renderTextField("latest_degree", "Latest Degree")}
                    {renderTextField("completion_year", "Completion Year")}
                    {renderTextField("marks_cgpa", "Marks / CGPA")}
                  </VStack>
                </GridItem>

                <GridItem colSpan={1}>
                  <VStack spacing={4}>
                    {renderImageField("image", "Student Image")}
                    {renderImageField("cnic_image", "CNIC Front Image")}
                    {renderImageField("cnic_back_image", "CNIC Back Image")}
                    {renderImageField(
                      "latest_degree_image",
                      "Latest Degree Image"
                    )}
                  </VStack>
                </GridItem>
              </Grid>
            </ModalBody>

            <ModalFooter>
              {!isForcedCompletion && (
              <Button
                variant="ghost"
                mr={3}
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
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </>
  );
}

export default ViewModal;
