import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import useDialogFocus from "../../hooks/useDialogFocus";

export default function TalentDialog({
  title,
  children,
  onClose,
  variant = "",
}) {
  const ref = useRef(null);
  const closeRef = useRef(null);
  const titleId = useId();
  useEffect(() => {
    const previous = document.body.style.overflow;
    const app = document.getElementById("root");
    const wasInert = app?.hasAttribute("inert");
    document.body.style.overflow = "hidden";
    app?.setAttribute("inert", "");
    return () => {
      document.body.style.overflow = previous;
      if (!wasInert) app?.removeAttribute("inert");
    };
  }, []);
  useDialogFocus({
    active: true,
    containerRef: ref,
    initialFocusRef: closeRef,
    onClose,
  });
  return createPortal(
    <div
      className={`talent-overlay ${variant}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="talent-dialog"
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header>
          <h2 id={titleId}>{title}</h2>
          <button
            ref={closeRef}
            type="button"
            className="talent-icon-button"
            aria-label="Fechar painel"
            onClick={onClose}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </header>
        <div className="talent-dialog__body">{children}</div>
      </section>
    </div>,
    document.body,
  );
}
