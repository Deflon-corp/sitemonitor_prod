import React from "react";
import { QA_EMPTY } from "./qaConstants";

export function QaTableStatusRow({ colSpan, loading, error, isEmpty, loadingMessage = "Loading…", emptyMessage = QA_EMPTY.noResults }) {
  if (loading) {
    return (
      <tr>
        <td colSpan={colSpan} className="text-center py-5 text-muted">
          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
          {loadingMessage}
        </td>
      </tr>
    );
  }
  if (error) {
    return (
      <tr>
        <td colSpan={colSpan} className="text-center py-5 text-danger">
          {error}
        </td>
      </tr>
    );
  }
  if (isEmpty) {
    return (
      <tr>
        <td colSpan={colSpan} className="text-center py-5 text-muted">
          {emptyMessage}
        </td>
      </tr>
    );
  }
  return null;
}

export function QaPanelEmpty({ title, message, icon = "isax-document-text" }) {
  return (
    <div className="card border border-secondary border-opacity-25 rounded-3 shadow-sm">
      <div className="card-body text-center py-5 text-muted">
        <i className={`isax ${icon} fs-32 mb-3 d-block opacity-50`} aria-hidden="true" />
        {title && <h6 className="text-body fw-semibold mb-2">{title}</h6>}
        <p className="fs-13 mb-0 mx-auto" style={{ maxWidth: 420 }}>
          {message}
        </p>
      </div>
    </div>
  );
}
