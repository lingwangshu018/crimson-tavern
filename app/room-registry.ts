export const roomRegistry = [
  {
    id: "tavern",
    icon: "杯",
    name: "绯夜酒馆",
    english: "THE CRIMSON TAVERN",
    description: "今夜点单、调酒档案与随杯手记",
    status: "ready",
  },
  {
    id: "cafe",
    icon: "啡",
    name: "绯昼咖啡馆",
    english: "THE CRIMSON CAFE",
    description: "留给白昼、咖啡与轻声交谈的房间",
    status: "planned",
  },
  {
    id: "journal",
    icon: "记",
    name: "日记本",
    english: "THE PRIVATE JOURNAL",
    description: "把散落的片刻收进只属于你的书页",
    status: "ready",
  },
  {
    id: "wheel",
    icon: "轮",
    name: "时光之轮",
    english: "THE WHEEL OF TIME",
    description: "沿时间回望故事、选择与留下的痕迹",
    status: "ready",
  },
  {
    id: "study",
    icon: "习",
    name: "自习室",
    english: "THE STUDY ROOMS",
    description: "在静谧与柔软之间，选择今晚的书桌",
    status: "ready",
  },
] as const;

export type RoomDefinition = (typeof roomRegistry)[number];
export type RoomId = RoomDefinition["id"];

export function getRoom(id: RoomId): RoomDefinition {
  return roomRegistry.find((room) => room.id === id) ?? roomRegistry[0];
}
