import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft, ChevronLeft, ChevronRight, Pause, Play, RotateCcw, Trophy, Loader2, AlertCircle } from "lucide-react";
import { getPianoTilesChart } from "@/lib/api/client";
import { analyzeBeatDetection } from "@/utils/beatDetection";
import type { PianoTilesChart, PianoTileNote } from "@/lib/api/types";
import { API_BASE_URL } from "@/lib/api/constants";

type GamePhase = "loading" | "ready" | "playing" | "ended";

type Tile = {
  id: string;
  note: PianoTileNote;
  y: number;
  height: number;
};

const TILE_HEIGHT = 80;
const HIT_LINE_OFFSET = 100;
const HIT_WINDOW_MS = 250;
const FALL_DURATION_MS = 2000;

const formatDuration = (durationMs: number) => {
  const totalSeconds = Math.round(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const formatElapsed = (elapsedMs: number) => {
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const PianoTiles = () => {
  const { songId } = useParams<{ songId: string }>();
  const navigate = useNavigate();

  const [phase, setPhase] = useState<GamePhase>("loading");
  const [chart, setChart] = useState<PianoTilesChart | null>(null);
  const [notes, setNotes] = useState<PianoTileNote[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [activeLane, setActiveLane] = useState<number | null>(null);
  const laneTimeoutRef = useRef<number | null>(null);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [laneHeight, setLaneHeight] = useState(0);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);
  const gameStartTimeRef = useRef<number | null>(null);
  const nextNoteIndexRef = useRef<number>(0);
  const activeTilesRef = useRef<Map<Tile, Tile>>(new Map());

  // Calculate speed based on board height
  const speedPxPerMs = useMemo(() => {
    if (!laneHeight) return 0;
    const travelDistance = laneHeight - HIT_LINE_OFFSET;
    const speed = travelDistance / FALL_DURATION_MS;
    console.log('[PianoTiles] Speed calculation:', {
      laneHeight,
      travelDistance,
      fallDuration: FALL_DURATION_MS,
      speedPxPerMs: speed,
    });
    return speed;
  }, [laneHeight]);

  const hitLineY = Math.max(0, laneHeight - HIT_LINE_OFFSET);

  // Load chart data and audio
  useEffect(() => {
    if (!songId) {
      setError("No song ID provided");
      setPhase("ready");
      return;
    }

    let cancelled = false;

    const loadChart = async () => {
      try {
        // Fetch chart data
        const chartData = await getPianoTilesChart(songId);
        if (cancelled) return;

        setChart(chartData);

        // Fetch and decode audio
        // audioUrl from backend is relative path like /api/audio/:jobId
        const audioUrl = chartData.audioUrl.startsWith("http")
          ? chartData.audioUrl
          : `${API_BASE_URL}${chartData.audioUrl}`;

        const audioResponse = await fetch(audioUrl);
        if (!audioResponse.ok) {
          throw new Error("Failed to fetch audio");
        }

        const audioBlob = await audioResponse.blob();
        const audioArrayBuffer = await audioBlob.arrayBuffer();

        // Initialize audio context and decode
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const audioBuffer = await audioContext.decodeAudioData(audioArrayBuffer);

        if (cancelled) return;

        // Run beat detection
        const detectedNotes = await analyzeBeatDetection(audioBuffer);
        console.log('[PianoTiles] Beat detection complete:', {
          noteCount: detectedNotes.length,
          firstNotes: detectedNotes.slice(0, 5),
          audioDuration: audioBuffer.duration,
        });
        setNotes(detectedNotes);

        // Create audio element for playback
        const audioUrlObj = URL.createObjectURL(audioBlob);
        const audioElement = new Audio(audioUrlObj);
        audioRef.current = audioElement;

        if (cancelled) {
          URL.revokeObjectURL(audioUrlObj);
          return;
        }

        setPhase("ready");
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load song");
        setPhase("ready");
      }
    };

    loadChart();

    return () => {
      cancelled = true;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, [songId]);

  // Track board height
  useEffect(() => {
    const element = boardRef.current;
    if (!element) return;
    const updateSize = () => setLaneHeight(element.clientHeight);
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    return () => observer.disconnect();
  }, [phase]);

  // Update elapsed time during gameplay
  useEffect(() => {
    if (phase !== "playing" || !gameStartTimeRef.current) return;

    const timer = window.setInterval(() => {
      if (gameStartTimeRef.current) {
        const elapsed = performance.now() - gameStartTimeRef.current;
        setElapsedMs(elapsed);
      }
    }, 100);

    return () => window.clearInterval(timer);
  }, [phase]);

  // Spawn tiles based on detected notes
  useEffect(() => {
    if (phase !== "playing" || !laneHeight || notes.length === 0 || !gameStartTimeRef.current || speedPxPerMs === 0) return;

    const update = (time: number) => {
      if (!gameStartTimeRef.current) return;

      const elapsed = time - gameStartTimeRef.current;

      // Collect new tiles to spawn
      const newTiles: Tile[] = [];
      while (
        nextNoteIndexRef.current < notes.length &&
        elapsed >= notes[nextNoteIndexRef.current].tMs - FALL_DURATION_MS
      ) {
        const note = notes[nextNoteIndexRef.current];
        console.log('[PianoTiles] Spawning tile:', {
          index: nextNoteIndexRef.current,
          noteTime: note.tMs,
          spawnTime: note.tMs - FALL_DURATION_MS,
          elapsed,
          lane: note.lane,
        });
        const tile: Tile = {
          id: `${note.tMs}-${nextNoteIndexRef.current}`,
          note,
          y: 0, // Will be recalculated below
          height: TILE_HEIGHT,
        };
        activeTilesRef.current.set(tile, tile);
        newTiles.push(tile);
        nextNoteIndexRef.current++;
      }
      
      if (nextNoteIndexRef.current === 0 && elapsed < 1000) {
        console.log('[PianoTiles] Game loop tick:', {
          elapsed,
          nextNoteIndex: nextNoteIndexRef.current,
          totalNotes: notes.length,
          firstNoteSpawnTime: notes[0] ? notes[0].tMs - FALL_DURATION_MS : 'N/A',
        });
      }

      // Update all tiles (existing + new) in a single state update
      setTiles((prev) => {
        // Combine existing and new tiles, avoiding duplicates by ID
        const tileMap = new Map<string, Tile>();
        prev.forEach((tile) => tileMap.set(tile.id, tile));
        newTiles.forEach((tile) => tileMap.set(tile.id, tile));

        const allTiles = Array.from(tileMap.values());
        const updated: Tile[] = [];
        let missesToAdd = 0;

        for (const tile of allTiles) {
          const spawnTime = tile.note.tMs - FALL_DURATION_MS;
          const y = (elapsed - spawnTime) * speedPxPerMs * playbackSpeed;

          const tileCenter = y + tile.height / 2;
          if (tileCenter > hitLineY + HIT_LINE_OFFSET) {
            missesToAdd += 1;
            // Try to delete from activeTilesRef (may not work due to object reference, but that's okay)
            activeTilesRef.current.delete(tile);
            continue;
          }

          updated.push({ ...tile, y });
        }

        if (missesToAdd > 0) {
          setMisses((current) => current + missesToAdd);
        }

        if (updated.length > 0 && Math.random() < 0.1) {
          console.log('[PianoTiles] Active tiles:', {
            count: updated.length,
            sample: updated.slice(0, 2).map(t => ({ lane: t.note.lane, y: t.y })),
          });
        }

        return updated;
      });

      // Check if game should end
      if (chart && elapsed >= chart.durationMs) {
        setElapsedMs(chart.durationMs);
        setPhase("ended");
        return;
      }

      animationFrameRef.current = window.requestAnimationFrame(update);
    };

    animationFrameRef.current = window.requestAnimationFrame(update);

    return () => {
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [phase, laneHeight, notes, speedPxPerMs, hitLineY, chart, playbackSpeed]);

  // Handle keyboard input for hit detection
  useEffect(() => {
    if (phase !== "playing" || !laneHeight) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const laneIndex = ["1", "2", "3", "4"].indexOf(event.key);
      if (laneIndex === -1) return;

      if (!gameStartTimeRef.current) return;
      const now = performance.now();
      const elapsed = now - gameStartTimeRef.current;

      let bestTile: Tile | null = null;
      let smallestDiff = Infinity;

      for (const tile of activeTilesRef.current.keys()) {
        if (tile.note.lane !== laneIndex) continue;

        const diff = Math.abs(tile.note.tMs - elapsed);
        if (diff < HIT_WINDOW_MS && diff < smallestDiff) {
          smallestDiff = diff;
          bestTile = tile;
        }
      }

      if (bestTile) {
        activeTilesRef.current.delete(bestTile);
        setTiles((prev) => prev.filter((t) => t.id !== bestTile!.id));
        setHits((current) => current + 10);
      } else {
        setMisses((current) => current + 1);
      }

      setActiveLane(laneIndex);
      if (laneTimeoutRef.current) {
        window.clearTimeout(laneTimeoutRef.current);
      }
      laneTimeoutRef.current = window.setTimeout(() => {
        setActiveLane(null);
      }, 150);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (laneTimeoutRef.current) {
        window.clearTimeout(laneTimeoutRef.current);
      }
    };
  }, [phase, laneHeight]);

  const handleStart = () => {
    if (!chart || notes.length === 0) return;

    console.log('[PianoTiles] Starting game:', {
      noteCount: notes.length,
      laneHeight,
      speedPxPerMs,
      hitLineY,
      chartDuration: chart.durationMs,
      firstFewNotes: notes.slice(0, 3),
    });

    setHits(0);
    setMisses(0);
    setElapsedMs(0);
    setTiles([]);
    nextNoteIndexRef.current = 0;
    activeTilesRef.current.clear();
    gameStartTimeRef.current = performance.now();
    setPhase("playing");

    // Start audio playback
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((err) => {
        console.error("Error playing audio:", err);
      });
    }
  };

  const handlePause = () => {
    setPhase("ended");
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const decreasePlaybackSpeed = () => {
    setPlaybackSpeed((prev) => Math.max(0.25, Number((prev - 0.25).toFixed(2))));
  };

  const increasePlaybackSpeed = () => {
    setPlaybackSpeed((prev) => Math.min(2.0, Number((prev + 0.25).toFixed(2))));
  };

  if (phase === "loading") {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <h2 className="text-2xl font-semibold">Loading song...</h2>
          <p className="text-muted-foreground">Analyzing beats and preparing game</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !chart) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <h2 className="text-2xl font-semibold">Failed to load song</h2>
          <p className="text-muted-foreground">{error || "Song not found"}</p>
          <Button variant="outline" onClick={() => navigate("/play")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Play
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const progress = Math.min(elapsedMs / chart.durationMs, 1);
  const accuracy = hits + misses > 0 ? Math.round((hits / (hits + misses)) * 100) : 0;

  return (
    <DashboardLayout>
      <div className="relative h-full overflow-hidden">
        <div className="absolute inset-0 soft-gradient" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.5),_transparent_55%)]" />

        <div className="relative h-full px-6 py-6 pb-28">
          <div className="relative h-full">
            <div ref={boardRef} className="relative h-full max-w-5xl mx-auto">
              <div
                className={cn(
                  "grid grid-cols-4 gap-3 h-full rounded-[28px] border border-border/60 bg-card/60 p-4 shadow-soft transition-all duration-300",
                  phase !== "playing" && "blur-sm"
                )}
              >
                {Array.from({ length: 4 }).map((_, laneIndex) => (
                  <div
                    key={`lane-${laneIndex}`}
                    className={cn(
                      "relative rounded-2xl border border-border/70 bg-background/40 overflow-hidden",
                      activeLane === laneIndex && "ring-2 ring-primary/60 shadow-glow"
                    )}
                  >
                    <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-primary/15 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-primary/20 to-transparent" />

                    {tiles
                      .filter((tile) => tile.note.lane === laneIndex)
                      .map((tile) => (
                        <div
                          key={tile.id}
                          className="absolute left-1/2 -translate-x-1/2 w-[70%] rounded-2xl border border-primary/40 bg-primary/30 shadow-soft"
                          style={{ top: tile.y, height: tile.height }}
                        />
                      ))}

                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[80%] h-1.5 rounded-full bg-primary/40" />
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-10 h-10 rounded-xl border border-border bg-background/70 flex items-center justify-center text-sm font-semibold text-muted-foreground">
                      {laneIndex + 1}
                    </div>
                  </div>
                ))}
              </div>

              <div className="absolute top-4 right-4 flex items-center gap-3 rounded-2xl border border-border/60 bg-background/80 px-3 py-2 text-xs text-muted-foreground shadow-soft backdrop-blur-sm">
                <span>
                  Hits: <span className="text-foreground font-semibold">{hits}</span>
                </span>
                <span>
                  Misses: <span className="text-foreground font-semibold">{misses}</span>
                </span>
                <span className="font-mono text-foreground">
                  {formatElapsed(elapsedMs)} / {formatDuration(chart.durationMs)}
                </span>
              </div>

              <div className="absolute left-6 right-6 top-2 h-1 rounded-full bg-muted/60 overflow-hidden">
                <div
                  className="h-full hero-gradient transition-all duration-200"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {phase !== "playing" && (
          <div className="absolute inset-0 flex items-center justify-center px-6">
            <div className="w-full max-w-md rounded-3xl border border-border bg-background/85 p-8 shadow-medium backdrop-blur-sm">
              {phase === "ready" ? (
                <div className="space-y-5 text-center">
                  <div className="mx-auto w-14 h-14 rounded-2xl hero-gradient flex items-center justify-center shadow-glow">
                    <Play className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-semibold">Ready to play?</h2>
                    <p className="text-muted-foreground">
                      {chart.title || "Song"} • {notes.length} tiles detected
                    </p>
                    {chart.genre && (
                      <p className="text-sm text-muted-foreground">
                        {chart.genre} • {chart.mood || ""} • {chart.bpm} BPM
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button variant="hero" onClick={handleStart} disabled={notes.length === 0}>
                      Start Game
                    </Button>
                    <Button variant="outline" onClick={() => navigate("/play")}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5 text-center">
                  <div className="mx-auto w-14 h-14 rounded-2xl warm-gradient flex items-center justify-center shadow-glow">
                    <Trophy className="w-6 h-6 text-accent-foreground" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-semibold">Run complete</h2>
                    <p className="text-muted-foreground">
                      {formatElapsed(elapsedMs)} played • {accuracy}% accuracy
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl border border-border bg-secondary/40 p-4">
                      <p className="text-muted-foreground">Hits</p>
                      <p className="text-xl font-semibold text-foreground">{hits}</p>
                    </div>
                    <div className="rounded-2xl border border-border bg-secondary/40 p-4">
                      <p className="text-muted-foreground">Misses</p>
                      <p className="text-xl font-semibold text-foreground">{misses}</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button variant="hero" onClick={handleStart}>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Play Again
                    </Button>
                    <Button variant="outline" onClick={() => navigate("/play")}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Play
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-border bg-background/80 backdrop-blur-lg">
          <div className="max-w-4xl mx-auto flex items-center justify-center px-4 py-3 md:px-6 md:py-4">
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
              <Button
                size="icon"
                className="h-12 w-12 rounded-full shadow-lg"
                onClick={phase === "playing" ? handlePause : handleStart}
                aria-label={phase === "playing" ? "Pause game" : "Start game"}
              >
                {phase === "playing" ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
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
    </DashboardLayout>
  );
};

export default PianoTiles;
