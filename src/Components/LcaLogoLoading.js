import React from "react";
import { Box, Text, VStack, VisuallyHidden } from "@chakra-ui/react";
import { ACADEMY_BRANDING } from "../utlls/academyBranding";

const SIZE_MAP = {
  xs: { logoH: 26, stage: 76, gap: 2, fontSize: "xs", py: 3 },
  sm: { logoH: 34, stage: 100, gap: 2, fontSize: "sm", py: 5 },
  md: { logoH: 48, stage: 140, gap: 3, fontSize: "sm", py: 8 },
  lg: { logoH: 60, stage: 168, gap: 4, fontSize: "md", py: 12 },
  xl: { logoH: 72, stage: 196, gap: 4, fontSize: "md", py: 16 },
};

/**
 * LCA branded loading indicator with orbit + glow animations.
 */
function LcaLogoLoading({
  size = "md",
  label = "Loading",
  showLabel = true,
  fullHeight = false,
  className = "",
}) {
  const dims = SIZE_MAP[size] || SIZE_MAP.md;

  return (
    <VStack
      className={`lca-logo-loading lca-logo-loading--${size} ${className}`.trim()}
      spacing={dims.gap}
      justify="center"
      align="center"
      py={dims.py}
      minH={fullHeight ? "40vh" : undefined}
      w="full"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Box
        className="lca-logo-loading__stage"
        style={{ width: dims.stage, height: dims.stage }}
        aria-hidden
      >
        <span className="lca-logo-loading__ripple lca-logo-loading__ripple--1" />
        <span className="lca-logo-loading__ripple lca-logo-loading__ripple--2" />
        <span className="lca-logo-loading__orb lca-logo-loading__orb--a" />
        <span className="lca-logo-loading__orb lca-logo-loading__orb--b" />
        <span className="lca-logo-loading__halo" />
        <span className="lca-logo-loading__ring lca-logo-loading__ring--dashed" />
        <span className="lca-logo-loading__ring lca-logo-loading__ring--outer" />
        <span className="lca-logo-loading__ring lca-logo-loading__ring--inner" />
        <span className="lca-logo-loading__arc lca-logo-loading__arc--a" />
        <span className="lca-logo-loading__arc lca-logo-loading__arc--b" />
        <span className="lca-logo-loading__spark lca-logo-loading__spark--1" />
        <span className="lca-logo-loading__spark lca-logo-loading__spark--2" />
        <span className="lca-logo-loading__spark lca-logo-loading__spark--3" />
        <span className="lca-logo-loading__spark lca-logo-loading__spark--4" />
        <Box className="lca-logo-loading__mark">
          <span className="lca-logo-loading__mark-glow" />
          <img
            className="lca-logo-loading__logo"
            src={ACADEMY_BRANDING.logoLightSrc || "/logo_light.svg"}
            alt=""
            style={{ height: `${dims.logoH}px`, width: "auto" }}
          />
        </Box>
      </Box>

      {showLabel ? (
        <VStack spacing={2.5} className="lca-logo-loading__caption">
          <Text
            className="lca-logo-loading__label"
            fontSize={dims.fontSize}
            fontWeight="700"
            color="#85652D"
            letterSpacing="0.16em"
            textTransform="uppercase"
          >
            {label}
            <span className="lca-logo-loading__dots" aria-hidden>
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </span>
          </Text>
          <Box className="lca-logo-loading__bar" aria-hidden>
            <span className="lca-logo-loading__bar-fill" />
            <span className="lca-logo-loading__bar-shine" />
          </Box>
        </VStack>
      ) : (
        <VisuallyHidden>Loading</VisuallyHidden>
      )}
    </VStack>
  );
}

export default LcaLogoLoading;
