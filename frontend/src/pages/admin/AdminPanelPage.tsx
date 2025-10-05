import AdminLayout from "./AdminLayout";
import UserManagement from "./UserManagmentPage";

export default function AdminPanelPage() {
  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-4">User Management</h1>
      <UserManagement />
    </AdminLayout>
  );
}
