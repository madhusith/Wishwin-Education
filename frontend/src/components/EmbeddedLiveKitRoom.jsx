import React, { useState, useEffect } from 'react';
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
import { X, Radio, Users, Mic, MicOff, Shield, User, Volume2, VolumeX } from 'lucide-react';
import api from '../services/api';

// Custom Top Navigation & Participant Drawer Bar inside LiveKitRoom context
function ClassroomHeader({ title, className, isTeacher, onLeave }) {
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();
  const [showRoster, setShowRoster] = useState(false);
  const [updatingIdentity, setUpdatingIdentity] = useState(null);

  // Listen to room data messages for instant Mute/Unmute signals
  useEffect(() => {
    if (!room) return;

    const handleDataReceived = (payload, participant, kind, topic) => {
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
      <div className="h-14 px-4 sm:px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0 z-30">
        {/* Left: Live Status & Class Info */}
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold bg-red-600/20 text-red-400 border border-red-500/30 animate-pulse">
            <Radio className="w-3.5 h-3.5 text-red-500" />
            LIVE
          </span>
          <div>
            <h2 className="text-sm font-bold text-white line-clamp-1">
              {title || 'Interactive Live Session'}
            </h2>
            {className && (
              <p className="text-[11px] text-slate-400 line-clamp-1">{className}</p>
            )}
          </div>
        </div>

        {/* Right: Participant Count Toggle & Leave Button */}
        <div className="flex items-center gap-2.5">
          {/* Participant Count Button */}
          <button
            type="button"
            onClick={() => setShowRoster((prev) => !prev)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
              showRoster
                ? 'bg-blue-600 text-white border-blue-500 shadow-lg'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
            }`}
            title="View participants list & host controls"
          >
            <Users className="w-4 h-4 text-sky-400" />
            <span>Participants ({participants.length})</span>
          </button>

          {/* Leave / End Session Button */}
          <button
            type="button"
            onClick={onLeave}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-bold transition cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>{isTeacher ? 'End Session' : 'Leave Room'}</span>
          </button>
        </div>
      </div>

      {/* Participants Drawer Slide-Over */}
      {showRoster && (
        <div className="absolute top-14 right-0 bottom-0 w-84 bg-slate-900/95 backdrop-blur-xl border-l border-slate-800 z-40 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold text-white">Participants ({participants.length})</h3>
            </div>
            <button
              onClick={() => setShowRoster(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* List of Attendees */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {participants.map((p) => {
              const isLocal = p.identity === localParticipant?.identity;
              const hasAudio = p.isMicrophoneEnabled;
              const isHost = p.identity?.toLowerCase().includes('teacher') || p.name?.toLowerCase().includes('teacher');
              const isUpdating = updatingIdentity === p.identity;

              return (
                <div
                  key={p.identity}
                  className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        isHost ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {isHost ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-white truncate">
                        {p.name || p.identity}
                        {isLocal && <span className="ml-1 text-[10px] text-sky-400 font-normal">(You)</span>}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {isHost ? 'Host / Teacher' : 'Student'}
                      </p>
                    </div>
                  </div>

                  {/* Mic Status & Teacher Host Controls (Unmute and Mute) */}
                  <div className="shrink-0 flex items-center gap-1.5">
                    {/* If Teacher looking at a student: Click to Unmute or Mute */}
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
                        title={hasAudio ? 'Click to Mute Student' : 'Click to Unmute / Allow Student to Speak'}
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
                    ) : (
                      /* Display static status indicator */
                      hasAudio ? (
                        <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center" title="Microphone Active">
                          <Mic className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center" title="Muted">
                          <MicOff className="w-3.5 h-3.5" />
                        </span>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 border-t border-slate-800 text-[11px] text-slate-400 text-center">
            {isTeacher ? '💡 Click "Unmute" next to any student to let them speak.' : '🔒 Only the teacher can unmute your microphone.'}
          </div>
        </div>
      )}
    </>
  );
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
  if (!serverUrl || !token) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
      <LiveKitRoom
        video={true}
        audio={isTeacher}
        token={token}
        serverUrl={serverUrl}
        data-lk-theme="default"
        onDisconnected={onLeave}
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
        style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}
      >
        {/* Custom Header with Live Participant Count and Roster Panel */}
        <ClassroomHeader
          title={title}
          className={className}
          isTeacher={isTeacher}
          onLeave={onLeave}
        />

        {/* Lock student microphone on join */}
        {!isTeacher && <StudentMicLock />}

        {/* Main LiveKit Embedded Video Area */}
        <div className="flex-1 w-full relative overflow-hidden bg-slate-950">
          <VideoConference />
          <RoomAudioRenderer />
        </div>
      </LiveKitRoom>
    </div>
  );
}
