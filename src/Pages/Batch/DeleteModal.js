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
  Checkbox,
  Text,
  Input,
  FormControl,
  FormLabel,
} from "@chakra-ui/react";
import Cookies from "js-cookie";
import { Trash } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { fetchBatches, deleteBatch } from "../../Features/batchSlice";

const DeleteModal = ({ batchId, batchName = "", enrolledCount = 0 }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [authToken] = useState(Cookies.get("authToken"));
  const { deleteStatus } = useSelector((state) => state.batches);
  const dispatch = useDispatch();

  const expectedConfirm = "DELETE";
  const canDelete =
    confirmed && confirmText.trim().toUpperCase() === expectedConfirm;

  const resetConfirmState = () => {
    setConfirmed(false);
    setConfirmText("");
  };

  const onOpen = () => {
    resetConfirmState();
    setIsOpen(true);
  };

  const onClose = () => {
    if (deleteStatus === "loading") return;
    resetConfirmState();
    setIsOpen(false);
  };

  const handleDeleteBatch = () => {
    if (!canDelete) return;

    dispatch(deleteBatch({ authToken, id: batchId }))
      .unwrap()
      .then(() => {
        resetConfirmState();
        setIsOpen(false);
        dispatch(fetchBatches({ authToken }));
      });
  };

  return (
    <>
      <button
        type="button"
        className="hover:bg-[#FF8A8A] hover:text-[#6D1F1F] font-medium p-[10px] rounded-xl transition-colors duration-300"
        onClick={onOpen}
      >
        <Trash size={18} />
      </button>

      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader className="text-xl font-semibold">
            Confirm delete batch
          </ModalHeader>
          <ModalCloseButton isDisabled={deleteStatus === "loading"} />
          <ModalBody>
            <Text>
              You are about to permanently delete
              {batchName ? (
                <>
                  {" "}
                  <Text as="span" fontWeight="semibold">
                    {batchName}
                  </Text>
                </>
              ) : (
                " this batch"
              )}
              .
            </Text>

            <Text mt={3} fontSize="sm" color="red.600">
              This will also delete all enrolled students, their login accounts,
              fees, fee logs, refunds, and related finance / LMS records.
              Finance Reporting will no longer include that history. This cannot
              be undone.
            </Text>

            {Number(enrolledCount) > 0 ? (
              <Text mt={2} fontSize="sm" fontWeight="medium">
                Enrolled students that will be deleted: {enrolledCount}
              </Text>
            ) : (
              <Text mt={2} fontSize="sm" color="gray.600">
                No enrolled students are currently listed for this batch.
              </Text>
            )}

            <Checkbox
              mt={4}
              isChecked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              colorScheme="red"
              alignItems="flex-start"
            >
              <Text fontSize="sm">
                I understand this will permanently delete the batch and all
                related student/finance data.
              </Text>
            </Checkbox>

            <FormControl mt={4}>
              <FormLabel fontSize="sm">
                Type <Text as="span" fontWeight="bold">{expectedConfirm}</Text> to
                confirm
              </FormLabel>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={expectedConfirm}
                borderRadius="xl"
                autoComplete="off"
                isDisabled={deleteStatus === "loading"}
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              borderRadius="0.75rem"
              onClick={onClose}
              isDisabled={deleteStatus === "loading"}
            >
              Cancel
            </Button>
            <Button
              borderRadius="0.75rem"
              backgroundColor="#FF8A8A"
              color="#6D1F1F"
              _hover={{
                backgroundColor: "#E48080",
                color: "#561616",
              }}
              fontWeight="500"
              onClick={handleDeleteBatch}
              loadingText="Deleting"
              isLoading={deleteStatus === "loading"}
              isDisabled={!canDelete || deleteStatus === "loading"}
            >
              Delete everything
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default DeleteModal;
