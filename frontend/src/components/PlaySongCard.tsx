import { Calendar, Play, Timer } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { PlaceholderSong } from "@/data/placeholderSongs";

const formatDate = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch (error) {
    return "Unknown Date";
  }
};

const formatDuration = (durationMs: number) => {
  const totalSeconds = Math.round(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

type PlaySongCardProps = {
  song: PlaceholderSong;
};

export function PlaySongCard({ song }: PlaySongCardProps) {
  return (
    <div className="flex items-center justify-between gap-4 p-4 border border-border bg-card rounded-lg hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <Badge variant="secondary" className="capitalize shrink-0">
          {song.genre}
        </Badge>
        <Badge variant="outline" className="capitalize shrink-0">
          {song.mood}
        </Badge>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold truncate">{song.title}</h3>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Timer className="h-4 w-4" />
              {formatDuration(song.durationMs)}
            </span>
            <span>{song.bpm} BPM</span>
          </div>
        </div>
        <div className="flex items-center text-sm text-muted-foreground shrink-0">
          <Calendar className="w-4 h-4 mr-1" />
          {formatDate(song.createdAt)}
        </div>
      </div>

      <Button variant="hero" size="sm" className="rounded-full" asChild>
        <Link to={`/play/${song.id}`}>
          <Play className="w-4 h-4 mr-2" />
          Play
        </Link>
      </Button>
    </div>
  );
}
