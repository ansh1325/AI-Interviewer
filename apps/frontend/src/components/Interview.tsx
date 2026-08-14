import { BACKEND_URL } from "@/lib/config";
import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { DeepgramClient } from "@deepgram/sdk";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Cpu, Mic, Activity, Power, Sparkles, Volume2 } from "lucide-react";

const client = new DeepgramClient();

export function Interview() {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement>(null);

  // Live audio visualization state
  const [userSpeaking, setUserSpeaking] = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [userVolume, setUserVolume] = useState(0); // 0 to 100
  const [aiVolume, setAiVolume] = useState(0);     // 0 to 100
  const [sessionTime, setSessionTime] = useState("00:00");

  useEffect(() => {
    // Simple duration counter
    let seconds = 0;
    const interval = setInterval(() => {
      seconds++;
      const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
      const secs = String(seconds % 60).padStart(2, "0");
      setSessionTime(`${mins}:${secs}`);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let animationFrameId: number;
    let audioCtx: AudioContext;
    let resumeContext: () => void;

    (async () => {
      const pc = new RTCPeerConnection();

      // Set up to play remote audio from the model
      audioRef.current = document.createElement("audio");
      audioRef.current.autoplay = true;

      // Add local audio track for microphone input in the browser
      const ms = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      // Hook up Web Audio API analysers
      try {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Microphone/User Analyser
        const userSource = audioCtx.createMediaStreamSource(ms);
        const userAnalyser = audioCtx.createAnalyser();
        userAnalyser.fftSize = 64;
        userSource.connect(userAnalyser);
        const userBuffer = new Uint8Array(userAnalyser.frequencyBinCount);

        // AI Remote Track Analyser (instantiated on track arrival)
        let aiAnalyser: AnalyserNode | null = null;
        let aiBuffer: Uint8Array | null = null;

        pc.ontrack = (e) => {
          audioRef.current!.srcObject = e.streams[0]!;
          try {
            const remoteStream = e.streams[0];
            if (remoteStream && audioCtx) {
              const aiSource = audioCtx.createMediaStreamSource(remoteStream);
              aiAnalyser = audioCtx.createAnalyser();
              aiAnalyser.fftSize = 64;
              aiSource.connect(aiAnalyser);
              aiBuffer = new Uint8Array(aiAnalyser.frequencyBinCount);
            }
          } catch (err) {
            console.error("AI audio analyzer connect failed:", err);
          }
        };

        // Real-time audio volume detection loop
        const checkSpeech = () => {
          if (!userAnalyser) return;

          // 1. User Voice Volume calculation
          userAnalyser.getByteFrequencyData(userBuffer);
          let userSum = 0;
          for (let i = 0; i < userBuffer.length; i++) {
            userSum += userBuffer[i];
          }
          const userAvg = userSum / userBuffer.length;
          // Scale raw volume to percentage
          const normUserVol = Math.min(100, Math.round((userAvg / 128) * 100));
          setUserVolume(normUserVol);
          setUserSpeaking(normUserVol > 12);

          // 2. AI Voice Volume calculation
          if (aiAnalyser && aiBuffer) {
            aiAnalyser.getByteFrequencyData(aiBuffer);
            let aiSum = 0;
            for (let i = 0; i < aiBuffer.length; i++) {
              aiSum += aiBuffer[i];
            }
            const aiAvg = aiSum / aiBuffer.length;
            const normAiVol = Math.min(100, Math.round((aiAvg / 128) * 100));
            setAiVolume(normAiVol);
            setAiSpeaking(normAiVol > 12);
          }

          animationFrameId = requestAnimationFrame(checkSpeech);
        };

        checkSpeech();

        // Autoplay policy bypass listener
        resumeContext = () => {
          if (audioCtx && audioCtx.state === "suspended") {
            audioCtx.resume();
          }
        };
        window.addEventListener("click", resumeContext);

      } catch (err) {
        console.error("Web Audio API visualizer configuration failed:", err);
      }

      const socket = new WebSocket('wss://api.deepgram.com/v1/listen', [
        'token',
        'ee3a19271e7917711c674dca557210f0b86d7d0d'
      ]);

      socket.onopen = () => {
        const mediRecorder = new MediaRecorder(ms, { mimeType: 'audio/webm' });
        mediRecorder.start(250);

        mediRecorder.addEventListener("dataavailable", (event) => {
          socket.send(event.data);
        });
      };

      socket.onmessage = (message) => {
        const received = JSON.parse(message.data);
        const transcript = received.channel.alternatives[0].transcript;
        if (transcript) {
          console.log(transcript);
          axios.post(`${BACKEND_URL}/api/v1/session/user/${interviewId}`, {
            message: transcript
          });
        }
      };

      pc.addTrack(ms.getTracks()[0]!);

      // Start the session using the Session Description Protocol (SDP)
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpResponse = await fetch(`${BACKEND_URL}/api/v1/session/${interviewId}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          "Content-Type": "application/sdp",
        },
      });

      const answer = {
        type: "answer" as 'answer',
        sdp: await sdpResponse.text(),
      };
      await pc.setRemoteDescription(answer);

    })();

    // Cleanup hook
    return () => {
      cancelAnimationFrame(animationFrameId);
      if (audioCtx) {
        audioCtx.close();
      }
      if (resumeContext) {
        window.removeEventListener("click", resumeContext);
      }
    };
  }, [interviewId]);

  return (
    <div className="h-screen w-screen bg-background overflow-hidden flex flex-col justify-between relative font-sans text-foreground select-none">
      {/* Sci-Fi Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

      {/* Cybernetic ambient lights */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-[250px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      {/* 1. Header Bar */}
      <header className="z-10 px-8 py-5 border-b border-border bg-background/50 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
          <span className="font-display font-bold tracking-widest text-sm text-foreground/80 uppercase">
            Technical Session
          </span>
          <span className="text-xs px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-muted-foreground font-mono">
            {interviewId?.slice(0, 8)}...
          </span>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/5 border border-white/10 font-mono text-sm text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            LIVE: {sessionTime}
          </div>
        </div>
      </header>

      {/* 2. Visual Nodes Container */}
      <main className="z-10 flex-1 flex flex-col md:flex-row items-center justify-center gap-16 md:gap-24 max-w-6xl mx-auto w-full px-6">
        
        {/* LEFT NODE: AI INTERVIEWER */}
        <div className="flex flex-col items-center gap-6 flex-1 max-w-sm">
          <div className="text-center">
            <span className="text-xs font-semibold tracking-widest text-primary/80 font-display uppercase">
              INTERVIEW CONDUCTOR
            </span>
            <h3 className="text-2xl font-black font-display text-white mt-1">AI Evaluator</h3>
          </div>

          {/* Interactive Holographic Orb Container */}
          <div className="relative w-64 h-64 flex items-center justify-center">
            {/* Background ripple ring (animated based on AI volume) */}
            <div 
              className="absolute inset-0 rounded-full border border-primary/20 bg-primary/5 transition-transform duration-100 ease-out"
              style={{ transform: `scale(${1.0 + (aiVolume / 100) * 0.5})`, opacity: aiSpeaking ? 0.8 : 0.2 }}
            />
            {/* Nested Speaking Ripple rings */}
            {aiSpeaking && (
              <>
                <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-pulse-ring" style={{ animationDelay: '0s' }} />
                <div className="absolute inset-0 rounded-full border-2 border-primary/10 animate-pulse-ring" style={{ animationDelay: '1.5s' }} />
              </>
            )}

            {/* Glowing Ring Frame */}
            <div className="absolute inset-4 rounded-full border border-white/5 bg-card/60 backdrop-blur-xl flex items-center justify-center shadow-2xl">
              {/* Rotating inner tech rings */}
              <div 
                className="absolute inset-4 rounded-full border border-dashed border-primary/30 animate-radar-scan" 
                style={{ animationDuration: '12s' }}
              />
              <div 
                className="absolute inset-8 rounded-full border border-dotted border-accent/20 animate-radar-scan" 
                style={{ animationDuration: '8s', animationDirection: 'reverse' }}
              />

              {/* Core Active Orb */}
              <div 
                className="w-28 h-28 rounded-full bg-gradient-to-tr from-primary via-primary/80 to-accent flex items-center justify-center transition-transform duration-75 shadow-[0_0_50px_rgba(99,102,241,0.4)]"
                style={{ transform: `scale(${1.0 + (aiVolume / 100) * 0.25})` }}
              >
                <Cpu className="w-12 h-12 text-white animate-pulse" />
              </div>
            </div>
          </div>

          {/* AI Talking Status Badge */}
          <div className="h-10 flex items-center justify-center">
            {aiSpeaking ? (
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-xs font-bold font-display uppercase tracking-widest text-primary animate-pulse shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                <Volume2 className="w-3.5 h-3.5 animate-bounce" />
                AI Speaking
              </div>
            ) : (
              <div className="text-xs text-muted-foreground uppercase tracking-widest font-mono">
                AI Listening...
              </div>
            )}
          </div>
        </div>

        {/* CONNECTION HIGHWAY */}
        <div className="hidden md:flex flex-col items-center justify-center w-32 relative">
          <span className="text-[10px] font-mono text-muted-foreground/30 uppercase tracking-widest mb-3">
            WebRTC Link
          </span>
          <div className="w-full h-[2px] bg-border relative overflow-hidden rounded-full">
            <div 
              className="absolute h-full w-12 bg-gradient-to-r from-transparent via-primary to-transparent animate-shimmer"
              style={{ 
                animation: 'shimmer 1.5s infinite linear',
                animationDuration: (aiSpeaking || userSpeaking) ? '0.7s' : '2s' 
              }}
            />
          </div>
          <Activity className="w-5 h-5 text-muted-foreground/20 mt-3 animate-pulse" />
        </div>

        {/* RIGHT NODE: USER */}
        <div className="flex flex-col items-center gap-6 flex-1 max-w-sm">
          <div className="text-center">
            <span className="text-xs font-semibold tracking-widest text-accent/80 font-display uppercase">
              LOCAL STREAM
            </span>
            <h3 className="text-2xl font-black font-display text-white mt-1">You (Candidate)</h3>
          </div>

          {/* Interactive User Node Container */}
          <div className="relative w-64 h-64 flex items-center justify-center">
            {/* Background ripple ring (animated based on user volume) */}
            <div 
              className="absolute inset-0 rounded-full border border-accent/20 bg-accent/5 transition-transform duration-100 ease-out"
              style={{ transform: `scale(${1.0 + (userVolume / 100) * 0.5})`, opacity: userSpeaking ? 0.8 : 0.2 }}
            />
            {/* Dynamic visual indicator glow rings */}
            {userSpeaking && (
              <>
                <div className="absolute inset-0 rounded-full border-2 border-accent/30 animate-pulse-ring" style={{ animationDelay: '0s' }} />
                <div className="absolute inset-0 rounded-full border-2 border-accent/10 animate-pulse-ring" style={{ animationDelay: '1.5s' }} />
              </>
            )}

            {/* Glowing Ring Frame */}
            <div className="absolute inset-4 rounded-full border border-white/5 bg-card/60 backdrop-blur-xl flex items-center justify-center shadow-2xl">
              
              {/* Dynamic waveform columns */}
              <div className="flex items-center justify-center gap-2 h-16 w-32 relative z-10">
                {[...Array(6)].map((_, i) => {
                  // Calculate dynamic scaling for each bar
                  const baseDelays = [0.1, 0.4, 0.2, 0.5, 0.3, 0.6];
                  const speakerMultiplier = userSpeaking ? (userVolume / 100) * 2.2 + 0.4 : 0.3;
                  return (
                    <div 
                      key={i}
                      className="w-2.5 bg-gradient-to-t from-accent/50 to-accent rounded-full transition-all duration-100 ease-out"
                      style={{ 
                        height: userSpeaking ? `${Math.max(10, Math.round(50 * speakerMultiplier * (0.5 + Math.random() * 0.5)))}px` : '6px',
                        opacity: userSpeaking ? 0.9 : 0.4,
                        transitionDelay: `${baseDelays[i] * 0.05}s`
                      }}
                    />
                  );
                })}
              </div>

              {/* Centered micro-ring */}
              <div 
                className="absolute w-36 h-36 rounded-full border border-accent/10 transition-transform duration-75"
                style={{ transform: `scale(${1.0 + (userVolume / 100) * 0.1})` }}
              />
            </div>
          </div>

          {/* User Transmitting Status Badge */}
          <div className="h-10 flex items-center justify-center">
            {userSpeaking ? (
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/30 text-xs font-bold font-display uppercase tracking-widest text-accent animate-pulse shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                <Mic className="w-3.5 h-3.5" />
                Transmitting
              </div>
            ) : (
              <div className="text-xs text-muted-foreground uppercase tracking-widest font-mono">
                Microphone Ready
              </div>
            )}
          </div>
        </div>

      </main>

      {/* 3. Footer Action Area */}
      <footer className="z-10 px-8 py-6 border-t border-border bg-background/50 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-center sm:text-left">
          <p className="text-xs text-muted-foreground max-w-md">
            Do not refresh or close this tab. The session metadata is saved automatically to database servers.
          </p>
        </div>

        <Button
          onClick={() => navigate(`/result/${interviewId}`)}
          className="px-6 h-12 bg-destructive/10 hover:bg-destructive text-destructive hover:text-white border border-destructive/20 hover:border-destructive rounded-xl transition-all duration-300 font-display font-bold text-sm uppercase tracking-wider flex items-center gap-2"
        >
          <Power className="w-4 h-4" />
          End Session & View Analysis
        </Button>
      </footer>

      {/* Audio Element */}
      <audio ref={audioRef} autoPlay className="hidden" />

      {/* Custom Keyframe Styles Inline */}
      <style>{`
        @keyframes shimmer {
          0% { left: -50px; }
          100% { left: 150px; }
        }
      `}</style>
    </div>
  );
}