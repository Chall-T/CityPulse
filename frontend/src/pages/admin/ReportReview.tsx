import { useEffect, useState } from "react";
import type { Report } from "../../types";
import { apiClient } from '../../lib/ApiClient';

export default function ReportReview({ moderatorId }: { moderatorId: string }) {
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    apiClient.adminReportedContent().then(response => {
      setReports(response.data);
    });
  }, []);

  async function markReviewed(reportId: string, action: string) {
    await apiClient.adminTakeActionOnReport(reportId, moderatorId, action);
    setReports(reports.filter(r => r.id !== reportId));
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Reports</h2>
      {reports.length === 0 && <p>No pending reports 🎉</p>}
      {reports.map((r: any) => (
        <div key={r.id} className="border rounded p-4 mb-3">
          <p><strong>Reason:</strong> {r.reason}</p>
          {r.details && <p><strong>Details:</strong> {r.details}</p>}
          {r.reportedUser && <p><strong>User:</strong> {r.reportedUser.username}</p>}
          {r.reportedEvent && <p><strong>Event:</strong> {r.reportedEvent.title}</p>}
          <button
            onClick={() => markReviewed(r.id, "warned")}
            className="px-3 py-1 bg-yellow-100 rounded mr-2"
          >
            Warn
          </button>
          <button
            onClick={() => markReviewed(r.id, "suspended")}
            className="px-3 py-1 bg-red-100 rounded"
          >
            Suspend
          </button>
        </div>
      ))}
    </div>
  );
}
