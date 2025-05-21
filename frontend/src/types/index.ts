export * from "./event";
export * from "./category";
export * from "./user";

export type UIState = {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
};