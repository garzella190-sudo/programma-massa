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
  Key 
} from "lucide-react";
import { WorkoutIcon } from "@/types/workout";

interface IconProps {
  name: WorkoutIcon;
  className?: string;
}

export const Icon = ({ name, className = "w-5 h-5" }: IconProps) => {
  const icons = {
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
    Key
  };

  const LucideIcon = icons[name] || Clock;
  
  return <LucideIcon className={className} />;
};
