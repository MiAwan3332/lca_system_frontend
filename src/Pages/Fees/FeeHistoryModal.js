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
    Text,
    Badge,
    useToast,
    HStack,
    Box,
    Flex,
    SimpleGrid,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    Image,
    Link,
} from "@chakra-ui/react";
import Cookies from "js-cookie";
import {
    Download,
    FileText,
    Logs,
    User,
    Phone,
    Mail,
    Layers,
    Calendar,
    CircleDollarSign,
    Receipt,
    Paperclip,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { fetchFeeLogs, selectFeeLogs } from "../../Features/feeSlice";
import { generateStudentFeeDetailsReport } from "../../utlls/generateStudentFeeDetailsReport";
import moment from "moment";
import OverdueFeeAlert from "../../Components/OverdueFeeAlert";
import { isFeeOverdue } from "../../utlls/feeDueDate";
import {
    getResponsiveModalSize,
    responsiveModalContentProps,
    responsiveModalProps,
} from "../../utlls/responsiveModal";

const ACTION_CONFIG = {
    Created: { label: "Fee Created", color: "blue", icon: Receipt, accent: "#2D4185" },
    Paid: { label: "Fee Paid", color: "green", icon: CircleDollarSign, accent: "#276749" },
    Discounted: { label: "Fee Discounted", color: "orange", icon: CircleDollarSign, accent: "#C05621" },
    Deleted: { label: "Fee Deleted", color: "red", icon: Receipt, accent: "#C53030" },
};

const formatRs = (value) =>
    Number(value || 0).toLocaleString("en-PK", { maximumFractionDigits: 0 });

const getAmountDisplay = (log) => {
    if (log.action_type === "Created" || log.action_type === "Deleted") {
        return `${formatRs(log.amount)} Rs.`;
    }
    const remaining = (log.amount ?? 0) - (log.action_amount ?? 0);
    return `${formatRs(log.amount)} − ${formatRs(log.action_amount)} = ${formatRs(remaining)} Rs.`;
};

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
    const isPaid = displayFee?.status === "Paid";
    const isOverdue = isFeeOverdue(displayFee?.status, displayFee?.due_date);

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
            const fileName = await generateStudentFeeDetailsReport(
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
                <ModalOverlay backdropFilter="blur(4px)" />
                <ModalContent
                    {...responsiveModalContentProps}
                    display="flex"
                    flexDirection="column"
                    maxH={{ base: "100dvh", sm: "92vh" }}
                    overflow="hidden"
                    borderRadius="2xl"
                >
                    {/* Hero header */}
                    <Box
                        px={{ base: 4, md: 6 }}
                        py={5}
                        bg="linear-gradient(135deg, #FFCB82 0%, #f5d9a8 55%, #fffaf0 100%)"
                        borderBottom="1px solid"
                        borderColor="#E0E8EC"
                        flexShrink={0}
                        position="relative"
                    >
                        <ModalCloseButton top={3} right={3} />
                        <HStack spacing={3} align="center" mb={3}>
                            <Image
                                src="/logo_dark.svg"
                                alt="Lahore CSS Academy"
                                h={{ base: "36px", md: "44px" }}
                                objectFit="contain"
                            />
                            <VStack align="flex-start" spacing={0}>
                                <Text
                                    fontSize={{ base: "md", md: "lg" }}
                                    fontWeight="bold"
                                    color="#85652D"
                                    lineHeight="shorter"
                                >
                                    Lahore CSS Academy
                                </Text>
                                <Text fontSize="xs" color="#5A6A7A">
                                    Finance Department
                                </Text>
                            </VStack>
                        </HStack>
                        <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="bold" color="#2D3748">
                            Student Fees Details Report
                        </Text>
                        <Text fontSize="sm" color="#5A6A7A" mt={0.5}>
                            Official fee statement & transaction history
                        </Text>
                        {displayFee?._id && (
                            <Badge
                                mt={2}
                                bg="white"
                                color="#85652D"
                                border="1px solid #FFCB82"
                                borderRadius="full"
                                px={3}
                                py={0.5}
                                fontSize="xs"
                            >
                                Ref: FEE-{String(displayFee._id).slice(-8).toUpperCase()}
                            </Badge>
                        )}
                    </Box>

                    <ModalBody flex="1" overflowY="auto" py={5} px={{ base: 4, md: 6 }}>
                        <VStack spacing={5} align="stretch">
                            {/* Summary cards */}
                            <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={3}>
                                <Stat
                                    px={4}
                                    py={3}
                                    borderRadius="xl"
                                    border="1px solid"
                                    borderColor="#E0E8EC"
                                    bg="linear-gradient(135deg, #f0f6ff 0%, #ffffff 100%)"
                                >
                                    <StatLabel color="#5A6A7A" fontSize="xs">
                                        Total Fee
                                    </StatLabel>
                                    <StatNumber color="#2D4185" fontSize="xl">
                                        Rs. {formatRs(displayFee?.amount)}
                                    </StatNumber>
                                    <StatHelpText color="#718096" mb={0}>
                                        <HStack spacing={1}>
                                            <CircleDollarSign size={12} />
                                            <Text>Fee amount</Text>
                                        </HStack>
                                    </StatHelpText>
                                </Stat>
                                <Stat
                                    px={4}
                                    py={3}
                                    borderRadius="xl"
                                    border="1px solid"
                                    borderColor={isOverdue ? "#FCA5A5" : "#E0E8EC"}
                                    bg={
                                        isOverdue
                                            ? "linear-gradient(135deg, #fee2e2 0%, #ffffff 100%)"
                                            : "linear-gradient(135deg, #fffaf0 0%, #ffffff 100%)"
                                    }
                                >
                                    <StatLabel color="#5A6A7A" fontSize="xs">
                                        Due Date
                                    </StatLabel>
                                    <StatNumber color={isOverdue ? "#DC2626" : "#85652D"} fontSize="lg">
                                        {displayFee?.due_date
                                            ? moment(displayFee.due_date).format("DD MMM YYYY")
                                            : "N/A"}
                                    </StatNumber>
                                    <StatHelpText color={isOverdue ? "#DC2626" : "#718096"} mb={0}>
                                        <HStack spacing={1}>
                                            <Calendar size={12} />
                                            <Text>
                                                {isOverdue
                                                    ? "Due date exceeded"
                                                    : "Payment deadline"}
                                            </Text>
                                        </HStack>
                                    </StatHelpText>
                                </Stat>
                                <Stat
                                    px={4}
                                    py={3}
                                    borderRadius="xl"
                                    border="1px solid"
                                    borderColor="#E0E8EC"
                                    bg={
                                        isPaid
                                            ? "linear-gradient(135deg, #f0fff4 0%, #ffffff 100%)"
                                            : "linear-gradient(135deg, #fff5f5 0%, #ffffff 100%)"
                                    }
                                >
                                    <StatLabel color="#5A6A7A" fontSize="xs">
                                        Status
                                    </StatLabel>
                                    <StatNumber fontSize="lg">
                                        <Badge
                                            colorScheme={isPaid ? "green" : "red"}
                                            fontSize="sm"
                                            px={3}
                                            py={1}
                                            borderRadius="full"
                                        >
                                            {displayFee?.status || "N/A"}
                                        </Badge>
                                    </StatNumber>
                                    <StatHelpText color="#718096" mb={0}>
                                        {isPaid ? "Fully settled" : "Payment pending"}
                                    </StatHelpText>
                                </Stat>
                            </SimpleGrid>

                            {/* Student profile */}
                            <Box
                                borderRadius="xl"
                                border="1px solid"
                                borderColor="#E0E8EC"
                                bg="#FFFBF5"
                                p={4}
                            >
                                <Text fontSize="sm" fontWeight="bold" color="#85652D" mb={3}>
                                    Student Profile
                                </Text>
                                <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
                                    {[
                                        { icon: User, label: "Student Name", value: displayFee?.student?.name },
                                        { icon: Layers, label: "Batch", value: displayFee?.batch?.name },
                                        { icon: Phone, label: "Phone", value: displayFee?.student?.phone },
                                        { icon: Mail, label: "Email", value: displayFee?.student?.email },
                                    ].map(({ icon: Icon, label, value }) => (
                                        <HStack key={label} spacing={3} align="flex-start">
                                            <Box p={2} borderRadius="lg" bg="white" boxShadow="sm">
                                                <Icon size={16} color="#85652D" />
                                            </Box>
                                            <Box>
                                                <Text fontSize="xs" color="#718096">
                                                    {label}
                                                </Text>
                                                <Text fontSize="sm" fontWeight="semibold" color="#2D3748">
                                                    {value || "N/A"}
                                                </Text>
                                            </Box>
                                        </HStack>
                                    ))}
                                </SimpleGrid>
                            </Box>

                            <OverdueFeeAlert
                                dueDate={displayFee?.due_date}
                                amount={displayFee?.amount}
                                status={displayFee?.status}
                            />

                            {/* Status strip */}
                            <Box
                                px={4}
                                py={2.5}
                                borderRadius="xl"
                                bg={isPaid ? "green.500" : isOverdue ? "red.600" : "red.400"}
                                color="white"
                            >
                                <Text fontSize="sm" fontWeight="medium">
                                    {isPaid
                                        ? "✓ Fee fully settled — no outstanding balance on this record"
                                        : isOverdue
                                          ? "⚠ Payment overdue — due date has been exceeded"
                                          : "⚠ Outstanding fee — payment pending as per due date"}
                                </Text>
                            </Box>

                            {/* Transaction History */}
                            <Box>
                                <Box mb={4} pb={3} borderBottom="2px solid" borderColor="#FFCB82">
                                    <Text fontSize="md" fontWeight="bold" color="#2D3748">
                                        Transaction History
                                    </Text>
                                    <Text fontSize="sm" color="#718096" mt={1}>
                                        {feeLogs?.length || 0} recorded{" "}
                                        {feeLogs?.length === 1 ? "entry" : "entries"}
                                    </Text>
                                </Box>

                                {isLoading && (
                                    <Flex justify="center" py={8}>
                                        <Spinner color="#85652D" />
                                    </Flex>
                                )}

                                {!isLoading && feeLogs?.length === 0 && (
                                    <Box
                                        py={8}
                                        textAlign="center"
                                        borderRadius="xl"
                                        bg="#F7FAFC"
                                        border="1px dashed"
                                        borderColor="#E0E8EC"
                                    >
                                        <Text color="#A0AEC0">No fee history found</Text>
                                    </Box>
                                )}

                                {!isLoading && feeLogs?.length > 0 && (
                                    <VStack spacing={3} align="stretch">
                                        {feeLogs.map((log, index) => {
                                            const config =
                                                ACTION_CONFIG[log.action_type] || ACTION_CONFIG.Created;
                                            const LogIcon = config.icon;
                                            return (
                                                <Box
                                                    key={log._id}
                                                    p={4}
                                                    borderRadius="xl"
                                                    border="1px solid"
                                                    borderColor="#E0E8EC"
                                                    bg={index % 2 === 0 ? "white" : "#FAFBFC"}
                                                    _hover={{ bg: "#FFFBF5", borderColor: "#FFCB82" }}
                                                    transition="all 0.2s"
                                                >
                                                    <Flex
                                                        justify="space-between"
                                                        align="center"
                                                        gap={2}
                                                        mb={2}
                                                        flexWrap="wrap"
                                                    >
                                                        <HStack spacing={2} flexWrap="wrap">
                                                            <Badge
                                                                colorScheme={config.color}
                                                                borderRadius="full"
                                                                px={2}
                                                            >
                                                                {config.label}
                                                            </Badge>
                                                            <Text fontSize="xs" color="#718096">
                                                                by {log.action_by?.name || "System"}
                                                            </Text>
                                                        </HStack>
                                                        <Text
                                                            fontSize="xs"
                                                            color="#A0AEC0"
                                                            fontWeight="medium"
                                                        >
                                                            {moment(log.action_date).format(
                                                                "DD MMM YYYY"
                                                            )}
                                                        </Text>
                                                    </Flex>

                                                    <HStack spacing={3} align="flex-start">
                                                        <Box
                                                            p={2}
                                                            borderRadius="lg"
                                                            bg={`${config.color}.50`}
                                                            flexShrink={0}
                                                        >
                                                            <LogIcon size={18} color={config.accent} />
                                                        </Box>
                                                        <Box flex="1" minW={0}>
                                                            <Text
                                                                fontSize="sm"
                                                                fontWeight="semibold"
                                                                color="#2D4185"
                                                                wordBreak="break-word"
                                                            >
                                                                {getAmountDisplay(log)}
                                                            </Text>
                                                            {log.description && (
                                                                <Text
                                                                    fontSize="sm"
                                                                    color="#718096"
                                                                    mt={1}
                                                                    wordBreak="break-word"
                                                                >
                                                                    {log.description}
                                                                </Text>
                                                            )}
                                                                {log.action_type === "Paid" &&
                                                                    log.payment_method && (
                                                                        <Badge
                                                                            mt={2}
                                                                            variant="outline"
                                                                            colorScheme="gray"
                                                                            fontSize="xs"
                                                                        >
                                                                            {log.payment_method}
                                                                        </Badge>
                                                                    )}
                                                            {log.action_type === "Paid" &&
                                                                log.payment_method === "Online" &&
                                                                log.payment_evidence && (
                                                                    <Link
                                                                        href={log.payment_evidence}
                                                                        isExternal
                                                                        mt={2}
                                                                        display="inline-flex"
                                                                        alignItems="center"
                                                                        gap={1}
                                                                        fontSize="sm"
                                                                        color="#2D4185"
                                                                        fontWeight="medium"
                                                                    >
                                                                        <Paperclip size={14} />
                                                                        View payment evidence
                                                                    </Link>
                                                                )}
                                                        </Box>
                                                    </HStack>
                                                </Box>
                                            );
                                        })}
                                    </VStack>
                                )}
                            </Box>
                        </VStack>
                    </ModalBody>

                    <ModalFooter
                        flexShrink={0}
                        borderTopWidth="1px"
                        borderColor="#E0E8EC"
                        bg="#FAFBFC"
                        justifyContent="space-between"
                        flexWrap="wrap"
                        gap={3}
                        px={{ base: 4, md: 6 }}
                        py={4}
                    >
                        <Button variant="ghost" borderRadius="xl" onClick={handleClose}>
                            Close
                        </Button>
                        <HStack spacing={2} flexWrap="wrap">
                            <Button
                                type="button"
                                leftIcon={<Download size={16} />}
                                borderRadius="xl"
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
                                borderRadius="xl"
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
