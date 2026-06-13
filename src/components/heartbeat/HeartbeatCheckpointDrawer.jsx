function _nullishCoalesce(lhs, rhsFn) {
  if (lhs != null) {
    return lhs;
  } else {
    return rhsFn();
  }
}
function _optionalChain(ops) {
  let lastAccessLHS = undefined;
  let value = ops[0];
  let i = 1;
  while (i < ops.length) {
    const op = ops[i];
    const fn = ops[i + 1];
    i += 2;
    if ((op === "optionalAccess" || op === "optionalCall") && value == null) {
      return undefined;
    }
    if (op === "access" || op === "optionalAccess") {
      lastAccessLHS = value;
      value = fn(value);
    } else if (op === "call" || op === "optionalCall") {
      value = fn((...args) => value.call(lastAccessLHS, ...args));
      lastAccessLHS = undefined;
    }
  }
  return value;
}
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const PING_INTERVAL_OPTIONS = [
  { value: "", label: "Choose an option" },
  { value: "1", label: "Every 1 minute" },
  { value: "5", label: "Every 5 minutes" },
  { value: "15", label: "Every 15 minutes" },
  { value: "30", label: "Every 30 minutes" },
  { value: "60", label: "Every 60 minutes" },
];

const defaultFormData = {
  status: false,
  url: "",
  pingInterval: "",
  responseTimeNotification: false,
  downtimeNotification: false,
};

export default function HeartbeatCheckpointDrawer({
  open,
  onClose,
  initialData,
  onSave,
}) {
  const [status, setStatus] = useState(defaultFormData.status);
  const [url, setUrl] = useState(defaultFormData.url);
  const [pingInterval, setPingInterval] = useState(
    defaultFormData.pingInterval,
  );
  const [responseTimeNotification, setResponseTimeNotification] = useState(
    defaultFormData.responseTimeNotification,
  );
  const [downtimeNotification, setDowntimeNotification] = useState(
    defaultFormData.downtimeNotification,
  );

  useEffect(() => {
    if (open) {
      setStatus(
        _nullishCoalesce(
          _optionalChain([initialData, "optionalAccess", (_) => _.status]),
          () => defaultFormData.status,
        ),
      );
      setUrl(
        _nullishCoalesce(
          _optionalChain([initialData, "optionalAccess", (_2) => _2.url]),
          () => defaultFormData.url,
        ),
      );
      setPingInterval(
        _nullishCoalesce(
          _optionalChain([
            initialData,
            "optionalAccess",
            (_3) => _3.pingInterval,
          ]),
          () => defaultFormData.pingInterval,
        ),
      );
      setResponseTimeNotification(
        _nullishCoalesce(
          _optionalChain([
            initialData,
            "optionalAccess",
            (_4) => _4.responseTimeNotification,
          ]),
          () => defaultFormData.responseTimeNotification,
        ),
      );
      setDowntimeNotification(
        _nullishCoalesce(
          _optionalChain([
            initialData,
            "optionalAccess",
            (_5) => _5.downtimeNotification,
          ]),
          () => defaultFormData.downtimeNotification,
        ),
      );
    }
  }, [open, initialData]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const handleSave = () => {
    _optionalChain([
      onSave,
      "optionalCall",
      (_6) =>
        _6({
          status,
          url,
          pingInterval,
          responseTimeNotification,
          downtimeNotification,
        }),
    ]);
    onClose();
  };

  if (!open) return null;

  const DRAWER_Z_BACKDROP = 1065;
  const DRAWER_Z_PANEL = 1070;

  const drawerContent = (
    <React.Fragment>
      <div
        className="position-fixed top-0 start-0 end-0 bottom-0 bg-dark bg-opacity-25"
        style={{ zIndex: DRAWER_Z_BACKDROP }}
        aria-hidden={true}
        onClick={onClose}
      />
      {
        <div
          className="position-fixed top-0 end-0 bottom-0 bg-white shadow overflow-auto d-flex flex-column"
          style={{
            zIndex: DRAWER_Z_PANEL,
            width: "min(100%, 480px)",
            maxWidth: "480px",
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="heartbeat-checkpoint-drawer-title"
        >
          {
            <div className="border-bottom border-secondary border-opacity-25 px-4 py-3 flex-shrink-0">
              <div className="d-flex align-items-center gap-3">
                <button
                  type="button"
                  className="btn btn-icon btn-sm btn-light border border-secondary border-opacity-25 rounded-2"
                  onClick={onClose}
                  title="Close"
                  aria-label="Close"
                >
                  <i
                    className="isax isax-close-circle text-body"
                    aria-hidden={true}
                  />
                </button>
                <h5
                  className="mb-0 fw-semibold text-body"
                  id="heartbeat-checkpoint-drawer-title"
                >
                  Heartbeat
                </h5>
              </div>
            </div>

            /* Content - Checkpoint information */
          }
          {
            <div className="flex-grow-1 overflow-auto px-4 py-4">
              <h6 className="fw-semibold text-body mb-4">
                Checkpoint information
              </h6>
              <div className="mb-4">
                <label className="form-label text-body fw-medium fs-13">
                  Status
                </label>
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    id="heartbeat-status"
                    checked={status}
                    onChange={(e) => setStatus(e.target.checked)}
                  />
                  <label
                    className="form-check-label fs-13 text-muted"
                    htmlFor="heartbeat-status"
                  >
                    Should we check the page's current status?
                  </label>
                </div>
              </div>
              <div className="mb-4">
                <label
                  className="form-label text-body fw-medium fs-13"
                  htmlFor="heartbeat-url"
                >
                  {"URL "}
                  <span className="text-danger">*</span>
                </label>
                <input
                  type="url"
                  className="form-control form-control-sm rounded-2"
                  id="heartbeat-url"
                  placeholder="URL"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
                <div className="form-text fs-12">
                  Enter the full URL (eg. http://www.mydomain.com)
                </div>
              </div>
              <div className="mb-4">
                <label
                  className="form-label text-body fw-medium fs-13"
                  htmlFor="heartbeat-ping"
                >
                  {"Ping intervals "}
                  <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select form-select-sm rounded-2"
                  id="heartbeat-ping"
                  value={pingInterval}
                  onChange={(e) => setPingInterval(e.target.value)}
                >
                  {PING_INTERVAL_OPTIONS.map((opt) => (
                    <option key={opt.value || "empty"} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="form-label text-body fw-medium fs-13">
                  Response time notification
                </label>
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    id="heartbeat-response-time"
                    checked={responseTimeNotification}
                    onChange={(e) =>
                      setResponseTimeNotification(e.target.checked)
                    }
                  />
                  <label
                    className="form-check-label fs-13 text-muted"
                    htmlFor="heartbeat-response-time"
                  >
                    Send an email if the site is slow to respond
                  </label>
                </div>
              </div>
              <div className="mb-0">
                <label className="form-label text-body fw-medium fs-13">
                  Downtime notification
                </label>
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    id="heartbeat-downtime"
                    checked={downtimeNotification}
                    onChange={(e) => setDowntimeNotification(e.target.checked)}
                  />
                  <label
                    className="form-check-label fs-13 text-muted"
                    htmlFor="heartbeat-downtime"
                  >
                    Send an email if the site is down
                  </label>
                </div>
              </div>
            </div>

            /* Footer */
          }
          <div className="border-top border-secondary border-opacity-25 px-4 py-3 flex-shrink-0 bg-body-tertiary bg-opacity-25">
            <div className="d-flex justify-content-end">
              <button
                type="button"
                className="btn btn-primary rounded-2"
                onClick={handleSave}
              >
                Save
              </button>
            </div>
          </div>
        </div>

        /* Header */
      }
    </React.Fragment>
  );

  return typeof document !== "undefined"
    ? createPortal(drawerContent, document.body)
    : null;
}
