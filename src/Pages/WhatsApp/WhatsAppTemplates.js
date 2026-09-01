import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Cookies from "js-cookie";
import axios from "axios";
import {
  Badge,
  Box,
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
  Input,
  Select,
  Switch,
  Text,
  Textarea,
  useToast,
  VStack,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import {
  Eye,
  MessageSquareText,
  Plus,
  Save,
  Send,
  Trash2,
} from "lucide-react";
import { Navigate } from "react-router-dom";
import PageHeader, { DataTableShell } from "../../Components/PageHeader";
import { config } from "../../utlls/config";
import { isPlatformSuperAdminRole } from "../../utlls/useful";

const PROCESS_COLORS = {
  student_admission: "green",
  user_welcome: "purple",
  panelist_welcome: "teal",
  qualifier_welcome: "cyan",
  fee_payment: "blue",
  fee_reminder: "orange",
  custom: "gray",
};

function WhatsAppTemplates() {
  const authToken = Cookies.get("authToken");
  const toast = useToast();
  const textareaRef = useRef(null);
  const canView = isPlatformSuperAdminRole();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [testing, setTesting] = useState(false);

  const [templates, setTemplates] = useState([]);
  const [tags, setTags] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [selectedKey, setSelectedKey] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [process, setProcess] = useState("custom");
  const [body, setBody] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [preview, setPreview] = useState("");
  const [testPhone, setTestPhone] = useState("");

  const headers = useMemo(
    () => ({ Authorization: `Bearer ${authToken}` }),
    [authToken]
  );

  const selected = useMemo(
    () => templates.find((t) => t.key === selectedKey) || null,
    [templates, selectedKey]
  );

  const processLabel = (key) =>
    processes.find((p) => p.key === key)?.label || key || "Custom";

  const fillForm = (tpl) => {
    if (!tpl) return;
    setSelectedKey(tpl.key);
    setName(tpl.name || "");
    setDescription(tpl.description || "");
    setProcess(tpl.process || "custom");
    setBody(tpl.body || "");
    setIsActive(tpl.is_active !== false);
    setPreview("");
  };

  const selectedKeyRef = useRef("");
  selectedKeyRef.current = selectedKey;

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${config.BASE_URL}/whatsapp/templates`, {
        headers,
      });
      const list = Array.isArray(data.templates) ? data.templates : [];
      setTemplates(list);
      setTags(data.tags || []);
      setProcesses(data.processes || []);

      const preferred =
        list.find((t) => t.key === selectedKeyRef.current) ||
        list.find((t) => t.process === "student_admission") ||
        list[0] ||
        null;
      if (preferred) {
        fillForm(preferred);
      } else {
        setSelectedKey("");
      }
    } catch (error) {
      toast({
        title: "Could not load templates",
        description:
          error?.response?.data?.message || error.message || "Please try again.",
        status: "error",
        duration: 4500,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [headers, toast]);

  useEffect(() => {
    if (!canView) return;
    loadTemplates();
  }, [canView, loadTemplates]);

  const insertTag = (tag) => {
    const el = textareaRef.current;
    if (!el) {
      setBody((prev) => `${prev}${tag}`);
      return;
    }
    const start = el.selectionStart ?? body.length;
    const end = el.selectionEnd ?? body.length;
    const next = `${body.slice(0, start)}${tag}${body.slice(end)}`;
    setBody(next);
    window.requestAnimationFrame(() => {
      el.focus();
      const cursor = start + tag.length;
      el.setSelectionRange(cursor, cursor);
    });
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const { data } = await axios.post(
        `${config.BASE_URL}/whatsapp/templates`,
        {
          name: "New Template",
          process: "custom",
          description: "",
          body: "Assalam o Alaikum {{name}}!\n\n— {{academy_name}}",
          is_active: true,
        },
        { headers }
      );
      await loadTemplates();
      if (data.template?.key) fillForm(data.template);
      toast({
        title: "Template created",
        status: "success",
        duration: 2500,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Could not create template",
        description:
          error?.response?.data?.message || error.message || "Please try again.",
        status: "error",
        duration: 4500,
        isClosable: true,
      });
    } finally {
      setCreating(false);
    }
  };

  const handleSave = async () => {
    if (!selectedKey) return;
    setSaving(true);
    try {
      const { data } = await axios.put(
        `${config.BASE_URL}/whatsapp/templates/${selectedKey}`,
        {
          name,
          description,
          process,
          body,
          is_active: isActive,
        },
        { headers }
      );
      setTemplates((prev) =>
        prev.map((t) => (t.key === selectedKey ? data.template : t))
      );
      // Refresh list so deactivated siblings update
      await loadTemplates();
      fillForm(data.template);
      toast({
        title: "Template saved",
        description: `Bound to process: ${processLabel(data.template.process)}`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Could not save template",
        description:
          error?.response?.data?.message || error.message || "Please try again.",
        status: "error",
        duration: 4500,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedKey) return;
    if (
      !window.confirm(
        `Delete template "${name}"? This cannot be undone.`
      )
    ) {
      return;
    }
    setDeleting(true);
    try {
      await axios.delete(
        `${config.BASE_URL}/whatsapp/templates/${selectedKey}`,
        { headers }
      );
      setSelectedKey("");
      await loadTemplates();
      toast({
        title: "Template deleted",
        status: "success",
        duration: 2500,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Could not delete template",
        description:
          error?.response?.data?.message || error.message || "Please try again.",
        status: "error",
        duration: 4500,
        isClosable: true,
      });
    } finally {
      setDeleting(false);
    }
  };

  const handlePreview = async () => {
    if (!selectedKey) return;
    setPreviewing(true);
    try {
      const { data } = await axios.post(
        `${config.BASE_URL}/whatsapp/templates/${selectedKey}/preview`,
        { body },
        { headers }
      );
      setPreview(data.rendered || "");
    } catch (error) {
      toast({
        title: "Preview failed",
        description:
          error?.response?.data?.message || error.message || "Please try again.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setPreviewing(false);
    }
  };

  const handleTestSend = async () => {
    if (!selectedKey) return;
    if (!testPhone.trim()) {
      toast({
        title: "Enter a phone number",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    setTesting(true);
    try {
      await axios.post(
        `${config.BASE_URL}/whatsapp/templates/${selectedKey}/test`,
        { phone: testPhone.trim() },
        { headers }
      );
      toast({
        title: "Test message sent",
        description: `Sent to ${testPhone.trim()}`,
        status: "success",
        duration: 3500,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Test send failed",
        description:
          error?.response?.data?.message ||
          error.message ||
          "Connect WhatsApp first, then try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setTesting(false);
    }
  };

  if (!canView) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Box>
      <PageHeader
        title="WhatsApp Templates"
        subtitle="Create multiple templates and assign each to a process (admission, fee payment, reminder, or custom)."
      >
        <HStack>
          <Button
            leftIcon={<Plus size={16} />}
            variant="outline"
            onClick={handleCreate}
            isLoading={creating}
          >
            New template
          </Button>
          <Button
            leftIcon={<Save size={16} />}
            colorScheme="yellow"
            bg="#85652D"
            _hover={{ bg: "#6f5324" }}
            color="white"
            onClick={handleSave}
            isLoading={saving}
            isDisabled={loading || !selectedKey}
          >
            Save
          </Button>
        </HStack>
      </PageHeader>

      <DataTableShell>
        <Box
          display="grid"
          gridTemplateColumns={{ base: "1fr", lg: "260px 1fr" }}
          gap={4}
          p={{ base: 3, md: 5 }}
        >
          <VStack align="stretch" spacing={2}>
            <Text fontSize="sm" fontWeight="semibold" className="dash-text">
              Templates
            </Text>
            {loading ? (
              <Text fontSize="sm" className="dash-text-muted">
                Loading…
              </Text>
            ) : templates.length === 0 ? (
              <Text fontSize="sm" className="dash-text-muted">
                No templates yet.
              </Text>
            ) : (
              templates.map((tpl) => {
                const active = tpl.key === selectedKey;
                return (
                  <Button
                    key={tpl.key}
                    justifyContent="flex-start"
                    variant={active ? "solid" : "outline"}
                    colorScheme={active ? "yellow" : "gray"}
                    h="auto"
                    py={3}
                    px={3}
                    whiteSpace="normal"
                    textAlign="left"
                    onClick={() => fillForm(tpl)}
                  >
                    <Box w="100%">
                      <HStack justify="space-between" mb={1}>
                        <Text fontWeight="semibold" fontSize="sm">
                          {tpl.name}
                        </Text>
                        <Badge
                          colorScheme={tpl.is_active ? "green" : "gray"}
                          fontSize="0.65rem"
                        >
                          {tpl.is_active ? "ON" : "OFF"}
                        </Badge>
                      </HStack>
                      <Badge
                        colorScheme={PROCESS_COLORS[tpl.process] || "gray"}
                        fontSize="0.65rem"
                      >
                        {processLabel(tpl.process)}
                      </Badge>
                    </Box>
                  </Button>
                );
              })
            )}

            <Box
              mt={3}
              p={3}
              borderRadius="lg"
              bg="#F9FAFB"
              borderWidth="1px"
              borderColor="#E5E7EB"
            >
              <Text fontSize="xs" fontWeight="semibold" mb={2} className="dash-text">
                Processes
              </Text>
              {processes.map((p) => (
                <Box key={p.key} mb={2}>
                  <Text fontSize="xs" fontWeight="semibold" className="dash-text">
                    {p.label}
                  </Text>
                  <Text fontSize="xs" className="dash-text-muted">
                    {p.description}
                  </Text>
                </Box>
              ))}
            </Box>
          </VStack>

          <VStack align="stretch" spacing={4}>
            {!selectedKey ? (
              <Text className="dash-text-muted">
                Select a template or create a new one.
              </Text>
            ) : (
              <>
                <HStack justify="space-between" flexWrap="wrap" gap={3}>
                  <Box>
                    <Text fontWeight="semibold" className="dash-text">
                      {name || "Untitled"}
                    </Text>
                    <Text fontSize="xs" className="dash-text-muted">
                      Key: {selectedKey}
                    </Text>
                  </Box>
                  <HStack>
                    <FormControl display="flex" alignItems="center" w="auto">
                      <FormLabel htmlFor="wa-active" mb="0" mr={2} fontSize="sm">
                        Active
                      </FormLabel>
                      <Switch
                        id="wa-active"
                        isChecked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        colorScheme="green"
                      />
                    </FormControl>
                    <Button
                      leftIcon={<Trash2 size={14} />}
                      size="sm"
                      colorScheme="red"
                      variant="outline"
                      onClick={handleDelete}
                      isLoading={deleting}
                    >
                      Delete
                    </Button>
                  </HStack>
                </HStack>

                <FormControl>
                  <FormLabel fontSize="sm">Template name</FormLabel>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="sm">Process</FormLabel>
                  <Select
                    value={process}
                    onChange={(e) => setProcess(e.target.value)}
                    maxW="360px"
                  >
                    {processes.map((p) => (
                      <option key={p.key} value={p.key}>
                        {p.label}
                      </option>
                    ))}
                  </Select>
                  <FormHelperText>
                    Only one active template can be used per process. Saving an
                    active template for a process turns off the previous one.
                  </FormHelperText>
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="sm">Description</FormLabel>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </FormControl>

                <Box>
                  <Text
                    fontSize="sm"
                    fontWeight="semibold"
                    mb={2}
                    className="dash-text"
                  >
                    Insert tags
                  </Text>
                  <Wrap>
                    {tags.map((item) => (
                      <WrapItem key={item.tag}>
                        <Button
                          size="xs"
                          variant="outline"
                          leftIcon={<MessageSquareText size={12} />}
                          onClick={() => insertTag(item.tag)}
                          title={item.label}
                        >
                          {item.tag}
                        </Button>
                      </WrapItem>
                    ))}
                  </Wrap>
                </Box>

                <FormControl>
                  <FormLabel fontSize="sm">Message body</FormLabel>
                  <Textarea
                    ref={textareaRef}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    minH="280px"
                    fontFamily="mono"
                    fontSize="sm"
                  />
                  <FormHelperText>{body.length}/4000 characters</FormHelperText>
                </FormControl>

                <HStack flexWrap="wrap" gap={3}>
                  <Button
                    leftIcon={<Eye size={16} />}
                    variant="outline"
                    onClick={handlePreview}
                    isLoading={previewing}
                  >
                    Preview
                  </Button>
                  <Input
                    maxW="220px"
                    placeholder="Test phone e.g. 0300..."
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                  />
                  <Button
                    leftIcon={<Send size={16} />}
                    onClick={handleTestSend}
                    isLoading={testing}
                  >
                    Send test
                  </Button>
                </HStack>

                {preview ? (
                  <Box
                    borderWidth="1px"
                    borderColor="#E0E8EC"
                    borderRadius="xl"
                    bg="#F9FAFB"
                    p={4}
                  >
                    <Text
                      fontSize="sm"
                      fontWeight="semibold"
                      mb={2}
                      className="dash-text"
                    >
                      Preview
                    </Text>
                    <Text
                      whiteSpace="pre-wrap"
                      fontSize="sm"
                      className="dash-text"
                      lineHeight="1.6"
                    >
                      {preview}
                    </Text>
                  </Box>
                ) : null}
              </>
            )}
          </VStack>
        </Box>
      </DataTableShell>
    </Box>
  );
}

export default WhatsAppTemplates;
