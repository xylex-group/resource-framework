import { describe, expect, it } from "vitest";
import {
  formatUnixSecondsToDate,
  formatUnixSecondsToMonthDayTime,
} from "../apps/demo/src/lib/date-utils";

describe("demo date formatting", () => {
  it("formats dates consistently across server and browser time zones", () => {
    const timestamp = Date.parse("2024-12-01T10:00:00.000Z") / 1000;

    expect(formatUnixSecondsToDate(timestamp)).toBe("2024-12-01");
    expect(formatUnixSecondsToMonthDayTime(timestamp)).toBe("Dec 1, 10:00 AM");
  });
});
