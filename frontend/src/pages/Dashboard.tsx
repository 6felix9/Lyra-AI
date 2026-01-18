import { useEffect, useRef, useState } from "react";
import { ArrowRight, Sparkles, Music2, Mic, Square, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { UserProfileModal } from "@/components/UserProfileModal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useGenerateSong } from "@/hooks/useSongGeneration";
import { useUserProfile } from "@/hooks/useUserProfile";
import { transcribeAudio } from "@/lib/api/client";

import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "A cyberpunk synthwave track",
  "A cozy acoustic guitar folk song",
  "Jazz vibes for a chill party",
];

const Dashboard = () => {
  const [prompt, setPrompt] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const shouldTranscribeRef = useRef(true);

  const { toast } = useToast();
  const navigate = useNavigate();
  const generateMutation = useGenerateSong();
  const { profile } = useUserProfile();


  useEffect(() => {
    return () => {
      shouldTranscribeRef.current = false;
      if (mediaRecorderRef.current?.state && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const getRecorderMimeType = () => {
    if (typeof MediaRecorder === "undefined") return "";
    const types = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/ogg",
      "audio/wav",
    ];
    return types.find((type) => MediaRecorder.isTypeSupported(type)) || "";
  };

  const handleMicClick = async () => {
    if (isTranscribing) return;

    if (isRecording) {
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        recorder.stop();
      }
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      toast({
        title: "Microphone unavailable",
        description: "Your browser does not support audio recording.",
        variant: "destructive",
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

      const mimeType = getRecorderMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const recorderMimeType = recorder.mimeType || mimeType || "audio/webm";

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        if (!shouldTranscribeRef.current) {
          stopStream();
          return;
        }

        setIsRecording(false);
        stopStream();

        const blob = new Blob(audioChunksRef.current, {
          type: recorderMimeType,
        });

        if (!blob.size) {
          toast({
            title: "No audio captured",
            description: "Try recording again and speak clearly.",
            variant: "destructive",
          });
          return;
        }

        setIsTranscribing(true);
        try {
          const { text } = await transcribeAudio(blob);
          const trimmed = text.trim();
          if (!trimmed) {
            toast({
              title: "No transcription detected",
              description: "Try again or speak a little longer.",
              variant: "destructive",
            });
            return;
          }
          setPrompt((current) => (current ? `${current.trim()} ${trimmed}` : trimmed));
        } catch (error) {
          toast({
            title: "Transcription failed",
            description: error instanceof Error ? error.message : "Unable to transcribe audio.",
            variant: "destructive",
          });
        } finally {
          setIsTranscribing(false);
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (error) {
      stopStream();
      toast({
        title: "Microphone permission denied",
        description: "Allow microphone access to use voice input.",
        variant: "destructive",
      });
      console.error("[Dashboard] Microphone error:", error);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    try {
      const result = await generateMutation.mutateAsync({ prompt });
      navigate(`/results/${result.jobId}`);
    } catch (error) {
      toast({ title: "Error", description: "Failed to start generation.", variant: "destructive" });
    }
  };

  const isReady = prompt.trim() && !generateMutation.isPending;
  const isMicBusy = isTranscribing || generateMutation.isPending;

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full p-4 animate-in fade-in duration-700">
        <div className="flex justify-end mb-4">
          <UserProfileModal />
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="max-w-3xl w-full space-y-5">
            
            <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg hero-gradient shadow-soft">
                <Music2 className="w-4 h-4 text-primary-foreground" />
              </div>
              <p className="text-xl text-muted-foreground">Lyra</p>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-primary">
              What's on your mind{profile.name ? `, ${profile.name}` : ""}?
            </h1>
            
          </div>
          
          <div className="space-y-6">
            <div className="relative group">
              <Textarea
                placeholder="Describe your song idea..."
                className="min-h-[220px] text-lg p-4 pb-16 resize-none bg-secondary/30 hover:bg-secondary/40 focus:bg-secondary/50 border-2 focus-visible:ring-0 focus-visible:border-primary/50 rounded-3xl transition-all"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                maxLength={500}
              />
              
              {/* Suggested Queries - Bottom Left */}
              <div className="absolute bottom-4 left-4 flex flex-wrap gap-2 max-w-[80%]">
                {SUGGESTIONS.map((suggestion, index) => (
                  <button
                    key={suggestion}
                    onClick={() => setPrompt(suggestion)}
                    className="px-3 py-1 text-xs font-medium rounded-full bg-background/50 hover:bg-background text-muted-foreground hover:text-foreground border border-transparent hover:border-border transition-all whitespace-nowrap animate-glow"
                    style={{ animationDelay: `${index * 0.2}s` }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              <div className="absolute bottom-4 right-4 flex items-center gap-2">
                <Button
                  size="icon"
                  className={cn(
                    "h-10 w-10 rounded-full transition-all duration-300 shadow-md",
                    isRecording
                      ? "bg-red-500 text-white hover:bg-red-500/90"
                      : "bg-primary text-primary-foreground hover:bg-primary/90",
                    isMicBusy ? "opacity-70" : "opacity-100"
                  )}
                  onClick={handleMicClick}
                  disabled={isMicBusy}
                  aria-label={isRecording ? "Stop recording" : "Start recording"}
                >
                  {isTranscribing ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : isRecording ? (
                    <Square className="h-5 w-5" />
                  ) : (
                    <Mic className="h-5 w-5" />
                  )}
                </Button>

                <Button
                  size="icon"
                  className={cn(
                    "h-10 w-10 rounded-full transition-all duration-300 shadow-md",
                    isReady ? "opacity-100" : "opacity-40"
                  )}
                  onClick={handleGenerate}
                  disabled={!isReady}
                  aria-label="Generate song"
                >
                  {generateMutation.isPending ? (
                    <Sparkles className="h-5 w-5 animate-spin" />
                  ) : (
                    <ArrowRight className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
