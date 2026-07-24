"use client";

import type { ComponentType } from "react";
import { JournalRoom } from "./JournalRoom";
import { StudyRoom } from "./StudyRoom";
import { TimeWheelRoom } from "./TimeWheelRoom";
import { getRoom, type RoomId } from "./room-registry";

type RoomComponentProps = {
  onClose: () => void;
};

const roomComponents: Partial<Record<RoomId, ComponentType<RoomComponentProps>>> = {
  journal: JournalRoom,
  wheel: TimeWheelRoom,
  study: StudyRoom,
};

type WorldRoomOutletProps = {
  active: RoomId;
  onClose: () => void;
};

export function WorldRoomOutlet({ active, onClose }: WorldRoomOutletProps) {
  if (active === "tavern") return null;

  const RoomComponent = roomComponents[active];
  if (RoomComponent) return <RoomComponent onClose={onClose} />;

  const room = getRoom(active);

  return (
    <section className={`world-room-preview room-${active}`} aria-live="polite">
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
