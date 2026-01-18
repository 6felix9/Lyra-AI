import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Music, Waves, Heart, Sun, Moon, Sparkles } from "lucide-react";

const genres = [
  { id: "jazz", name: "Jazz", icon: Music },
  { id: "classical", name: "Classical", icon: Waves },
  { id: "folk", name: "Folk", icon: Heart },
  { id: "pop", name: "Pop", icon: Sun },
  { id: "ballad", name: "Ballad", icon: Moon },
  { id: "inspirational", name: "Inspirational", icon: Sparkles },
];

interface GenreSelectorProps {
  selected: string;
  onSelect: (genre: string) => void;
}

export function GenreSelector({ selected, onSelect }: GenreSelectorProps) {
  return (
    <Select value={selected} onValueChange={onSelect}>
      <SelectTrigger className="w-full h-12 bg-background/50">
        <SelectValue placeholder="Select Genre" />
      </SelectTrigger>
      <SelectContent>
        {genres.map((genre) => {
          const Icon = genre.icon;
          return (
            <SelectItem key={genre.id} value={genre.id}>
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <span>{genre.name}</span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}