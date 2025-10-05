import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "../../lib/ApiClient";
import AdminLayout from "./AdminLayout";

type SortKey = "title" | "creator" | "dateTime" | "status";

export default function EventManagementPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("dateTime");
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => {
    apiClient.adminGetAllEvents().then((res) => {
      setEvents(res.data);
    });
  }, []);

  function sortBy(key: SortKey) {
    if (key === sortKey) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  const sortedEvents = [...events].sort((a, b) => {
    let aVal: any;
    let bVal: any;

    switch (sortKey) {
      case "title":
        aVal = a.title.toLowerCase();
        bVal = b.title.toLowerCase();
        break;
      case "creator":
        aVal = a.creator?.username?.toLowerCase() || "";
        bVal = b.creator?.username?.toLowerCase() || "";
        break;
      case "dateTime":
        aVal = new Date(a.dateTime).getTime();
        bVal = new Date(b.dateTime).getTime();
        break;
      case "status":
        aVal = a.status;
        bVal = b.status;
        break;
      default:
        aVal = "";
        bVal = "";
    }

    if (aVal < bVal) return sortAsc ? -1 : 1;
    if (aVal > bVal) return sortAsc ? 1 : -1;
    return 0;
  });

  async function deleteEvent(eventId: string) {
    if (!confirm("Are you sure you want to delete this event?")) return;
    await apiClient.adminDeleteEvent(eventId);
    setEvents(events.filter((e) => e.id !== eventId));
  }

  async function updateStatus(eventId: string, status: string) {
    await apiClient.adminUpdateEventStatus(eventId, status);
    setEvents(events.map((e) => (e.id === eventId ? { ...e, status } : e)));
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Event Management</h2>
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100 cursor-pointer">
              <th className="p-2" onClick={() => sortBy("title")}>Title</th>
              <th className="p-2" onClick={() => sortBy("creator")}>Creator</th>
              <th className="p-2" onClick={() => sortBy("dateTime")}>Date</th>
              <th className="p-2" onClick={() => sortBy("status")}>Status</th>
              <th className="p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {sortedEvents.map((e: any) => (
              <tr key={e.id} className="border-t">
                <td className="p-2 text-blue-600 hover:underline">
                  <Link to={`/events/${e.id}`}>{e.title}</Link>
                </td>
                <td className="p-2">{e.creator?.username || e.creator?.name}</td>
                <td className="p-2">{new Date(e.dateTime).toLocaleString()}</td>
                <td className="p-2">
                  <select
                    value={e.status}
                    onChange={(ev) => updateStatus(e.id, ev.target.value)}
                    className="border rounded p-1"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="CANCELED">CANCELED</option>
                  </select>
                </td>
                <td className="p-2">
                  <button
                    onClick={() => deleteEvent(e.id)}
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
