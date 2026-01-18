import { useMemo, useState, useEffect, useRef } from "react";
import { Loader2, Play, Pause, ChevronLeft, ChevronRight } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useJobStatus } from "@/hooks/useSongGeneration";
import { getAudioUrl } from "@/lib/api/client";
import type { WordTiming } from "@/lib/api/types";

const Results = () => {
    const { jobId } = useParams<{ jobId: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [lyrics, setLyrics] = useState("");
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
    const [wordTimings, setWordTimings] = useState<WordTiming[]>([]);
    const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
    
    // Track previous status and jobId to detect transitions
    const previousStatusRef = useRef<string | null>(null);
    const currentJobIdRef = useRef<string | null>(null);

    const { data: jobData } = useJobStatus(jobId || null, !!jobId);

    // Reset tracking when jobId changes
    useEffect(() => {
        if (jobId !== currentJobIdRef.current) {
            currentJobIdRef.current = jobId || null;
            previousStatusRef.current = null;
            setWordTimings([]);
        }
    }, [jobId]);

    // Update lyrics, audio URL, and word timings when job data changes
    useEffect(() => {
        if (jobData) {
            if (jobData.lyrics) setLyrics(jobData.lyrics);
            if (jobData.audioUrl) setAudioUrl(getAudioUrl(jobData.audioUrl));
            if (jobData.wordTimings) setWordTimings(jobData.wordTimings);

            const previousStatus = previousStatusRef.current;
            const currentStatus = jobData.status;

            // Only show toast if status transitions from "processing" to "completed"
            // This prevents showing toast when viewing completed songs from history
            // (where previousStatus would be null and currentStatus is already "completed")
            if (currentStatus === "completed" && previousStatus === "processing") {
                toast({
                    title: "Song Created!",
                    description: "Your song is ready.",
                });
            }

            if (currentStatus === "failed") {
                toast({
                    title: "Error",
                    description: jobData.error || "Failed to generate song.",
                    variant: "destructive",
                });
            }

            // Update previous status for next comparison
            previousStatusRef.current = currentStatus;
        }
    }, [jobData, toast]);

    // Audio player setup
    useEffect(() => {
        if (audioUrl) {
            const audio = new Audio(audioUrl);
            audio.playbackRate = playbackSpeed;
            setAudioElement(audio);

            audio.addEventListener('loadedmetadata', () => setDuration(audio.duration));
            audio.addEventListener('timeupdate', () => setProgress(audio.currentTime));
            audio.addEventListener('ended', () => setIsPlaying(false));

            return () => {
                audio.pause();
                audio.remove();
            };
        }
    }, [audioUrl]);
    
    // Update playback rate when speed changes
    useEffect(() => {
        if (audioElement) {
            audioElement.playbackRate = playbackSpeed;
        }
    }, [playbackSpeed, audioElement]);

    const lyricTokens = useMemo(() => {
        if (!lyrics) return [];
        const tokens = lyrics.split(/(\s+)/);
        let wordIndex = 0;

        return tokens.map((token, index) => {
            const isWhitespace = /^\s+$/.test(token);
            if (isWhitespace) {
                return { token, isWhitespace: true, key: `ws-${index}` };
            }
            const assignedIndex = wordIndex;
            wordIndex += 1;
            return { token, isWhitespace: false, wordIndex: assignedIndex, key: `word-${index}` };
        });
    }, [lyrics]);

    // Check if a word has been sung (progress >= word start time)
    const isWordSung = useMemo(() => {
        if (!wordTimings.length) return new Set<number>();
        const sungWords = new Set<number>();
        wordTimings.forEach((timing, index) => {
            if (progress >= timing.start) {
                sungWords.add(index);
            }
        });
        return sungWords;
    }, [progress, wordTimings]);

    const togglePlay = () => {
        if (!audioElement) return;
        if (isPlaying) {
            audioElement.pause();
        } else {
            audioElement.play();
        }
        setIsPlaying(!isPlaying);
    };

    const seek = (value: number[]) => {
        if (audioElement) {
            audioElement.currentTime = value[0];
            setProgress(value[0]);
        }
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const decreasePlaybackSpeed = () => {
        setPlaybackSpeed(prev => Math.max(0.25, prev - 0.25));
    };

    const increasePlaybackSpeed = () => {
        setPlaybackSpeed(prev => Math.min(2.0, prev + 0.25));
    };

    const handleNewSong = () => {
        if (audioElement) {
            audioElement.pause();
            setAudioElement(null);
        }
        navigate('/dashboard');
    };

    // Redirect if no job ID
    if (!jobId) {
        navigate('/dashboard');
        return null;
    }

    // Loading state - only show for actual processing, not when loading completed history items
    if (!jobData || jobData.status === "processing") {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center h-full space-y-6 animate-in fade-in duration-500">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                        <Loader2 className="h-16 w-16 animate-spin text-primary relative z-10" />
                    </div>
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl font-medium">Creating your masterpiece...</h2>
                        <p className="text-muted-foreground animate-pulse">
                            {jobData?.lyrics && !jobData?.audioUrl ? "Composing melody..." : "Writing lyrics..."}
                        </p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    // Error state
    if (jobData.status === "failed") {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center h-full space-y-6">
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl font-medium">Generation Failed</h2>
                        <p className="text-muted-foreground">
                            {jobData.error || "Something went wrong while generating your song."}
                        </p>
                    </div>
                    <Button onClick={handleNewSong}>
                        <ChevronLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                    </Button>
                </div>
            </DashboardLayout>
        );
    }

    // Success state - display results
    return (
        <DashboardLayout>
            <div className="relative flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="absolute top-4 left-4 md:top-6 md:left-6 z-20">
                    <Button variant="ghost" size="sm" onClick={handleNewSong} className="text-muted-foreground hover:text-foreground">
                        <ChevronLeft className="mr-2 h-4 w-4" /> New Song
                    </Button>
                </div>
                {/* Scrollable Lyrics Area */}
                <div className="flex-1 overflow-y-auto p-6 md:p-12 text-center">
                    <div className="max-w-2xl mx-auto space-y-8 pb-48">
                        <div className="space-y-2">
                            <h2 className="text-xl font-medium text-muted-foreground uppercase tracking-widest">
                                Your Song
                            </h2>
                            <div className="h-1 w-20 bg-primary/30 mx-auto rounded-full" />
                        </div>

                        <div className="whitespace-pre-wrap text-2xl md:text-3xl font-medium leading-relaxed text-foreground/90 font-serif">
                            {!lyrics && "Lyrics not available."}
                            {!!lyrics && wordTimings.length === 0 && lyrics}
                            {!!lyrics && wordTimings.length > 0 && (
                                <span>
                                    {lyricTokens.map((token) => {
                                        if (token.isWhitespace) {
                                            return <span key={token.key}>{token.token}</span>;
                                        }

                                        const isSung = token.wordIndex !== undefined && isWordSung.has(token.wordIndex);
                                        return (
                                            <span
                                                key={token.key}
                                                className={`transition-all duration-200 ${isSung ? "text-primary font-bold" : "text-foreground/70"}`}
                                            >
                                                {token.token}
                                            </span>
                                        );
                                    })}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sticky Bottom Player */}
                <div className="fixed bottom-0 left-0 right-0 z-10 bg-background/80 backdrop-blur-lg border-t p-4 md:p-6 pb-8">
                    <div className="max-w-3xl mx-auto flex flex-col gap-4">
                        {/* Progress Bar */}
                        <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground">
                            <span>{formatTime(progress)}</span>
                            <Slider
                                value={[progress]}
                                max={duration || 100}
                                step={0.1}
                                onValueChange={seek}
                                className="flex-1 cursor-pointer"
                            />
                            <span>{formatTime(duration)}</span>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-center">
                            <div className="flex items-center gap-4">
                                <Button 
                                    size="icon" 
                                    variant="ghost"
                                    className="h-10 w-10" 
                                    onClick={decreasePlaybackSpeed}
                                    aria-label="Decrease playback speed"
                                >
                                    <ChevronLeft className="h-5 w-5" />
                                </Button>
                                <Button size="icon" className="h-12 w-12 rounded-full shadow-lg" onClick={togglePlay}>
                                    {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
                                </Button>
                                <Button 
                                    size="icon" 
                                    variant="ghost"
                                    className="h-10 w-10" 
                                    onClick={increasePlaybackSpeed}
                                    aria-label="Increase playback speed"
                                >
                                    <ChevronRight className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout >
    );
};

export default Results;
