// The subscription URL is the page's own address (minus a trailing /info).
// Clients fetch this URL to get the user's configs.
export function getSubscriptionUrl(): string {
  if (typeof window === "undefined") return "";
  const path = window.location.pathname.replace(/\/info$/, "");
  return `${window.location.origin}${path}`;
}
