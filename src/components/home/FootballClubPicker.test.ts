import { describe, expect, it } from "vitest";
import { clubOutlookHref } from "./football-club-link";

describe("club outlook links", () => {
  it("opens the chosen club's existing localized outlook", () => {
    expect(clubOutlookHref("pt", "arouca")).toBe("/pt/desporto/liga/arouca");
    expect(clubOutlookHref("en", "benfica")).toBe("/en/desporto/liga/benfica");
  });
});
