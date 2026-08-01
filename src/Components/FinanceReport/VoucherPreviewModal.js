import React, { useMemo, useState } from "react";
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
  downloadFinanceVoucherPdf,
  printFinanceVoucherPdf,
} from "../../utlls/generateFinanceVoucherPdf";
import {
  getResponsiveModalSize,
  responsiveModalContentProps,
} from "../../utlls/responsiveModal";

const ZOOM_LEVELS = [0.5, 0.65, 0.8, 1];
const DEFAULT_ZOOM_INDEX = ZOOM_LEVELS.length - 1;

function VoucherPreviewModal({ isOpen, onClose, transaction }) {
  const [zoomIndex, setZoomIndex] = useState(DEFAULT_ZOOM_INDEX);
  const [busyAction, setBusyAction] = useState("");
  const toast = useToast();

  const voucherData = useMemo(
    () => (transaction ? buildVoucherData(transaction) : null),
    [transaction]
  );

  const zoom = ZOOM_LEVELS[zoomIndex];

  const handleZoomIn = () => {
    setZoomIndex((prev) => Math.min(prev + 1, ZOOM_LEVELS.length - 1));
  };

  const handleZoomOut = () => {
    setZoomIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleResetZoom = () => setZoomIndex(DEFAULT_ZOOM_INDEX);

  const handleDownload = async () => {
    if (!transaction) return;

    setBusyAction("download");
    try {
      await downloadFinanceVoucherPdf(transaction);
      toast({
        title: "PDF downloaded",
        description: "Printed on A4 paper, same size as Admission Slip.",
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
    if (!transaction) return;
    setBusyAction("print");
    try {
      await printFinanceVoucherPdf(transaction);
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
              Print uses A4 paper — same card size as Admission Slip
            </Text>
          </div>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody className="voucher-preview-modal__body">
          <HStack justify="space-between" mb={4} flexWrap="wrap" gap={2}>
            <Text fontSize="sm" color="gray.600">
              Preview — {Math.round(zoom * 100)}% zoom
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
              className="voucher-preview-canvas"
              style={{ transform: `scale(${zoom})` }}
            >
              <VoucherPrintSheet data={voucherData} />
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
            isDisabled={!transaction}
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
            isDisabled={!transaction}
          >
            Download PDF
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default VoucherPreviewModal;
