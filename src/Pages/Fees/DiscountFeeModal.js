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
    VStack,
    Code,
    Textarea,
    FormErrorMessage,
    useToast,
} from "@chakra-ui/react";
import { useFormik } from "formik";
import * as Yup from "yup";
import Cookies from "js-cookie";
import { useSelector } from "react-redux";
import { Percent } from "lucide-react";
import { useDispatch } from "react-redux";
import { discountFee, fetchFees } from "../../Features/feeSlice.js";
import { selectUser } from "../../Features/authSlice";
import { generatePendingPaymentSlip } from "../../utlls/generatePendingPaymentSlip";
import { saveLastFeeSlipPayload } from "../../utlls/feeSlipStorage";
import { issueSlipVerificationQr } from "../../utlls/slipVerification";
import { formatClassTimeRange } from "../../utlls/classTime";

function DiscountFeeModal({ fee, isDisabled }) {
    const [isOpen, setIsOpen] = React.useState(false);
    const onOpen = () => setIsOpen(true);

    const [authToken] = useState(Cookies.get("authToken"));
    const [inputAmount, setInputAmount] = useState(0);
    const [isPrinting, setIsPrinting] = useState(false);
    const { updateStatus } = useSelector((state) => state.fees);
    const currentUser = useSelector(selectUser);
    const dispatch = useDispatch();
    const toast = useToast();

    const printPaidZeroSlip = async (discountAmount) => {
        const student = fee?.student || {};
        const batch = fee?.batch || student?.batch || {};
        const outstanding = Math.max(Number(fee?.amount) || 0, 0);
        const slipPayload = {
            name: student.name || "",
            phone: student.phone || "",
            cnic: student.cnic || "",
            rollNumber: student.roll_number || "",
            batchName: batch.name || "N/A",
            batchFee: Number(batch.batch_fee) || outstanding,
            totalFee:
                Number(student.total_fee) ||
                Number(batch.batch_fee) ||
                outstanding,
            paidFee: Number(student.paid_fee) || 0,
            outstandingBalance: outstanding,
            payingNow: 0,
            remainingAfter: Math.max(outstanding - discountAmount, 0),
            discountAmount,
            paymentOption: "full",
            paymentMethod: "Discount",
            nextInstallmentDate: "",
            photoUrl: student.image || "",
            authorizedBy: currentUser?.name || "",
            classStartTime: batch.class_start_time || "",
            classEndTime: batch.class_end_time || "",
        };

        if (student._id) {
            saveLastFeeSlipPayload(student._id, slipPayload);
        }

        setIsPrinting(true);
        try {
            const { qrDataUrl, verifyUrl } = await issueSlipVerificationQr({
                authToken,
                student_name: slipPayload.name,
                cnic: slipPayload.cnic,
                phone: slipPayload.phone,
                batch_name: slipPayload.batchName,
                total_fee: slipPayload.totalFee,
                amount_received: 0,
                remaining_fee: slipPayload.remainingAfter,
                payment_option: "full",
                payment_method: "Discount",
                class_time: formatClassTimeRange(
                    slipPayload.classStartTime,
                    slipPayload.classEndTime
                ),
                authorized_by: slipPayload.authorizedBy,
                slip_type: "fee",
            });
            await generatePendingPaymentSlip(
                { ...slipPayload, qrDataUrl, verifyUrl },
                "print"
            );
            toast({
                title: "Paid zero slip ready",
                description:
                    "100% discount applied. Fee slip opened for printing.",
                status: "success",
                duration: 4000,
                isClosable: true,
            });
        } catch (error) {
            toast({
                title: "Discount applied, but slip failed",
                description:
                    error?.message || "Please allow pop-ups and reprint from Students.",
                status: "warning",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsPrinting(false);
        }
    };

    const formik = useFormik({
        initialValues: {
            amount: "",
            description: "",
        },
        validationSchema: Yup.object({
            amount: Yup.number()
                .min(1, "Minimum 1")
                .max(fee.amount, "Amount exceeds fee balance")
                .required("Required"),
            description: Yup.string()
                .trim()
                .min(3, "Description must be at least 3 characters")
                .required("Description is required"),
        }),
        onSubmit: async (values) => {
            const discountAmount = Number(values.amount);
            const isFullDiscount =
                discountAmount > 0 && discountAmount >= Number(fee.amount);

            try {
                await dispatch(
                    discountFee({
                        authToken,
                        id: fee._id,
                        studentId: fee.student._id,
                        amount: discountAmount,
                        description: values.description.trim(),
                    })
                ).unwrap();
                dispatch(fetchFees({ authToken }));
                onClose();

                if (isFullDiscount) {
                    await printPaidZeroSlip(discountAmount);
                } else {
                    toast({
                        title: "Discount applied",
                        status: "success",
                        duration: 3000,
                        isClosable: true,
                    });
                }
            } catch (error) {
                toast({
                    title: "Could not apply discount",
                    description: error?.message || "Please try again.",
                    status: "error",
                    duration: 4500,
                    isClosable: true,
                });
            }
        },
    });

    const onClose = () => {
        formik.resetForm();
        setInputAmount(0);
        setIsOpen(false);
    };

    return (
        <>
            <button
                className="hover:bg-[#FFCB82] hover:text-[#85652D] disabled:cursor-not-allowed disabled:opacity-60 font-medium p-[10px] rounded-xl transition-colors duration-300 flex flex-nowrap items-center gap-1.5 pr-3"
                onClick={onOpen}
                disabled={isDisabled}
            >
                <Percent size={18} />
                <span>Apply Discount</span>
            </button>
            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader className="text-xl font-semibold">
                        Apply Discount
                    </ModalHeader>
                    <ModalCloseButton />
                    <form onSubmit={formik.handleSubmit}>
                        <ModalBody>
                            <VStack spacing={4} align="stretch">
                                <Code
                                    colorScheme={
                                        fee.amount - inputAmount >= 0 &&
                                        inputAmount > 0
                                            ? "green"
                                            : "red"
                                    }
                                >
                                    {fee.amount} - {inputAmount || 0} ={" "}
                                    {parseInt(fee.amount - (inputAmount || 0))} Rs.
                                </Code>

                                <FormControl
                                    isRequired
                                    isInvalid={
                                        formik.errors.amount && formik.touched.amount
                                    }
                                >
                                    <FormLabel>Discount Amount</FormLabel>
                                    <Input
                                        name="amount"
                                        placeholder="Enter discount amount"
                                        borderRadius="0.75rem"
                                        type="number"
                                        onChange={(e) => {
                                            setInputAmount(e.target.value);
                                            formik.handleChange(e);
                                        }}
                                        onBlur={formik.handleBlur}
                                        value={formik.values.amount}
                                        disabled={isDisabled}
                                    />
                                    <FormErrorMessage>
                                        {formik.errors.amount}
                                    </FormErrorMessage>
                                </FormControl>

                                <FormControl
                                    isRequired
                                    isInvalid={
                                        formik.errors.description &&
                                        formik.touched.description
                                    }
                                >
                                    <FormLabel>Description</FormLabel>
                                    <Textarea
                                        name="description"
                                        placeholder="Enter reason for discount (required)"
                                        borderRadius="0.75rem"
                                        rows={3}
                                        value={formik.values.description}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                    />
                                    <FormErrorMessage>
                                        {formik.errors.description}
                                    </FormErrorMessage>
                                </FormControl>
                            </VStack>
                        </ModalBody>

                        <ModalFooter>
                            <Button
                                variant="ghost"
                                mr={3}
                                onClick={onClose}
                                borderRadius="0.75rem"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                borderRadius="0.75rem"
                                backgroundColor="#FFCB82"
                                color="#85652D"
                                isLoading={
                                    updateStatus === "loading" || isPrinting
                                }
                                loadingText={
                                    isPrinting ? "Printing slip" : "Applying"
                                }
                            >
                                Apply Discount
                            </Button>
                        </ModalFooter>
                    </form>
                </ModalContent>
            </Modal>
        </>
    );
}

export default DiscountFeeModal;
