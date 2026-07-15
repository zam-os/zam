import { describe, expect, it } from "vitest";
import { isTransientRemoteDatabaseError } from "../../src/kernel/db/connection.js";

/**
 * Classifier behind the native→HTTP autorepair fallback (issue #163): a
 * native libsql websocket connection that hits a transient server/network
 * failure should be retried over the HTTP provider, while real SQL errors
 * must keep surfacing unchanged.
 */
describe("transient remote database error classification", () => {
  it("classifies the Turso websocket 502 as transient", () => {
    expect(
      isTransientRemoteDatabaseError(
        new Error(
          'Hrana: `api error: `status=502 Bad Gateway, body={"error":"upstream forward failed"}``',
        ),
      ),
    ).toBe(true);
  });

  it("classifies Hrana(Api(...)) debug-formatted errors as transient", () => {
    expect(
      isTransientRemoteDatabaseError(
        new Error(
          'Hrana(Api("status=502 Bad Gateway, body={\\"error\\":\\"upstream forward failed\\"}"))',
        ),
      ),
    ).toBe(true);
  });

  it("classifies websocket/stream failures as transient", () => {
    expect(
      isTransientRemoteDatabaseError(new Error("websocket connection closed")),
    ).toBe(true);
    expect(
      isTransientRemoteDatabaseError(new Error("stream closed by server")),
    ).toBe(true);
  });

  it("classifies network-level failures as transient", () => {
    expect(
      isTransientRemoteDatabaseError(
        new Error("connect ETIMEDOUT 1.2.3.4:443"),
      ),
    ).toBe(true);
    expect(
      isTransientRemoteDatabaseError(new Error("getaddrinfo ENOTFOUND x.y")),
    ).toBe(true);
  });

  it("does not classify SQL and constraint errors as transient", () => {
    expect(
      isTransientRemoteDatabaseError(
        new Error("UNIQUE constraint failed: tokens.slug"),
      ),
    ).toBe(false);
    expect(
      isTransientRemoteDatabaseError(new Error("no such table: tokens")),
    ).toBe(false);
    expect(
      isTransientRemoteDatabaseError(
        new Error("status=401 Unauthorized, body=..."),
      ),
    ).toBe(false);
  });

  it("handles non-Error values without throwing", () => {
    expect(isTransientRemoteDatabaseError("boom")).toBe(false);
    expect(isTransientRemoteDatabaseError(null)).toBe(false);
  });
});
