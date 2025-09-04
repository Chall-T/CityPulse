export * from "./event";
export * from "./category";
export * from "./user";
export * from "./message";
export * from "./report";

export type UIState = {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
};