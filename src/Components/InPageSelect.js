import React, { useId, useMemo, useRef, useState } from 'react';
import { Box, Menu, MenuButton, MenuItemOption, MenuList, Portal, Text, chakra, useColorModeValue, useFormControl, useFormControlContext, useMergeRefs, useMultiStyleConfig } from '@chakra-ui/react';
import { Check, ChevronDown } from 'lucide-react';

// Menu generates its own IDs; retain the field ID used by existing form labels.
const FieldButton = React.forwardRef(({ fieldId, ...props }, ref) => <chakra.button {...props} ref={ref} id={fieldId} />);
const FieldMenu = React.forwardRef(({ fieldId, ...props }, ref) => <chakra.div {...props} ref={ref} aria-labelledby={fieldId} />);

// Interpret existing option declarations without mounting a native select or option.
function readOptions(children, group, disabled = false) {
  return React.Children.toArray(children).flatMap((child) => {
    if (!React.isValidElement(child)) return [];
    if (child.type === React.Fragment) return readOptions(child.props.children, group, disabled);
    if (child.type === 'optgroup') return readOptions(child.props.children, child.props.label, disabled || child.props.disabled);
    if (child.type !== 'option') return [];
    const label = React.Children.toArray(child.props.children).join('');
    return [{ value: String(child.props.value ?? label), label, group, disabled: Boolean(disabled || child.props.disabled), hidden: child.props.hidden }];
  });
}

const InPageSelect = React.forwardRef(function InPageSelect({
  children, value, defaultValue, placeholder, name, onChange, onBlur, onFocus,
  isDisabled, disabled, isRequired, required, isInvalid, isReadOnly, readOnly,
  id, size, variant, colorScheme, w, width, minW, minWidth, maxW, maxWidth,
  className = '', ...props
}, ref) {
  const options = useMemo(() => {
    const items = readOptions(children);
    return placeholder && !items.some((item) => item.value === '')
      ? [{ value: '', label: placeholder }, ...items] : items;
  }, [children, placeholder]);
  const [localValue, setLocalValue] = useState(defaultValue);
  const selectedValue = String(value ?? localValue ?? options.find((item) => !item.disabled)?.value ?? '');
  const selected = options.find((item) => item.value === selectedValue);
  const trigger = useRef(null);
  const triggerRef = useMergeRefs(ref, trigger);
  const [invalid, setInvalid] = useState(false);
  const [portalHost, setPortalHost] = useState(null);
  const context = useFormControlContext();
  const generatedId = useId();
  const field = useFormControl({ id: id ?? context?.id ?? generatedId, isDisabled: isDisabled || disabled, isRequired: isRequired || required, isInvalid,
    isReadOnly: isReadOnly || readOnly, onBlur, onFocus, 'aria-describedby': props['aria-describedby'] });
  const styles = useMultiStyleConfig('Select', { size, variant, colorScheme });
  const background = useColorModeValue('#ffffff', '#1e293b');
  const foreground = useColorModeValue('#263238', '#f1f5f9');
  const highlight = useColorModeValue('#edf2f7', '#334155');
  const choose = (item) => {
    if (field.disabled || field.readOnly || item.disabled) return;
    setLocalValue(item.value);
    setInvalid(false);
    const target = { name, id: field.id, value: item.value, type: 'select-one' };
    onChange?.({ target, currentTarget: target, type: 'change', persist() {}, preventDefault() {}, stopPropagation() {} });
  };
  return <Box position="relative" w={w ?? width ?? '100%'} minW={minW ?? minWidth ?? 0} maxW={maxW ?? maxWidth}>
    <Menu matchWidth placement="bottom-start" strategy="fixed" isLazy onOpen={() => {
      // Stay inside a dialog's focus/accessibility boundary while escaping its scrolling body.
      setPortalHost(trigger.current?.closest('[role="dialog"], [role="alertdialog"]') || trigger.current?.ownerDocument.body);
    }}>
      <MenuButton as={FieldButton} fieldId={field.id} ref={triggerRef} {...props} {...field} type="button" name={name} value={selectedValue}
        disabled={field.disabled || field.readOnly} aria-invalid={field['aria-invalid'] || (invalid && !selectedValue) || undefined}
        onClick={(event) => { if (field.readOnly) event.preventDefault(); props.onClick?.(event); }}
        className={`inpage-select-trigger ${className}`} __css={{ ...styles.field, display: 'flex', alignItems: 'center', textAlign: 'start', fontWeight: 'normal', cursor: 'pointer' }}
        w="100%" bg={background} color={foreground}>
        <Text as="span" flex="1" minW={0} isTruncated>{selected?.label ?? placeholder ?? 'Choose an option'}</Text>
        <Box as="span" position="absolute" insetEnd="0.6rem" pointerEvents="none" aria-hidden="true"><ChevronDown size={16} /></Box>
      </MenuButton>
      <Portal containerRef={{ current: portalHost }}><MenuList as={FieldMenu} fieldId={field.id} bg={background} color={foreground} minW={0} maxW="calc(100vw - 16px)" maxH="280px" overflowY="auto" overscrollBehavior="contain" zIndex={1600}>
        {options.filter((item) => !item.hidden).map((item, index, items) => <React.Fragment key={`${item.value}-${index}`}>
          {item.group && item.group !== items[index - 1]?.group && <Text px={3} py={2} fontWeight="semibold">{item.group}</Text>}
          <MenuItemOption type="radio" isChecked={selectedValue === item.value} icon={<Check size={16} />} isDisabled={item.disabled || field.readOnly}
            bg={background} color={foreground} _focus={{ bg: highlight }} _hover={{ bg: highlight }}
            whiteSpace="normal" wordBreak="break-word" minH="40px" onClick={() => choose(item)}>
            <Text as="span" flex="1">{item.label}</Text>
          </MenuItemOption>
        </React.Fragment>)}
        {!options.length && <Text px={3} py={2}>No options available.</Text>}
      </MenuList></Portal>
    </Menu>
    {/* Keep form data and native required validation, without a native dropdown. */}
    <input type="text" name={name} value={selectedValue} disabled={field.disabled} required={field.required && !field.readOnly}
      tabIndex={-1} aria-hidden="true" autoComplete="off" onChange={() => {}}
      style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none', bottom: 0, left: 0 }}
      onInvalid={(event) => { event.preventDefault(); setInvalid(true); trigger.current?.focus(); }} />
    {invalid && !selectedValue && <Text color="red.500" fontSize="sm" role="alert">Choose an option.</Text>}
  </Box>;
});

export default InPageSelect;
