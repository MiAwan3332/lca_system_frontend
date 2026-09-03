import React, { useMemo, useState, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  HStack,
  Text,
  useToast,
  Spinner,
  Box,
} from "@chakra-ui/react";
import { Download, Printer } from "lucide-react";
import {
  downloadFinanceVoucherPdf,
  printFinanceVoucherPdf,
  generateFinanceVoucherPdf,
} from "../../utlls/generateFinanceVoucherPdf";
import {
  getResponsiveModalSize,
  responsiveModalContentProps,
} from "../../utlls/responsiveModal";

function VoucherPreviewModal({ isOpen, onClose, transaction }) {
  const [busyAction, setBusyAction] = useState("");
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const toast = useToast();

  useEffect(() => {
    if (!isOpen || !transaction) {
      setPdfBlobUrl(null);
      return;
    }

    let isMounted = true;
    let currentUrl = null;

    generateFinanceVoucherPdf(transaction, { includeBranding: true })
      .then(({ blobUrl }) => {
        if (isMounted) {
          setPdfBlobUrl(blobUrl);
          currentUrl = blobUrl;
        } else {
          URL.revokeObjectURL(blobUrl);
        }
      })
      .catch((err) => {
        console.error("Voucher preview generation failed:", err);
      });

    return () => {
      isMounted = false;
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
    };
  }, [isOpen, transaction]);

  const handleDownload = async () => {
    if (!transaction) return;

    setBusyAction("download");
    try {
      await downloadFinanceVoucherPdf(transaction);
      toast({
        title: "PDF downloaded",
        description: "Printed on 5×7\" paper, same size as Admission Slip.",
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
              Print uses 5×7" thermal paper — same size as Admission Slip
            </Text>
          </div>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody className="voucher-preview-modal__body" p={0}>
          {pdfBlobUrl ? (
            <iframe
              src={`${pdfBlobUrl}#toolbar=0&navpanes=0&scrollbar=0`}
              style={{
                width: "100%",
                height: "65vh",
                border: "none",
                backgroundColor: "#525659",
              }}
              title="Voucher Preview"
            />
          ) : (
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              height="65vh"
              bg="gray.50"
            >
              <Spinner size="xl" color="blue.500" />
            </Box>
          )}
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
