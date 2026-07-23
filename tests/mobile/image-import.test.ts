import { describe, expect, it } from "vitest";
import {
  computeDownscaleSize,
  IMAGE_MAX_LONG_EDGE,
} from "../../mobile/src/image-import.js";

describe("image downscale sizing", () => {
  it("leaves already-small images alone", () => {
    expect(computeDownscaleSize(800, 600)).toEqual({ width: 800, height: 600 });
  });

  it("caps the long edge at the multimodal budget", () => {
    expect(computeDownscaleSize(4000, 3000)).toEqual({
      width: IMAGE_MAX_LONG_EDGE,
      height: Math.round((3000 * IMAGE_MAX_LONG_EDGE) / 4000),
    });
    expect(computeDownscaleSize(2000, 4000).height).toBe(IMAGE_MAX_LONG_EDGE);
  });
});
