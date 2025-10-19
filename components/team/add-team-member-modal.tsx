"use client";

import { useState } from "react";

interface AddTeamMemberModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddTeamMemberModal({ onClose, onSuccess }: AddTeamMemberModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("barber");
  const [permissions, setPermissions] = useState("view_only");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [invitationUrl, setInvitationUrl] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role, permissions }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send invitation");
        setLoading(false);
        return;
      }

      // Show invitation URL
      setInvitationUrl(data.invitation.invitationUrl);

      // Wait a moment before closing to show the URL
      setTimeout(() => {
        onSuccess();
      }, 3000);
    } catch (err) {
      console.error("Error sending invitation:", err);
      setError("Failed to send invitation");
      setLoading(false);
    }
  };

  const copyInvitationLink = () => {
    if (invitationUrl) {
      navigator.clipboard.writeText(invitationUrl);
      alert("Invitation link copied to clipboard!");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Add Team Member</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {invitationUrl ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium mb-2">Invitation sent successfully!</p>
              <p className="text-sm text-green-700">
                Share this link with your team member:
              </p>
              <div className="mt-2 flex items-center space-x-2">
                <input
                  type="text"
                  value={invitationUrl}
                  readOnly
                  className="flex-1 px-3 py-2 border border-green-300 rounded text-sm"
                />
                <button
                  onClick={copyInvitationLink}
                  className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                >
                  Copy
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              This window will close automatically...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="team@example.com"
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="barber">Barber</option>
                <option value="stylist">Stylist</option>
                <option value="manager">Manager</option>
                <option value="assistant">Assistant</option>
              </select>
            </div>

            <div>
              <label htmlFor="permissions" className="block text-sm font-medium text-gray-700 mb-1">
                Access Level
              </label>
              <select
                id="permissions"
                value={permissions}
                onChange={(e) => setPermissions(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="view_only">View Only</option>
                <option value="full_access">Full Access</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                {permissions === "view_only"
                  ? "Can view schedules and client info, but cannot edit"
                  : "Can view and edit schedules, appointments, and client info"}
              </p>
            </div>

            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                {permissions === "view_only" ? "View Only Permissions:" : "Full Access Permissions:"}
              </h3>
              <ul className="text-xs text-gray-600 space-y-1">
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  View full business schedule
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  View all client profiles
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Access business analytics
                </li>
                {permissions === "full_access" && (
                  <>
                    <li className="flex items-center">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Create and edit appointments
                    </li>
                    <li className="flex items-center">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Modify client information
                    </li>
                  </>
                )}
              </ul>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send Invitation"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
