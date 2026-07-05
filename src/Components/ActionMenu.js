import React, { useCallback, useEffect, useRef } from "react";
import {
  IconButton,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  Portal,
  VStack,
  useDisclosure,
} from "@chakra-ui/react";
import { MoreVertical } from "lucide-react";

// Singleton: only one ActionMenu open at a time (across the whole app).
let activeClose = null;

const isInsideOpenModal = (target) => {
  if (!target?.closest) return false;
  return Boolean(
    target.closest('[role="dialog"]') ||
      target.closest(".chakra-modal__content-container") ||
      target.closest(".chakra-modal__overlay") ||
      target.closest(".chakra-modal__content")
  );
};

function ActionMenu({ children, placement = "left-start", width = "220px" }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const triggerRef = useRef(null);
  const contentRef = useRef(null);

  const closeSelf = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleOpen = useCallback(() => {
    if (typeof activeClose === "function" && activeClose !== closeSelf) {
      activeClose();
    }
    activeClose = closeSelf;
    onOpen();
  }, [closeSelf, onOpen]);

  const handleClose = useCallback(() => {
    onClose();
    if (activeClose === closeSelf) {
      activeClose = null;
    }
  }, [closeSelf, onClose]);

  const handleToggle = useCallback(
    (e) => {
      e?.stopPropagation?.();
      if (isOpen) {
        handleClose();
      } else {
        handleOpen();
      }
    },
    [handleClose, handleOpen, isOpen]
  );

  const handleMenuActionClick = useCallback(
    (e) => {
      const actionTarget = e.target.closest("button, a, [role='button']");
      if (!actionTarget || !contentRef.current?.contains(actionTarget)) {
        return;
      }
      // Hide the menu but keep children mounted so modals stay open.
      handleClose();
    },
    [handleClose]
  );

  useEffect(() => {
    return () => {
      if (activeClose === closeSelf) {
        activeClose = null;
      }
    };
  }, [closeSelf]);

  // Close menu on outside click, but never when interacting with an open modal.
  useEffect(() => {
    if (!isOpen) return;

    const onPointerDownCapture = (event) => {
      const target = event.target;
      if (!target) return;

      const isInsideTrigger =
        triggerRef.current && triggerRef.current.contains(target);
      const isInsideContent =
        contentRef.current && contentRef.current.contains(target);

      if (
        isInsideTrigger ||
        isInsideContent ||
        isInsideOpenModal(target)
      ) {
        return;
      }

      handleClose();
    };

    document.addEventListener("pointerdown", onPointerDownCapture, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDownCapture, true);
    };
  }, [handleClose, isOpen]);

  return (
    <Popover
      placement={placement}
      closeOnBlur={false}
      isLazy
      lazyBehavior="keepMounted"
      isOpen={isOpen}
      onClose={handleClose}
      returnFocusOnClose={false}
    >
      <PopoverTrigger>
        <span ref={triggerRef} style={{ display: "inline-flex" }}>
          <IconButton
            aria-label="More actions"
            icon={<MoreVertical size={18} />}
            variant="outline"
            size="sm"
            borderRadius="lg"
            onClick={handleToggle}
          />
        </span>
      </PopoverTrigger>
      <Portal>
        <PopoverContent
          ref={contentRef}
          w={width}
          bg="white"
          borderColor="#E0E8EC"
          boxShadow="xl"
          zIndex={1400}
        >
          <PopoverBody onClick={handleMenuActionClick}>
            <VStack align="stretch" spacing={2}>
              {children}
            </VStack>
          </PopoverBody>
        </PopoverContent>
      </Portal>
    </Popover>
  );
}

export default ActionMenu;
