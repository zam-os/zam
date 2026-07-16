import { describe, expect, it } from "vitest";
import {
  StudyEditError,
  deleteConfirmCommand,
  deletePreviewCommand,
  editCommand,
  removeConfirmCommand,
  removePreviewCommand,
} from "../../desktop/src/study-card-actions.js";

describe("study-card-actions", () => {
  it("builds the remove (delete-card) preview and confirm calls", () => {
    expect(removePreviewCommand("git-init")).toEqual({
      cmd: "personal-card-remove",
      args: ["--slug", "git-init"],
    });
    expect(removeConfirmCommand("git-init")).toEqual({
      cmd: "personal-card-remove",
      args: ["--slug", "git-init", "--confirm"],
    });
  });

  it("builds the outdated (delete-token) preview and confirm calls", () => {
    expect(deletePreviewCommand("git-init")).toEqual({
      cmd: "personal-card-delete",
      args: ["--slug", "git-init"],
    });
    expect(deleteConfirmCommand("git-init")).toEqual({
      cmd: "personal-card-delete",
      args: ["--slug", "git-init", "--confirm"],
    });
  });

  it("builds a partial edit call with only slug, question and concept, trimmed", () => {
    expect(
      editCommand({
        slug: "git-init",
        question: "  What inits? ",
        concept: " git init ",
      }),
    ).toEqual({
      cmd: "personal-card-update",
      args: [
        "--slug",
        "git-init",
        "--question",
        "What inits?",
        "--concept",
        "git init",
      ],
    });
  });

  it("rejects an empty concept", () => {
    try {
      editCommand({ slug: "s", question: "q", concept: "   " });
      throw new Error("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(StudyEditError);
      expect((err as StudyEditError).reason).toBe("concept-required");
    }
  });

  it("rejects an empty question", () => {
    try {
      editCommand({ slug: "s", question: "  ", concept: "c" });
      throw new Error("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(StudyEditError);
      expect((err as StudyEditError).reason).toBe("question-required");
    }
  });
});
