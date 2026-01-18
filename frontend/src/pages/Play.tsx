import DashboardLayout from "@/components/DashboardLayout";
import { PlaySongCard } from "@/components/PlaySongCard";
import { useHistory } from "@/hooks/useSongGeneration";
import { Gamepad2, Loader2, AlertCircle, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Play = () => {
  const { data: songs, isLoading, error, refetch } = useHistory();

  // Filter to only show completed songs
  const completedSongs = songs?.filter((song) => song.status === "completed") ?? [];

  return (
    <DashboardLayout>
      <div className="container max-w-6xl mx-auto py-8 px-4 h-full overflow-y-auto animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="p-1.5 rounded-lg hero-gradient shadow-soft">
                <Gamepad2 className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-sm uppercase tracking-[0.2em]">Playground</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight mt-2">Play Your Songs</h1>
            <p className="text-muted-foreground mt-1">
              Jump into a quick piano tiles session for any generated track.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">Loading your music library...</p>
          </div>
        ) : error ? (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-8 text-center max-w-md mx-auto">
            <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground">Failed to load songs</h3>
            <p className="text-muted-foreground mt-2 mb-6">
              There was an issue connecting to the database.
            </p>
            <Button onClick={() => refetch()}>Try Again</Button>
          </div>
        ) : completedSongs.length === 0 ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="bg-muted/30 border border-dashed border-border rounded-2xl p-12 text-center max-w-md">
              <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Music className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold">No songs yet</h3>
              <p className="text-muted-foreground mt-2 mb-8">
                Generate a song first to play piano tiles.
              </p>
              <Button asChild>
                <Link to="/dashboard">Generate My First Song</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {completedSongs.map((song) => (
              <PlaySongCard key={song.id} song={song} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Play;
