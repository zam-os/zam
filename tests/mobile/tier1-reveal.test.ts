import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const file = (path: string) => readFileSync(join(process.cwd(), path), "utf-8");

describe("Tier-1 choice reveal on Mobile", () => {
  const main = file("mobile/src/main.ts");
  const session = file("mobile/src/review-session.ts");

  it("option click always reveals, and rating is blocked until then", () => {
    expect(main).toContain("revealAnswerButton.click()");
    expect(main).toContain("revealedAnswer.hidden = !reviewSession.revealed");
    expect(main).toContain("expectedAnswer.textContent = prompt.concept");
    expect(session).toContain("this.snapshot.revealed = true");
    expect(session).toContain(
      'throw new Error("Reveal the answer before rating")',
    );
    const reveal = session.slice(session.indexOf("reveal(options"));
    const body = reveal.slice(0, reveal.indexOf("async rate("));
    expect(body).not.toMatch(/correct_index|isCorrect|correctIndex/);
  });
});
