import React, { useState, useRef } from "react";
import { apiClient } from '../lib/ApiClient';

const ReportButton: React.FC<{ id: string }> = ({ id }) => {
    const [showReportMenu, setShowReportMenu] = useState(false);
    const [reportReason, setReportReason] = useState<string | null>(null);
    const reportMenuRef = useRef<HTMLDivElement | null>(null);
    const [reportDetails, setReportDetails] = useState("");

    const handleReport = async (reason: string, details?: string) => {
        if (!id) return;
        try {
            await apiClient.reportEvent(id, reason, details);
            alert("Report submitted. Thank you.");
        } catch (err) {
            console.error("Failed to report event:", err);
            alert("Failed to report event.");
        }
    };


    return (
        <div className="flex justify-end mt-4">
            <div ref={reportMenuRef} className="relative inline-block text-left">
                <button
                    className="p-2 rounded-full bg-gray-100 hover:bg-red-100 transition"
                    onClick={() => {
                        setShowReportMenu((prev) => !prev);
                        setReportReason(null);
                        setReportDetails("");
                    }}
                    title="Report event"
                >
                    <span className="text-red-600 text-xl">⚠️</span>Report
                </button>

                {showReportMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-white border rounded-lg shadow-lg z-50 p-3 space-y-2">
                        {!reportReason ? (
                            <>
                                <p className="text-sm font-medium text-gray-700">Report this event:</p>
                                {["SPAM", "INAPPROPRIATE", "HARASSMENT", "MISINFORMATION", "OTHER"].map(
                                    (reason) => (
                                        <button
                                            key={reason}
                                            onClick={() => setReportReason(reason)}
                                            className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-red-50 rounded"
                                        >
                                            {reason.charAt(0) + reason.slice(1).toLowerCase()}
                                        </button>
                                    )
                                )}
                            </>
                        ) : (
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleReport(reportReason, reportDetails);
                                    setShowReportMenu(false);
                                    setReportReason(null);
                                    setReportDetails("");
                                }}
                                className="space-y-2"
                            >
                                <p className="text-sm font-medium text-gray-700">
                                    {reportReason.charAt(0) + reportReason.slice(1).toLowerCase()}
                                </p>
                                <textarea
                                    value={reportDetails}
                                    onChange={(e) =>
                                        setReportDetails(e.target.value.slice(0, 100))
                                    }
                                    placeholder="Add details (optional)"
                                    maxLength={100}
                                    className="w-full border rounded-lg p-2 text-sm text-gray-700 resize-none focus:ring-2 focus:ring-red-400"
                                    rows={3}
                                />
                                <div className="flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setReportReason(null);
                                            setReportDetails("");
                                        }}
                                        className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-sm"
                                    >
                                        Back
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 text-sm"
                                    >
                                        Submit
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReportButton;
