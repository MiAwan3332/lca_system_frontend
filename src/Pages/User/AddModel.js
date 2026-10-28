import { Input, Select } from '../../Components/AccessInputs';
import AccessForm from '../../Components/AccessForm';
import FormControl from '../../Components/AccessFormControl';
import { useAccessCreateFormik as useFormik } from '../../utlls/accessForms';
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, Button, FormLabel, FormHelperText, VStack, Box } from '@chakra-ui/react';
import { can } from '../../utlls/accessCapabilities';
import { RoleChoice } from '../Roles/RoleChoice';
import ScopePicker from '../Roles/ScopePicker';

import * as Yup from "yup";
import Cookies from "js-cookie";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { fetchUsers, addUser } from "../../Features/userSlice";
import { config } from "../../utlls/config";
import CreationProcessing from '../../Components/CreationProcessing';
import { pendingCreationKey } from '../../utlls/creationRecovery';

const isExcludedUserFormRole = (roleName) => {
  const name = String(roleName || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
  return name === "teacher" || name === "student";
};

// Built-in login roles for other account categories are never right for a staff account.
const staffRole = (role) => !['lca-v1-student', 'lca-v1-teacher', 'lca-v1-qualifier', 'lca-v1-panelist'].includes(role.code);

function AddModel({ isOpen, onClose }) {
  const [authToken] = useState(Cookies.get("authToken"));
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [submission, setSubmission] = useState(null);
  const [accessRole, setAccessRole] = useState(null), [accessBatchIds, setAccessBatches] = useState([]), [accessCourseIds, setAccessCourses] = useState([]), [accessError, setAccessError] = useState('');
  const accessApi = useMemo(() => axios.create({ baseURL: `${config.BASE_URL}/access`, headers: { Authorization: `Bearer ${authToken}` }, timeout: 15000 }), [authToken]);
  const canChooseAccess = can('access.assign');
  const scopedRole = accessRole?.grants?.some((grant) => grant.scope === 'selected');
  const formRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const key = pendingCreationKey('user', authToken);
    if (!key) { formRef.current?.resetForm(); setAccessRole(null); setAccessBatches([]); setAccessCourses([]); setAccessError(''); }
    setSubmission(key ? { idempotency_key: key, submission_status: 'unknown' } : null);
  }, [isOpen, authToken]);

  const { addStatus } = useSelector((state) => state.users);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!isOpen || !authToken) return;

    let cancelled = false;
    const loadRoles = async () => {
      setRolesLoading(true);
      try {
        const response = await axios.get(`${config.BASE_URL}/access/account-categories`, {
          headers: { Authorization: `Bearer ${authToken}` },
          params: { page: 1, limit: 100, query: "" },
        });
        if (!cancelled) {
          setRoles(
            (response.data?.docs || []).filter(
              (role) => !isExcludedUserFormRole(role.name)
            )
          );
        }
      } catch {
        if (!cancelled) setRoles([]);
      } finally {
        if (!cancelled) setRolesLoading(false);
      }
    };

    loadRoles();
    return () => {
      cancelled = true;
    };
  }, [isOpen, authToken]);

  const formik = useFormik({
    initialValues: {
      name: "",
      email: "",
      phone: "",
      // password: "",
      role: "",
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Required"),
      email: Yup.string().email("Invalid email address").required("Required"),
      phone: Yup.string().trim().required("Contact number is required"),
      // password: Yup.string().required("Required"),
      role: Yup.string().required("Required"),
    }),
    onSubmit: async (values) => {
      if (scopedRole && !accessBatchIds.length && !accessCourseIds.length) { setAccessError('Choose the batches or courses this access role applies to.'); return; }
      setAccessError('');
      try {
        const access = accessRole ? { accessRoleId: accessRole._id, accessBatchIds, accessCourseIds } : {};
        const result = await dispatch(addUser({ formData: { ...values, ...access }, authToken })).unwrap();
        setSubmission(result);
        if (result.submission_status === 'complete') dispatch(fetchUsers({ authToken }));
      } catch { /* The shared request handler displays validation errors. */ }
    },
  });
  formRef.current = formik;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <AccessForm component={ModalContent}>
        <ModalHeader className="text-xl font-semibold">Add User</ModalHeader>
        <ModalCloseButton />
        <AccessForm onSubmit={formik.handleSubmit}>
          <ModalBody>
            {submission && <Box mb={4}><CreationProcessing kind="user" authToken={authToken}
              submissionKey={submission.idempotency_key} initial={submission}
              onReset={() => setSubmission(null)}
              onResolved={() => dispatch(fetchUsers({ authToken }))} /></Box>}
            <VStack as="fieldset" disabled={addStatus === 'loading' || Boolean(submission)} spacing={4} width="100%">
              <FormControl id="name" isRequired>
                <FormLabel fontSize={14}>Name</FormLabel>
                <Input
                  type="text"
                  name="name"
                  borderRadius={"0.5rem"}
                  value={formik.values.name}
                  onChange={formik.handleChange}
                />
                {formik.touched.name && formik.errors.name ? (
                  <Box color="red" fontSize="sm">
                    {formik.errors.name}
                  </Box>
                ) : null}
              </FormControl>
              <FormControl id="email" isRequired>
                <FormLabel fontSize={14}>Email</FormLabel>
                <Input
                  type="email"
                  name="email"
                  borderRadius={"0.5rem"}
                  value={formik.values.email}
                  onChange={formik.handleChange}
                />
                {formik.touched.email && formik.errors.email ? (
                  <Box color="red" fontSize="sm">
                    {formik.errors.email}
                  </Box>
                ) : null}
              </FormControl>
              <FormControl id="phone" isRequired>
                <FormLabel fontSize={14}>Contact Number</FormLabel>
                <Input
                  type="tel"
                  name="phone"
                  borderRadius={"0.5rem"}
                  placeholder="03XXXXXXXXX"
                  value={formik.values.phone}
                  onChange={formik.handleChange}
                />
                {formik.touched.phone && formik.errors.phone ? (
                  <Box color="red" fontSize="sm">
                    {formik.errors.phone}
                  </Box>
                ) : null}
              </FormControl>
              {/* <FormControl id="password">
                <FormLabel fontSize={14}>Password</FormLabel>
                <Input
                  type="password"
                  name="password"
                  borderRadius={"0.5rem"}
                  value={formik.values.password}
                  onChange={formik.handleChange}
                />
                {formik.touched.password && formik.errors.password ? (
                  <Box color="red" fontSize="sm">
                    {formik.errors.password}
                  </Box>
                ) : null}
              </FormControl> */}
              <FormControl id="role" isRequired>
                <FormLabel fontSize={14}>Job title</FormLabel>
                <Select
                  aria-label="Job title"
                  placeholder={rolesLoading ? "Loading job titles..." : "Select job title"}
                  borderRadius={"0.5rem"}
                  name="role"
                  value={formik.values.role}
                  onChange={formik.handleChange}
                  isDisabled={rolesLoading}
                >
                  {roles.map((role) => (
                    <option key={role._id} value={role.name}>
                      {role.name}
                    </option>
                  ))}
                </Select>
                {formik.touched.role && formik.errors.role ? (
                  <Box color="red" fontSize="sm">
                    {formik.errors.role}
                  </Box>
                ) : null}
                <FormHelperText>Shown on their account. What they can open comes from their access role.</FormHelperText>
              </FormControl>
              {canChooseAccess && <FormControl>
                <FormLabel fontSize={14}>Access role</FormLabel>
                <RoleChoice api={accessApi} value={accessRole} label="Access role" filter={staffRole} onChange={(role) => { setAccessRole(role); setAccessBatches([]); setAccessCourses([]); setAccessError(''); }} />
                <FormHelperText>{accessRole ? `They can sign in and work as ${accessRole.name} straight away.` : 'Optional. Leave empty to use the new-account default; you can assign a role later.'}</FormHelperText>
                {scopedRole && <Box mt={2}><ScopePicker api={accessApi} type="batches" selected={accessBatchIds} onChange={setAccessBatches} /><ScopePicker api={accessApi} type="courses" selected={accessCourseIds} onChange={setAccessCourses} /></Box>}
                {accessError && <Box color="red" fontSize="sm" mt={1}>{accessError}</Box>}
              </FormControl>}
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              borderRadius={"0.75rem"}
              onClick={onClose}
            >
              Close
            </Button>
            <Button
              borderRadius={"0.75rem"}
              backgroundColor={"#FFCB82"}
              color={"#85652D"}
              _hover={{
                backgroundColor: "#E3B574",
                color: "#654E26",
              }}
              fontWeight={"500"}
              type="submit"
              loadingText="Adding"
              isLoading={addStatus === "loading"}
              isDisabled={Boolean(submission)}
            >
              Add
            </Button>
          </ModalFooter>
        </AccessForm>
      </AccessForm>
    </Modal>
  );
}

export default AddModel;
