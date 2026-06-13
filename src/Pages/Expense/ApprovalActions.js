import React, { useState } from "react";
import Cookies from "js-cookie";
import { Button, useDisclosure } from "@chakra-ui/react";
import { Check, X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { approveExpense, rejectExpense } from "../../Features/expenseSlice";
import RejectModal from "./RejectModal";

function ApprovalActions({ expense, onUpdated }) {
  const [authToken] = useState(Cookies.get("authToken"));
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { approvalStatus } = useSelector((state) => state.expenses);
  const dispatch = useDispatch();

  if (expense.status !== "Pending") {
    return null;
  }

  const handleApprove = () => {
    dispatch(approveExpense({ authToken, expenseId: expense._id }))
      .unwrap()
      .then(() => onUpdated());
  };

  const handleReject = (rejection_reason) => {
    dispatch(
      rejectExpense({ authToken, expenseId: expense._id, rejection_reason })
    )
      .unwrap()
      .then(() => {
        onClose();
        onUpdated();
      });
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        size="sm"
        borderRadius="lg"
        backgroundColor="#82FFCB"
        color="#1F6D4A"
        _hover={{ backgroundColor: "#74E3B5" }}
        onClick={handleApprove}
        isLoading={approvalStatus === "loading"}
        leftIcon={<Check size={14} />}
      >
        Approve
      </Button>
      <Button
        size="sm"
        borderRadius="lg"
        backgroundColor="#FF8A8A"
        color="#6D1F1F"
        _hover={{ backgroundColor: "#E48080" }}
        onClick={onOpen}
        leftIcon={<X size={14} />}
      >
        Reject
      </Button>
      <RejectModal
        isOpen={isOpen}
        onClose={onClose}
        onReject={handleReject}
        isLoading={approvalStatus === "loading"}
      />
    </div>
  );
}

export default ApprovalActions;
