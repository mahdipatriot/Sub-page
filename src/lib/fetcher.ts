export const fetcher = async (url: string) => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();

  // Extract headers for /info endpoint (announce and support-url headers)
  if (url.includes('/info')) {
    const headers: Record<string, string> = {};

    // Extract announce, announce-url, and support-url headers
    // Check for case variations - HTTP headers are case-insensitive but we check common variations
    const announce = response.headers.get('announce') ||
                     response.headers.get('Announce') ||
                     response.headers.get('ANNOUNCE');
    const announceUrl = response.headers.get('announce-url') ||
                        response.headers.get('Announce-Url') ||
                        response.headers.get('ANNOUNCE-URL');
    const supportUrl = response.headers.get('support-url') ||
                       response.headers.get('Support-Url') ||
                       response.headers.get('SUPPORT-URL');

    if (announce) {
      headers['announce'] = announce;
    }
    if (announceUrl) {
      headers['announce-url'] = announceUrl;
    }
    if (supportUrl) {
      headers['support-url'] = supportUrl;
    }

    // Always return headers object, even if empty, so the structure is consistent
    return { data, headers };
  }

  return data;
};

export const getBaseUrl = () => {
  return import.meta.env.VITE_PANEL_DOMAIN || window.location.origin;
};

/**
 * API address for this subscription page, e.g. apiUrl('info') ->
 * https://panel.example.com/sub/TOKEN/info. Joins with exactly one slash,
 * so a page path ending in "/" never produces "//info".
 */
export const apiUrl = (endpoint: string) => {
  const path = window.location.pathname.replace(/\/+$/, '');
  return `${getBaseUrl()}${path}/${endpoint}`;
};

