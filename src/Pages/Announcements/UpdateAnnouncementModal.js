import React, { useEffect, useState } from "react";
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
  Textarea,
  VStack,
  Box,
  Text,
} from "@chakra-ui/react";
import { useFormik } from "formik";
import * as Yup from "yup";
import Cookies from "js-cookie";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchAnnouncements,
  updateAnnouncement,
} from "../../Features/announcementSlice";
import { selectActiveBatches, fetchBatches, setLimitFilter } from "../../Features/batchSlice";
import BatchMultiSelect from "../../Components/BatchMultiSelect";

function UpdateAnnouncementModal({ isOpen, onClose, announcement }) {
  const authToken = Cookies.get("authToken");
  const { updateStatus } = useSelector((state) => state.announcements);
  const batches = useSelector(selectActiveBatches);
  const dispatch = useDispatch();
  const [selectedBatches, setSelectedBatches] = useState([]);
  const [batchError, setBatchError] = useState("");

  const handleBatchChange = (nextBatches) => {
    setSelectedBatches(nextBatches);
    if (nextBatches.length > 0) {
      setBatchError("");
    }
  };

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      title: announcement?.title || "",
      message: announcement?.message || "",
    },
    validationSchema: Yup.object({
      title: Yup.string().required("Title is required"),
      message: Yup.string().required("Message is required"),
    }),
    onSubmit: async (values) => {
      if (!announcement?._id) return;
      if (selectedBatches.length < 1) {
        setBatchError("Select at least one batch");
        return;
      }

      dispatch(
        updateAnnouncement({
          authToken,
          id: announcement._id,
          announcement: {
            title: values.title.trim(),
            message: values.message.trim(),
            batch_ids: selectedBatches.map((id) => String(id)),
          },
        })
      )
        .unwrap()
        .then(() => {
          onClose();
          dispatch(fetchAnnouncements({ authToken }));
        });
    },
  });

  const canSubmit =
    formik.values.title.trim() &&
    formik.values.message.trim() &&
    selectedBatches.length >= 1;

  useEffect(() => {
    if (isOpen && authToken) {
      dispatch(setLimitFilter(200));
      dispatch(fetchBatches({ authToken }));
    }
  }, [isOpen, authToken, dispatch]);

  useEffect(() => {
    if (!announcement || !isOpen) return;
    const batchIds = (announcement.batches || []).map((batch) =>
      String(batch._id || batch)
    );
    setSelectedBatches(batchIds);
  }, [announcement, isOpen]);

  const handleClose = () => {
    formik.resetForm();
    setSelectedBatches([]);
    setBatchError("");
    onClose();
  };

  if (!announcement) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader className="text-xl font-semibold">Update Announcement</ModalHeader>
        <ModalCloseButton />
        <form onSubmit={formik.handleSubmit}>
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl id="title" isRequired>
                <FormLabel fontSize={14}>Title</FormLabel>
                <Input
                  name="title"
                  borderRadius="0.75rem"
                  value={formik.values.title}
                  onChange={formik.handleChange}
                  placeholder="Announcement title"
                />
                {formik.touched.title && formik.errors.title ? (
                  <Box color="red" fontSize="sm">
                    {formik.errors.title}
                  </Box>
                ) : null}
              </FormControl>

              <FormControl id="message" isRequired>
                <FormLabel fontSize={14}>Message</FormLabel>
                <Textarea
                  name="message"
                  borderRadius="0.75rem"
                  rows={5}
                  value={formik.values.message}
                  onChange={formik.handleChange}
                  placeholder="Write your announcement..."
                />
                {formik.touched.message && formik.errors.message ? (
                  <Box color="red" fontSize="sm">
                    {formik.errors.message}
                  </Box>
                ) : null}
              </FormControl>

              <FormControl isInvalid={Boolean(batchError)}>
                <FormLabel fontSize={14}>Target Batches</FormLabel>
                <Text fontSize="xs" color="gray.500" mb={2}>
                  Select at least 1 batch. You do not need to select all batches.
                </Text>
                <BatchMultiSelect
                  batches={batches}
                  value={selectedBatches}
                  onChange={handleBatchChange}
                  searchable={false}
                  showSelectAll={false}
                  helperText={`${selectedBatches.length} batch${selectedBatches.length === 1 ? "" : "es"} selected`}
                />
                {batchError ? (
                  <Box color="red.500" fontSize="sm" mt={2}>
                    {batchError}
                  </Box>
                ) : null}
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter gap={2}>
            <Button variant="ghost" borderRadius="xl" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              borderRadius="xl"
              backgroundColor="#FFCB82"
              color="#85652D"
              _hover={{ backgroundColor: "#E3B574", color: "#654E26" }}
              isLoading={updateStatus === "loading"}
              loadingText="Saving..."
              isDisabled={!canSubmit && updateStatus !== "loading"}
            >
              Save Changes
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}

export default UpdateAnnouncementModal;
