import DashboardLayout from "@/components/DashboardLayout";
import { PlaySongCard } from "@/components/PlaySongCard";
import { placeholderSongs } from "@/data/placeholderSongs";
import { Gamepad2 } from "lucide-react";

const Play = () => {
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

        <div className="space-y-2">
          {placeholderSongs.map((song) => (
            <PlaySongCard key={song.id} song={song} />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Play;
