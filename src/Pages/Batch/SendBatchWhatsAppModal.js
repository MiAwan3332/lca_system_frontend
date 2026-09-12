import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Box,
  Button,
  FormControl,
  FormLabel,
  Select,
  Text,
  Textarea,
  useToast,
  VStack,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import Cookies from "js-cookie";
import axios from "axios";
import { MessageCircle, MessageSquareText } from "lucide-react";
import { Link as RouterLink } from "react-router-dom";
import { config } from "../../utlls/config";

const STUDENT_TAG_KEYS = new Set([
  "name",
  "phone",
  "cnic",
  "roll_number",
  "batch",
  "class_time",
  "admission_date",
  "total_fee",
  "paid_fee",
  "pending_fee",
  "amount_received",
  "payment_method",
  "password",
  "portal_url",
  "academy_name",
]);

const QUALIFIER_TAG_KEYS = new Set([
  "name",
  "phone",
  "cnic",
  "css_pms_roll_no",
  "roll_number",
  "class_type",
  "email",
  "description",
  "batch",
  "status",
  "role",
  "discount",
  "total_fee",
  "paid_fee",
  "pending_fee",
  "amount_received",
  "payment_method",
  "password",
  "portal_url",
  "academy_name",
]);

const tagKey = (tag) =>
  String(tag || "")
    .replace(/^\{\{|\}\}$/g, "")
    .trim();

const SendBatchWhatsAppModal = ({ batch }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [authToken] = useState(Cookies.get("authToken"));
  const toast = useToast();
  const textareaRef = useRef(null);

  const defaultAudience = batch?.is_interview_batch ? "qualifiers" : "students";

  const [audience, setAudience] = useState(defaultAudience);
  const [templates, setTemplates] = useState([]);
  const [tags, setTags] = useState([]);
  const [templateKey, setTemplateKey] = useState("");
  const [customBody, setCustomBody] = useState("");
  const [showTags, setShowTags] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [queueing, setQueueing] = useState(false);

  const headers = useMemo(
    () => ({ Authorization: `Bearer ${authToken}` }),
    [authToken]
  );

  const visibleTags = useMemo(() => {
    const allowed =
      audience === "qualifiers" ? QUALIFIER_TAG_KEYS : STUDENT_TAG_KEYS;
    return tags.filter((item) => allowed.has(tagKey(item.tag)));
  }, [audience, tags]);

  const onOpen = () => {
    setAudience(batch?.is_interview_batch ? "qualifiers" : "students");
    setCustomBody("");
    setShowTags(false);
    setIsOpen(true);
  };
  const onClose = () => {
    if (queueing) return;
    setIsOpen(false);
  };

  const loadTemplates = useCallback(async () => {
    setLoadingTemplates(true);
    try {
      const { data } = await axios.get(`${config.BASE_URL}/whatsapp/templates`, {
        headers,
      });
      const list = (Array.isArray(data.templates) ? data.templates : []).filter(
        (t) => t.is_active !== false
      );
      setTemplates(list);
      setTags(Array.isArray(data.tags) ? data.tags : []);
      setTemplateKey((prev) => {
        if (prev && list.some((t) => t.key === prev)) return prev;
        const preferred =
          list.find((t) => t.process === "custom") ||
          list.find((t) => t.process === "qualifier_welcome") ||
          list[0];
        return preferred?.key || "";
      });
    } catch (error) {
      toast({
        title: "Could not load templates",
        description:
          error?.response?.data?.message || error.message || "Please try again.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoadingTemplates(false);
    }
  }, [headers, toast]);

  useEffect(() => {
    if (!isOpen) return;
    loadTemplates();
  }, [isOpen, loadTemplates]);

  const insertTag = (tag) => {
    const el = textareaRef.current;
    if (!el) {
      setCustomBody((prev) => `${prev}${tag}`);
      setShowTags(true);
      return;
    }
    const start = el.selectionStart ?? customBody.length;
    const end = el.selectionEnd ?? customBody.length;
    const next = `${customBody.slice(0, start)}${tag}${customBody.slice(end)}`;
    setCustomBody(next);
    setShowTags(true);
    window.requestAnimationFrame(() => {
      el.focus();
      const cursor = start + tag.length;
      el.setSelectionRange(cursor, cursor);
    });
  };

  const handleEnqueue = async () => {
    if (!batch?._id) return;
    if (!customBody.trim() && !templateKey) {
      toast({
        title: "Select a template or write a custom message",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setQueueing(true);
    try {
      const payload = {
        audience,
        batch_id: batch._id,
        source: "batch_page",
      };
      if (customBody.trim()) {
        payload.body = customBody.trim();
      } else {
        payload.template_key = templateKey;
      }

      const { data } = await axios.post(
        `${config.BASE_URL}/whatsapp/queue/bulk`,
        payload,
        { headers }
      );

      toast({
        title: "Messages added to queue",
        description: data.message,
        status: "success",
        duration: 6000,
        isClosable: true,
      });
      setCustomBody("");
      setShowTags(false);
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Could not queue messages",
        description:
          error?.response?.data?.message || error.message || "Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setQueueing(false);
    }
  };

  const tagsVisible = showTags || Boolean(customBody.trim());

  return (
    <>
      <button
        type="button"
        className="hover:bg-[#7AEF85] hover:text-[#257947] font-medium p-[10px] rounded-xl transition-colors duration-300 flex flex-nowrap items-center gap-1.5 pr-3"
        onClick={onOpen}
      >
        <MessageCircle size={18} />
        WhatsApp batch
      </button>

      <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
        <ModalOverlay />
        <ModalContent borderRadius="2xl">
          <ModalHeader className="text-xl font-semibold">
            Send WhatsApp to batch
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="stretch" spacing={4}>
              <Text fontSize="sm" color="gray.600">
                Queue WhatsApp messages for everyone in{" "}
                <Text as="span" fontWeight="semibold" color="gray.800">
                  {batch?.name || "this batch"}
                </Text>
                . They will send one-by-one from the WhatsApp queue.
              </Text>

              <FormControl>
                <FormLabel fontSize="sm">Audience</FormLabel>
                <Select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  borderRadius="xl"
                >
                  <option value="students">Students</option>
                  <option value="qualifiers">Qualifiers</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm">Template</FormLabel>
                <Select
                  value={templateKey}
                  onChange={(e) => setTemplateKey(e.target.value)}
                  isDisabled={Boolean(customBody.trim()) || loadingTemplates}
                  borderRadius="xl"
                >
                  <option value="">
                    {loadingTemplates ? "Loading templates..." : "Select template"}
                  </option>
                  {templates.map((tpl) => (
                    <option key={tpl.key} value={tpl.key}>
                      {tpl.name}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm">
                  Custom message (optional — overrides template)
                </FormLabel>
                <Textarea
                  ref={textareaRef}
                  value={customBody}
                  onChange={(e) => setCustomBody(e.target.value)}
                  onFocus={() => setShowTags(true)}
                  placeholder="Assalam o Alaikum {{name}}! ..."
                  rows={4}
                  borderRadius="xl"
                  fontFamily="mono"
                  fontSize="sm"
                />
              </FormControl>

              {tagsVisible && visibleTags.length > 0 && (
                <Box>
                  <Text fontSize="sm" fontWeight="semibold" mb={2}>
                    Insert tags
                  </Text>
                  <Text fontSize="xs" color="gray.500" mb={2}>
                    Click a tag to insert recipient info into your custom message.
                  </Text>
                  <Wrap spacing={2}>
                    {visibleTags.map((item) => (
                      <WrapItem key={item.tag}>
                        <Button
                          size="xs"
                          variant="outline"
                          leftIcon={<MessageSquareText size={12} />}
                          onClick={() => insertTag(item.tag)}
                          title={item.label}
                          borderRadius="md"
                        >
                          {item.tag}
                        </Button>
                      </WrapItem>
                    ))}
                  </Wrap>
                </Box>
              )}

              <Text fontSize="xs" color="gray.500">
                Track progress on{" "}
                <Button
                  as={RouterLink}
                  to="/whatsapp-queue"
                  variant="link"
                  colorScheme="green"
                  size="xs"
                >
                  WhatsApp Queue
                </Button>
                .
              </Text>
            </VStack>
          </ModalBody>
          <ModalFooter gap={2}>
            <Button variant="ghost" onClick={onClose} isDisabled={queueing}>
              Cancel
            </Button>
            <Button
              leftIcon={<MessageCircle size={16} />}
              backgroundColor="#7AEF85"
              color="#257947"
              _hover={{ backgroundColor: "#65C76E", color: "#184E2E" }}
              onClick={handleEnqueue}
              isLoading={queueing}
              loadingText="Queuing..."
            >
              Add to Queue
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default SendBatchWhatsAppModal;
