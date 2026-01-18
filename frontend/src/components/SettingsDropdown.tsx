import { useState } from "react";
import { SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const GENRES = ["Lo-Fi", "Pop", "Jazz", "Rock", "Classical", "Ambient"];
const MOODS = ["Happy", "Melancholic", "Energetic", "Calm", "Dark", "Romantic"];

interface SettingsDropdownProps {
  genre: string;
  mood: string;
  onGenreChange: (genre: string) => void;
  onMoodChange: (mood: string) => void;
}

export function SettingsDropdown({
  genre,
  mood,
  onGenreChange,
  onMoodChange,
}: SettingsDropdownProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleGenreClick = (selectedGenre: string) => {
    // Toggle selection: if already selected, deselect it
    onGenreChange(genre === selectedGenre ? "" : selectedGenre);
  };

  const handleMoodClick = (selectedMood: string) => {
    // Toggle selection: if already selected, deselect it
    onMoodChange(mood === selectedMood ? "" : selectedMood);
  };


  return (
    <div className="w-full">
      <Button
        variant="ghost"
        size="default"
        className="gap-2"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground">Settings</span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 ml-auto text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 ml-auto text-muted-foreground" />
        )}
      </Button>

      {isExpanded && (
        <div className="mt-3 space-y-4">
          {/* Genre Section */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Genre</p>
            <div className="flex flex-wrap gap-2">
              {GENRES.map((g) => (
                <Button
                  key={g}
                  variant="outline"
                  size="sm"
                  onClick={() => handleGenreClick(g)}
                  className={cn(
                    "text-sm",
                    genre === g && "bg-primary text-primary-foreground border-primary"
                  )}
                >
                  {g}
                </Button>
              ))}
            </div>
          </div>

          {/* Mood Section */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Mood</p>
            <div className="flex flex-wrap gap-2">
              {MOODS.map((m) => (
                <Button
                  key={m}
                  variant="outline"
                  size="sm"
                  onClick={() => handleMoodClick(m)}
                  className={cn(
                    "text-sm",
                    mood === m && "bg-primary text-primary-foreground border-primary"
                  )}
                >
                  {m}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
