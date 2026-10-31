import {DEFAULT_STAFF_PASSWORD} from '../../utlls/creationDefaults';
import { Input, Select, Textarea } from '../../Components/AccessInputs';
import AccessForm from '../../Components/AccessForm';
import FormControl from '../../Components/AccessFormControl';
import { useAccessCreateFormik as useFormik } from '../../utlls/accessForms';
import React, { useState, useEffect } from "react";
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, Button, FormLabel, VStack, Box, Image } from '@chakra-ui/react';

import axios from 'axios';
import {config} from '../../utlls/config';
import {Text, Alert, AlertIcon, useToast} from '@chakra-ui/react';
import * as Yup from "yup";
import Cookies from "js-cookie";
import { useDispatch, useSelector } from "react-redux";
import { addPanelist, fetchPanelists } from "../../Features/panelistSlice";

function AddPanelistModal({ isOpen, onClose }) {
  const [authToken] = useState(Cookies.get("authToken"));
  const [preview, setPreview] = useState("");
  const { addStatus } = useSelector((state) => state.panelists);
  const dispatch = useDispatch();
  const toast=useToast();
  const [identity,setIdentity]=useState(null),[checking,setChecking]=useState(false),[identityError,setIdentityError]=useState('');

  const formik = useFormik({
    initialValues: {
      name: "",
      phone: "",
      email: "",
      description: "",
      is_active: "true",
      photo: null,
    },
    validationSchema: Yup.object({
      name: Yup.string().trim().required("Required"),
      phone: Yup.string().trim().required("Required"),
      description: Yup.string().trim().required("Required"),
    }),
    onSubmit: async (values) => {
      if(checking || identityError)return;
      const formData = new FormData();
      if(values.email.trim())formData.append('email',values.email.trim());
      formData.append("name", values.name.trim());
      formData.append("phone", values.phone.trim());
      formData.append("description", values.description.trim());
      formData.append("is_active", values.is_active);
      if (values.photo) {
        formData.append("photo", values.photo);
      }

      dispatch(addPanelist({ formData, authToken }))
        .unwrap()
        .then((data) => {
          toast({title:data.login?.created?'Panelist login created':'Panelist access added',description:data.login?.created?'They can log in with their phone or '+data.login.email+' and the default password shown in this form.':'Their existing login, password and other roles are unchanged.',status:'success',duration:9000,isClosable:true});
          formik.resetForm();
          setPreview("");
          onClose();
          dispatch(fetchPanelists({ authToken }));
        })
        .catch(() => {});
    },
  });

  useEffect(()=>{
    const phone=formik.values.phone,email=formik.values.email;
    if(phone.replace(/\D/g,'').length<10){setIdentity(null);setIdentityError('');setChecking(false);return;}
    let active=true;setChecking(true);setIdentity(null);setIdentityError('');
    const timer=setTimeout(async()=>{try{const r=await axios.post(config.BASE_URL+'/panelists/identity/lookup',{phone,email},{headers:{Authorization:'Bearer '+authToken}});if(active){setIdentity(r.data);if(r.data.existing_user?.name&&!formik.values.name)formik.setFieldValue('name',r.data.existing_user.name);}}
      catch(error){if(active)setIdentityError(error.response?.data?.message||'Could not check the existing login. Retry before creating the panelist.');}finally{if(active)setChecking(false);}},400);
    return()=>{active=false;clearTimeout(timer);};
  },[formik.values.phone,formik.values.email,authToken]);

  const handleClose = () => {
    formik.resetForm();
    setPreview("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalOverlay />
      <AccessForm component={ModalContent}>
        <ModalHeader className="text-xl font-semibold">Add Panelist</ModalHeader>
        <ModalCloseButton />
        <AccessForm onSubmit={formik.handleSubmit}>
          <ModalBody>
            <VStack spacing={4}>
              <FormControl id="name" isRequired>
                <FormLabel fontSize={14}>Name</FormLabel>
                <Input
                  type="text"
                  name="name"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                />
                {formik.touched.name && formik.errors.name ? (
                  <Box color="red" fontSize="sm">
                    {formik.errors.name}
                  </Box>
                ) : null}
              </FormControl>

              <FormControl id="phone" isRequired>
                <FormLabel fontSize={14}>Phone No</FormLabel>
                <Input
                  type="tel"
                  name="phone"
                  value={formik.values.phone}
                  onChange={formik.handleChange}
                />
                {formik.touched.phone && formik.errors.phone ? (
                  <Box color="red" fontSize="sm">
                    {formik.errors.phone}
                  </Box>
                ) : null}
              </FormControl>

              <FormControl id="panelist-email"><FormLabel>Login email (optional)</FormLabel><Input name="email" type="email" value={formik.values.email} onChange={formik.handleChange} placeholder="Use their existing email when they already have an account" /></FormControl>
              {checking && <Text fontSize="sm">Checking existing accounts…</Text>}
              {identityError && <Alert status="error"><AlertIcon />{identityError}</Alert>}
              {identity?.found && <Alert status="info"><AlertIcon /><Box><Text>Use the existing login for {identity.existing_user?.name}.</Text><Text fontSize="sm">Current roles: {(identity.existing_user?.accessRoleNames||[]).join(', ')||'Existing access'}. Interview Panelist will be added; their password and current roles stay unchanged.</Text></Box></Alert>}
              {identity?.existing_panelist && <Text fontSize="sm">This person already has a panelist profile. We will complete its login/access setup without creating a duplicate.</Text>}
              {identity?.needs_login && <Box w="full" borderWidth="1px" borderRadius="md" p={3}><Text fontSize="sm">New login password</Text><Text as="code" fontWeight="bold" userSelect="all">{DEFAULT_STAFF_PASSWORD}</Text><Text fontSize="sm">This is the same default password used when creating staff users.</Text></Box>}
              <FormControl id="description" isRequired>
                <FormLabel fontSize={14}>Description</FormLabel>
                <Textarea
                  name="description"
                  rows={4}
                  value={formik.values.description}
                  onChange={formik.handleChange}
                />
                {formik.touched.description && formik.errors.description ? (
                  <Box color="red" fontSize="sm">
                    {formik.errors.description}
                  </Box>
                ) : null}
              </FormControl>

              <FormControl id="is_active">
                <FormLabel fontSize={14}>Status</FormLabel>
                <Select
                  name="is_active"
                  value={formik.values.is_active}
                  onChange={formik.handleChange}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </Select>
              </FormControl>

              <FormControl id="photo">
                <FormLabel fontSize={14}>Photo</FormLabel>
                <Input
                  type="file"
                  accept="image/*"
                  name="photo"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    formik.setFieldValue("photo", file);
                    setPreview(file ? URL.createObjectURL(file) : "");
                  }}
                />
                {preview ? (
                  <Image
                    src={preview}
                    alt="Preview"
                    mt={3}
                    boxSize="96px"
                    objectFit="cover"
                    borderRadius="full"
                  />
                ) : null}
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              borderRadius="0.75rem"
              onClick={handleClose}
            >
              Close
            </Button>
            <Button
              borderRadius="0.75rem"
              backgroundColor="#FFCB82"
              color="#85652D"
              _hover={{ backgroundColor: "#E3B574", color: "#654E26" }}
              fontWeight="500"
              type="submit"
              loadingText="Adding"
              isLoading={addStatus === "loading"} isDisabled={checking || Boolean(identityError) || !identity}
            >
              Add Panelist
            </Button>
          </ModalFooter>
        </AccessForm>
      </AccessForm>
    </Modal>
  );
}

export default AddPanelistModal;
