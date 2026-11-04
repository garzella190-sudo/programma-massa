import { 
  Clock, 
  Coffee, 
  Dumbbell, 
  Utensils, 
  Moon, 
  Zap, 
  ShieldPlus, 
  Sparkles, 
  X, 
  Loader2, 
  ChevronRight, 
  Activity, 
  Download, 
  Settings, 
  Key,
  Check,
  Flame,
  History,
  Trophy,
  Plus,
  Play,
  Square,
  MoreVertical
} from "lucide-react";
import { WorkoutIcon } from "@/types/workout";
import { LucideIcon as LucideIconType } from "lucide-react";

interface IconProps {
  name: WorkoutIcon;
  className?: string;
}

export const Icon = ({ name, className = "w-5 h-5" }: IconProps) => {
  const icons: Record<string, LucideIconType> = {
    Clock,
    Coffee,
    Dumbbell,
    Utensils,
    Moon,
    Zap,
    ShieldPlus,
    Sparkles,
    X,
    Loader2,
    ChevronRight,
    Activity,
    Download,
    Settings,
    Key,
    Check,
    Flame,
    History,
    Trophy,
    Plus,
    Play,
    Square,
    MoreVertical
  };

  const LucideIcon = icons[name] || Clock;
  
  return <LucideIcon className={className} />;
};

