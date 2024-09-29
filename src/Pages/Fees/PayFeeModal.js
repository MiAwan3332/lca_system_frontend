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
    Box,
    Code,
} from "@chakra-ui/react";
import { useFormik } from "formik";
import * as Yup from "yup";
import Cookies from "js-cookie";
import { useSelector } from "react-redux";
import { HandCoins, Pen } from "lucide-react";
import { useDispatch } from "react-redux";
import { fetchFees, payFee } from "../../Features/feeSlice.js";

function PayFeeModal({ fee, isDisabled }) {
    const [isOpen, setIsOpen] = React.useState(false);
    const onOpen = () => setIsOpen(true);
    const onClose = () => setIsOpen(false);

    const [authToken, setAuthToken] = useState(Cookies.get("authToken"));

    const [inputAmount, setInputAmount] = useState(0);
    const { updateStatus } = useSelector((state) => state.fees);
    const dispatch = useDispatch();

    const formik = useFormik({
        initialValues: {
            amount: 0,
        },
        validationSchema: Yup.object({
            amount: Yup.number().min(1).max(fee.amount).required("Required"),
        }),
        onSubmit: async (values) => {
            dispatch(payFee({ authToken, id: fee._id, studentId: fee.student._id, amount: values.amount }))
                .unwrap()
                .then(() => {
                    dispatch(fetchFees({ authToken }));
                    onClose();
                });
        },
    });
    return (
        <>
            <button
                className="hover:bg-[#FFCB82] hover:text-[#85652D] disabled:cursor-not-allowed disabled:opacity-60 font-medium p-[10px] rounded-xl transition-colors duration-300 flex flex-nowrap items-center gap-1.5 pr-3"
                onClick={onOpen}
                disabled={isDisabled}
            >
                <HandCoins size={18} />
                <span>Pay Fee</span>
            </button>
            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader className="text-xl font-semibold">
                        Pay Fee
                    </ModalHeader>
                    <ModalCloseButton />
                    <form onSubmit={formik.handleSubmit}>
                        <ModalBody>
                            <VStack spacing={4} align={"stretch"}>
                                <Code colorScheme={fee.amount - inputAmount >= 0 && inputAmount > 0 && inputAmount ? "green" : "red"}>{fee.amount + " - " + (inputAmount || 0) + " = " + parseInt(fee.amount - inputAmount) + " Rs."}</Code>
                                <FormControl>
                                    <FormLabel>Fee Amount</FormLabel>
                                    <Input
                                        name="amount"
                                        placeholder="Enter amount"
                                        borderRadius={"0.75rem"}
                                        type="number"
                                        onChange={(e) => {
                                            setInputAmount(e.target.value);
                                            formik.handleChange(e);
                                        }}
                                        value={formik.values.amount}
                                        disabled={isDisabled}
                                    />
                                    {formik.errors.amount && formik.touched.amount ? (
                                        <p className="text-red-500">{formik.errors.amount}</p>
                                    ) : null}
                                </FormControl>
                            </VStack>
                        </ModalBody>

                        <ModalFooter>
                            <Button
                                variant="ghost"
                                mr={3}
                                borderRadius={"0.75rem"}
                                onClick={onClose}
                            >
                                Close
                            </Button>
                            <Button
                                borderRadius={"0.75rem"}
                                backgroundColor={"#82B4FF"}
                                color={"#2D4185"}
                                _hover={{
                                    backgroundColor: "#74A0E3",
                                    color: "#223163",
                                }}
                                fontWeight={"500"}
                                type="submit"
                                loadingText="Updating"
                                isLoading={updateStatus === "loading"}
                            >
                                Update
                            </Button>
                        </ModalFooter>
                    </form>
                </ModalContent>
            </Modal>
        </>
    );
}

export default PayFeeModal;
