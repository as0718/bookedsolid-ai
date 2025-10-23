// Time-off database management - API-backed
// Migrated from localStorage to Supabase/PostgreSQL

export interface TimeOffRequest {
  id: string;
  teamMemberId: string;
  startDate: string;
  endDate: string;
  reason: "SICK" | "VACATION" | "PERSONAL" | "FAMILY" | "OTHER";
  reasonDetails?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

// Get all time-off requests from database
export async function getTimeOffRequests(): Promise<TimeOffRequest[]> {
  try {
    const response = await fetch("/api/time-off", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch time-off requests:", response.statusText);
      return [];
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching time-off requests:", error);
    return [];
  }
}

// Create a new time-off request in database
export async function createTimeOffRequest(
  data: Omit<TimeOffRequest, "id" | "createdAt" | "status">
): Promise<TimeOffRequest | null> {
  try {
    const response = await fetch("/api/time-off", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Failed to create time-off request:", error);
      throw new Error(error.error || "Failed to create time-off request");
    }

    const newRequest = await response.json();
    return newRequest;
  } catch (error) {
    console.error("Error creating time-off request:", error);
    throw error;
  }
}

// Update a time-off request (approve/reject)
export async function updateTimeOffRequest(
  id: string,
  updates: {
    status?: "APPROVED" | "REJECTED";
    reviewedBy?: string;
  }
): Promise<TimeOffRequest | null> {
  try {
    const response = await fetch(`/api/time-off/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Failed to update time-off request:", error);
      return null;
    }

    const updatedRequest = await response.json();
    return updatedRequest;
  } catch (error) {
    console.error("Error updating time-off request:", error);
    return null;
  }
}

// Delete a time-off request (cancel)
export async function deleteTimeOffRequest(id: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/time-off/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Failed to delete time-off request:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error deleting time-off request:", error);
    return false;
  }
}

// Get requests for a specific team member
export async function getTimeOffRequestsByMember(teamMemberId: string): Promise<TimeOffRequest[]> {
  try {
    const response = await fetch(`/api/time-off?teamMemberId=${teamMemberId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch time-off requests:", response.statusText);
      return [];
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching time-off requests by member:", error);
    return [];
  }
}

// Get requests by status
export async function getTimeOffRequestsByStatus(
  status: "PENDING" | "APPROVED" | "REJECTED"
): Promise<TimeOffRequest[]> {
  try {
    const response = await fetch(`/api/time-off?status=${status}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch time-off requests:", response.statusText);
      return [];
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching time-off requests by status:", error);
    return [];
  }
}
