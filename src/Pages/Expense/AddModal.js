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
import moment from "moment";
import { useSelector, useDispatch } from "react-redux";
import { addExpense } from "../../Features/expenseSlice";
import {
  EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
} from "./expenseConstants";

function AddModal({ isOpen, onClose, onAdded }) {
  const [authToken] = useState(Cookies.get("authToken"));
  const { addStatus } = useSelector((state) => state.expenses);
  const dispatch = useDispatch();

  const formik = useFormik({
    initialValues: {
      title: "",
      description: "",
      amount: "",
      category: "Other",
      expense_date: moment().format("YYYY-MM-DD"),
      payment_method: "Cash",
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
      dispatch(addExpense({ authToken, expense: values }))
        .unwrap()
        .then(() => {
          formik.resetForm({
            values: {
              title: "",
              description: "",
              amount: "",
              category: "Other",
              expense_date: moment().format("YYYY-MM-DD"),
              payment_method: "Cash",
            },
          });
          onClose();
          onAdded();
        });
    },
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader className="text-xl font-semibold">Add Expense</ModalHeader>
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
                {formik.touched.amount && formik.errors.amount ? (
                  <Box color="red" fontSize="sm">
                    {formik.errors.amount}
                  </Box>
                ) : null}
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
              backgroundColor="#FFCB82"
              color="#85652D"
              _hover={{ backgroundColor: "#E3B574", color: "#654E26" }}
              fontWeight="500"
              type="submit"
              loadingText="Adding..."
              isLoading={addStatus === "loading"}
            >
              Add
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}

export default AddModal;
