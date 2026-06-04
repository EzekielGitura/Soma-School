const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? "https://soma-school-backend.vercel.app/api"
    : "http://localhost:4000/api");

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: "Request failed.",
    }));
    throw new Error(error.message || "Request failed.");
  }

  if (response.status === 204) return null;
  return response.json();
}

export function pdfUrl(path) {
  return `${API_URL}${path}`;
}

export async function downloadPdf(path, fileName) {
  const response = await fetch(pdfUrl(path));
  if (!response.ok) throw new Error("PDF download failed.");

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
