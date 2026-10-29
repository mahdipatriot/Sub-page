// P5.11: Helper to read initial data embedded as a non-executable
// <script type="application/json" id="initial-data"> tag in index.html.
// This replaces the previous pattern of setting window.__INITIAL_DATA__
// via an inline executable <script>, which required 'unsafe-inline' in
// the CSP script-src directive. By reading from a JSON script tag, the
// CSP can disallow inline scripts entirely.
import type { InitialData } from "@/types/global";

const INITIAL_DATA_ELEMENT_ID = "initial-data";

/**
 * Read and parse the initial data embedded in the index.html template.
 *
 * The data is rendered server-side (Jinja2) into a
 * `<script type="application/json" id="initial-data">` tag. This function
 * reads the text content of that tag and parses it as JSON. Returns an
 * empty object if the tag is missing or the JSON is invalid.
 *
 * The result is cached after the first call so repeated reads don't
 * re-parse the same JSON.
 */
let _cached: InitialData | null = null;

export function getInitialData(): InitialData {
  if (_cached !== null) {
    return _cached;
  }
  if (typeof document === "undefined") {
    _cached = {};
    return _cached;
  }
  const el = document.getElementById(INITIAL_DATA_ELEMENT_ID);
  if (!el || !el.textContent) {
    _cached = {};
    return _cached;
  }
  try {
    _cached = JSON.parse(el.textContent) as InitialData;
  } catch {
    console.warn("Failed to parse initial data from #initial-data script tag");
    _cached = {};
  }
  return _cached;
}
