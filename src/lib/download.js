export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function safeFilename(title) {
  return (
    title
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-|-$/gi, "")
      .toLowerCase() || "report"
  );
}
