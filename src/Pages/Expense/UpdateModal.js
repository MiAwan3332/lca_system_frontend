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
  Select,
  Textarea,
} from "@chakra-ui/react";
import { useFormik } from "formik";
import * as Yup from "yup";
import Cookies from "js-cookie";
import { Pen } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { updateExpense } from "../../Features/expenseSlice";
import {
  EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
} from "./expenseConstants";

function UpdateModal({ expense, onUpdated }) {
  const [isOpen, setIsOpen] = useState(false);
  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);

  const [authToken] = useState(Cookies.get("authToken"));
  const { updateStatus } = useSelector((state) => state.expenses);
  const dispatch = useDispatch();

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      title: expense.title || "",
      description: expense.description || "",
      amount: expense.amount || "",
      category: expense.category || "Other",
      expense_date: expense.expense_date || "",
      payment_method: expense.payment_method || "Cash",
    },
    validationSchema: Yup.object({
      title: Yup.string().required("Required"),
      description: Yup.string(),
      amount: Yup.number().min(1, "Must be greater than 0").required("Required"),
      category: Yup.string().required("Required"),
      expense_date: Yup.string().required("Required"),
      payment_method: Yup.string().required("Required"),
    }),
    onSubmit: async (values) => {
      dispatch(updateExpense({ authToken, expense: values, id: expense._id }))
        .unwrap()
        .then(() => {
          onClose();
          onUpdated();
        });
    },
  });

  return (
    <>
      <button
        className="hover:bg-[#FFCB82] hover:text-[#85652D] font-medium p-[10px] rounded-xl transition-colors duration-300"
        onClick={onOpen}
      >
        <Pen size={18} />
      </button>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader className="text-xl font-semibold">Update Expense</ModalHeader>
          <ModalCloseButton />
          <form onSubmit={formik.handleSubmit}>
            <ModalBody>
              <VStack spacing={4}>
                <FormControl id="title" isRequired>
                  <FormLabel fontSize={14}>Title</FormLabel>
                  <Input
                    name="title"
                    borderRadius="0.5rem"
                    value={formik.values.title}
                    onChange={formik.handleChange}
                  />
                  {formik.touched.title && formik.errors.title ? (
                    <Box color="red" fontSize="sm">
                      {formik.errors.title}
                    </Box>
                  ) : null}
                </FormControl>
                <FormControl id="description">
                  <FormLabel fontSize={14}>Description</FormLabel>
                  <Textarea
                    name="description"
                    borderRadius="0.5rem"
                    value={formik.values.description}
                    onChange={formik.handleChange}
                  />
                </FormControl>
                <FormControl id="amount" isRequired>
                  <FormLabel fontSize={14}>Amount</FormLabel>
                  <Input
                    type="number"
                    min="1"
                    name="amount"
                    borderRadius="0.5rem"
                    value={formik.values.amount}
                    onChange={formik.handleChange}
                  />
                </FormControl>
                <FormControl id="category" isRequired>
                  <FormLabel fontSize={14}>Category</FormLabel>
                  <Select
                    name="category"
                    borderRadius="0.5rem"
                    value={formik.values.category}
                    onChange={formik.handleChange}
                  >
                    {EXPENSE_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl id="expense_date" isRequired>
                  <FormLabel fontSize={14}>Expense Date</FormLabel>
                  <Input
                    type="date"
                    name="expense_date"
                    borderRadius="0.5rem"
                    value={formik.values.expense_date}
                    onChange={formik.handleChange}
                  />
                </FormControl>
                <FormControl id="payment_method" isRequired>
                  <FormLabel fontSize={14}>Payment Method</FormLabel>
                  <Select
                    name="payment_method"
                    borderRadius="0.5rem"
                    value={formik.values.payment_method}
                    onChange={formik.handleChange}
                  >
                    {PAYMENT_METHODS.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} borderRadius="0.75rem" onClick={onClose}>
                Close
              </Button>
              <Button
                borderRadius="0.75rem"
                backgroundColor="#82B4FF"
                color="#2D4185"
                _hover={{ backgroundColor: "#74A0E3", color: "#223163" }}
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

export default UpdateModal;
