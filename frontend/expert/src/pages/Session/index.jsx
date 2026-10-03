import { useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";

import { Icons } from "../../icons";
import { useConsultationSession } from "./hooks/useConsultationSession";

/** One round session control. */
function ControlButton({ onClick, active = true, label, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex h-12 w-12 items-center justify-center rounded-full transition-all active:scale-95 ${
        active
          ? "bg-card/90 text-foreground hover:bg-card"
          : "bg-destructive text-white hover:opacity-90"
      }`}
    >
      {children}
    </button>
  );
}

function PhaseMessage({ icon: Icon, title, children }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-center text-white">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
        <Icon className="h-8 w-8" />
      </div>
      <h1 className="mt-5 font-display text-2xl font-bold">{title}</h1>
      <div className="mt-2 max-w-md text-sm text-white/70">{children}</div>
      <Link
        to="/dashboard"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-slate-900 transition-opacity hover:opacity-90"
      >
        <Icons.arrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>
    </div>
  );
}

/**
 * The expert's one-to-one video room. Media is peer-to-peer over WebRTC;
 * signaling and lifecycle run through the consultation API. No time limit.
 */
export default function ConsultationSession() {
  const { consultationId } = useParams();
  const session = useConsultationSession(consultationId);

  const remoteVideoRef = useRef(null);
  const localVideoRef = useRef(null);

  useEffect(() => {
    if (remoteVideoRef.current && session.remoteStream) {
      remoteVideoRef.current.srcObject = session.remoteStream;
    }
  }, [session.remoteStream]);

  useEffect(() => {
    if (localVideoRef.current && session.localStream) {
      localVideoRef.current.srcObject = session.localStream;
    }
  }, [session.localStream]);

  if (session.phase === "loading") {
    return (
      <PhaseMessage icon={Icons.spinner} title="Preparing your room…">
        Checking the consultation and getting things ready.
      </PhaseMessage>
    );
  }

  if (session.phase === "error") {
    return (
      <PhaseMessage icon={Icons.infoCircle} title="Session unavailable">
        {session.error ||
          "This session can't be opened. It may not be paid for yet, or it has already ended."}
      </PhaseMessage>
    );
  }

  if (session.phase === "ended") {
    return (
      <PhaseMessage icon={Icons.checkCircle} title="Session ended">
        The session has been closed. The client can now rate it, which updates
        your overall rating.
      </PhaseMessage>
    );
  }

  const connecting = session.phase === "connecting";

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 font-sans text-white">
      {/* Remote stage */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
      />

      {connecting && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-950/90">
          <div className="h-14 w-14 animate-spin rounded-full border-4 border-white/15 border-t-accent" />
          <p className="text-sm font-semibold text-white/80">
            Waiting for your client to connect…
          </p>
          <p className="max-w-xs text-center text-xs text-white/50">
            Keep this tab open. The session starts the moment both of you are
            connected.
          </p>
        </div>
      )}

      {/* Local PiP */}
      <video
        ref={localVideoRef}
        autoPlay
        playsInline
        muted
        className="absolute bottom-24 right-4 z-10 h-36 w-auto max-w-[38vw] rounded-2xl border border-white/15 object-cover shadow-2xl sm:bottom-28 sm:h-44"
      />

      {/* Status chip */}
      <div className="absolute left-4 top-4 z-10 inline-flex items-center gap-2 rounded-full bg-black/50 px-3.5 py-1.5 text-xs font-bold backdrop-blur">
        <span
          className={`h-2 w-2 rounded-full ${
            connecting ? "animate-pulse bg-amber-400" : "bg-emerald-400"
          }`}
        />
        {connecting ? "Connecting…" : "Live"}
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-center gap-4 bg-gradient-to-t from-black/70 to-transparent px-6 pb-7 pt-14">
        <ControlButton
          onClick={session.toggleMic}
          active={session.micOn}
          label={session.micOn ? "Mute microphone" : "Unmute microphone"}
        >
          <Icons.microphone className="h-5 w-5" />
        </ControlButton>

        <ControlButton
          onClick={session.toggleCamera}
          active={session.cameraOn}
          label={session.cameraOn ? "Turn camera off" : "Turn camera on"}
        >
          <Icons.videoCamera className="h-5 w-5" />
        </ControlButton>

        <button
          type="button"
          onClick={session.hangUp}
          aria-label="End session"
          title="End session"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-500 text-white shadow-lg transition-all hover:bg-rose-600 active:scale-95"
        >
          <Icons.phone className="h-6 w-6 rotate-[135deg]" />
        </button>
      </div>
    </div>
  );
}
