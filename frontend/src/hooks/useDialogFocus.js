import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

const dialogStack = [];

function setLayerState(entry, isTopLayer) {
  const root = entry.root;

  if (!root) return;

  root.dataset.dialogLayer = isTopLayer ? "top" : "background";

  if (isTopLayer) {
    if (entry.originalAriaHidden === null) {
      root.removeAttribute("aria-hidden");
    } else {
      root.setAttribute("aria-hidden", entry.originalAriaHidden);
    }

    if (!entry.originalInert) root.removeAttribute("inert");
    return;
  }

  root.setAttribute("inert", "");
  root.setAttribute("aria-hidden", "true");
}

function syncDialogLayers() {
  const topEntry = dialogStack.at(-1);

  dialogStack.forEach((entry) => {
    setLayerState(entry, entry === topEntry);
  });
}

function restoreRootAttributes(entry) {
  const root = entry.root;

  if (!root) return;

  delete root.dataset.dialogLayer;

  if (entry.originalAriaHidden === null) {
    root.removeAttribute("aria-hidden");
  } else {
    root.setAttribute("aria-hidden", entry.originalAriaHidden);
  }

  if (entry.originalInert) root.setAttribute("inert", "");
  else root.removeAttribute("inert");
}

export default function useDialogFocus({
  active,
  containerRef,
  initialFocusRef,
  onClose,
  rootRef,
}) {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!active) return undefined;

    const previouslyFocused = document.activeElement;
    const root = rootRef?.current || containerRef.current;
    const entry = {
      root,
      originalAriaHidden: root?.getAttribute("aria-hidden") ?? null,
      originalInert: root?.hasAttribute("inert") ?? false,
    };

    dialogStack.push(entry);
    (initialFocusRef?.current || containerRef.current)?.focus();
    syncDialogLayers();

    const focusFrame = window.requestAnimationFrame(() => {
      if (dialogStack.at(-1) === entry) {
        (initialFocusRef?.current || containerRef.current)?.focus();
      }
    });

    function handleKeyDown(event) {
      if (dialogStack.at(-1) !== entry) return;

      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current?.();
        return;
      }

      if (event.key !== "Tab" || !containerRef.current) return;

      const focusableElements = Array.from(
        containerRef.current.querySelectorAll(FOCUSABLE_SELECTOR),
      );

      if (focusableElements.length === 0) {
        event.preventDefault();
        containerRef.current.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements.at(-1);
      const focusIsInside = containerRef.current.contains(
        document.activeElement,
      );

      if (
        event.shiftKey &&
        (!focusIsInside || document.activeElement === firstElement)
      ) {
        event.preventDefault();
        lastElement.focus();
      } else if (
        !event.shiftKey &&
        (!focusIsInside || document.activeElement === lastElement)
      ) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      const wasTopLayer = dialogStack.at(-1) === entry;

      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);

      const entryIndex = dialogStack.indexOf(entry);

      if (entryIndex >= 0) dialogStack.splice(entryIndex, 1);
      restoreRootAttributes(entry);
      syncDialogLayers();

      if (
        wasTopLayer &&
        previouslyFocused instanceof HTMLElement &&
        previouslyFocused.isConnected
      ) {
        previouslyFocused.focus();
      }
    };
  }, [active, containerRef, initialFocusRef, rootRef]);
}
