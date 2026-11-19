import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  useParticipants,
  useLocalParticipant,
  useRoomContext,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { VideoPresets } from 'livekit-client';
import {
  X,
  Radio,
  Users,
  Mic,
  MicOff,
  Shield,
  User,
  Volume2,
  VolumeX,
  ArrowLeft,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import api from '../services/api';

// Custom Top Navigation & Participant Drawer Bar inside LiveKitRoom context
function ClassroomHeader({
  title,
  className,
  isTeacher,
  onLeave,
  isFullscreen,
  onToggleFullscreen,
}) {
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();
  const [showRoster, setShowRoster] = useState(false);
  const [updatingIdentity, setUpdatingIdentity] = useState(null);

  // Listen to room data messages for instant Mute/Unmute signals
  useEffect(() => {
    if (!room) return;

    const handleDataReceived = (payload) => {
      try {
        const str = new TextDecoder().decode(payload);
        const data = JSON.parse(str);

        if (data.type === 'MUTE_STUDENT' && data.identity === localParticipant?.identity) {
          // Immediately disable and unpublish microphone on student device
          localParticipant?.setMicrophoneEnabled(false);
        } else if (data.type === 'UNMUTE_STUDENT' && data.identity === localParticipant?.identity) {
          // Enable microphone on student device
          localParticipant?.setMicrophoneEnabled(true);
        }
      } catch (e) {
        // Not a JSON control message
      }
    };

    room.on('dataReceived', handleDataReceived);
    return () => {
      room.off('dataReceived', handleDataReceived);
    };
  }, [room, localParticipant]);

  // Toggle student microphone from teacher screen
  const handleToggleStudentMic = async (p, forceMute) => {
    if (!isTeacher) return;
    try {
      setUpdatingIdentity(p.identity);
      const allowMic = forceMute !== undefined ? !forceMute : !p.isMicrophoneEnabled;
      const roomName = room?.name;

      if (!roomName) {
        alert('Room is not connected yet.');
        return;
      }

      // 1. Send instant WebRTC real-time control message to student
      try {
        const signalMsg = JSON.stringify({
          type: allowMic ? 'UNMUTE_STUDENT' : 'MUTE_STUDENT',
          identity: p.identity,
        });
        const encoder = new TextEncoder();
        localParticipant?.publishData(encoder.encode(signalMsg), { reliable: true });
      } catch (err) {
        console.warn('Realtime signal publish fallback:', err);
      }

      // 2. Call backend server to update participant permission
      await api.post('/live-classes/participant-permission', {
        roomName,
        identity: p.identity,
        allowMic,
      });
    } catch (err) {
      console.error('Failed to update student mic permission:', err);
      alert(err.response?.data?.message || 'Could not update student microphone.');
    } finally {
      setUpdatingIdentity(null);
    }
  };

  return (
    <>
      <header
        className="min-h-11 sm:min-h-14 px-2.5 sm:px-5 py-1.5 sm:py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-2 sm:gap-4 shrink-0 z-30"
        style={{
          paddingLeft: 'max(0.625rem, env(safe-area-inset-left))',
          paddingRight: 'max(0.625rem, env(safe-area-inset-right))',
        }}
      >
        {/* Left: Back Button, Live Status & Class Info */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          {/* Back Button */}
          <button
            type="button"
            onClick={onLeave}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold transition cursor-pointer shrink-0"
            title="Back to Live Classes"
            aria-label="Back to Live Classes"
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400 shrink-0" />
            <span>Back</span>
          </button>

          {/* Live Indicator Badge */}
          <span className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-extrabold bg-red-600/20 text-red-400 border border-red-500/30 animate-pulse shrink-0">
            <Radio className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-500 shrink-0" />
            <span>LIVE</span>
          </span>

          {/* Title & Class Name */}
          <div className="min-w-0 flex-1">
            <h2 className="text-xs sm:text-sm font-bold text-white truncate leading-tight">
              {title || 'Interactive Live Session'}
            </h2>
            {className && (
              <p className="text-[10px] sm:text-[11px] text-slate-400 truncate hidden sm:block leading-tight">
                {className}
              </p>
            )}
          </div>
        </div>

        {/* Right: Participant Count Toggle, Full Screen Toggle & Leave Button */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Participant Count Button */}
          <button
            type="button"
            onClick={() => setShowRoster((prev) => !prev)}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
              showRoster
                ? 'bg-blue-600 text-white border-blue-500 shadow-lg'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
            }`}
            title="View participants list & host controls"
            aria-label="Toggle participants list"
          >
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400 shrink-0" />
            <span className="hidden md:inline">Participants</span>
            <span className="px-1.5 py-0.2 rounded-md bg-slate-950/50 text-[11px] font-extrabold text-sky-300">
              {participants.length}
            </span>
          </button>

          {/* Full Screen Mode Toggle Button */}
          <button
            type="button"
            onClick={onToggleFullscreen}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
              isFullscreen
                ? 'bg-indigo-600/30 text-indigo-200 border-indigo-500/50 hover:bg-indigo-600/50 hover:text-white'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
            }`}
            title={isFullscreen ? 'Exit Full Screen (Esc)' : 'Enter Full Screen Mode'}
            aria-label={isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400 shrink-0" />
                <span className="hidden lg:inline">Exit Full Screen</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400 shrink-0" />
                <span className="hidden lg:inline">Full Screen</span>
              </>
            )}
          </button>

          {/* Leave / End Session Button */}
          <button
            type="button"
            onClick={onLeave}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-bold transition cursor-pointer"
            title={isTeacher ? 'End Session' : 'Leave Room'}
          >
            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="hidden sm:inline">{isTeacher ? 'End Session' : 'Leave Room'}</span>
          </button>
        </div>
      </header>

      {/* Participants Drawer Slide-Over (Responsive for Mobile & Desktop) */}
      {showRoster && (
        <>
          {/* Mobile backdrop overlay */}
          <div
            className="fixed inset-0 top-14 bg-slate-950/60 backdrop-blur-xs z-30 sm:hidden"
            onClick={() => setShowRoster(false)}
          />
          <aside className="absolute top-14 right-0 bottom-0 w-full sm:w-80 md:w-88 max-w-full bg-slate-900/98 backdrop-blur-xl border-l border-slate-800 z-40 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="p-3.5 sm:p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-bold text-white">
                  Participants ({participants.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRoster(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                aria-label="Close participants drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List of Attendees */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {participants.map((p) => {
                const isLocal = p.identity === localParticipant?.identity;
                const hasAudio = p.isMicrophoneEnabled;
                const isHost =
                  p.identity?.toLowerCase().includes('teacher') ||
                  p.name?.toLowerCase().includes('teacher');
                const isUpdating = updatingIdentity === p.identity;

                return (
                  <div
                    key={p.identity}
                    className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          isHost
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {isHost ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-white truncate">
                          {p.name || p.identity}
                          {isLocal && (
                            <span className="ml-1 text-[10px] text-sky-400 font-normal">(You)</span>
                          )}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {isHost ? 'Host / Teacher' : 'Student'}
                        </p>
                      </div>
                    </div>

                    {/* Mic Status & Teacher Host Controls (Unmute and Mute) */}
                    <div className="shrink-0 flex items-center gap-1.5">
                      {isTeacher && !isLocal ? (
                        <button
                          type="button"
                          onClick={() => handleToggleStudentMic(p)}
                          disabled={isUpdating}
                          className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                            hasAudio
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                          } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title={
                            hasAudio
                              ? 'Click to Mute Student'
                              : 'Click to Unmute / Allow Student to Speak'
                          }
                        >
                          {hasAudio ? (
                            <>
                              <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                              <span>Mute</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Unmute</span>
                            </>
                          )}
                        </button>
                      ) : hasAudio ? (
                        <span
                          className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center"
                          title="Microphone Active"
                        >
                          <Mic className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <span
                          className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center"
                          title="Muted"
                        >
                          <MicOff className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3 border-t border-slate-800 text-[11px] text-slate-400 text-center">
              {isTeacher
                ? '💡 Click "Unmute" next to any student to let them speak.'
                : '🔒 Only the teacher can unmute your microphone.'}
            </div>
          </aside>
        </>
      )}
    </>
  );
}

// Auto-Focus Teacher Video Track so Teacher/Whiteboard is large by default
function AutoFocusTeacher() {
  const participants = useParticipants();
  const hasAutoFocused = useRef(false);

  useEffect(() => {
    if (hasAutoFocused.current) return;

    // Wait briefly for video tiles to render, then auto-click the focus button on the teacher tile if still in grid mode
    const timer = setTimeout(() => {
      const inFocusLayout = document.querySelector('.lk-focus-layout');
      if (inFocusLayout) {
        hasAutoFocused.current = true;
        return;
      }

      const tiles = document.querySelectorAll('.lk-participant-tile');
      for (const tile of tiles) {
        const hasVideo = tile.querySelector('video');
        const focusBtn = tile.querySelector('.lk-focus-toggle-button');
        if (hasVideo && focusBtn) {
          focusBtn.click();
          hasAutoFocused.current = true;
          break;
        }
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [participants.length]);

  return null;
}

// Student Microphone Auto-Lock Controller
function StudentMicLock() {
  const { localParticipant } = useLocalParticipant();

  useEffect(() => {
    // Ensure student microphone is muted by default upon joining
    if (localParticipant) {
      localParticipant.setMicrophoneEnabled(false);
    }
  }, [localParticipant]);

  return null;
}

export default function EmbeddedLiveKitRoom({
  serverUrl,
  token,
  title,
  className,
  isTeacher = false,
  onLeave,
}) {
  const containerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sync fullscreen state with browser native fullscreen events
  useEffect(() => {
    const handleFullscreenChange = () => {
      const fsElement =
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement;
      setIsFullscreen(Boolean(fsElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Toggle Full Screen Mode (with fallback for mobile browsers like iOS Safari)
  const handleToggleFullscreen = useCallback(async () => {
    try {
      const fsElement =
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement;

      if (!fsElement) {
        const el = containerRef.current || document.documentElement;
        if (el.requestFullscreen) {
          await el.requestFullscreen();
          return;
        } else if (el.webkitRequestFullscreen) {
          await el.webkitRequestFullscreen();
          return;
        } else if (el.msRequestFullscreen) {
          await el.msRequestFullscreen();
          return;
        }

        // iOS Safari iPhone fallback: trigger native fullscreen on the active teacher/focused video element
        const videoEl =
          el.querySelector('.lk-focus-layout > .lk-participant-tile video') ||
          el.querySelector('.lk-participant-media-video');
        if (videoEl && videoEl.webkitEnterFullscreen) {
          videoEl.webkitEnterFullscreen();
          return;
        }

        setIsFullscreen((prev) => !prev);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
          await document.msExitFullscreen();
        } else {
          setIsFullscreen(false);
        }
      }
    } catch (err) {
      console.warn('Fullscreen toggle fallback:', err);
      // Try video element fullscreen on iOS if container requestFullscreen threw
      const videoEl =
        containerRef.current?.querySelector('.lk-focus-layout > .lk-participant-tile video') ||
        containerRef.current?.querySelector('.lk-participant-media-video');
      if (videoEl && videoEl.webkitEnterFullscreen) {
        try {
          videoEl.webkitEnterFullscreen();
          return;
        } catch (e) {}
      }
      setIsFullscreen((prev) => !prev);
    }
  }, []);

  // Ensure we exit browser fullscreen cleanly when leaving the room
  const handleLeaveRoom = useCallback(async () => {
    try {
      const fsElement =
        document.fullscreenElement || document.webkitFullscreenElement;
      if (fsElement) {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        }
      }
    } catch (e) {
      // Ignore exit fullscreen errors
    }
    if (onLeave) {
      onLeave();
    }
  }, [onLeave]);

  if (!serverUrl || !token) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 w-screen h-screen h-[100dvh] max-w-full max-h-full bg-slate-950 flex flex-col overflow-hidden select-none"
    >
      <LiveKitRoom
        video={true}
        audio={isTeacher}
        token={token}
        serverUrl={serverUrl}
        data-lk-theme="default"
        onDisconnected={handleLeaveRoom}
        options={{
          adaptiveStream: {
            pixelDensity: 'screen',
          },
          dynacast: true,
          // 720p HD provides crisp whiteboard & face clarity with zero stutter or lag
          videoCaptureDefaults: {
            resolution: VideoPresets.h720.resolution,
            deviceId: '',
          },
          publishDefaults: {
            videoEncoding: VideoPresets.h720.encoding,
            videoSimulcastLayers: [
              VideoPresets.h720,
              VideoPresets.h360,
              VideoPresets.h180,
            ],
            videoCodec: 'vp8',
            audioPreset: {
              maxBitrate: 32000,
            },
            screenShareEncoding: VideoPresets.h1080.encoding,
          },
        }}
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Custom Header with Back Button, Live Participant Count, Full Screen & Leave Button */}
        <ClassroomHeader
          title={title}
          className={className}
          isTeacher={isTeacher}
          onLeave={handleLeaveRoom}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
        />

        {/* Lock student microphone on join */}
        {!isTeacher && <StudentMicLock />}
        {/* Automatically focus teacher's active video stream */}
        <AutoFocusTeacher />

        {/* Main LiveKit Embedded Video Area */}
        <div className="flex-1 w-full min-h-0 relative overflow-hidden bg-slate-950 flex flex-col">
          <VideoConference />
          <RoomAudioRenderer />
        </div>
      </LiveKitRoom>
    </div>
  );
}
