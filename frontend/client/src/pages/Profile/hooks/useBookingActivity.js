import { useCallback, useEffect, useState } from "react";
import api from "../../../config/axios";
import { summarizeBookings } from "../utils";

/**
 * The booking counts the profile's stat tiles show.
 *
 * A failure here never breaks the page — the tiles render an em dash and the
 * page offers a retry — so the error is reported rather than thrown.
 */
export default function useBookingActivity(enabled) {
  const [activity, setActivity] = useState(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setFailed(false);

    try {
      const res = await api.get("/consult/bookings");
      setActivity(summarizeBookings(res.data?.data || []));
    } catch {
      // The profile is still useful without the summary.
      setActivity(null);
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    load();
  }, [enabled, load]);

  return { activity, failed, reload: load };
}
