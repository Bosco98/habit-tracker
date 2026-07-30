import { describe, expect, it } from "vitest";
import { inviteBaseUrl, RELEASES_URL, WEB_APP_URL } from "./links";

describe("public links", () => {
  it("uses the canonical web app for desktop and production invites", () => {
    expect(inviteBaseUrl()).toBe("https://habit-tracker.fun/app");
    expect(WEB_APP_URL).toBe("https://habit-tracker.fun/app");
    expect(RELEASES_URL).toBe(
      "https://github.com/Bosco98/habit-tracker/releases/latest",
    );
  });

  it("keeps localhost invites inside the development app", () => {
    expect(
      inviteBaseUrl({
        hostname: "127.0.0.1",
        origin: "http://127.0.0.1:5173",
      }),
    ).toBe("http://127.0.0.1:5173/app");
  });
});
