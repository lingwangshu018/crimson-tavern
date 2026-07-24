import type { RoomId } from "./room-registry";

type RoomIconProps = {
  roomId: RoomId;
};

const common = {
  viewBox: "0 0 48 48",
  width: "1em",
  height: "1em",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: false,
};

export function RoomIcon({ roomId }: RoomIconProps) {
  if (roomId === "tavern") {
    return (
      <svg {...common}>
        <path d="M12 16h21v11a9 9 0 0 1-9 9h-3a9 9 0 0 1-9-9V16Z" />
        <path d="M33 19h3a5 5 0 0 1 0 10h-3" />
        <path d="M16 12c1.8-2 4.2-2 6 0s4.2 2 6 0" />
      </svg>
    );
  }

  if (roomId === "cafe") {
    return (
      <svg {...common}>
        <path d="M11 18h22v10a8 8 0 0 1-8 8h-6a8 8 0 0 1-8-8V18Z" />
        <path d="M33 21h3a4 4 0 0 1 0 8h-3" />
        <path d="M17 13c-2-2 2-3 0-6M24 13c-2-2 2-3 0-6M31 13c-2-2 2-3 0-6" />
      </svg>
    );
  }

  if (roomId === "journal") {
    return (
      <svg {...common}>
        <path d="M9 12h12a7 7 0 0 1 7 7v18H16a7 7 0 0 0-7 3V12Z" />
        <path d="M39 12H27a7 7 0 0 0-7 7v18h12a7 7 0 0 1 7 3V12Z" />
        <path d="M15 19h7M15 25h7M33 19h-7M33 25h-7" opacity="0.75" />
      </svg>
    );
  }

  if (roomId === "wheel") {
    return (
      <svg {...common}>
        <circle cx="24" cy="24" r="16" />
        <circle cx="24" cy="24" r="3" fill="currentColor" stroke="none" />
        <path d="M24 12v4M24 32v4M12 24h4M32 24h4" />
        <path d="M24 24l6-7M24 24l-5 5" strokeWidth="2.8" />
        <path d="M17 14.5l2 3M31 14.5l-2 3M33.5 31l-3-2M14.5 31l3-2" strokeWidth="1.8" opacity="0.8" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M10 15h28v21H10z" />
      <path d="M15 15v-3h18v3M15 22h18M20 22v14M28 22v14" />
      <path d="M14 40h20" />
    </svg>
  );
}
