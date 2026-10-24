import { CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { buildIcs, googleCalendarUrl, outlookCalendarUrl, type CalendarEvent } from "@/lib/orders/calendar";

const downloadIcs = (event: CalendarEvent) => {
  const blob = new Blob([buildIcs(event)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${event.uid}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

/** Universal Add to Calendar menu — no account or connection needed. */
const AddToCalendar = ({ event, size = "sm" }: { event: CalendarEvent; size?: "sm" | "default" }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button size={size} variant="outline" className="min-h-11 rounded-full sm:min-h-0">
        <CalendarPlus size={15} className="mr-1.5" /> Add to Calendar
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem asChild>
        <a href={googleCalendarUrl(event)} target="_blank" rel="noopener noreferrer">Google Calendar</a>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <a href={outlookCalendarUrl(event)} target="_blank" rel="noopener noreferrer">Outlook Calendar</a>
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={() => downloadIcs(event)}>Apple Calendar (.ics)</DropdownMenuItem>
      <DropdownMenuItem onSelect={() => downloadIcs(event)}>Other calendar (.ics)</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

export default AddToCalendar;
