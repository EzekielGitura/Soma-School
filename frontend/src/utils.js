export function formToObject(form) {
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());
  const streamIds = formData.getAll("streamIds");
  if (streamIds.length) data.streamIds = streamIds;
  return data;
}

export function fullName(student) {
  return `${student.firstName} ${student.lastName}`;
}

export function formatScore(value) {
  return Number(value || 0).toLocaleString("en-KE", {
    maximumFractionDigits: 2,
  });
}

export function formatDate(value) {
  if (!value) return "Not provided";
  return new Intl.DateTimeFormat("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function classNames(...values) {
  return values.filter(Boolean).join(" ");
}
