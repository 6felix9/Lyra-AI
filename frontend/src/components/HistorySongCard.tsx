import { Eye, Trash2, Calendar, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { HistorySong } from "@/lib/api/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import { Badge } from "./ui/badge";
import { useUserProfile } from "@/hooks/useUserProfile";
import { cn } from "@/lib/utils";

interface HistorySongCardProps {
  song: HistorySong;
  onDelete: (id: string) => void;
}

export function HistorySongCard({ song, onDelete }: HistorySongCardProps) {
  const navigate = useNavigate();
  const { profile, toggleLikedSong } = useUserProfile();
  const isLiked = profile.likedSongIds.includes(song.id);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch (e) {
      return "Unknown Date";
    }
  };

  return (
    <div className="flex items-center justify-between gap-4 p-4 border border-border bg-card rounded-lg hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {song.genre && (
          <Badge variant="secondary" className="capitalize shrink-0">
            {song.genre}
          </Badge>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold truncate">
            {song.prompt}
          </h3>
        </div>
        <div className="flex items-center text-sm text-muted-foreground shrink-0">
          <Calendar className="w-4 h-4 mr-1" />
          {formatDate(song.created_at)}
        </div>
      </div>
      
      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => toggleLikedSong(song.id)}
          className={cn(
            "rounded-full transition-colors",
            isLiked ? "text-red-500 hover:text-red-600 hover:bg-red-50" : "text-muted-foreground"
          )}
        >
          <Heart className={cn("w-4 h-4", isLiked && "fill-current")} />
        </Button>

        <Button
          variant="hero"
          size="sm"
          onClick={() => navigate(`/results/${song.job_id}`)}
          className="rounded-full"
        >
          <Eye className="w-4 h-4 mr-2" />
          View
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
              <Trash2 className="w-4 h-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this song from your history. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(song.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
