
import ReportReview from "./ReportReview";
import { useAuthStore } from "../../store/authStore";

export default function ModeratorPanelPage() {
  const user = useAuthStore(state => state.user);
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Moderator Panel</h1>
      {user && <ReportReview moderatorId={user.id} />}
    </div>
  );
}
