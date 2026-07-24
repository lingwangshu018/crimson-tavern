"use client";

import { getVisibleRooms, type RoomDefinition, type RoomId } from "./room-registry";

type WorldMapProps = {
  open: boolean;
  active: RoomId;
  onClose: () => void;
  onSelect: (room: RoomDefinition) => void;
};

function MapBuildingIcon({ room }: { room: RoomDefinition }) {
  if (room.id !== "wheel") return <>{room.icon}</>;

  return (
    <svg
      viewBox="0 0 48 48"
      width="1em"
      height="1em"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="24" cy="24" r="16" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <circle cx="24" cy="24" r="3" fill="currentColor" />
      <path d="M24 12v4M24 32v4M12 24h4M32 24h4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M24 24l6-7M24 24l-5 5" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 14.5l2 3M31 14.5l-2 3M33.5 31l-3-2M14.5 31l3-2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.8" />
    </svg>
  );
}

export function WorldMap({ open, active, onClose, onSelect }: WorldMapProps) {
  const rooms = getVisibleRooms();

  return (
    <section className={`world-map-shell ${open ? "is-open" : ""}`} aria-hidden={!open} aria-label="绯界地图">
      <div className="world-map-head">
        <div>
          <p>CRIMSON WORLD ATLAS</p>
          <h2>绯界地图</h2>
        </div>
        <button type="button" aria-label="关闭绯界地图" onClick={onClose}>×</button>
      </div>

      <div className="world-map-canvas" role="navigation" aria-label="绯界建筑">
        <div className="world-map-moon" aria-hidden="true">☾</div>
        <div className="world-map-road road-vertical" aria-hidden="true" />
        <div className="world-map-road road-horizontal" aria-hidden="true" />

        {rooms.map((room) => (
          <button
            className={`world-map-node theme-${room.theme} ${active === room.id ? "is-active" : ""} ${room.status === "planned" ? "is-planned" : ""}`}
            style={{ left: `${room.map.x}%`, top: `${room.map.y}%` }}
            type="button"
            key={room.id}
            onClick={() => onSelect(room)}
            aria-label={`${room.name}${room.status === "planned" ? "，布置中" : ""}`}
          >
            <span className="world-map-building"><MapBuildingIcon room={room} /></span>
            <span className="world-map-label"><strong>{room.name}</strong><small>{room.status === "ready" ? "可进入" : "布置中"}</small></span>
          </button>
        ))}
      </div>

      <footer className="world-map-legend">
        <span><i className="is-ready" /> 已开放</span>
        <span><i className="is-planned" /> 布置中</span>
        <em>地图位置由房间注册表自动生成</em>
      </footer>
    </section>
  );
}
