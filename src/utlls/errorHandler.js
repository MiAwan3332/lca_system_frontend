import { createStandaloneToast } from "@chakra-ui/react";

const { toast } = createStandaloneToast();

const showErrorPopup = (title, description) => {
  toast({
    title: title || "Something went wrong",
    description: description || "Please try again.",
    status: "error",
    duration: 8000,
    isClosable: true,
    position: "top",
  });
};

export const setupGlobalErrorHandlers = () => {
  const handleWindowError = (event) => {
    event.preventDefault();
    showErrorPopup("Application Error", event.message || "An unexpected error occurred.");
  };

  const handleUnhandledRejection = (event) => {
    event.preventDefault();
    const reason = event.reason;
    const message =
      reason?.message ||
      reason?.response?.data?.message ||
      (typeof reason === "string" ? reason : null) ||
      (reason && typeof reason === "object" ? JSON.stringify(reason) : null) ||
      "Request failed.";
    showErrorPopup("Request Error", message);
  };

  window.addEventListener("error", handleWindowError);
  window.addEventListener("unhandledrejection", handleUnhandledRejection);

  return () => {
    window.removeEventListener("error", handleWindowError);
    window.removeEventListener("unhandledrejection", handleUnhandledRejection);
  };
};

export { showErrorPopup };
