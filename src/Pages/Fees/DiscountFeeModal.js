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
} from "@chakra-ui/react";
import { useFormik } from "formik";
import * as Yup from "yup";
import Cookies from "js-cookie";
import { useSelector } from "react-redux";
import { Percent } from "lucide-react";
import { useDispatch } from "react-redux";
import { discountFee, fetchFees } from "../../Features/feeSlice.js";

function DiscountFeeModal({ fee, isDisabled }) {
    const [isOpen, setIsOpen] = React.useState(false);
    const onOpen = () => setIsOpen(true);

    const [authToken] = useState(Cookies.get("authToken"));
    const [inputAmount, setInputAmount] = useState(0);
    const { updateStatus } = useSelector((state) => state.fees);
    const dispatch = useDispatch();

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
            dispatch(
                discountFee({
                    authToken,
                    id: fee._id,
                    studentId: fee.student._id,
                    amount: Number(values.amount),
                    description: values.description.trim(),
                })
            )
                .unwrap()
                .then(() => {
                    dispatch(fetchFees({ authToken }));
                    onClose();
                });
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
                                borderRadius="0.75rem"
                                onClick={onClose}
                            >
                                Close
                            </Button>
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
                                loadingText="Applying..."
                                isLoading={updateStatus === "loading"}
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
