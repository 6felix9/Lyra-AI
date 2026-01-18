import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Smile, Feather, CloudMoon, Sunrise, Heart, Sparkles } from "lucide-react";

const moods = [
  { id: "joyful", name: "Joyful", icon: Smile },
  { id: "peaceful", name: "Peaceful", icon: Feather },
  { id: "nostalgic", name: "Nostalgic", icon: CloudMoon },
  { id: "hopeful", name: "Hopeful", icon: Sunrise },
  { id: "grateful", name: "Grateful", icon: Heart },
  { id: "loving", name: "Loving", icon: Sparkles },
];

interface MoodSelectorProps {
  selected: string;
  onSelect: (mood: string) => void;
}

export function MoodSelector({ selected, onSelect }: MoodSelectorProps) {
  return (
    <Select value={selected} onValueChange={onSelect}>
      <SelectTrigger className="w-full h-12 bg-background/50">
        <SelectValue placeholder="Select Mood" />
      </SelectTrigger>
      <SelectContent>
        {moods.map((mood) => {
          const Icon = mood.icon;
          return (
            <SelectItem key={mood.id} value={mood.id}>
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <span>{mood.name}</span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}