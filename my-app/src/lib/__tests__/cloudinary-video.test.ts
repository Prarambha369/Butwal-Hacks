import { describe, expect, it } from "vitest";
import {
  cloudinaryDownloadUrl,
  displayPhotoUrl,
  isVideoUrl,
  videoPlaybackUrl,
  videoPosterUrl,
} from "../cloudinary-url";

const CLOUD = "https://res.cloudinary.com/rs6xky5b";
const IMAGE = `${CLOUD}/image/upload/v123/daydream-butwal/ijfuxrqorqfq3lsyhttl.jpg`;
const VIDEO_MOV = `${CLOUD}/video/upload/v123/daydream-butwal/dsc_1075.mov`;
const VIDEO_MP4 = `${CLOUD}/video/upload/v123/daydream-butwal/dsc_1076.mp4`;

describe("isVideoUrl", () => {
  it("detects video delivery paths", () => {
    expect(isVideoUrl(VIDEO_MOV)).toBe(true);
    expect(isVideoUrl(VIDEO_MP4)).toBe(true);
  });

  it("does not mistake images for video", () => {
    expect(isVideoUrl(IMAGE)).toBe(false);
  });

  it("is safe on null, undefined, and junk", () => {
    expect(isVideoUrl(null)).toBe(false);
    expect(isVideoUrl(undefined)).toBe(false);
    expect(isVideoUrl("")).toBe(false);
    expect(isVideoUrl("/local/photo.jpg")).toBe(false);
  });

  it("does not treat an image URL ending in .mp4 as video", () => {
    // Belt and braces: the resource type in the path is the truth. An
    // image/upload asset with a video extension is a mis-stored upload, and
    // treating it as video would hide the bug rather than show it.
    expect(isVideoUrl(`${CLOUD}/image/upload/v123/x.mp4`)).toBe(false);
  });
});

describe("videoPosterUrl", () => {
  it("derives a jpg still from the video delivery path", () => {
    const poster = videoPosterUrl(VIDEO_MOV, 800);
    // The v123 version segment is preserved: pinning the version is what makes
    // the poster stable instead of re-deriving from whatever is current.
    expect(poster).toBe(
      `${CLOUD}/video/upload/so_1,w_800,c_limit,q_auto,f_jpg/v123/daydream-butwal/dsc_1075.jpg`,
    );
  });

  it("strips the source extension regardless of format", () => {
    expect(videoPosterUrl(VIDEO_MP4, 400)).toContain("dsc_1076.jpg");
    expect(videoPosterUrl(VIDEO_MP4, 400)).not.toContain(".mp4");
  });

  it("returns null for an image", () => {
    expect(videoPosterUrl(IMAGE, 800)).toBeNull();
  });

  it("uses a non-zero start offset by default", () => {
    // so_0 on a camera clip is usually a black frame mid-fade-in.
    expect(videoPosterUrl(VIDEO_MP4, 800)).toContain("so_1");
  });

  it("falls back to a sane width for invalid input", () => {
    expect(videoPosterUrl(VIDEO_MP4, 0)).toContain("w_800");
    expect(videoPosterUrl(VIDEO_MP4, NaN)).toContain("w_800");
    expect(videoPosterUrl(VIDEO_MP4, -5)).toContain("w_800");
  });
});

describe("videoPlaybackUrl", () => {
  it("requests an h264 rendition so browsers can actually play it", () => {
    // .mov from an iPhone is ProRes/HEVC; without vc_h264 it will not play
    // in Chrome or Firefox.
    const url = videoPlaybackUrl(VIDEO_MOV, 800);
    expect(url).toContain("vc_h264");
    expect(url).toContain("w_800");
    expect(url).toContain("c_limit");
  });

  it("preserves the original path and version", () => {
    expect(videoPlaybackUrl(VIDEO_MP4, 800)).toContain("v123/daydream-butwal/dsc_1076.mp4");
  });

  it("passes through an image untouched", () => {
    expect(videoPlaybackUrl(IMAGE, 800)).toBe(IMAGE);
  });

  it("does not double-transform a URL that already has one", () => {
    const once = videoPlaybackUrl(VIDEO_MP4, 800);
    expect(videoPlaybackUrl(once, 1600)).toBe(once);
  });
});

describe("displayPhotoUrl with video", () => {
  it("returns a POSTER, not the mp4, because callers render <img>", () => {
    // This is the silent-breakage guard: handing an <img> a .mp4 renders a
    // broken tile with no error anywhere.
    const out = displayPhotoUrl(VIDEO_MP4, null, 800);
    expect(out).not.toContain(".mp4");
    expect(out).toContain("f_jpg");
  });

  it("ignores the recipe for video", () => {
    // OPTIMIZE_RECIPES are image transforms (q_auto,f_auto,e_auto_enhance);
    // splicing them into a video poster URL would be nonsense.
    const out = displayPhotoUrl(VIDEO_MP4, "q_auto,f_auto", 800);
    expect(out).toContain("f_jpg");
  });

  it("still sizes images with their recipe", () => {
    expect(displayPhotoUrl(IMAGE, "q_auto:eco,f_auto", 800)).toContain(
      "w_800,q_auto:eco,f_auto",
    );
  });
});

describe("cloudinaryDownloadUrl with video", () => {
  it("keeps the video resource type in the path", () => {
    // Splicing an image fl_attachment onto a video URL 404s.
    const url = cloudinaryDownloadUrl(VIDEO_MP4);
    expect(url).toContain("/video/upload/fl_attachment/");
    expect(url).not.toContain("/image/upload/");
  });

  it("is unchanged for images", () => {
    expect(cloudinaryDownloadUrl(IMAGE)).toContain("/image/upload/fl_attachment/");
  });

  it("does not double-apply fl_attachment", () => {
    const once = cloudinaryDownloadUrl(VIDEO_MP4);
    expect(cloudinaryDownloadUrl(once)).toBe(once);
  });
});
