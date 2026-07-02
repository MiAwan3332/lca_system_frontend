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
      // Prevent table-row click handlers from interfering
      e?.stopPropagation?.();
      if (isOpen) {
        handleClose();
      } else {
        handleOpen();
      }
    },
    [handleClose, handleOpen, isOpen]
  );

  useEffect(() => {
    return () => {
      if (activeClose === closeSelf) {
        activeClose = null;
      }
    };
  }, [closeSelf]);

  // Close on any click anywhere outside trigger/content (stronger than closeOnBlur).
  useEffect(() => {
    if (!isOpen) return;

    const onPointerDownCapture = (event) => {
      const target = event.target;
      if (!target) return;

      const isInsideTrigger =
        triggerRef.current && triggerRef.current.contains(target);
      const isInsideContent =
        contentRef.current && contentRef.current.contains(target);

      if (isInsideTrigger || isInsideContent) return;
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
      closeOnBlur
      isLazy
      isOpen={isOpen}
      onClose={handleClose}
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
          zIndex={2000}
        >
          <PopoverBody>
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
