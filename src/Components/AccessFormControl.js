import React, { useSyncExternalStore } from 'react';
import { FormControl } from '@chakra-ui/react';
import { accessFieldName, accessSnapshot, canUseField, subscribeAccess } from '../utlls/accessCapabilities';
import { useAccessForm } from './AccessForm';

function childFields(children, result = new Set()) {
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    const name = child.props.permissionField || child.props.name || child.props.fieldName;
    if (typeof name === 'string') result.add(accessFieldName(name));
    if (child.props.children) childFields(child.props.children, result);
  });
  return [...result];
}

// Explicit names take precedence; unnamed layout groups are left to their named controls.
export default function AccessFormControl({ permissionField, id, children, isDisabled, ...props }) {
  useSyncExternalStore(subscribeAccess, accessSnapshot);
  const enabled = useAccessForm();
  const names = childFields(children);
  const field = permissionField || (names.length === 1 ? names[0] : names.length === 0 ? id : null);
  if (!enabled || !field) return <FormControl id={id} isDisabled={isDisabled} {...props}>{children}</FormControl>;
  const writable = enabled === 'read' ? canUseField(field, 'read') : canUseField(field, 'write');
  if (!canUseField(field, 'read') && !writable) return null;
  return <FormControl as="fieldset" minW={0} border={0} p={0} m={0} id={id} {...props}
    disabled={Boolean(isDisabled || !writable)} isDisabled={Boolean(isDisabled || !writable)}
    isRequired={writable && props.isRequired}>{children}</FormControl>;
}
