import { Input, Select, Switch, Textarea } from "../../Components/AccessInputs";
import FormControl from "../../Components/AccessFormControl";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Cookies from "js-cookie";
import axios from "axios";
import { resourceAccess } from "../../utlls/accessCapabilities";
import {
  Badge,
  Box,
  Button,
  FormHelperText,
  FormLabel,
  HStack,
  Text,
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
  X,
} from "lucide-react";
import { Navigate } from "react-router-dom";
import PageHeader, { DataTableShell } from "../../Components/PageHeader";
import { config } from "../../utlls/config";
import { isPlatformSuperAdminRole } from "../../utlls/useful";
import LcaLogoLoading from "../../Components/LcaLogoLoading";

const ACTION_COLORS = {
  add: "green",
  remove: "red",
  shift: "blue",
  alert: "orange",
  pay_pending_fee: "yellow",
  fee_payment: "teal",
  overdue: "red",
};

const actionColor = (key) => ACTION_COLORS[key] || "gray";

const FALLBACK_ACTIONS = [
  { key: "add", label: "Add", description: "When added / admitted" },
  { key: "remove", label: "Remove", description: "When removed" },
  { key: "shift", label: "Shift", description: "Batch / shift change" },
  { key: "alert", label: "Alert", description: "General alert" },
  {
    key: "pay_pending_fee",
    label: "Pay pending fee",
    description: "Pending dues reminder",
  },
  { key: "fee_payment", label: "Fee payment", description: "Payment recorded" },
  { key: "overdue", label: "Overdue", description: "Past due installment" },
];

const FALLBACK_ROLES = [
  { key: "students", label: "Students", kind: "people" },
  { key: "qualifiers", label: "Qualifiers", kind: "people" },
  { key: "panelists", label: "Panelists", kind: "people" },
];

const defaultAudienceForProcess = (process) => {
  if (String(process || "").startsWith("role:")) {
    return String(process).slice(5);
  }
  switch (process) {
    case "qualifier_welcome":
      return "qualifiers";
    case "panelist_welcome":
      return "panelists";
    case "student_admission":
    case "fee_payment":
    case "fee_reminder":
    case "fee_overdue":
      return "students";
    default:
      return "students";
  }
};

const defaultActionForProcess = (process) => {
  switch (process) {
    case "fee_payment":
      return "fee_payment";
    case "fee_reminder":
      return "pay_pending_fee";
    case "fee_overdue":
      return "overdue";
    case "student_admission":
    case "qualifier_welcome":
    case "panelist_welcome":
    case "user_welcome":
      return "add";
    default:
      return "alert";
  }
};

const defaultDataForAction = (actionKey) => {
  const common = ["{{name}}", "{{phone}}", "{{academy_name}}"];
  switch (actionKey) {
    case "add":
      return [...common, "{{batch}}", "{{roll_number}}", "{{password}}"];
    case "pay_pending_fee":
    case "fee_payment":
    case "overdue":
      return [
        ...common,
        "{{total_fee}}",
        "{{paid_fee}}",
        "{{pending_fee}}",
        "{{due_date}}",
      ];
    case "shift":
      return [...common, "{{batch}}", "{{class_time}}"];
    default:
      return common;
  }
};

function WhatsAppTemplates() {
  const authToken = Cookies.get("authToken");
  const toast = useToast();
  const textareaRef = useRef(null);
  const canView = resourceAccess("whatsapp", isPlatformSuperAdminRole());

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [testing, setTesting] = useState(false);

  const [templates, setTemplates] = useState([]);
  const [tags, setTags] = useState([]);
  const [actionsCatalog, setActionsCatalog] = useState(FALLBACK_ACTIONS);
  const [rolesCatalog, setRolesCatalog] = useState(FALLBACK_ROLES);
  const [selectedKey, setSelectedKey] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [audiences, setAudiences] = useState(["students"]);
  const [bindings, setBindings] = useState([]);
  const [body, setBody] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [preview, setPreview] = useState("");
  const [testPhone, setTestPhone] = useState("");

  const [audiencePick, setAudiencePick] = useState("");
  const [bindAction, setBindAction] = useState("add");
  const [bindRole, setBindRole] = useState("students");
  const [bindData, setBindData] = useState(defaultDataForAction("add"));

  const headers = useMemo(
    () => ({ Authorization: `Bearer ${authToken}` }),
    [authToken]
  );

  const roleLabel = (key) =>
    rolesCatalog.find((r) => r.key === key)?.label || key;

  const actionLabel = (key) =>
    actionsCatalog.find((a) => a.key === key)?.label || key;

  const availableAudienceRoles = useMemo(
    () => (rolesCatalog || []).filter((r) => !(audiences || []).includes(r.key)),
    [rolesCatalog, audiences]
  );

  const availableBindData = useMemo(
    () => (tags || []).filter((t) => !(bindData || []).includes(t.tag)),
    [tags, bindData]
  );

  const fillForm = (tpl) => {
    if (!tpl) return;
    const process = tpl.process || "custom";
    const nextAudiences =
      Array.isArray(tpl.audiences) && tpl.audiences.length
        ? tpl.audiences
        : [defaultAudienceForProcess(process)].filter(Boolean);
    const nextBindings =
      Array.isArray(tpl.action_bindings) && tpl.action_bindings.length
        ? tpl.action_bindings.map((b) => ({
            action: b.action,
            role: b.role || nextAudiences[0] || "students",
            data: Array.isArray(b.data) ? b.data : [],
          }))
        : [
            {
              action: defaultActionForProcess(process),
              role: nextAudiences[0] || "students",
              data: defaultDataForAction(defaultActionForProcess(process)),
            },
          ];

    setSelectedKey(tpl.key);
    setName(tpl.name || "");
    setDescription(tpl.description || "");
    setAudiences(nextAudiences);
    setBindings(nextBindings);
    setBody(tpl.body || "");
    setIsActive(tpl.is_active !== false);
    setPreview("");
    setAudiencePick("");
    setBindAction("add");
    setBindRole(nextAudiences[0] || "students");
    setBindData(defaultDataForAction("add"));
  };

  const selectedKeyRef = useRef("");
  selectedKeyRef.current = selectedKey;

  const toastRef = useRef(toast);
  toastRef.current = toast;

  const loadTemplates = useCallback(
    async ({ preserveSelection = false } = {}) => {
      if (!preserveSelection) setLoading(true);
      try {
        const { data } = await axios.get(`${config.BASE_URL}/whatsapp/templates`, {
          headers,
        });
        const list = Array.isArray(data.templates) ? data.templates : [];
        setTemplates(list);
        setTags(data.tags || data.data_fields || []);
        if (Array.isArray(data.actions) && data.actions.length) {
          setActionsCatalog(data.actions);
        }
        const roles = data.roles || data.audiences || [];
        if (Array.isArray(roles) && roles.length) {
          setRolesCatalog(roles);
        }

        if (preserveSelection) {
          return list;
        }

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
        return list;
      } catch (error) {
        toastRef.current({
          title: "Could not load templates",
          description:
            error?.response?.data?.message ||
            error.message ||
            "Please try again.",
          status: "error",
          duration: 4500,
          isClosable: true,
        });
        return [];
      } finally {
        if (!preserveSelection) setLoading(false);
      }
    },
    [headers]
  );

  useEffect(() => {
    if (!canView) return;
    loadTemplates();
  }, [canView, loadTemplates]);

  const addAudience = (key) => {
    const value = String(key || "").trim();
    if (!value) return;
    setAudiences((prev) => (prev.includes(value) ? prev : [...prev, value]));
    setAudiencePick("");
    if (!bindRole) setBindRole(value);
  };

  const removeAudience = (key) => {
    setAudiences((prev) => prev.filter((a) => a !== key));
  };

  const toggleBindData = (tag) => {
    setBindData((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const addBinding = () => {
    if (!bindAction || !bindRole) {
      toast({
        title: "Choose action and role",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
      return;
    }
    setBindings((prev) => [
      ...prev,
      {
        action: bindAction,
        role: bindRole,
        data: bindData.length ? bindData : defaultDataForAction(bindAction),
      },
    ]);
    setBindData(defaultDataForAction(bindAction));
  };

  const removeBinding = (index) => {
    setBindings((prev) => prev.filter((_, i) => i !== index));
  };

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
          audiences: ["students"],
          action_bindings: [
            {
              action: "add",
              role: "students",
              data: defaultDataForAction("add"),
            },
          ],
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
          error?.response?.data?.message ||
          error.message ||
          "Please try again.",
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
    if (!audiences.length) {
      toast({
        title: "Add at least one role to Audience",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    if (!bindings.length) {
      toast({
        title: "Add at least one action binding",
        description: "Choose action, role, and data.",
        status: "warning",
        duration: 3500,
        isClosable: true,
      });
      return;
    }
    setSaving(true);
    try {
      const { data } = await axios.put(
        `${config.BASE_URL}/whatsapp/templates/${encodeURIComponent(selectedKey)}`,
        {
          name,
          description,
          audiences,
          action_bindings: bindings,
          body,
          is_active: isActive,
        },
        { headers }
      );
      const saved = data.template;
      const list = await loadTemplates({ preserveSelection: true });
      const persisted =
        list.find((t) => t.key === (saved?.key || selectedKey)) || saved;
      if (persisted) fillForm(persisted);
      toast({
        title: "Template saved",
        status: "success",
        duration: 2500,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Could not save template",
        description:
          error?.response?.data?.message ||
          error.message ||
          "Please try again.",
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
      !window.confirm(`Delete template "${name}"? This cannot be undone.`)
    ) {
      return;
    }
    setDeleting(true);
    try {
      await axios.delete(
        `${config.BASE_URL}/whatsapp/templates/${encodeURIComponent(selectedKey)}`,
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
          error?.response?.data?.message ||
          error.message ||
          "Please try again.",
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
        `${config.BASE_URL}/whatsapp/templates/${encodeURIComponent(selectedKey)}/preview`,
        { body },
        { headers }
      );
      setPreview(data.rendered || "");
    } catch (error) {
      toast({
        title: "Preview failed",
        description:
          error?.response?.data?.message ||
          error.message ||
          "Please try again.",
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
    if (!isActive) {
      toast({
        title: "Template is inactive",
        description: "Turn Active on and save before sending a message.",
        status: "warning",
        duration: 4000,
        isClosable: true,
      });
      return;
    }
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
        `${config.BASE_URL}/whatsapp/templates/${encodeURIComponent(selectedKey)}/test`,
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
        subtitle="Audience is roles only. Under Action, define which action, for which role, with which data."
      >
        <HStack flexWrap="wrap" gap={2}>
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
          gridTemplateColumns={{ base: "1fr", lg: "280px 1fr" }}
          gap={4}
          p={{ base: 3, md: 5 }}
        >
          <VStack align="stretch" spacing={2}>
            <Text fontSize="sm" fontWeight="semibold" className="dash-text">
              Templates
            </Text>
            {loading ? (
              <LcaLogoLoading size="sm" />
            ) : templates.length === 0 ? (
              <Text fontSize="sm" className="dash-text-muted">
                No templates yet.
              </Text>
            ) : (
              templates.map((tpl) => {
                const active = tpl.key === selectedKey;
                const tplAudiences =
                  Array.isArray(tpl.audiences) && tpl.audiences.length
                    ? tpl.audiences
                    : [defaultAudienceForProcess(tpl.process)].filter(Boolean);
                const tplBindings =
                  Array.isArray(tpl.action_bindings) && tpl.action_bindings.length
                    ? tpl.action_bindings
                    : [];
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
                      <Wrap spacing={1} mb={1}>
                        {tplAudiences.map((a) => (
                          <WrapItem key={a}>
                            <Badge colorScheme="purple" fontSize="0.6rem">
                              {roleLabel(a)}
                            </Badge>
                          </WrapItem>
                        ))}
                      </Wrap>
                      <Wrap spacing={1}>
                        {tplBindings.map((b, i) => (
                          <WrapItem key={`${b.action}-${b.role}-${i}`}>
                            <Badge
                              colorScheme={actionColor(b.action)}
                              fontSize="0.6rem"
                              variant="subtle"
                            >
                              {actionLabel(b.action)} → {roleLabel(b.role)}
                            </Badge>
                          </WrapItem>
                        ))}
                      </Wrap>
                    </Box>
                  </Button>
                );
              })
            )}
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
                        permissionField="is_active"
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
                  <Input
                    permissionField="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </FormControl>

                {/* Audience = roles only */}
                <Box>
                  <FormLabel fontSize="sm">Audience</FormLabel>
                  <Text fontSize="sm" className="dash-text-muted" mb={2}>
                    Roles only — who this template is for.
                  </Text>
                  <Wrap mb={3}>
                    {audiences.length === 0 ? (
                      <Text fontSize="sm" className="dash-text-muted">
                        No roles yet — add one below.
                      </Text>
                    ) : (
                      audiences.map((key) => (
                        <WrapItem key={key}>
                          <Button
                            size="sm"
                            variant="outline"
                            colorScheme="purple"
                            rightIcon={<X size={14} />}
                            onClick={() => removeAudience(key)}
                          >
                            {roleLabel(key)}
                          </Button>
                        </WrapItem>
                      ))
                    )}
                  </Wrap>
                  <HStack align="end" flexWrap="wrap" gap={2}>
                    <FormControl maxW="320px">
                      <FormLabel fontSize="sm">Add role</FormLabel>
                      <Select
                        value={audiencePick}
                        onChange={(e) => setAudiencePick(e.target.value)}
                        placeholder="Choose role"
                      >
                        {availableAudienceRoles.map((r) => (
                          <option key={r.key} value={r.key}>
                            {r.label}
                            {r.kind === "staff" ? " (staff)" : ""}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                    <Button
                      leftIcon={<Plus size={16} />}
                      onClick={() => addAudience(audiencePick)}
                      isDisabled={!audiencePick}
                    >
                      Add
                    </Button>
                  </HStack>
                </Box>

                {/* Action = action + role + data */}
                <Box
                  p={4}
                  borderWidth="1px"
                  borderColor="#E0E8EC"
                  borderRadius="xl"
                  bg="#FAFBFC"
                >
                  <FormLabel fontSize="sm" mb={1}>
                    Action
                  </FormLabel>
                  <Text fontSize="sm" className="dash-text-muted" mb={3}>
                    Define which action this template uses, for which role, with
                    which data.
                  </Text>

                  <Wrap mb={4}>
                    {bindings.length === 0 ? (
                      <Text fontSize="sm" className="dash-text-muted">
                        No action bindings yet.
                      </Text>
                    ) : (
                      bindings.map((b, index) => (
                        <WrapItem key={`${b.action}-${b.role}-${index}`}>
                          <Box
                            borderWidth="1px"
                            borderColor="#E5E7EB"
                            borderRadius="lg"
                            bg="white"
                            px={3}
                            py={2}
                            maxW="420px"
                          >
                            <HStack justify="space-between" mb={1}>
                              <Text fontSize="sm" fontWeight="semibold">
                                {actionLabel(b.action)} · {roleLabel(b.role)}
                              </Text>
                              <Button
                                size="xs"
                                variant="ghost"
                                colorScheme="red"
                                onClick={() => removeBinding(index)}
                              >
                                <X size={14} />
                              </Button>
                            </HStack>
                            <Wrap spacing={1}>
                              {(b.data || []).map((tag) => (
                                <WrapItem key={tag}>
                                  <Badge fontSize="0.6rem" colorScheme="gray">
                                    {tag}
                                  </Badge>
                                </WrapItem>
                              ))}
                            </Wrap>
                          </Box>
                        </WrapItem>
                      ))
                    )}
                  </Wrap>

                  <VStack align="stretch" spacing={3}>
                    <HStack flexWrap="wrap" gap={3} align="end">
                      <FormControl maxW="220px">
                        <FormLabel fontSize="sm">Which action</FormLabel>
                        <Select
                          value={bindAction}
                          onChange={(e) => {
                            const next = e.target.value;
                            setBindAction(next);
                            setBindData(defaultDataForAction(next));
                          }}
                        >
                          {actionsCatalog.map((a) => (
                            <option key={a.key} value={a.key}>
                              {a.label}
                            </option>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl maxW="220px">
                        <FormLabel fontSize="sm">For which role</FormLabel>
                        <Select
                          value={bindRole}
                          onChange={(e) => setBindRole(e.target.value)}
                        >
                          {rolesCatalog.map((r) => (
                            <option key={r.key} value={r.key}>
                              {r.label}
                            </option>
                          ))}
                        </Select>
                      </FormControl>
                    </HStack>

                    <Box>
                      <FormLabel fontSize="sm">With which data</FormLabel>
                      <Wrap mb={2}>
                        {bindData.map((tag) => (
                          <WrapItem key={tag}>
                            <Button
                              size="xs"
                              variant="solid"
                              colorScheme="yellow"
                              rightIcon={<X size={12} />}
                              onClick={() => toggleBindData(tag)}
                            >
                              {tag}
                            </Button>
                          </WrapItem>
                        ))}
                      </Wrap>
                      <Wrap>
                        {availableBindData.map((item) => (
                          <WrapItem key={item.tag}>
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => toggleBindData(item.tag)}
                              title={item.label}
                            >
                              {item.tag}
                            </Button>
                          </WrapItem>
                        ))}
                      </Wrap>
                    </Box>

                    <Button
                      alignSelf="flex-start"
                      leftIcon={<Plus size={16} />}
                      onClick={addBinding}
                      colorScheme="yellow"
                      variant="outline"
                    >
                      Add action binding
                    </Button>
                  </VStack>
                </Box>

                <FormControl>
                  <FormLabel fontSize="sm">Description</FormLabel>
                  <Input
                    permissionField="description"
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
                    Insert tags into message
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
                    permissionField="body"
                    ref={textareaRef}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    minH="280px"
                    fontFamily="mono"
                    fontSize="sm"
                  />
                  <FormHelperText>
                    {body.length.toLocaleString()} characters
                  </FormHelperText>
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
                    isDisabled={!isActive}
                  />
                  <Button
                    leftIcon={<Send size={16} />}
                    onClick={handleTestSend}
                    isLoading={testing}
                    isDisabled={!isActive}
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
