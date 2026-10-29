import React, { useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import moment from "moment";
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, Button, Box, Flex, Text, VStack, Alert, AlertIcon, AlertDescription, Checkbox, FormControl, FormLabel, FormHelperText, Select, Textarea, Spinner, SimpleGrid, useToast } from "@chakra-ui/react";
import { Undo2 } from "lucide-react";
import { config } from "../../utlls/config";
import PaymentEvidenceGallery from "../../Components/PaymentEvidenceGallery";

const formatRs = (value) => `Rs. ${Number(value || 0).toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;
const formatDate = (value) => (value && moment(value).isValid() ? moment(value).format("DD MMM YYYY, hh:mm A") : "—");
const TOTALS = [["paid_fee", "Paid"], ["pending_fee", "Pending"], ["total_fee", "Total fee"], ["cash_amount", "Cash"], ["online_amount", "Online"]];
export const MIN_NOTE = 10;

const revertUrl = (logId) => `${config.BASE_URL}/fees/payments/${logId}/revert`;
const errorText = (error) => error?.response?.data?.message || error?.message || "Something went wrong.";

/** Items the reversal removes or changes, in the words shown to the owner. */
export function removalLines(preview) {
  if (!preview) return [];
  return [
    ...preview.entries.map((entry) => `Payment entry ${formatRs(entry.amount)}${entry.batch ? ` · ${entry.batch}` : ""} · ${entry.payment_method || "Cash"}`),
    ...preview.receipts.map((receipt) => `Fee receipt of ${formatDate(receipt.created_at)} (${formatRs(receipt.amount)})`),
    ...preview.slips.map((slip) => `Fee slip issued ${formatDate(slip.issued_at)} (${formatRs(slip.amount)}): its verification link will show it as cancelled`),
    ...preview.fee_changes.map((change) => `Fee balance${change.batch ? ` (${change.batch})` : ""}: ${formatRs(change.before_amount)} → ${formatRs(change.after_amount)}, ${change.after_status}`),
  ];
}

export const canSubmitReversal = ({ preview, reason, note, acknowledged, understood }) =>
  Boolean(preview && !preview.blockers.length && reason && note.trim().length >= MIN_NOTE && understood && (!preview.warnings.length || acknowledged));

/** Finishes a reversal that stopped part-way; the saved reason is reused. */
export async function finishReversal(logId) {
  return axios.post(revertUrl(logId), {}, { headers: { Authorization: `Bearer ${Cookies.get("authToken")}` } });
}

export default function RevertPaymentModal({ log, onReverted }) {
  const [isOpen, setIsOpen] = useState(false);
  const [preview, setPreview] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [understood, setUnderstood] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();
  const headers = { Authorization: `Bearer ${Cookies.get("authToken")}` };

  const open = async () => {
    setIsOpen(true); setPreview(null); setLoadError(""); setReason(""); setNote(""); setAcknowledged(false); setUnderstood(false);
    try {
      const { data } = await axios.post(revertUrl(log._id), { preview: true }, { headers });
      setPreview(data);
    } catch (error) {
      setLoadError(errorText(error));
    }
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const { data } = await axios.post(revertUrl(log._id), { reason, note: note.trim(), acknowledged }, { headers });
      toast({ title: data?.message || "Payment reverted", status: "success", duration: 4000, isClosable: true });
      setIsOpen(false);
      onReverted?.();
    } catch (error) {
      toast({ title: "Payment not reverted", description: errorText(error), status: "error", duration: 8000, isClosable: true });
      onReverted?.();
    } finally {
      setSubmitting(false);
    }
  };

  const ready = canSubmitReversal({ preview, reason, note, acknowledged, understood });
  return (
    <>
      <Button size="xs" variant="outline" colorScheme="red" leftIcon={<Undo2 size={12} />} mt={2} onClick={open}>Undo payment</Button>
      <Modal isOpen={isOpen} onClose={() => !submitting && setIsOpen(false)} size="2xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Undo payment</ModalHeader>
          <ModalCloseButton isDisabled={submitting} />
          <ModalBody>
            {loadError ? <Alert status="error" borderRadius="lg"><AlertIcon /><AlertDescription>{loadError}</AlertDescription></Alert> : null}
            {!preview && !loadError ? <Flex justify="center" py={10}><Spinner /></Flex> : null}
            {preview ? (
              <VStack align="stretch" spacing={4}>
                <Box>
                  <Text fontWeight="700">{preview.student.name}</Text>
                  <Text fontSize="sm" color="gray.500">{[preview.student.roll_number, preview.student.batch].filter(Boolean).join(" · ")}</Text>
                </Box>
                <Box p={3} borderRadius="lg" bg="gray.50" border="1px solid" borderColor="gray.200">
                  <Text fontSize="xl" fontWeight="700">{formatRs(preview.payment.amount)}</Text>
                  <Text fontSize="sm" color="gray.600">{formatDate(preview.payment.date)} · {preview.payment.methods.join(", ")}{preview.payment.collected_by ? ` · collected by ${preview.payment.collected_by}` : ""}</Text>
                  {preview.payment.description ? <Text fontSize="sm" color="gray.600" mt={1}>Remarks: {preview.payment.description}</Text> : null}
                  <PaymentEvidenceGallery value={preview.payment.payment_evidence} paymentMethod={preview.payment.methods[0]} />
                </Box>
                {preview.blockers.length ? (
                  <Alert status="error" borderRadius="lg" alignItems="flex-start"><AlertIcon />
                    <Box>{preview.blockers.map((text) => <Text key={text} fontSize="sm">{text}</Text>)}</Box>
                  </Alert>
                ) : null}
                <Box>
                  <Text fontWeight="600" mb={1}>This will remove or change</Text>
                  <VStack align="stretch" spacing={1}>{removalLines(preview).map((line) => <Text key={line} fontSize="sm">• {line}</Text>)}</VStack>
                </Box>
                <Box>
                  <Text fontWeight="600" mb={1}>Student balance</Text>
                  <SimpleGrid columns={3} spacing={1} fontSize="sm">
                    <Text color="gray.500"></Text><Text color="gray.500">Now</Text><Text color="gray.500">After undo</Text>
                    {TOTALS.map(([key, label]) => (
                      <React.Fragment key={key}>
                        <Text>{label}</Text><Text>{formatRs(preview.totals_before[key])}</Text>
                        <Text fontWeight={preview.totals_before[key] !== preview.totals_after[key] ? "700" : "400"}>{formatRs(preview.totals_after[key])}</Text>
                      </React.Fragment>
                    ))}
                  </SimpleGrid>
                </Box>
                {preview.warnings.length ? (
                  <Alert status="warning" borderRadius="lg" alignItems="flex-start"><AlertIcon />
                    <Box>
                      {preview.warnings.map((text) => <Text key={text} fontSize="sm">{text}</Text>)}
                      <Checkbox mt={2} isChecked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)}>I have checked these warnings</Checkbox>
                    </Box>
                  </Alert>
                ) : null}
                {!preview.blockers.length ? (
                  <>
                    <FormControl isRequired>
                      <FormLabel>Reason</FormLabel>
                      <Select aria-label="Reason" placeholder="Choose a reason" value={reason} onChange={(event) => setReason(event.target.value)}>
                        {preview.reasons.map((item) => <option key={item} value={item}>{item}</option>)}
                      </Select>
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel>Details</FormLabel>
                      <Textarea aria-label="Details" value={note} onChange={(event) => setNote(event.target.value)} placeholder="What happened, and who confirmed it" />
                      <FormHelperText>At least {MIN_NOTE} characters. Saved with the reversal record.</FormHelperText>
                    </FormControl>
                    <Checkbox isChecked={understood} onChange={(event) => setUnderstood(event.target.checked)}>
                      I understand this changes the student's balance and the fee reports
                    </Checkbox>
                  </>
                ) : null}
              </VStack>
            ) : null}
          </ModalBody>
          <ModalFooter gap={2}>
            <Button variant="ghost" onClick={() => setIsOpen(false)} isDisabled={submitting}>Cancel</Button>
            <Button colorScheme="red" onClick={submit} isDisabled={!ready} isLoading={submitting}>Revert payment</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
