import React, { useState } from "react";
import { Button, useToast } from "@chakra-ui/react";
import Cookies from "js-cookie";
import { FileText } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { getOrCreatePendingFeeSlip } from "../../Features/studentSlice";
import {
  generatePendingFeeSlipPdf,
  openFeeSlipUrl,
} from "../../utlls/generatePendingFeeSlip";
import { getMediaUrl } from "../../utlls/useful.js";

const formatPendingAmount = (amount) =>
  `Rs. ${Number(amount || 0).toLocaleString("en-PK", {
    maximumFractionDigits: 0,
  })}`;

/**
 * Action-menu button: generate or open pending fee slip when student has dues.
 */
function GeneratePendingFeeSlipAction({ student }) {
  const authToken = Cookies.get("authToken");
  const dispatch = useDispatch();
  const toast = useToast();
  const { pendingFeeSlipStatus } = useSelector((state) => state.students);
  const [busy, setBusy] = useState(false);

  const pendingAmount = Math.round(Math.max(Number(student?.pending_fee) || 0, 0));
  if (pendingAmount <= 0) {
    return null;
  }

  const handleClick = async () => {
    if (!student?._id || busy) return;
    setBusy(true);

    try {
      let result;
      try {
        result = await dispatch(
          getOrCreatePendingFeeSlip({
            authToken,
            studentId: student._id,
          })
        ).unwrap();
      } catch (error) {
        if (
          error?.code !== "NEED_SLIP_FILE" &&
          !error?.message?.includes?.("PDF is required")
        ) {
          throw error;
        }
        result = error;
      }

      if (result?.reused && result?.slip_url) {
        openFeeSlipUrl(getMediaUrl(result.slip_url));
        toast({
          title: "Existing pending fee slip opened",
          description: `Pending Amount: ${formatPendingAmount(
            result.pending_amount ?? pendingAmount
          )}`,
          status: "info",
          duration: 4000,
          isClosable: true,
        });
        return;
      }

      const amount =
        Number(result?.pending_amount) > 0
          ? Number(result.pending_amount)
          : pendingAmount;

      const slipFile = await generatePendingFeeSlipPdf({
        name: student.name,
        email: student.email,
        phone: student.phone,
        rollNumber: student.roll_number,
        batchName: student.batch?.name || "N/A",
        totalFee: student.total_fee,
        paidFee: student.paid_fee,
        pendingAmount: amount,
      });

      const created = await dispatch(
        getOrCreatePendingFeeSlip({
          authToken,
          studentId: student._id,
          slipFile,
        })
      ).unwrap();

      openFeeSlipUrl(getMediaUrl(created.slip_url));
      toast({
        title: created?.reused
          ? "Existing pending fee slip opened"
          : "Pending fee slip generated",
        description: `Pending Amount: ${formatPendingAmount(
          created.pending_amount ?? amount
        )}`,
        status: "success",
        duration: 4000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Could not generate pending fee slip",
        description:
          error?.message ||
          error?.payload?.message ||
          "Please try again.",
        status: "error",
        duration: 4500,
        isClosable: true,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      leftIcon={<FileText size={14} />}
      onClick={handleClick}
      isLoading={busy || pendingFeeSlipStatus === "loading"}
      loadingText="Generating"
    >
      Generate Pending Slip
    </Button>
  );
}

export default GeneratePendingFeeSlipAction;
