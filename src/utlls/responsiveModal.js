/**
 * Shared responsive props for Chakra Modal components.
 */
export const responsiveModalProps = {
  scrollBehavior: "inside",
  blockScrollOnMount: true,
};

export const responsiveModalContentProps = {
  mx: { base: 2, sm: 4 },
  my: { base: 2, sm: "auto" },
  maxH: { base: "100vh", sm: "90vh" },
  w: { base: "100%", sm: "auto" },
};

export const getResponsiveModalSize = (desktopSize = "md") => ({
  size: { base: "full", sm: desktopSize },
});
