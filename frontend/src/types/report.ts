

export type Report = {
  id: string;
  reason: string;
  details?: string;
  reportedUser?: {
    id: string;
    username: string;
  };
  reportedEvent?: {
    id: string;
    title: string;
  };
  reviewedBy?: {
    id: string;
    username: string;
  };
};
