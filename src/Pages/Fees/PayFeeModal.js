import React, { useRef, useState } from "react";
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
  HStack,
  Textarea,
  Text,
} from "@chakra-ui/react";
import { useFormik } from "formik";
import * as Yup from "yup";
import Cookies from "js-cookie";
import { useSelector, useDispatch } from "react-redux";
import { HandCoins } from "lucide-react";
import moment from "moment";
import { fetchFees, payFee } from "../../Features/feeSlice.js";
import {
  FEE_PAYMENT_METHODS,
  requiresPaymentEvidence,
} from "../../utlls/paymentMethods";

function PayFeeModal({ fee, isDisabled }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const onOpen = () => setIsOpen(true);

  const [authToken] = useState(Cookies.get("authToken"));
  const [inputAmount, setInputAmount] = useState(0);
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [evidenceError, setEvidenceError] = useState("");
  const evidenceInputRef = useRef(null);
  const { updateStatus } = useSelector((state) => state.fees);
  const dispatch = useDispatch();
  const balance = Number(fee?.amount) || 0;
  const today = moment().format("YYYY-MM-DD");

  const formik = useFormik({
    initialValues: {
      amount: 0,
      payment_method: "Cash",
      next_installment_date: "",
      remarks: "",
    },
    validationSchema: Yup.object({
      amount: Yup.number()
        .typeError("Must be a number")
        .min(1, "Amount must be greater than 0")
        .max(balance, "Cannot exceed fee balance")
        .required("Required"),
      payment_method: Yup.string()
        .oneOf(FEE_PAYMENT_METHODS, "Select a payment method")
        .required("Required"),
      next_installment_date: Yup.string().when("amount", {
        is: (amount) => Number(amount) > 0 && Number(amount) < balance,
        then: (schema) =>
          schema
            .required("Next installment date is required for partial payment")
            .test(
              "not-past",
              "Date must be today or in the future",
              (value) => !value || !moment(value).isBefore(moment(), "day")
            ),
        otherwise: (schema) => schema.notRequired(),
      }),
      remarks: Yup.string().trim().required("Remarks are required"),
    }),
    onSubmit: async (values) => {
      if (requiresPaymentEvidence(values.payment_method) && !evidenceFile) {
        setEvidenceError("Online payment receipt/slip is required");
        return;
      }

      const amount = Number(values.amount);
      const isPartialPayment = amount < balance;

      try {
        await dispatch(
          payFee({
            authToken,
            id: fee._id,
            studentId: fee.student._id,
            amount,
            payment_method: values.payment_method,
            description: values.remarks.trim(),
            next_installment_date: isPartialPayment
              ? values.next_installment_date
              : undefined,
            payment_evidence: evidenceFile || undefined,
          })
        ).unwrap();
        dispatch(fetchFees({ authToken }));
        setIsOpen(false);
        setEvidenceFile(null);
        setEvidenceError("");
        setInputAmount(0);
        formik.resetForm();
      } catch {
        // leave modal open for correction
      }
    },
  });

  const onClose = () => {
    setIsOpen(false);
    setEvidenceFile(null);
    setEvidenceError("");
    setInputAmount(0);
    formik.resetForm();
  };

  const isPartial =
    Number(formik.values.amount) > 0 &&
    Number(formik.values.amount) < balance;

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
          <ModalHeader className="text-xl font-semibold">Pay Fee</ModalHeader>
          <ModalCloseButton />
          <form onSubmit={formik.handleSubmit}>
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <Code
                  colorScheme={
                    balance - inputAmount >= 0 && inputAmount > 0
                      ? "green"
                      : "red"
                  }
                >
                  {balance +
                    " - " +
                    (inputAmount || 0) +
                    " = " +
                    parseInt(balance - inputAmount, 10) +
                    " Rs."}
                </Code>
                <FormControl isRequired>
                  <FormLabel>Fee Amount</FormLabel>
                  <Input
                    name="amount"
                    placeholder="Enter amount"
                    borderRadius="0.75rem"
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

                {isPartial && (
                  <FormControl isRequired>
                    <FormLabel>Next installment due date</FormLabel>
                    <Input
                      type="date"
                      name="next_installment_date"
                      borderRadius="0.75rem"
                      min={today}
                      value={formik.values.next_installment_date}
                      onChange={formik.handleChange}
                    />
                    {formik.touched.next_installment_date &&
                    formik.errors.next_installment_date ? (
                      <Text color="red.500" fontSize="sm">
                        {formik.errors.next_installment_date}
                      </Text>
                    ) : null}
                  </FormControl>
                )}

                <FormControl isRequired>
                  <FormLabel>Payment Method</FormLabel>
                  <HStack spacing={2} flexWrap="wrap">
                    {FEE_PAYMENT_METHODS.map((method) => (
                      <Button
                        key={method}
                        size="sm"
                        type="button"
                        variant={
                          formik.values.payment_method === method
                            ? "solid"
                            : "outline"
                        }
                        colorScheme={
                          method === "Online Payment" ? "blue" : "yellow"
                        }
                        onClick={() => {
                          formik.setFieldValue("payment_method", method);
                          if (!requiresPaymentEvidence(method)) {
                            setEvidenceFile(null);
                            setEvidenceError("");
                          }
                        }}
                      >
                        {method}
                      </Button>
                    ))}
                  </HStack>
                  {formik.errors.payment_method &&
                  formik.touched.payment_method ? (
                    <Box color="red.500" fontSize="sm" mt={1}>
                      {formik.errors.payment_method}
                    </Box>
                  ) : null}
                </FormControl>

                {requiresPaymentEvidence(formik.values.payment_method) && (
                  <FormControl isRequired>
                    <FormLabel>Online payment receipt / slip</FormLabel>
                    <Input
                      ref={evidenceInputRef}
                      type="file"
                      accept="image/*,.pdf"
                      display="none"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setEvidenceFile(file);
                        setEvidenceError(
                          file ? "" : "Online payment receipt/slip is required"
                        );
                        e.target.value = "";
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => evidenceInputRef.current?.click()}
                    >
                      {evidenceFile ? "Change attachment" : "Upload attachment"}
                    </Button>
                    {evidenceFile ? (
                      <Text fontSize="sm" mt={1} color="gray.600">
                        {evidenceFile.name}
                      </Text>
                    ) : null}
                    {evidenceError ? (
                      <Text color="red.500" fontSize="sm" mt={1}>
                        {evidenceError}
                      </Text>
                    ) : null}
                  </FormControl>
                )}

                <FormControl isRequired>
                  <FormLabel>Remarks</FormLabel>
                  <Textarea
                    name="remarks"
                    borderRadius="0.75rem"
                    value={formik.values.remarks}
                    onChange={formik.handleChange}
                  />
                  {formik.touched.remarks && formik.errors.remarks ? (
                    <Text color="red.500" fontSize="sm">
                      {formik.errors.remarks}
                    </Text>
                  ) : null}
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
