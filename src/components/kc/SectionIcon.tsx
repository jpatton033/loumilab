import * as Icons from "lucide-react";
import { BookOpen, LucideIcon } from "lucide-react";

interface SectionIconProps {
  name?: string | null;
  size?: number;
  className?: string;
}

const SectionIcon = ({ name, size = 20, className }: SectionIconProps) => {
  const registry = Icons as unknown as Record<string, LucideIcon>;
  const Cmp = (name && registry[name]) || BookOpen;
  return <Cmp size={size} strokeWidth={1.75} className={className} />;
};

export default SectionIcon;
