import { describe, expect, it } from "vitest";
import { encodeCloudinaryMetadata, pickDefinedMetadata } from "@/lib/cloudinary-metadata";

/**
 * The upload `metadata` parameter is a `key=value|key=value` string, not JSON.
 * Sending JSON made Cloudinary split the payload at the `|` inside an Auth0
 * `sub` (`auth0|<hex>`) and reject every avatar upload with
 * "Metadata External IDs do not exist" for the two fragments. The encoding is
 * asserted exactly because the failure is silent until Cloudinary sees it.
 */
describe("encodeCloudinaryMetadata", () => {
  it("encodes a single field", () => {
    expect(encodeCloudinaryMetadata({ entity_type: "avatar" })).toBe("entity_type=avatar");
  });

  it("joins fields with an unescaped pipe", () => {
    expect(
      encodeCloudinaryMetadata({ entity_type: "avatar", bh_id: "BH-26-010" }),
    ).toBe("entity_type=avatar|bh_id=BH-26-010");
  });

  it("escapes the pipe inside an Auth0 subject", () => {
    const encoded = encodeCloudinaryMetadata({
      entity_type: "avatar",
      bh_id: "BH-26-010",
      uploader_auth0_id: "auth0|6aee1150b02056fc67531651",
    });

    expect(encoded).toBe(
      "entity_type=avatar|bh_id=BH-26-010|uploader_auth0_id=auth0\\|6aee1150b02056fc67531651",
    );
    // The regression: one segment per field, not one per pipe character.
    expect(encoded.split(/(?<!\\)\|/)).toHaveLength(3);
  });

  it("escapes an equals sign inside a value", () => {
    expect(encodeCloudinaryMetadata({ caption: "a=b" })).toBe("caption=a\\=b");
  });

  it("returns an empty string when there is nothing to attach", () => {
    expect(encodeCloudinaryMetadata({})).toBe("");
  });
});

describe("pickDefinedMetadata", () => {
  it("drops fields the product environment does not define", () => {
    expect(
      pickDefinedMetadata(
        { entity_type: "avatar", bh_id: "BH-26-010" },
        new Set(["entity_type"]),
      ),
    ).toEqual({ entity_type: "avatar" });
  });

  it("returns nothing when no fields are defined", () => {
    expect(pickDefinedMetadata({ entity_type: "avatar" }, new Set())).toEqual({});
  });
});
