// @vitest-environment happy-dom

import { describe, expect, it, vi } from "vitest";
import {
  cloudinaryDownloadUrl,
  displayPhotoUrl,
  fallBackToWebmOnDecodeError,
  isVideoUrl,
  videoPlaybackUrl,
  videoPosterUrl,
  videoSources,
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
  });

  it("forces .mp4 so Firefox accepts the MIME type", () => {
    // Cloudinary serves a stored .mov as Content-Type: video/quicktime;codecs=avc1.
    // Firefox rejects H.264 in a QuickTime container with "No video with
    // supported format and MIME type found" while Chrome and Safari play it.
    // The same asset requested as .mp4 comes back video/mp4;codecs=avc1.
    expect(videoPlaybackUrl(VIDEO_MOV, 800)).toMatch(/\.mp4$/);
  });

  it("does not append a second extension when the asset is already .mp4", () => {
    expect(videoPlaybackUrl(VIDEO_MP4, 800)).toMatch(/\.mp4$/);
    expect(videoPlaybackUrl(VIDEO_MP4, 800)).not.toContain(".mp4.mp4");
  });

  it("drops the no-op c_limit crop mode", () => {
    // c_limit needs both dimensions; with width alone it is a byte-for-byte
    // no-op, so sending it only misleads the next reader.
    expect(videoPlaybackUrl(VIDEO_MP4, 800)).not.toContain("c_limit");
  });

  it("preserves the original path and version", () => {
    expect(videoPlaybackUrl(VIDEO_MP4, 800)).toContain("v123/daydream-butwal/dsc_1076");
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

  it("downloads a transcoded .mp4 instead of the original .mov", () => {
    const mov = `${CLOUD}/video/upload/v123/hackday-butwal/mvi_5296.mov`;
    expect(cloudinaryDownloadUrl(mov)).toBe(
      `${CLOUD}/video/upload/fl_attachment/vc_h264,q_auto/v123/hackday-butwal/mvi_5296.mp4`,
    );
  });

  it("is unchanged for images", () => {
    expect(cloudinaryDownloadUrl(IMAGE)).toContain("/image/upload/fl_attachment/");
  });

  it("does not double-apply fl_attachment", () => {
    const once = cloudinaryDownloadUrl(VIDEO_MP4);
    expect(cloudinaryDownloadUrl(once)).toBe(once);
  });
});

describe("videoSources", () => {
  it("offers H.264 MP4 first, typed with a codec so canPlayType can reject it", () => {
    const [mp4] = videoSources(VIDEO_MOV, 1600);
    expect(mp4.src).toBe(videoPlaybackUrl(VIDEO_MOV, 1600));
    expect(mp4.type).toMatch(/^video\/mp4; codecs="avc1\./);
  });

  it("labels the MP4 as High profile, matching what vc_h264 actually encodes", () => {
    // Verified with ffprobe on res.cloudinary.com: vc_h264 serves High@4.0
    // (1600px) and High@3.0 (640px). A Baseline label (avc1.42E01E) let
    // Firefox's Baseline-only OpenH264 claim the MP4, fail to decode it, and
    // never fall back to the WebM.
    const [mp4] = videoSources(VIDEO_MOV, 1600);
    expect(mp4.type).toBe('video/mp4; codecs="avc1.640028"');
  });

  it("falls back to VP9 WebM for browsers without an H.264 decoder", () => {
    // Firefox on Linux without a usable system libavcodec cannot decode
    // H.264 at all and shows "No video with supported format and MIME type
    // found" even for a correct video/mp4 response.
    const [, webm] = videoSources(VIDEO_MOV, 1600);
    expect(webm.src).toBe(`${CLOUD}/video/upload/w_1600,vc_vp9,q_auto/v123/daydream-butwal/dsc_1075.webm`);
    expect(webm.type).toBe('video/webm; codecs="vp9"');
  });

  it("returns the URL alone when it is not a transformable Cloudinary video", () => {
    expect(videoSources(IMAGE, 1600)).toEqual([{ src: IMAGE }]);
  });
});

describe("fallBackToWebmOnDecodeError", () => {
  function player(currentSrc: string, error: unknown) {
    const video = document.createElement("video");
    for (const s of videoSources(VIDEO_MOV, 1600)) {
      const source = document.createElement("source");
      source.src = s.src;
      if (s.type) source.setAttribute("type", s.type);
      video.appendChild(source);
    }
    Object.defineProperty(video, "currentSrc", { value: currentSrc });
    Object.defineProperty(video, "error", { value: error });
    video.load = vi.fn();
    return video;
  }

  /**
   * A player that models the playback state the spec defines for load() and
   * play(): load() sets `paused` back to true (and drops pending play()
   * promises), play() sets it to false. That is the behaviour the CodeRabbit
   * review caught: retagging and reloading alone left a playing video paused.
   */
  function statefulPlayer(currentSrc: string, initiallyPaused: boolean) {
    const video = player(currentSrc, { code: 3 });
    let paused = initiallyPaused;
    Object.defineProperty(video, "paused", { get: () => paused });
    Object.defineProperty(video, "ended", { value: false });
    const calls: string[] = [];
    video.load = vi.fn(() => {
      calls.push("load");
      paused = true;
    });
    video.play = vi.fn(() => {
      calls.push("play");
      paused = false;
      return Promise.resolve();
    });
    return { video, calls };
  }

  it("keeps a playing video playing across the WebM reload", () => {
    const [mp4] = videoSources(VIDEO_MOV, 640);
    const { video, calls } = statefulPlayer(mp4.src, false);
    fallBackToWebmOnDecodeError({ currentTarget: video });
    // play() must come after load(): played before, the reload would undo it.
    expect(calls).toEqual(["load", "play"]);
    expect(video.paused).toBe(false);
  });

  it("leaves a paused video paused across the WebM reload", () => {
    const [mp4] = videoSources(VIDEO_MOV, 1600);
    const { video, calls } = statefulPlayer(mp4.src, true);
    fallBackToWebmOnDecodeError({ currentTarget: video });
    expect(calls).toEqual(["load"]);
    expect(video.paused).toBe(true);
  });

  it("handles a rejected resume instead of leaking an unhandled rejection", () => {
    const [mp4] = videoSources(VIDEO_MOV, 640);
    const { video } = statefulPlayer(mp4.src, false);
    const resume = { catch: vi.fn() };
    video.play = vi.fn(() => resume as unknown as Promise<void>);
    fallBackToWebmOnDecodeError({ currentTarget: video });
    expect(resume.catch).toHaveBeenCalledTimes(1);
  });

  it("retags the MP4 and reloads when the MP4 failed to decode", () => {
    const [mp4] = videoSources(VIDEO_MOV, 1600);
    const video = player(mp4.src, { code: 3 });
    fallBackToWebmOnDecodeError({ currentTarget: video });
    expect(video.querySelector('source[type^="video/mp4"]')).toBeNull();
    expect(video.querySelector('source[type^="video/webm"]')).not.toBeNull();
    expect(video.load).toHaveBeenCalledTimes(1);
  });

  it("does nothing when the WebM itself failed, so it cannot loop", () => {
    const [, webm] = videoSources(VIDEO_MOV, 1600);
    const video = player(webm.src, { code: 3 });
    fallBackToWebmOnDecodeError({ currentTarget: video });
    expect(video.load).not.toHaveBeenCalled();
  });
});
