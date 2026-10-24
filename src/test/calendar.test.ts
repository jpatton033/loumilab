import { describe, expect, it } from "vitest";
import { buildIcs, googleCalendarUrl, jobCalendarEvent, toUtcStamp } from "@/lib/orders/calendar";

const job = {
  id: "abc",
  title: "Kitchen sink repair",
  scheduled_for: "2026-11-01T14:30:00-05:00", // day DST ends in US Eastern
  service_address: "12 Main St, Akron, OH",
  businessName: "Jay's Plumbing",
  industrySlug: "home-services",
};

describe("calendar events", () => {
  it("converts offset times to UTC across the DST change", () => {
    const e = jobCalendarEvent(job)!;
    expect(toUtcStamp(e.start)).toBe("20261101T193000Z");
    expect(toUtcStamp(e.end)).toBe("20261101T203000Z");
  });

  it("returns no event when the job has no date", () => {
    expect(jobCalendarEvent({ ...job, scheduled_for: null })).toBeNull();
  });

  it("uses a stable UID so re-adding does not duplicate", () => {
    const ics = buildIcs(jobCalendarEvent(job)!, new Date("2026-10-24T00:00:00Z"));
    expect(ics).toContain("UID:job-abc@orders.loumilab.com");
    expect(ics).toContain("DTSTART:20261101T193000Z");
    expect(ics).toContain("LOCATION:12 Main St\\, Akron\\, OH");
  });

  it("puts google dates in the URL", () => {
    expect(googleCalendarUrl(jobCalendarEvent(job)!)).toContain("dates=20261101T193000Z%2F20261101T203000Z");
  });
});
