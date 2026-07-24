"use client";

import type { ComponentType } from "react";
import { JournalRoom } from "./JournalRoom";
import { StudyRoom } from "./StudyRoom";
import { TimeWheelRoom } from "./TimeWheelRoom";
import { getRoom, type RoomId, type RoomRenderer } from "./room-registry";

type RoomComponentProps = {
  onClose: () => void;
};

const roomRenderers: Partial<Record<RoomRenderer, ComponentType<RoomComponentProps>>> = {
  journal: JournalRoom,
  wheel: TimeWheelRoom,
  study: StudyRoom,
};

type WorldRoomOutletProps = {
  active: RoomId;
  onClose: () => void;
};

export function WorldRoomOutlet({ active, onClose }: WorldRoomOutletProps) {
  const room = getRoom(active);

  if (room.renderer === "native") return null;

  const RoomComponent = roomRenderers[room.renderer];
  if (RoomComponent) return <RoomComponent onClose={onClose} />;

  return (
    <section
      className={`world-room-preview room-${active}`}
      data-room-theme={room.theme}
      data-room-status={room.status}
      aria-live="polite"
    >
      <div className="world-room-card">
        <span className="world-room-seal">{room.icon}</span>
        <p>{room.english}</p>
        <h1>{room.name}</h1>
        <div className="world-room-rule" />
        <p className="world-room-description">{room.description}</p>
        <span className="world-room-status">房间正在布置中</span>
        <button type="button" onClick={onClose}>返回绯夜酒馆</button>
      </div>
    </section>
  );
}
