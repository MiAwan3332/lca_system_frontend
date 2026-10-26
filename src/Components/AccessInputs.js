import React, { useSyncExternalStore } from 'react';
import * as Chakra from '@chakra-ui/react';
import { accessSnapshot, can, canUseField, subscribeAccess } from '../utlls/accessCapabilities';
import { useAccessForm } from './AccessForm';

function control(Component, native = false) {
  return React.forwardRef(function AccessInput({ permissionField, permission, name, isDisabled, disabled, isRequired, required, ...props }, ref) {
    useSyncExternalStore(subscribeAccess, accessSnapshot);
    const mode = useAccessForm() || (permissionField ? 'edit' : false);
    const field = permissionField || name;
    if (!mode || !field) return <Component ref={ref} name={name} {...props} {...(native ? { disabled: disabled || isDisabled, required: required || isRequired } : { isDisabled: isDisabled || disabled, isRequired: isRequired || required })} />;
    const readable = canUseField(field, 'read'), writable = (mode === 'read' ? readable : canUseField(field, 'write')) && (!permission || !accessSnapshot().managed || can(permission));
    if (!readable && !writable) return null;
    return <Component ref={ref} name={name} {...props} {...(native
      ? { disabled: Boolean(disabled || !writable), required: writable && required }
      : { isDisabled: Boolean(isDisabled || disabled || !writable), isRequired: writable && isRequired })} />;
  });
}
export const Input = control(Chakra.Input);
export const Textarea = control(Chakra.Textarea);
export const Select = control(Chakra.Select);
export const Checkbox = control(Chakra.Checkbox);
export const Switch = control(Chakra.Switch);
export const Radio = control(Chakra.Radio);
export const RadioGroup = control(Chakra.RadioGroup);
export const NumberInput = control(Chakra.NumberInput);
export const NumberInputField = control(Chakra.NumberInputField);
export const NativeInput = control('input', true);
