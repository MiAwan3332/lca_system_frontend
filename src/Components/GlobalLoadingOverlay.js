import React, { useEffect, useState } from "react";
import { Box } from "@chakra-ui/react";
import LcaLogoLoading from "./LcaLogoLoading";
import { subscribeGlobalLoading } from "../utlls/globalLoading";

/**
 * Full-screen LCA logo overlay shown while tracked API requests are in flight.
 */
function GlobalLoadingOverlay() {
  const [active, setActive] = useState(false);

  useEffect(() => subscribeGlobalLoading(setActive), []);

  if (!active) return null;

  return (
    <Box
      className="lca-global-loading"
      position="fixed"
      inset={0}
      zIndex={3000}
      display="flex"
      alignItems="center"
      justifyContent="center"
      pointerEvents="all"
    >
      <Box className="lca-global-loading__backdrop" />
      <Box className="lca-global-loading__card">
        <LcaLogoLoading size="lg" label="Loading" />
      </Box>
    </Box>
  );
}

export default GlobalLoadingOverlay;
