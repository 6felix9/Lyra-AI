import { useState } from "react";
import { User, Heart } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUserProfile } from "@/hooks/useUserProfile";
import { cn } from "@/lib/utils";
import { useHistory } from "@/hooks/useSongGeneration";
import { HistorySongCard } from "./HistorySongCard";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";

const GENRES = ["Lo-Fi", "Pop", "Jazz", "Rock", "Classical", "Ambient"];
const MOODS = ["Happy", "Melancholic", "Energetic", "Calm", "Dark", "Romantic"];

export function UserProfileModal() {
  const { profile, updateProfile } = useUserProfile();
  const { data: history } = useHistory();
  const [open, setOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: profile.name,
    age: profile.age,
    about: profile.about,
    preferredGenres: profile.preferredGenres,
    preferredMoods: profile.preferredMoods,
  });

  const handleSave = () => {
    updateProfile(formData);
    setOpen(false);
  };

  const toggleGenre = (genre: string) => {
    setFormData((prev) => ({
      ...prev,
      preferredGenres: prev.preferredGenres.includes(genre)
        ? prev.preferredGenres.filter((g) => g !== genre)
        : [...prev.preferredGenres, genre],
    }));
  };

  const toggleMood = (mood: string) => {
    setFormData((prev) => ({
      ...prev,
      preferredMoods: prev.preferredMoods.includes(mood)
        ? prev.preferredMoods.filter((m) => m !== mood)
        : [...prev.preferredMoods, mood],
    }));
  };

  const likedSongs = history?.filter((song) => profile.likedSongIds.includes(song.id)) || [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 border border-border">
          <User className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <User className="h-6 w-6 text-primary" />
            User Profile
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1">
          <div className="p-6">
            <div className="space-y-8 pb-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Your name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="Your age"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="about">About You</Label>
              <Textarea
                id="about"
                placeholder="Tell us about yourself and your musical taste..."
                className="min-h-[100px] resize-none"
                value={formData.about}
                onChange={(e) => setFormData({ ...formData, about: e.target.value })}
              />
            </div>

            {/* Preferences */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-base font-semibold">Preferred Genres</Label>
                <div className="flex flex-wrap gap-2">
                  {GENRES.map((genre) => (
                    <Button
                      key={genre}
                      variant="outline"
                      size="sm"
                      onClick={() => toggleGenre(genre)}
                      className={cn(
                        "rounded-full transition-all",
                        formData.preferredGenres.includes(genre) && 
                        "bg-primary text-primary-foreground border-primary"
                      )}
                    >
                      {genre}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold">Preferred Moods</Label>
                <div className="flex flex-wrap gap-2">
                  {MOODS.map((mood) => (
                    <Button
                      key={mood}
                      variant="outline"
                      size="sm"
                      onClick={() => toggleMood(mood)}
                      className={cn(
                        "rounded-full transition-all",
                        formData.preferredMoods.includes(mood) && 
                        "bg-primary text-primary-foreground border-primary"
                      )}
                    >
                      {mood}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Liked Songs */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500 fill-red-500" />
                <Label className="text-base font-semibold">Liked Songs</Label>
                <Badge variant="secondary" className="ml-auto">
                  {likedSongs.length}
                </Badge>
              </div>
              
              <div className="space-y-3">
                {likedSongs.length > 0 ? (
                  likedSongs.map((song) => (
                    <HistorySongCard key={song.id} song={song} onDelete={() => {}} />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground italic text-center py-4 border border-dashed rounded-lg">
                    No liked songs yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
        </ScrollArea>

        <DialogFooter className="p-6 pt-2 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
