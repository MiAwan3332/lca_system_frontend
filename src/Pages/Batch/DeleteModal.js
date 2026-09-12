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
  Text,
} from "@chakra-ui/react";
import Cookies from "js-cookie";
import { Trash } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { fetchBatches, deleteBatch } from "../../Features/batchSlice";

const DeleteModal = ({ batchId, batchName = "", enrolledCount = 0 }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [authToken] = useState(Cookies.get("authToken"));
  const { deleteStatus } = useSelector((state) => state.batches);
  const dispatch = useDispatch();

  const onOpen = () => setIsOpen(true);
  const onClose = () => {
    if (deleteStatus === "loading") return;
    setIsOpen(false);
  };

  const handleDeleteBatch = () => {
    dispatch(deleteBatch({ authToken, id: batchId }))
      .unwrap()
      .then(() => {
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

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader className="text-xl font-semibold">
            Delete batch
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              Are you sure you want to permanently delete
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
              ?
            </Text>
            <Text mt={3} fontSize="sm" color="red.600">
              This will also delete all enrolled students in this batch, their
              login accounts, fees, fee logs, refunds, and other related finance
              / LMS records. Finance Reporting will no longer include their
              history. This cannot be undone.
            </Text>
            {Number(enrolledCount) > 0 ? (
              <Text mt={2} fontSize="sm" fontWeight="medium">
                Enrolled students that will be deleted: {enrolledCount}
              </Text>
            ) : null}
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              borderRadius={"0.75rem"}
              onClick={onClose}
              isDisabled={deleteStatus === "loading"}
            >
              Close
            </Button>
            <Button
              borderRadius={"0.75rem"}
              backgroundColor={"#FF8A8A"}
              color={"#6D1F1F"}
              _hover={{
                backgroundColor: "#E48080",
                color: "#561616",
              }}
              fontWeight={"500"}
              onClick={handleDeleteBatch}
              loadingText="Deleting"
              isLoading={deleteStatus === "loading"}
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
