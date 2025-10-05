import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { apiClient } from "../../lib/ApiClient";

export default function ReportReviewPage() {
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    apiClient.adminGetAllReports().then((res) => {
      setReports(res.data);
    });
  }, []);

  async function markReviewed(reportId: string, actionTaken: string) {
    await apiClient.adminReviewReport(reportId, actionTaken);
    setReports(
      reports.map((r) =>
        r.id === reportId
          ? { ...r, reviewedAt: new Date().toISOString(), actionTaken }
          : r
      )
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Report Review</h2>
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Reporter</th>
              <th className="p-2">Reported User</th>
              <th className="p-2">Reported Event</th>
              <th className="p-2">Reason</th>
              <th className="p-2">Details</th>
              <th className="p-2">Reviewed</th>
              <th className="p-2">Action Taken</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-2">{r.reporter?.username || r.reporter?.name}</td>
                <td className="p-2">{r.reportedUser?.username || "-"}</td>
                <td className="p-2">
                  {r.reportedEvent ? (
                    <a
                      href={`/events/${r.reportedEvent.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {r.reportedEvent.title}
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="p-2">{r.reason}</td>
                <td className="p-2">{r.details || "-"}</td>
                <td className="p-2">
                  {r.reviewedAt
                    ? new Date(r.reviewedAt).toLocaleString()
                    : "Pending"}
                </td>
                <td className="p-2">
                  {!r.reviewedAt && (
                    <select
                      className="border rounded p-1"
                      onChange={(e) => markReviewed(r.id, e.target.value)}
                    >
                      <option value="">Select action</option>
                      <option value="warned">Warned</option>
                      <option value="suspended">Suspended</option>
                      <option value="ignored">Ignored</option>
                    </select>
                  )}
                  {r.actionTaken && <span>{r.actionTaken}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
