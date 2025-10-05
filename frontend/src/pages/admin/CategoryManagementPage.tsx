import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { apiClient } from "../../lib/ApiClient";

export default function CategoryManagementPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [newCategory, setNewCategory] = useState({ name: "", emoji: "" });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const res = await apiClient.adminGetCategories();
    setCategories(res.data);
  };

  const createCategory = async () => {
    if (!newCategory.name) return;
    await apiClient.adminCreateCategory(newCategory);
    setNewCategory({ name: "", emoji: "" });
    fetchCategories();
  };

  const updateCategory = async (id: string, name: string, emoji: string) => {
    await apiClient.adminUpdateCategory(id, { name, emoji });
    fetchCategories();
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    await apiClient.adminDeleteCategory(id);
    fetchCategories();
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Category Management</h2>

        {/* Create new category */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Name"
            value={newCategory.name}
            onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
            className="border rounded p-1"
          />
          <input
            type="text"
            placeholder="Emoji"
            value={newCategory.emoji}
            onChange={(e) => setNewCategory({ ...newCategory, emoji: e.target.value })}
            className="border rounded p-1 w-20"
          />
          <button
            onClick={createCategory}
            className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 transition"
          >
            Create
          </button>
        </div>

        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Name</th>
              <th className="p-2">Emoji</th>
              <th className="p-2">Active Events</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.id} className="border-t">
                <td className="p-2">
                  <input
                    type="text"
                    value={cat.name}
                    onChange={(e) => updateCategory(cat.id, e.target.value, cat.emoji)}
                    className="border rounded p-1 w-full"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="text"
                    value={cat.emoji || ""}
                    onChange={(e) => updateCategory(cat.id, cat.name, e.target.value)}
                    className="border rounded p-1 w-20"
                  />
                </td>
                <td className="p-2">{cat.activeEventCount || 0}</td>
                <td className="p-2 flex gap-2">
                  <button
                    onClick={() => deleteCategory(cat.id)}
                    className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 transition"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
