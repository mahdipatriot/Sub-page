/**
 * The brand's signal arcs, small, in front of section headings: a quiet thread
 * from the logo and the status card down through the rest of the page.
 */
export function SectionMark() {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
      className="size-4 shrink-0 text-primary/70"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
    >
      <circle cx="3" cy="13" r="1.6" fill="currentColor" stroke="none" />
      <path d="M3 8.5a4.5 4.5 0 0 1 4.5 4.5" />
      <path d="M3 4.5A8.5 8.5 0 0 1 11.5 13" />
      <path d="M3 0.8A12.2 12.2 0 0 1 15.2 13" opacity="0.6" />
    </svg>
  );
}
