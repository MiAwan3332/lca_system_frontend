import React, { useEffect } from "react";
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    Button,
    VStack,
    Spinner,
    IconButton,
    Stack,
    Text,
    Badge,
    Divider,
    Code,
} from "@chakra-ui/react";
import Cookies from "js-cookie";
import { Logs } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { fetchFeeLogs, selectFeeLogs } from "../../Features/feeSlice";
import moment from "moment";

function FeeHistoryModal({ isOpen, onClose, onOpen, fee }) {
    const authToken = Cookies.get("authToken");

    const { fetchFeeLogsStatus } = useSelector((state) => state.fees);
    const feeLogs = useSelector(selectFeeLogs);
    const dispatch = useDispatch();

    const handleOpenModal = () => {
        dispatch(fetchFeeLogs({ authToken, id: fee._id }));
        onOpen();
    };

    return (
        <>
            <IconButton onClick={handleOpenModal} colorScheme="gray">
                <Logs />
            </IconButton>
            <Modal isOpen={isOpen} size={'2xl'} onClose={onClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader className="text-xl font-semibold">
                        Student Fees Details
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4} align={"stretch"}>
                            <Stack spacing={0} className="text-left">
                                <Text fontSize='md'><span className="font-semibold">Student Name:</span> {fee?.student?.name}</Text>
                                <Text fontSize='md'><span className="font-semibold">Batch:</span> {fee?.batch?.name}</Text>
                                <Text fontSize='md'><span className="font-semibold">Student Phone:</span> {fee?.student?.phone}</Text>
                                <Text fontSize='md'><span className="font-semibold">Fee Due Date:</span> {moment(fee.due_date).format("DD-MM-YYYY")}</Text>
                                <Text fontSize='md'><span className="font-semibold">Fee Status:</span> <Badge colorScheme={fee.status === "Paid" ? "green" : "red"}>{fee?.status}</Badge></Text>
                            </Stack>
                            <Divider />
                            {fetchFeeLogsStatus == "loading" && <Spinner />}
                            <ol className="relative border-s border-gray-200 mx-3">
                                {feeLogs && feeLogs.length > 0 ? (
                                    feeLogs.map((log, index) => (
                                        <li key={log._id} className="mb-10 ms-6">
                                            <span className="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -start-3 ring-8 ring-white">
                                                <svg className="w-2.5 h-2.5 text-blue-800" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4ZM0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm5-8h10a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z" />
                                                </svg>
                                            </span>
                                            <h3 className="flex items-center mb-1 text-lg font-semibold text-gray-900">
                                                {
                                                    log.action_type == "Created"
                                                        ? "Fee Created"
                                                        : log.action_type == "Paid"
                                                            ? "Fee paid"
                                                            : log.action_type == "Discounted"
                                                                ? "Fee discounted"
                                                                : "Fee deleted"
                                                }
                                                {" by '" + log.action_by.name + "'" }
                                            </h3>
                                            <time className="block mb-2 text-sm font-normal leading-none text-gray-400">Action Date: {moment(log.action_date).format("DD-MM-YYYY")}</time>
                                            {log.action_type == "Created" ? <Code colorScheme='green' children={"Amount: " + log.amount + " Rs."} /> : null}
                                            {log.action_type == "Paid" ? <Code colorScheme='green' children={"Amount: " + log.amount + " - " + log.action_amount + " = " + (log.amount - log.action_amount) + " Rs."} /> : null}
                                            {log.action_type == "Discounted" ? <Code colorScheme='green' children={"Amount: " + log.amount + " - " + log.action_amount + " = " + (log.amount - log.action_amount) + " Rs."} /> : null}
                                            {log.action_type == "Deleted" ? <Code colorScheme='red' children={"Amount: " + log.amount + " Rs."} /> : null}
                                            <p className="text-base font-normal text-gray-500">
                                                <span className="text-semibold">Description: </span>
                                                {log.description ? log.description : "No description"}
                                            </p>
                                        </li>
                                    ))
                                ) : (
                                    <p>No fee history found</p>
                                )}
                            </ol>
                        </VStack>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </>
    );
}

export default FeeHistoryModal;
