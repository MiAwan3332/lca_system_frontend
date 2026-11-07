import { useSyncExternalStore } from 'react';
import { useFormik, setIn } from 'formik';
import { createStandaloneToast } from '@chakra-ui/react';
import { accessSnapshot, canUseField, subscribeAccess } from './accessCapabilities';
const { toast } = createStandaloneToast();

export function permittedValidationErrors(errors) {
  const filter = (value, prefix = '') => Object.fromEntries(Object.entries(value || {}).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (!canUseField(path, 'write')) return [];
    if (child && typeof child === 'object') {
      const nested = filter(child, path); return Object.keys(nested).length ? [[key, nested]] : [];
    }
    return [[key, child]];
  }));
  return filter(errors);
}

function usePermissionFormik(options, partial) {
  const access = useSyncExternalStore(subscribeAccess, accessSnapshot);
  const restricted = access.managed && !access.owner;
  const { validationSchema, validate, ...rest } = options;
  const validateAll = async (values) => {
    let errors = {};
    if (validationSchema) {
      const schema = typeof validationSchema === 'function' ? validationSchema() : validationSchema;
      try { await schema.validate(values, { abortEarly: false }); }
      catch (error) {
        if (error.name !== 'ValidationError') throw error;
        for (const item of error.inner?.length ? error.inner : [error]) if (item.path) errors = setIn(errors, item.path, item.message);
      }
    }
    if (validate) errors = { ...errors, ...await validate(values) };
    return errors;
  };
  const formik = useFormik({ ...rest, validate: async (values) => {
    const errors = await validateAll(values);
    return restricted && partial ? permittedValidationErrors(errors) : errors;
  } });
  const handleSubmit = async (event) => {
    event?.preventDefault(); event?.stopPropagation();
    if (restricted && !partial) {
      const errors = await validateAll(formik.values);
      const schema = typeof validationSchema === 'function' ? validationSchema() : validationSchema;
      const required = Object.entries(schema?.describe({ value: formik.values })?.fields || {}).filter(([, field]) => field.optional === false).map(([name]) => name);
      if ([...required, ...Object.keys(errors)].some((field) => !canUseField(field, 'write'))) {
        toast({ title: 'Additional access is required', description: 'Your role cannot provide one or more required fields. Contact an access administrator.', status: 'warning', isClosable: true });
        return;
      }
    }
    return formik.submitForm();
  };
  return { ...formik, handleSubmit };
}
export const useAccessUpdateFormik = (options) => usePermissionFormik(options, true);
export const useAccessCreateFormik = (options) => usePermissionFormik(options, false);
