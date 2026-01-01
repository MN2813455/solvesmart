
import React from 'react';
import { 
  Target, 
  Layers, 
  ListOrdered, 
  CalendarClock, 
  Search, 
  Lightbulb, 
  FileText, 
  Users, 
  Brain, 
  Zap,
  CheckCircle2,
  AlertCircle,
  Clock,
  Briefcase,
  ArrowRight,
  Send,
  Paperclip,
  Download,
  X,
  Printer,
  MessageSquare,
  Sparkles,
  ChevronRight,
  Activity,
  Mic
} from 'lucide-react';

export const Icons = {
  Target,
  Layers,
  ListOrdered,
  CalendarClock,
  Search,
  Lightbulb,
  FileText,
  Users,
  Brain,
  Zap,
  CheckCircle2,
  AlertCircle,
  Clock,
  Briefcase,
  ArrowRight,
  Send,
  Paperclip,
  Download,
  X,
  Printer,
  MessageSquare,
  Sparkles,
  ChevronRight,
  Activity,
  Mic
};

interface IconProps {
  name: keyof typeof Icons;
  size?: number;
  className?: string;
  onClick?: () => void;
}

const Icon: React.FC<IconProps> = ({ name, size = 24, className = "", onClick }) => {
  const LucideIcon = Icons[name];
  return <LucideIcon size={size} className={className} onClick={onClick} />;
};

export default Icon;
