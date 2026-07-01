import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  ButtonGroup,
  HStack,
  Text,
  useToast,
  IconButton,
} from "@chakra-ui/react";
import { Download, Printer, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import VoucherPrintSheet from "./VoucherPrintSheet";
import { buildVoucherData } from "../../utlls/financeVoucherUtils";
import {
  downloadVoucherPdf,
  exportVoucherImage,
  mountVoucherPrintPage,
  printVoucherImage,
  unmountVoucherPrintPage,
} from "../../utlls/generateFinanceVoucher";
import {
  getResponsiveModalSize,
  responsiveModalContentProps,
} from "../../utlls/responsiveModal";

const ZOOM_LEVELS = [0.5, 0.65, 0.8, 1];
const DEFAULT_ZOOM_INDEX = ZOOM_LEVELS.length - 1;

function VoucherPreviewModal({ isOpen, onClose, transaction }) {
  const sheetRef = useRef(null);
  const canvasRef = useRef(null);
  const [zoomIndex, setZoomIndex] = useState(DEFAULT_ZOOM_INDEX);
  const [busyAction, setBusyAction] = useState("");
  const [snapshotUrl, setSnapshotUrl] = useState(null);
  const [isPreparingOutput, setIsPreparingOutput] = useState(false);
  const toast = useToast();

  const voucherData = useMemo(
    () => (transaction ? buildVoucherData(transaction) : null),
    [transaction]
  );

  const zoom = ZOOM_LEVELS[zoomIndex];

  const refreshSnapshot = useCallback(async () => {
    if (!sheetRef.current) return null;

    setIsPreparingOutput(true);
    try {
      const imageUrl = await exportVoucherImage(sheetRef.current, canvasRef.current);
      setSnapshotUrl(imageUrl);
      return imageUrl;
    } catch (error) {
      setSnapshotUrl(null);
      throw error;
    } finally {
      setIsPreparingOutput(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen || !voucherData) {
      setSnapshotUrl(null);
      setIsPreparingOutput(false);
      return undefined;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      if (cancelled || !sheetRef.current) return;
      try {
        await refreshSnapshot();
      } catch {
        if (!cancelled) setSnapshotUrl(null);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [isOpen, voucherData, refreshSnapshot]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleBeforePrint = () => {
      if (snapshotUrl) {
        mountVoucherPrintPage(snapshotUrl);
      }
    };

    const handleAfterPrint = () => {
      unmountVoucherPrintPage();
    };

    window.addEventListener("beforeprint", handleBeforePrint);
    window.addEventListener("afterprint", handleAfterPrint);

    return () => {
      window.removeEventListener("beforeprint", handleBeforePrint);
      window.removeEventListener("afterprint", handleAfterPrint);
      unmountVoucherPrintPage();
    };
  }, [isOpen, snapshotUrl]);

  const handleZoomIn = () => {
    setZoomIndex((prev) => Math.min(prev + 1, ZOOM_LEVELS.length - 1));
  };

  const handleZoomOut = () => {
    setZoomIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleResetZoom = () => setZoomIndex(DEFAULT_ZOOM_INDEX);

  const getOutputImage = useCallback(async () => {
    if (snapshotUrl) return snapshotUrl;
    return refreshSnapshot();
  }, [snapshotUrl, refreshSnapshot]);

  const handleDownload = async () => {
    if (!sheetRef.current) return;

    setBusyAction("download");
    try {
      const imageUrl = await getOutputImage();
      if (!imageUrl) {
        throw new Error("Voucher preview is not ready.");
      }
      await downloadVoucherPdf(
        sheetRef.current,
        canvasRef.current,
        transaction,
        imageUrl
      );
      toast({
        title: "PDF downloaded",
        description: "PDF matches the voucher preview layout.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: error.message || "Could not generate PDF.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setBusyAction("");
    }
  };

  const handlePrint = async () => {
    setBusyAction("print");
    try {
      unmountVoucherPrintPage();
      const imageUrl = await getOutputImage();
      if (!imageUrl) {
        throw new Error("Voucher preview is not ready.");
      }
      printVoucherImage(imageUrl);
    } catch (error) {
      toast({
        title: "Print failed",
        description: error.message || "Could not prepare voucher for printing.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setTimeout(() => setBusyAction(""), 500);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      {...getResponsiveModalSize("6xl")}
      scrollBehavior="inside"
    >
      <ModalOverlay />
      <ModalContent {...responsiveModalContentProps} className="voucher-preview-modal">
        <ModalHeader className="voucher-preview-modal__header">
          <div>
            <Text fontSize="lg" fontWeight="semibold">
              Voucher Preview
            </Text>
            <Text fontSize="sm" color="gray.500">
              Print and PDF use this exact layout on one A4 page
            </Text>
          </div>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody className="voucher-preview-modal__body">
          <HStack justify="space-between" mb={4} flexWrap="wrap" gap={2}>
            <Text fontSize="sm" color="gray.600">
              A4 sheet with 4 voucher slips — {Math.round(zoom * 100)}% zoom
              {isPreparingOutput ? " · Syncing print output..." : ""}
            </Text>
            <ButtonGroup size="sm" variant="outline" isAttached>
              <IconButton
                aria-label="Zoom out"
                icon={<ZoomOut size={16} />}
                onClick={handleZoomOut}
                isDisabled={zoomIndex === 0}
              />
              <IconButton
                aria-label="Reset zoom"
                icon={<RotateCcw size={16} />}
                onClick={handleResetZoom}
              />
              <IconButton
                aria-label="Zoom in"
                icon={<ZoomIn size={16} />}
                onClick={handleZoomIn}
                isDisabled={zoomIndex === ZOOM_LEVELS.length - 1}
              />
            </ButtonGroup>
          </HStack>

          <div className="voucher-preview-stage">
            <div
              ref={canvasRef}
              className="voucher-preview-canvas"
              style={{ transform: `scale(${zoom})` }}
            >
              <VoucherPrintSheet ref={sheetRef} data={voucherData} />
            </div>
          </div>
        </ModalBody>

        <ModalFooter className="voucher-preview-modal__footer" gap={3} flexWrap="wrap">
          <Button variant="ghost" borderRadius="xl" onClick={onClose}>
            Close
          </Button>
          <Button
            leftIcon={<Printer size={18} />}
            borderRadius="xl"
            variant="outline"
            onClick={handlePrint}
            isLoading={busyAction === "print"}
          >
            Print
          </Button>
          <Button
            leftIcon={<Download size={18} />}
            borderRadius="xl"
            backgroundColor="#FFCB82"
            color="#85652D"
            _hover={{ backgroundColor: "#E3B574", color: "#654E26" }}
            onClick={handleDownload}
            isLoading={busyAction === "download"}
            loadingText="Generating..."
          >
            Download PDF
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default VoucherPreviewModal;
