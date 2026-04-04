export type LifecycleStatus =
    | "searching"
    | "matched"
    | "pending"
    | "accepted"
    | "in_session"
    | "completed"
    | "cancelled"
    | "declined";

export function getLifecycleStatus(
    requestStatus?: string,
    nominationStatus?: string
): LifecycleStatus {
    if (nominationStatus === "declined") {
        return "declined";
    }

    switch (requestStatus) {
        case "open":
            return "searching";
        case "nominated":
            return "matched";
        case "accepted":
            return "accepted";
        case "in_call":
            return "in_session";
        case "completed":
            return "completed";
        case "cancelled":
        case "expired":
        case "timed_out":
        case "missed":
            return "cancelled";
        default:
            return "pending";
    }
}

export function getLifecycleStatusLabel(
    requestStatus?: string,
    nominationStatus?: string
) {
    const lifecycleStatus = getLifecycleStatus(requestStatus, nominationStatus);

    switch (lifecycleStatus) {
        case "searching":
            return "Searching";
        case "matched":
            return "Matched";
        case "pending":
            return "Pending";
        case "accepted":
            return "Accepted";
        case "in_session":
            return "In Session";
        case "completed":
            return "Completed";
        case "cancelled":
            return "Cancelled";
        case "declined":
            return "Declined";
    }
}
