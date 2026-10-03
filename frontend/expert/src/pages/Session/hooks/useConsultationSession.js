import { useCallback, useEffect, useRef, useState } from "react";

import * as consultApi from "../../../api/consultation";

/**
 * Drives the expert's side of a one-to-one WebRTC session over the REST
 * signaling API. The "user" side sends the offer; the expert answers —
 * the role split keeps the offer/answer exchange deterministic.
 */
export function useConsultationSession(consultationId) {
  const [phase, setPhase] = useState("loading"); // loading | connecting | live | ended | error
  const [error, setError] = useState("");
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const pollRef = useRef(null);
  const heartbeatRef = useRef(null);
  const lastSignalIdRef = useRef(null);
  const endedRef = useRef(false);
  const offerSentRef = useRef(false);

  const stopEverything = useCallback(() => {
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    if (pollRef.current) clearInterval(pollRef.current);
    heartbeatRef.current = null;
    pollRef.current = null;

    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    pcRef.current?.close();
    pcRef.current = null;
  }, []);

  const finish = useCallback(
    async (endedRemotely = false) => {
      if (endedRef.current) return;
      endedRef.current = true;
      stopEverything();
      setPhase("ended");
      if (!endedRemotely) {
        try {
          await consultApi.endSession(consultationId);
        } catch {
          /* already closed server-side */
        }
      }
    },
    [consultationId, stopEverything],
  );

  const drainSignals = useCallback(
    async (pc) => {
      const { messages } = await consultApi.pullSignals(
        consultationId,
        lastSignalIdRef.current,
      );

      for (const message of messages) {
        lastSignalIdRef.current = message.id;

        if (message.type === "bye") {
          await finish(true);
          return;
        }

        try {
          if (message.type === "offer") {
            await pc.setRemoteDescription(message.payload);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            await consultApi.postSignal(consultationId, "answer", answer);
          } else if (message.type === "answer" && pc.signalingState !== "stable") {
            await pc.setRemoteDescription(message.payload);
          } else if (message.type === "ice" && message.payload) {
            await pc.addIceCandidate(message.payload).catch(() => {});
          }
        } catch {
          // Stale or out-of-order messages are skipped on purpose.
        }
      }
    },
    [consultationId, finish],
  );

  useEffect(() => {
    let cancelled = false;
    endedRef.current = false;

    (async () => {
      try {
        const config = await consultApi.getSession(consultationId);
        if (cancelled) return;

        setPhase("connecting");

        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: { echoCancellation: true, noiseSuppression: true },
          });
        } catch {
          setError("Camera and microphone access is required for the session.");
          setPhase("error");
          return;
        }
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream;
        setLocalStream(stream);

        const pc = new RTCPeerConnection({ iceServers: config.iceServers });
        pcRef.current = pc;

        pc.ontrack = (event) => {
          const [remote] = event.streams;
          if (remote) setRemoteStream(remote);
        };
        pc.onconnectionstatechange = () => {
          if (pc.connectionState === "connected") setPhase("live");
          if (["failed", "closed"].includes(pc.connectionState) && !endedRef.current) {
            setPhase("connecting");
          }
        };
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            consultApi
              .postSignal(consultationId, "ice", event.candidate.toJSON())
              .catch(() => {});
          }
        };

        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        await consultApi.joinSession(consultationId);
        if (cancelled) return;

        heartbeatRef.current = setInterval(() => {
          consultApi.heartbeat(consultationId).catch(() => {});
        }, 15000);

        // Expert answers — no offer of their own.
        offerSentRef.current = false;

        pollRef.current = setInterval(async () => {
          try {
            await drainSignals(pcRef.current);
          } catch {
            /* retried on the next tick */
          }
        }, 1000);
      } catch (err) {
        if (cancelled) return;
        setError(
          err.response?.data?.error?.message ||
            err.message ||
            "Could not start the session.",
        );
        setPhase("error");
      }
    })();

    // Leaving the page (refresh, navigating away) must NOT end the meeting —
    // ending it here was marking fresh CONFIRMED bookings COMPLETED the
    // moment the room remounted. The session closes only when the expert
    // explicitly closes it, the peer sends `bye`, or the server's
    // stale-session sweep runs.
    return () => {
      cancelled = true;
      endedRef.current = true;
      stopEverything();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consultationId]);

  const toggleMic = useCallback(() => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setMicOn(track.enabled);
    }
  }, []);

  const toggleCamera = useCallback(() => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setCameraOn(track.enabled);
    }
  }, []);

  const hangUp = useCallback(() => finish(false), [finish]);

  return {
    phase,
    error,
    localStream,
    remoteStream,
    micOn,
    cameraOn,
    toggleMic,
    toggleCamera,
    hangUp,
  };
}
