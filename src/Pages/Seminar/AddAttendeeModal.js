import React, { useState } from "react";
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
  Box,
  SimpleGrid,
  VStack,
  Text,
} from "@chakra-ui/react";
import Cookies from "js-cookie";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useDispatch, useSelector } from "react-redux";
import { UserPlus } from "lucide-react";
import { addSeminarAttendee } from "../../Features/seminarAttendeeSlice";
import {
  getResponsiveModalSize,
  responsiveModalContentProps,
} from "../../utlls/responsiveModal";

const EMPTY_ATTENDEE_VALUES = {
  name: "",
  phone: "",
  email: "",
  city: "",
  qualification: "",
  age: "",
};

function AddAttendeeModal({ seminar, isOpen, onClose, onAdded }) {
  const [authToken] = useState(Cookies.get("authToken"));
  const { addStatus } = useSelector((state) => state.seminarAttendees);
  const dispatch = useDispatch();

  const formik = useFormik({
    initialValues: EMPTY_ATTENDEE_VALUES,
    enableReinitialize: false,
    validationSchema: Yup.object({
      name: Yup.string().required("Name is required"),
      phone: Yup.string().required("Phone is required"),
      email: Yup.string().email("Invalid email"),
      city: Yup.string(),
      qualification: Yup.string(),
      age: Yup.string(),
    }),
    onSubmit: async (values, { resetForm }) => {
      dispatch(
        addSeminarAttendee({
          authToken,
          attendee: {
            name: values.name,
            phone: values.phone,
            email: values.email || "",
            city: values.city || "",
            qualification: values.qualification || "",
            age: values.age || "",
            seminar_id: seminar._id,
          },
        })
      )
        .unwrap()
        .then(() => {
          resetForm({ values: EMPTY_ATTENDEE_VALUES });
          onAdded?.();
        });
    },
  });

  const handleClose = () => {
    formik.resetForm({ values: EMPTY_ATTENDEE_VALUES });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      closeOnOverlayClick={false}
      blockScrollOnMount={false}
      {...getResponsiveModalSize("2xl")}
    >
      <ModalOverlay />
      <ModalContent {...responsiveModalContentProps}>
        <ModalHeader className="text-xl font-semibold">Add Attendee</ModalHeader>
        <ModalCloseButton />
        <form onSubmit={formik.handleSubmit}>
          <ModalBody>
            <Text fontSize="sm" color="gray.500" mb={4}>
              Adding attendees for <strong>{seminar.name}</strong>. The form
              stays open after each save so you can add more. Close manually when
              finished.
            </Text>
            <VStack spacing={4} align="stretch">
              <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
                <FormControl isRequired>
                  <FormLabel fontSize={14}>Name</FormLabel>
                  <Input
                    name="name"
                    borderRadius="0.5rem"
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="Attendee name"
                  />
                  {formik.touched.name && formik.errors.name ? (
                    <Box color="red" fontSize="sm">
                      {formik.errors.name}
                    </Box>
                  ) : null}
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontSize={14}>Phone</FormLabel>
                  <Input
                    name="phone"
                    borderRadius="0.5rem"
                    value={formik.values.phone}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="Phone number"
                  />
                  {formik.touched.phone && formik.errors.phone ? (
                    <Box color="red" fontSize="sm">
                      {formik.errors.phone}
                    </Box>
                  ) : null}
                </FormControl>
                <FormControl>
                  <FormLabel fontSize={14}>Email</FormLabel>
                  <Input
                    type="email"
                    name="email"
                    borderRadius="0.5rem"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="Email address"
                  />
                  {formik.touched.email && formik.errors.email ? (
                    <Box color="red" fontSize="sm">
                      {formik.errors.email}
                    </Box>
                  ) : null}
                </FormControl>
                <FormControl>
                  <FormLabel fontSize={14}>City</FormLabel>
                  <Input
                    name="city"
                    borderRadius="0.5rem"
                    value={formik.values.city}
                    onChange={formik.handleChange}
                    placeholder="City"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize={14}>Qualification</FormLabel>
                  <Input
                    name="qualification"
                    borderRadius="0.5rem"
                    value={formik.values.qualification}
                    onChange={formik.handleChange}
                    placeholder="Qualification"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize={14}>Age</FormLabel>
                  <Input
                    name="age"
                    borderRadius="0.5rem"
                    value={formik.values.age}
                    onChange={formik.handleChange}
                    placeholder="Age"
                  />
                </FormControl>
              </SimpleGrid>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              borderRadius="0.75rem"
              onClick={handleClose}
            >
              Close
            </Button>
            <Button
              leftIcon={<UserPlus size={18} />}
              borderRadius="0.75rem"
              backgroundColor="#7AEF85"
              color="#257947"
              _hover={{
                backgroundColor: "#65C76E",
                color: "#184E2E",
              }}
              fontWeight="500"
              type="submit"
              loadingText="Adding..."
              isLoading={addStatus === "loading"}
            >
              Add Attendee
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}

export default AddAttendeeModal;
