import React, { useMemo, useState } from "react";
import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { useFormik } from "formik";
import * as Yup from "yup";
import Cookies from "js-cookie";
import { Banknote } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import ActionButton from "../../Components/ActionButton";
import { createRefundRequest } from "../../Features/refundRequestSlice";
import { fetchStudents } from "../../Features/studentSlice";
import { selectUser } from "../../Features/authSlice";
import { canCreateRefundRequest } from "../../utlls/refundAccess";
import {
  getResponsiveModalSize,
  responsiveModalContentProps,
  responsiveModalProps,
} from "../../utlls/responsiveModal";

const formatAmount = (amount) =>
  `Rs. ${Number(amount || 0).toLocaleString("en-PK", {
    maximumFractionDigits: 0,
  })}`;

function RefundRequestAction({ student }) {
  const authToken = Cookies.get("authToken");
  const dispatch = useDispatch();
  const currentUser = useSelector(selectUser);
  const { createStatus } = useSelector((state) => state.refundRequests);
  const [isOpen, setIsOpen] = useState(false);

  const paidFee = Math.round(Math.max(Number(student?.paid_fee) || 0, 0));
  const userRole = currentUser?.role?.name || currentUser?.role;
  const alreadyRefunded = Boolean(student?.has_refunded_request);
  const hasOpenRequest = Boolean(
    student?.pending_refund_request || student?.approved_refund_request
  );

  const validationSchema = useMemo(
    () =>
      Yup.object({
        amount: Yup.number()
          .typeError("Enter a valid amount")
          .required("Amount is required")
          .moreThan(0, "Amount must be greater than 0")
          .max(paidFee, `Amount cannot exceed paid fee (${paidFee})`),
        reason: Yup.string().trim().required("Reason is required"),
      }),
    [paidFee]
  );

  const formik = useFormik({
    initialValues: {
      amount: paidFee > 0 ? String(paidFee) : "",
      reason: "",
    },
    enableReinitialize: true,
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        await dispatch(
          createRefundRequest({
            authToken,
            studentId: student._id,
            amount: Number(values.amount),
            reason: values.reason.trim(),
          })
        ).unwrap();
        resetForm();
        setIsOpen(false);
        dispatch(fetchStudents({ authToken }));
      } catch {
        // toast handled in slice
      }
    },
  });

  if (
    !canCreateRefundRequest(userRole) ||
    paidFee <= 0 ||
    alreadyRefunded ||
    hasOpenRequest
  ) {
    return null;
  }

  const onClose = () => {
    formik.resetForm();
    setIsOpen(false);
  };

  return (
    <>
      <ActionButton
        variant="amber"
        icon={<Banknote size={16} />}
        label="Refund Request"
        onClick={() => setIsOpen(true)}
      />

      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size={getResponsiveModalSize("md")}
        {...responsiveModalProps}
      >
        <ModalOverlay />
        <ModalContent {...responsiveModalContentProps}>
          <ModalHeader>Refund Request</ModalHeader>
          <ModalCloseButton />
          <form onSubmit={formik.handleSubmit}>
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <Text fontSize="sm" color="gray.600">
                  Student: <strong>{student?.name || "N/A"}</strong>
                  {student?.roll_number ? ` (${student.roll_number})` : ""}
                </Text>
                <Text fontSize="sm" color="gray.500">
                  Paid fee on record: {formatAmount(paidFee)}
                </Text>

                <FormControl
                  isInvalid={formik.touched.amount && Boolean(formik.errors.amount)}
                >
                  <FormLabel>Refund Amount</FormLabel>
                  <Input
                    name="amount"
                    type="number"
                    min={1}
                    max={paidFee}
                    value={formik.values.amount}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder={`Max ${paidFee}`}
                  />
                  {formik.touched.amount && formik.errors.amount ? (
                    <Text color="red.500" fontSize="sm" mt={1}>
                      {formik.errors.amount}
                    </Text>
                  ) : (
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      Maximum is the student&apos;s paid fee.
                    </Text>
                  )}
                </FormControl>

                <FormControl
                  isInvalid={formik.touched.reason && Boolean(formik.errors.reason)}
                >
                  <FormLabel>Reason</FormLabel>
                  <Textarea
                    name="reason"
                    value={formik.values.reason}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="Why is this refund needed?"
                    rows={4}
                  />
                  {formik.touched.reason && formik.errors.reason ? (
                    <Text color="red.500" fontSize="sm" mt={1}>
                      {formik.errors.reason}
                    </Text>
                  ) : null}
                </FormControl>

                <Text fontSize="xs" color="gray.500">
                  This request will appear on Request Management for approval.
                </Text>
              </VStack>
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} borderRadius="0.75rem" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                borderRadius="0.75rem"
                backgroundColor="#FFCB82"
                color="#85652D"
                _hover={{ backgroundColor: "#E3B574", color: "#654E26" }}
                fontWeight="500"
                isLoading={createStatus === "loading"}
                loadingText="Submitting"
              >
                Submit Request
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </>
  );
}

export default RefundRequestAction;
