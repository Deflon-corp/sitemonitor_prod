import React, { useState, useEffect } from "react";

export default function SuggestionsDrawer({ open, onClose }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  // Simple close
  const handleClose = () => {
    onClose();
  };

  // Close and reset form
  const handleCloseAndReset = () => {
    setName("");
    setEmail("");
    setMessage("");
    setSubmitted(false);
    onClose();
  };

  // Reset form when drawer opens
  useEffect(() => {
    if (!open) return;
    setName("");
    setEmail("");
    setMessage("");
    setSubmitted(false);
  }, [open]);

  // Escape key handler + body scroll lock
  useEffect(() => {
    if (!open) return;

    const handleEscape = (e) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null; // Optional: early return when closed

  return (
    <>
      {/* Backdrop */}
      <div
        className="suggestions-drawer-backdrop"
        aria-hidden={!open}
        onClick={handleClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 1050,
          opacity: open ? 1 : 0,
          visibility: open ? "visible" : "hidden",
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.3s ease, visibility 0.3s ease",
        }}
      />

      {/* Drawer Panel */}
      <div
        className="suggestions-drawer-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="suggestions-drawer-title"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: "100%",
          maxWidth: "440px",
          height: "100%",
          backgroundColor: "#f8f9fa",
          boxShadow: "-4px 0 24px rgba(0, 0, 0, 0.12)",
          zIndex: 1051,
          overflowY: "auto",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s ease",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div className="d-flex align-items-center gap-3 p-4 border-bottom bg-white">
          <button
            type="button"
            className="btn btn-link p-0 text-body d-flex align-items-center justify-content-center"
            onClick={handleClose}
            aria-label="Close"
            style={{ minWidth: 32, minHeight: 32 }}
          >
            <i className="isax isax-close-circle fs-4" />
          </button>
          <h5
            className="mb-0 fw-semibold text-body"
            id="suggestions-drawer-title"
          >
            Suggestions and Ideas
          </h5>
        </div>

        {/* Content Area */}
        <div className="p-4 flex-grow-1">
          {submitted ? (
            <div
              className="alert alert-success d-flex align-items-center mb-0 rounded-3"
              role="alert"
            >
              <i className="isax isax-tick-circle me-2 fs-5" />
              <span>
                Thank you! Your suggestion has been submitted successfully.
              </span>
            </div>
          ) : (
            <div
              className="bg-white rounded-3 shadow-sm p-4"
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
            >
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label
                    className="form-label text-body fw-medium"
                    htmlFor="suggestion-drawer-name"
                  >
                    Name*
                  </label>
                  <input
                    id="suggestion-drawer-name"
                    className="form-control border"
                    placeholder="Your name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label
                    className="form-label text-body fw-medium"
                    htmlFor="suggestion-drawer-email"
                  >
                    Email*
                  </label>
                  <input
                    id="suggestion-drawer-email"
                    className="form-control border"
                    placeholder="Your email address"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label
                    className="form-label text-body fw-medium"
                    htmlFor="suggestion-drawer-message"
                  >
                    Message*
                  </label>
                  <textarea
                    id="suggestion-drawer-message"
                    className="form-control border"
                    placeholder="Your message"
                    rows={10}
                    style={{
                      minHeight: "220px",
                      width: "100%",
                      resize: "vertical",
                    }}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                  />
                </div>

                <div className="d-flex gap-2 justify-content-end pt-2">
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={handleClose}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn bg-primary-gradient text-white"
                  >
                    Submit
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Footer - Shown only after successful submission */}
        {submitted && (
          <div className="border-top p-4 bg-white">
            <button
              type="button"
              className="btn btn-primary w-100"
              onClick={handleCloseAndReset}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </>
  );
}
