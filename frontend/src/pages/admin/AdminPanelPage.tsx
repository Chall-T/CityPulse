
import UserManagement from "./UserManagmentPage";

export default function AdminPanelPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>
      <UserManagement />
    </div>
  );
}
