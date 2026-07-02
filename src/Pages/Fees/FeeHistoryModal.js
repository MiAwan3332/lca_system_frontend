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
    VStack,
    Spinner,
    IconButton,
    Stack,
    Text,
    Badge,
    Divider,
    Code,
    useToast,
    HStack,
} from "@chakra-ui/react";
import Cookies from "js-cookie";
import { Download, FileText, Logs } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { fetchFeeLogs, selectFeeLogs } from "../../Features/feeSlice";
import { generateStudentFeeDetailsReport } from "../../utlls/generateStudentFeeDetailsReport";
import moment from "moment";
import {
    getResponsiveModalSize,
    responsiveModalContentProps,
    responsiveModalProps,
} from "../../utlls/responsiveModal";

function FeeHistoryModal({ fee }) {
    const authToken = Cookies.get("authToken");
    const toast = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedFee, setSelectedFee] = useState(null);

    const { fetchFeeLogsStatus } = useSelector((state) => state.fees);
    const feeLogs = useSelector(selectFeeLogs);
    const dispatch = useDispatch();

    const displayFee = selectedFee || fee;
    const isLoading = fetchFeeLogsStatus === "loading";
    const canGenerateReport = !isLoading && displayFee?._id;

    const handleOpenModal = () => {
        setSelectedFee(fee);
        dispatch(fetchFeeLogs({ authToken, id: fee._id }));
        setIsOpen(true);
    };

    const handleClose = () => {
        setIsOpen(false);
        setSelectedFee(null);
    };

    const handleGenerateReport = async (mode) => {
        if (!canGenerateReport) return;

        setIsGenerating(true);
        try {
            const fileName = generateStudentFeeDetailsReport(
                displayFee,
                feeLogs,
                mode
            );
            toast({
                title:
                    mode === "print"
                        ? "Report opened for printing"
                        : "Report downloaded",
                description:
                    mode === "print"
                        ? "Use your browser print dialog to finish."
                        : fileName,
                status: "success",
                duration: 4000,
                isClosable: true,
            });
        } catch (error) {
            toast({
                title: "Could not generate report",
                description: error.message || "Please try again.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <>
            <IconButton
                type="button"
                onClick={handleOpenModal}
                colorScheme="gray"
                aria-label="View fee history"
                icon={<Logs size={18} />}
            />
            <Modal
                isOpen={isOpen}
                onClose={handleClose}
                {...responsiveModalProps}
                {...getResponsiveModalSize("2xl")}
            >
                <ModalOverlay />
                <ModalContent
                    {...responsiveModalContentProps}
                    display="flex"
                    flexDirection="column"
                    maxH={{ base: "100dvh", sm: "92vh" }}
                >
                    <ModalHeader className="text-xl font-semibold" flexShrink={0}>
                        Student Fees Details
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody flex="1" overflowY="auto" py={4}>
                        <VStack spacing={4} align="stretch">
                            <Stack spacing={0} className="text-left">
                                <Text fontSize="md">
                                    <span className="font-semibold">Student Name:</span>{" "}
                                    {displayFee?.student?.name || "N/A"}
                                </Text>
                                <Text fontSize="md">
                                    <span className="font-semibold">Batch:</span>{" "}
                                    {displayFee?.batch?.name || "N/A"}
                                </Text>
                                <Text fontSize="md">
                                    <span className="font-semibold">Student Phone:</span>{" "}
                                    {displayFee?.student?.phone || "N/A"}
                                </Text>
                                <Text fontSize="md">
                                    <span className="font-semibold">Fee Amount:</span>{" "}
                                    {displayFee?.amount ?? "N/A"} Rs.
                                </Text>
                                <Text fontSize="md">
                                    <span className="font-semibold">Fee Due Date:</span>{" "}
                                    {displayFee?.due_date
                                        ? moment(displayFee.due_date).format("DD-MM-YYYY")
                                        : "N/A"}
                                </Text>
                                <Text fontSize="md">
                                    <span className="font-semibold">Fee Status:</span>{" "}
                                    <Badge
                                        colorScheme={
                                            displayFee?.status === "Paid" ? "green" : "red"
                                        }
                                    >
                                        {displayFee?.status || "N/A"}
                                    </Badge>
                                </Text>
                            </Stack>
                            <Divider />
                            {isLoading && <Spinner />}
                            <ol className="relative border-s border-gray-200 mx-3">
                                {feeLogs && feeLogs.length > 0 ? (
                                    feeLogs.map((log) => (
                                        <li key={log._id} className="mb-10 ms-6">
                                            <span className="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -start-3 ring-8 ring-white">
                                                <svg
                                                    className="w-2.5 h-2.5 text-blue-800"
                                                    aria-hidden="true"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    fill="currentColor"
                                                    viewBox="0 0 20 20"
                                                >
                                                    <path d="M20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4ZM0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm5-8h10a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z" />
                                                </svg>
                                            </span>
                                            <h3 className="flex items-center mb-1 text-lg font-semibold text-gray-900">
                                                {log.action_type === "Created"
                                                    ? "Fee Created"
                                                    : log.action_type === "Paid"
                                                      ? "Fee paid"
                                                      : log.action_type === "Discounted"
                                                        ? "Fee discounted"
                                                        : "Fee deleted"}
                                                {" by '" + (log.action_by?.name || "N/A") + "'"}
                                            </h3>
                                            <time className="block mb-2 text-sm font-normal leading-none text-gray-400">
                                                Action Date:{" "}
                                                {moment(log.action_date).format("DD-MM-YYYY")}
                                            </time>
                                            {log.action_type === "Created" ? (
                                                <Code
                                                    colorScheme="green"
                                                    children={"Amount: " + log.amount + " Rs."}
                                                />
                                            ) : null}
                                            {log.action_type === "Paid" ? (
                                                <Code
                                                    colorScheme="green"
                                                    children={
                                                        "Amount: " +
                                                        log.amount +
                                                        " - " +
                                                        log.action_amount +
                                                        " = " +
                                                        (log.amount - log.action_amount) +
                                                        " Rs."
                                                    }
                                                />
                                            ) : null}
                                            {log.action_type === "Discounted" ? (
                                                <Code
                                                    colorScheme="green"
                                                    children={
                                                        "Amount: " +
                                                        log.amount +
                                                        " - " +
                                                        log.action_amount +
                                                        " = " +
                                                        (log.amount - log.action_amount) +
                                                        " Rs."
                                                    }
                                                />
                                            ) : null}
                                            {log.action_type === "Deleted" ? (
                                                <Code
                                                    colorScheme="red"
                                                    children={"Amount: " + log.amount + " Rs."}
                                                />
                                            ) : null}
                                            <p className="text-base font-normal text-gray-500">
                                                <span className="text-semibold">Description: </span>
                                                {log.description ? log.description : "No description"}
                                            </p>
                                            {log.action_type === "Paid" && log.payment_method ? (
                                                <p className="text-base font-normal text-gray-500">
                                                    <span className="text-semibold">Payment Method: </span>
                                                    {log.payment_method}
                                                </p>
                                            ) : null}
                                        </li>
                                    ))
                                ) : !isLoading ? (
                                    <p>No fee history found</p>
                                ) : null}
                            </ol>
                        </VStack>
                    </ModalBody>
                    <ModalFooter
                        flexShrink={0}
                        borderTopWidth="1px"
                        borderColor="gray.100"
                        justifyContent="space-between"
                        flexWrap="wrap"
                        gap={3}
                    >
                        <Button variant="ghost" borderRadius="0.75rem" onClick={handleClose}>
                            Close
                        </Button>
                        <HStack spacing={2} flexWrap="wrap">
                            <Button
                                type="button"
                                leftIcon={<Download size={16} />}
                                borderRadius="0.75rem"
                                backgroundColor="#82B4FF"
                                color="#2D4185"
                                _hover={{ backgroundColor: "#74A0E3", color: "#223163" }}
                                fontWeight="500"
                                isDisabled={!canGenerateReport}
                                isLoading={isGenerating}
                                loadingText="Generating"
                                onClick={() => handleGenerateReport("download")}
                            >
                                Download PDF
                            </Button>
                            <Button
                                type="button"
                                leftIcon={<FileText size={16} />}
                                borderRadius="0.75rem"
                                backgroundColor="#FFCB82"
                                color="#85652D"
                                _hover={{ backgroundColor: "#E3B574", color: "#654E26" }}
                                fontWeight="500"
                                isDisabled={!canGenerateReport}
                                isLoading={isGenerating}
                                loadingText="Generating"
                                onClick={() => handleGenerateReport("print")}
                            >
                                Print Report
                            </Button>
                        </HStack>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
}

export default FeeHistoryModal;
