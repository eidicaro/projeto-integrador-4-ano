import { useEffect, useState } from "react";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const MOBILE_VIEWPORT_QUERY = "(max-width: 768px)";
const MOBILE_INTERACTION_QUERY = "(hover: none) and (pointer: coarse)";

function getConnection() {
  if (typeof navigator === "undefined") return null;

  return (
    navigator.connection ||
    navigator.mozConnection ||
    navigator.webkitConnection ||
    null
  );
}

function shouldEnableBackgroundVideo() {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return false;
  }

  const reducedMotion = window.matchMedia(
    REDUCED_MOTION_QUERY,
  ).matches;
  const mobileViewport = window.matchMedia(
    MOBILE_VIEWPORT_QUERY,
  ).matches;
  const mobileInteraction = window.matchMedia(
    MOBILE_INTERACTION_QUERY,
  ).matches;
  const saveData = getConnection()?.saveData === true;

  return (
    !reducedMotion &&
    !mobileViewport &&
    !mobileInteraction &&
    !saveData
  );
}

function subscribeToMediaQuery(mediaQuery, listener) {
  if (typeof mediaQuery.addEventListener === "function") {
    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }

  mediaQuery.addListener?.(listener);
  return () => mediaQuery.removeListener?.(listener);
}

export default function useBackgroundVideoEnabled() {
  const [enabled, setEnabled] = useState(
    shouldEnableBackgroundVideo,
  );

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return undefined;

    const reducedMotionQuery = window.matchMedia(
      REDUCED_MOTION_QUERY,
    );
    const mobileViewportQuery = window.matchMedia(
      MOBILE_VIEWPORT_QUERY,
    );
    const mobileInteractionQuery = window.matchMedia(
      MOBILE_INTERACTION_QUERY,
    );
    const connection = getConnection();

    function updatePreference() {
      setEnabled(shouldEnableBackgroundVideo());
    }

    const unsubscribeReducedMotion = subscribeToMediaQuery(
      reducedMotionQuery,
      updatePreference,
    );
    const unsubscribeMobileViewport = subscribeToMediaQuery(
      mobileViewportQuery,
      updatePreference,
    );
    const unsubscribeMobileInteraction = subscribeToMediaQuery(
      mobileInteractionQuery,
      updatePreference,
    );
    connection?.addEventListener?.("change", updatePreference);

    updatePreference();

    return () => {
      unsubscribeReducedMotion();
      unsubscribeMobileViewport();
      unsubscribeMobileInteraction();
      connection?.removeEventListener?.("change", updatePreference);
    };
  }, []);

  return enabled;
}
