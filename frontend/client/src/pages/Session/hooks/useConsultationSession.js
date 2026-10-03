import { useCallback, useEffect, useRef, useState } from "react";

import * as consultApi from "../../../api/consultation";
import { openRazorpayCheckout } from "../../../utils/razorpay";
import { useAuth } from "../../../context/AuthContext";

/**
 * Drives a one-to-one WebRTC session over the REST signaling API.
 *
 * Media flows peer-to-peer (STUN/TURN); the server only relays small
 * offer/answer/ICE messages, which both sides poll every second. The
 * consultation itself has no fixed duration — the session runs until one
 * side ends it.
 *
 * Pay at the door: an unpaid user first lands in the `payment` phase. Only
 * after a verified Razorpay payment does the room open (the backend flips
 * CONFIRMED → IN_PROGRESS when the paid user joins).
 */
export function useConsultationSession(consultationId) {
  const { user } = useAuth();

  const [phase, setPhase] = useState("loading"); // loading | payment | connecting | live | ended | error
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [payment, setPayment] = useState(null); // { amount, currency } while unpaid
  const [paying, setPaying] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const socketLikeRef = useRef(null); // signaling poll timer
  const heartbeatRef = useRef(null);
  const lastSignalIdRef = useRef(null);
  const endedRef = useRef(false);
  const joinedRef = useRef(false);
  const configRef = useRef(null);

  const stopEverything = useCallback(() => {
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    if (socketLikeRef.current) clearInterval(socketLikeRef.current);
    heartbeatRef.current = null;
    socketLikeRef.current = null;

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

  // ----------------------------------------------------------------------
  // Signaling
  // ----------------------------------------------------------------------

  const wirePeerConnection = useCallback(
    async (pc) => {
      pc.ontrack = (event) => {
        const [stream] = event.streams;
        if (stream) setRemoteStream(stream);
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
    },
    [consultationId],
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
          // A stale or out-of-order message must never kill the session.
        }
      }
    },
    [consultationId, finish],
  );

  // ----------------------------------------------------------------------
  // Join (media + peer connection + signaling loop)
  // ----------------------------------------------------------------------

  const startSessionFlow = useCallback(
    async (config) => {
      setPhase("connecting");

      // 1. Media.
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
      localStreamRef.current = stream;
      setLocalStream(stream);

      // 2. Peer connection.
      const pc = new RTCPeerConnection({ iceServers: config.iceServers });
      pcRef.current = pc;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      await wirePeerConnection(pc);

      // 3. Tell the backend we're in (user's paid join: CONFIRMED → IN_PROGRESS).
      await consultApi.joinSession(consultationId);
      joinedRef.current = true;

      // 4. Heartbeat keeps the session alive server-side.
      heartbeatRef.current = setInterval(() => {
        consultApi.heartbeat(consultationId).catch(() => {});
      }, 15000);

      // 5. Decide the signaling role: the "user" side always offers; the
      //    "expert" side waits.
      const isOfferer = config.side === "user";

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await pc.setLocalDescription(offer);
      if (isOfferer) {
        await consultApi.postSignal(consultationId, "offer", offer);
      }

      // 6. Poll signaling until the session ends.
      socketLikeRef.current = setInterval(async () => {
        try {
          await drainSignals(pcRef.current);
        } catch {
          /* transient network errors are retried on the next tick */
        }
      }, 1000);
    },
    [consultationId, wirePeerConnection, drainSignals],
  );

  useEffect(() => {
    let cancelled = false;
    endedRef.current = false;
    joinedRef.current = false;

    (async () => {
      try {
        const config = await consultApi.getSession(consultationId);
        if (cancelled) return;

        configRef.current = config;
        setStatus(config.status || "");

        // The door: an unpaid user must pay before entering the room.
        if (config.paymentRequired) {
          setPayment({
            amount: config.amount,
            currency: config.currency || "INR",
          });
          setPhase("payment");
          return;
        }

        await startSessionFlow(config);
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
    // the session closes only when someone explicitly hangs up, the peer
    // sends `bye`, or the server's stale-session sweep closes it.
    return () => {
      cancelled = true;
      endedRef.current = true;
      stopEverything();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consultationId]);

  // ----------------------------------------------------------------------
  // Pay at the door — checkout → verify → enter the room
  // ----------------------------------------------------------------------

  const pay = useCallback(async () => {
    if (paying) return;
    setPaying(true);

    try {
      const order = await consultApi.createPaymentOrder(consultationId);

      const handshake = await openRazorpayCheckout(order, {
        description: "Consultation session fee",
        prefill: { name: user?.fullName, email: user?.email },
      });

      await consultApi.verifyPayment(consultationId, handshake);

      setPayment(null);
      await startSessionFlow(configRef.current);
    } catch (err) {
      if (!err?.cancelled && !err?.failed) {
        setError(
          err.response?.data?.error?.message ||
            "Payment could not be completed. Please try again.",
        );
      }
      // Cancelled/failed checkouts stay in the payment phase for a retry.
      throw err;
    } finally {
      setPaying(false);
    }
  }, [consultationId, paying, user, startSessionFlow]);

  // ----------------------------------------------------------------------
  // Controls
  // ----------------------------------------------------------------------

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
    status,
    payment,
    paying,
    pay,
    localStream,
    remoteStream,
    micOn,
    cameraOn,
    toggleMic,
    toggleCamera,
    hangUp,
  };
}
