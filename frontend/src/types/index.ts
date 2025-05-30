export * from "./event";
export * from "./category";
export * from "./user";
export * from "./message";

export type UIState = {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
};