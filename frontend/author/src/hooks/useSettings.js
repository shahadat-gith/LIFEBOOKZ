import { useCallback, useEffect, useState } from "react";
import api from "../config/api";

/**
 * Author preferences, loaded on demand.
 *
 * Signing in only needs the session and the author — preferences are read by
 * the screens that actually use them (settings page, story editor, profile).
 * The first successful read is cached for the session so switching between
 * those screens costs nothing, and `refresh()` re-reads from the API so the
 * settings page always shows what the backend has stored.
 */

/** Used as a fallback while settings load, and for brand-new accounts. */
export const SETTINGS_DEFAULTS = Object.freeze({
  defaultVisibility: "public",
  autosave: true,
  showWordCount: true,
  inDirectory: true,
  twoStep: false,
  notifications: { likes: true, comments: true, followers: true },
});

let cached = null;
let inflight = null;

/** Forget the cached copy — call this whenever the session changes. */
export function resetSettingsCache() {
  cached = null;
  inflight = null;
}

function requestSettings() {
  if (!inflight) {
    inflight = api
      .get("/authors/me/settings")
      .then((res) => res.data.data)
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

export default function useSettings({ enabled = true, refreshOnMount = false } = {}) {
  const [settings, setSettings] = useState(cached);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await requestSettings();
      cached = data;
      setSettings(data);
      setError(null);
      return data;
    } catch (err) {
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // The settings screen always re-reads, so it can never show a stale
    // (or default) copy of what the backend has.
    if (refreshOnMount) {
      load();
      return;
    }

    if (cached) {
      setSettings(cached);
      return;
    }

    load();
  }, [enabled, refreshOnMount, load]);

  const save = useCallback(async (patch) => {
    const res = await api.patch("/authors/me/settings", patch);
    cached = res.data.data;
    setSettings(cached);
    setError(null);
    return cached;
  }, []);

  return { settings, error, loading, save, refresh: load };
}
