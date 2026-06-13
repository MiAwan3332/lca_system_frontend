import React from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  Text,
  Box,
} from "@chakra-ui/react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleClose = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const message =
        this.state.error?.message || "An unexpected error occurred.";

      return (
        <>
          {this.props.fallback || (
            <Box p={6} textAlign="center" color="gray.500">
              Something went wrong. Please close the error dialog to continue.
            </Box>
          )}
          <Modal isOpen onClose={this.handleClose} isCentered size="lg">
            <ModalOverlay />
            <ModalContent borderRadius="xl">
              <ModalHeader color="red.500">Error</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <Text fontSize="sm" color="gray.700">
                  {message}
                </Text>
              </ModalBody>
              <ModalFooter>
                <Button
                  borderRadius="xl"
                  backgroundColor="#FFCB82"
                  color="#85652D"
                  onClick={this.handleClose}
                >
                  Close
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
