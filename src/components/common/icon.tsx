import {
  Activity,
  AlertCircle,
  Archive,
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  Book,
  Bookmark,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coffee,
  Compass,
  Copy,
  Disc,
  Download,
  Droplets,
  FileText,
  Flame,
  Gauge,
  Home,
  Info,
  Layers,
  Minus,
  NotebookPen,
  Pause,
  Pencil,
  Play,
  Plus,
  Repeat,
  RotateCcw,
  Save,
  Scale,
  Settings,
  Share2,
  SkipForward,
  SlidersHorizontal,
  Smartphone,
  Star,
  Thermometer,
  Timer,
  Trash2,
  Upload,
  X,
  XCircle,
  type LucideIcon,
} from 'lucide-react-native';

const ICON_MAP = {
  activity: Activity,
  home: Home,
  timer: Timer,
  'book-open': BookOpen,
  book: Book,
  bookmark: Bookmark,
  disc: Disc,
  gauge: Gauge,
  'notebook-pen': NotebookPen,
  settings: Settings,
  sliders: SlidersHorizontal,
  smartphone: Smartphone,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  'chevron-down': ChevronDown,
  'arrow-right': ArrowRight,
  'arrow-left': ArrowLeft,
  compare: ArrowLeftRight,
  close: X,
  'x-circle': XCircle,
  plus: Plus,
  minus: Minus,
  play: Play,
  pause: Pause,
  repeat: Repeat,
  reset: RotateCcw,
  save: Save,
  'skip-forward': SkipForward,
  check: Check,
  'check-circle': CheckCircle2,
  star: Star,
  copy: Copy,
  trash: Trash2,
  edit: Pencil,
  share: Share2,
  download: Download,
  upload: Upload,
  coffee: Coffee,
  droplets: Droplets,
  thermometer: Thermometer,
  scale: Scale,
  clock: Clock,
  'alert-circle': AlertCircle,
  info: Info,
  'file-text': FileText,
  compass: Compass,
  flame: Flame,
  layers: Layers,
  archive: Archive,
} as const satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICON_MAP;

interface AppIconProps {
  name: IconName;
  size?: number;
  color: string;
  strokeWidth?: number;
  filled?: boolean;
}

export function AppIcon({
  name,
  size = 18,
  color,
  strokeWidth = 1.65,
  filled = false,
}: AppIconProps) {
  const Component = ICON_MAP[name];
  return (
    <Component
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      fill={filled ? color : 'none'}
    />
  );
}
