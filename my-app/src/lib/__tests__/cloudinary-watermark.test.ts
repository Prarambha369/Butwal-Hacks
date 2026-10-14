import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The gallery watermark transform, pinned.
 *
 * This exists because the transform was silently wrong for as long as it
 * shipped. Putting the positioning params (`g_`, `x_`, `y_`, `o_`) in the
 * overlay component instead of the `fl_layer_apply` component does not error —
 * Cloudinary returns HTTP 200 with a correctly resized, correctly encoded
 * image and no logo anywhere in it. Every photo uploaded through the gallery
 * during that window was unwatermarked and nothing reported a failure.
 *
 * The only way to catch this is to assert the string's shape, so the string is
 * asserted here. The live check that motivated it:
 *
 *   bad : .../l_butwal-hacks:watermark,w_140,g_south_east,x_24,y_24,o_65/fl_layer_apply/...
 *         → 1920x1280 JPEG, no logo
 *   good: .../l_butwal-hacks:watermark,w_140/fl_layer_apply,g_south_east,x_24,y_24,o_65/...
 *         → 1920x1280 JPEG, logo bottom-right
 */
const ROUTE = join(process.cwd(), "src/app/api/cloudinary-signature/route.ts");
const src = readFileSync(ROUTE, "utf8");

function galleryTransform(): string[] {
  const block = src.slice(
    src.indexOf("const galleryTransformation"),
    src.indexOf("const transformation ="),
  );
  // Only the array literal. Slicing to `.join` would otherwise pick up the "/"
  // separator as a fourth "component".
  const array = block.slice(block.indexOf("["), block.indexOf("]"));
  return [...array.matchAll(/"([^"]+)"/g)].map((m) => m[1] as string);
}

describe("gallery watermark transformation", () => {
  const components = galleryTransform();

  it("declares three chained components", () => {
    expect(components).toHaveLength(3);
  });

  it("keeps the overlay bare of positioning params", () => {
    // This is the bug. g_south_east/x_24/y_24/o_65 belong to fl_layer_apply.
    const overlay = components[1] as string;
    expect(overlay).toBe("l_butwal-hacks:watermark,w_140");
    for (const bad of ["g_", "x_", "y_", "o_"]) {
      expect(overlay).not.toContain(bad);
    }
  });

  it("carries the positioning in the fl_layer_apply component", () => {
    const apply = components[2] as string;
    expect(apply).toContain("fl_layer_apply");
    expect(apply).toContain("g_south_east");
    expect(apply).toContain("x_24");
    expect(apply).toContain("y_24");
    expect(apply).toContain("o_65");
  });

  it("resizes before overlaying, so the logo is sized against the stored asset", () => {
    expect(components[0]).toBe("w_1920,c_limit,q_auto:good");
  });

  it("uses the colon form of the overlay public_id", () => {
    // Slashes in a layer public_id must be colons; a slash here would make
    // Cloudinary read "butwal-hacks" as the layer and drop the rest.
    expect(components[1]).toContain("butwal-hacks:watermark");
  });
});
