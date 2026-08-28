import type { SVGProps } from "react";

export type IconName =
  | "arrow"
  | "building"
  | "check"
  | "clock"
  | "grid"
  | "history"
  | "receipt"
  | "shield"
  | "sparkles"
  | "user"
  | "wallet";

export function Icon({
  name,
  ...props
}: SVGProps<SVGSVGElement> & { name: IconName }) {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" {...props}>
      {name === "arrow" && (
        <path
          d="M5 12h14m-5-5 5 5-5 5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      )}
      {name === "building" && (
        <path
          d="M4 20h16M6 20V9l6-4 6 4v11M9 12h.01M12 12h.01M15 12h.01M9 16h.01M12 16h.01M15 16h.01"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      )}
      {name === "check" && (
        <path
          d="m6 12 4 4 8-9"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      )}
      {name === "clock" && (
        <>
          <circle
            cx="12"
            cy="12"
            r="8"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M12 8v4l2.5 1.5"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
        </>
      )}
      {name === "grid" && (
        <path
          d="M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="1.7"
        />
      )}
      {name === "history" && (
        <path
          d="M4.5 9A8 8 0 1 1 4 14m.5-5H9M4.5 9V4.5M12 8v4l3 2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      )}
      {name === "receipt" && (
        <path
          d="M7 3h10v18l-2.5-1.5L12 21l-2.5-1.5L7 21V3Zm3 5h4m-4 4h4m-4 4h2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      )}
      {name === "shield" && (
        <path
          d="M12 3 5.5 5.5v5.8c0 4.1 2.7 7.8 6.5 9.2 3.8-1.4 6.5-5.1 6.5-9.2V5.5L12 3Z"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      )}
      {name === "sparkles" && (
        <path
          d="m12 3 1.1 3.3L16.5 7.5l-3.4 1.2L12 12l-1.1-3.3-3.4-1.2 3.4-1.2L12 3Zm6 9 .7 2.1 2.3.9-2.3.8L18 18l-.7-2.2L15 15l2.3-.9L18 12ZM6 13l.9 2.6L9.5 16.5l-2.6.9L6 20l-.9-2.6-2.6-.9 2.6-.9L6 13Z"
          fill="currentColor"
        />
      )}
      {name === "user" && (
        <>
          <circle
            cx="12"
            cy="8"
            r="3.5"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M5.5 20c.7-4 3-6 6.5-6s5.8 2 6.5 6"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.8"
          />
        </>
      )}
      {name === "wallet" && (
        <path
          d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v14H6.5A2.5 2.5 0 0 1 4 16.5v-9ZM15 10h5v4h-5a2 2 0 1 1 0-4Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      )}
    </svg>
  );
}
