import { useHistory, useDeleteSong } from "@/hooks/useSongGeneration";
import DashboardLayout from "@/components/DashboardLayout";
import { HistorySongCard } from "@/components/HistorySongCard";
import { useToast } from "@/hooks/use-toast";
import { Music, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const History = () => {
  const { data: songs, isLoading, error, refetch } = useHistory();
  const deleteMutation = useDeleteSong();
  const { toast } = useToast();

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast({
        title: "Song deleted",
        description: "The song has been removed from your history.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete the song.",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="container max-w-6xl mx-auto py-8 px-4 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Your History</h1>
            <p className="text-muted-foreground mt-1">
              Listen back to your generated songs and memories.
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
            <h3 className="text-lg font-semibold text-foreground">Failed to load history</h3>
            <p className="text-muted-foreground mt-2 mb-6">
              There was an issue connecting to the database.
            </p>
            <Button onClick={() => refetch()}>Try Again</Button>
          </div>
        ) : !songs || songs.length === 0 ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="bg-muted/30 border border-dashed border-border rounded-2xl p-12 text-center max-w-md">
              <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Music className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold">No songs yet</h3>
              <p className="text-muted-foreground mt-2 mb-8">
                Start generating music to see your creations appear here.
              </p>
              <Button asChild>
                <Link to="/dashboard">Generate My First Song</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {songs.map((song) => (
              <HistorySongCard
                key={song.id}
                song={song}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default History;
