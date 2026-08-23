import React from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Badge,
  Text,
  VStack,
  HStack,
  Box,
  Divider,
} from "@chakra-ui/react";
import moment from "moment";
import {
  getInterviewPanelStatusMeta,
  getPanelTimeRange,
  panelToScheduleRows,
} from "../../utlls/interviewPanel";
import { formatClassTimeRange, formatTime12Hour } from "../../utlls/classTime";
import {
  getResponsiveModalSize,
  responsiveModalContentProps,
  responsiveModalProps,
} from "../../utlls/responsiveModal";

function ViewInterviewPanelModal({ isOpen, onClose, panel }) {
  if (!panel) return null;

  const statusMeta = getInterviewPanelStatusMeta(panel.status);
  const creator =
    typeof panel.created_by === "object"
      ? panel.created_by?.name || panel.created_by?.email
      : null;
  const { start_time, end_time } = getPanelTimeRange(panel);
  const durationLabel =
    formatClassTimeRange(start_time, end_time) ||
    formatTime12Hour(start_time) ||
    "—";
  const scheduleRows = panelToScheduleRows(panel);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      {...responsiveModalProps}
      {...getResponsiveModalSize("lg")}
    >
      <ModalOverlay />
      <ModalContent {...responsiveModalContentProps}>
        <ModalHeader className="text-xl font-semibold pr-10">
          {panel.title}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack align="stretch" spacing={4}>
            <HStack justify="space-between" flexWrap="wrap" gap={2}>
              <Badge colorScheme={statusMeta.colorScheme} borderRadius="md" px={2} py={1}>
                {statusMeta.label}
              </Badge>
              {creator ? (
                <Text fontSize="sm" color="gray.500">
                  Created by {creator}
                </Text>
              ) : null}
            </HStack>

            {panel.description ? (
              <Text whiteSpace="pre-wrap" color="gray.700">
                {panel.description}
              </Text>
            ) : (
              <Text color="gray.400" fontSize="sm">
                No description provided.
              </Text>
            )}

            <Box
              border="1px solid"
              borderColor="#E0E8EC"
              borderRadius="xl"
              p={4}
              bg="#FAFBFC"
            >
              <VStack align="stretch" spacing={2}>
                <DetailRow
                  label="Primary date"
                  value={
                    panel.date
                      ? moment(panel.date).format("DD MMM YYYY")
                      : "—"
                  }
                />
                <DetailRow label="Primary duration" value={durationLabel} />
                <DetailRow label="Venue" value={panel.venue || "—"} />
                {panel.createdAt ? (
                  <DetailRow
                    label="Created"
                    value={moment(panel.createdAt).format(
                      "DD MMM YYYY, hh:mm A"
                    )}
                  />
                ) : null}
              </VStack>
            </Box>

            <Box>
              <Text fontWeight="600" fontSize="sm" mb={2}>
                Schedules ({scheduleRows.length})
              </Text>
              <VStack align="stretch" spacing={2}>
                {scheduleRows.map((slot, index) => {
                  const slotDuration =
                    formatClassTimeRange(slot.start_time, slot.end_time) ||
                    formatTime12Hour(slot.start_time) ||
                    "—";
                  return (
                    <Box
                      key={slot.id || index}
                      border="1px solid"
                      borderColor="#E0E8EC"
                      borderRadius="lg"
                      px={3}
                      py={2}
                      bg="white"
                    >
                      <Text fontWeight="600" fontSize="sm">
                        Schedule {index + 1}
                      </Text>
                      <Text fontSize="sm" color="gray.600" mt={1}>
                        {slot.date
                          ? moment(slot.date).format("DD MMM YYYY")
                          : "—"}{" "}
                        · {slotDuration}
                      </Text>
                      {slot.venue ? (
                        <Text fontSize="xs" color="gray.500" mt={1}>
                          {slot.venue}
                        </Text>
                      ) : null}
                      {slot.notes ? (
                        <Text fontSize="sm" color="gray.600" mt={1}>
                          {slot.notes}
                        </Text>
                      ) : null}
                    </Box>
                  );
                })}
              </VStack>
            </Box>

            <Box>
              <Text fontWeight="600" fontSize="sm" mb={2}>
                Panel Members ({(panel.members || []).length})
              </Text>
              {(panel.members || []).length === 0 ? (
                <Text fontSize="sm" color="gray.500">
                  No members added.
                </Text>
              ) : (
                <VStack align="stretch" spacing={2}>
                  {(panel.members || []).map((member, index) => (
                    <Box
                      key={`${member.name}-${index}`}
                      border="1px solid"
                      borderColor="#E0E8EC"
                      borderRadius="lg"
                      px={3}
                      py={2}
                      bg="white"
                    >
                      <Text fontWeight="600" fontSize="sm">
                        {member.name}
                      </Text>
                      {member.role ? (
                        <Text fontSize="xs" color="gray.500">
                          {member.role}
                        </Text>
                      ) : null}
                      {member.description ? (
                        <Text fontSize="sm" color="gray.600" mt={1}>
                          {member.description}
                        </Text>
                      ) : null}
                    </Box>
                  ))}
                </VStack>
              )}
            </Box>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

function DetailRow({ label, value }) {
  return (
    <>
      <HStack justify="space-between" align="flex-start">
        <Text fontSize="sm" color="gray.500">
          {label}
        </Text>
        <Text fontSize="sm" fontWeight="600" textAlign="right">
          {value}
        </Text>
      </HStack>
      <Divider />
    </>
  );
}

export default ViewInterviewPanelModal;
