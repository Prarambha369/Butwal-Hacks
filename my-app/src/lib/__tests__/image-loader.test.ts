import { describe, expect, it } from "vitest";
import imageLoader, { cloudinaryUrl } from "../image-loader";

const CLD = "https://res.cloudinary.com/demo/image/upload";

describe("imageLoader", () => {
  it("adds sizing to a plain Cloudinary URL", () => {
    expect(imageLoader({ src: `${CLD}/v1712/events/a.jpg`, width: 640 })).toBe(
      `${CLD}/w_640,c_limit,f_auto,q_auto/v1712/events/a.jpg`,
    );
  });

  it("keeps existing transformations and runs sizing after them", () => {
    expect(cloudinaryUrl(`${CLD}/c_fill,g_face,w_400,h_400/v1/p.png`, 256, 80)).toBe(
      `${CLD}/c_fill,g_face,w_400,h_400/w_256,c_limit,f_auto,q_80/v1/p.png`,
    );
  });

  it("does not treat a folder name as a transformation", () => {
    expect(cloudinaryUrl(`${CLD}/bh_photos/x.jpg`, 320)).toBe(
      `${CLD}/w_320,c_limit,f_auto,q_auto/bh_photos/x.jpg`,
    );
  });

  it("leaves non-image Cloudinary URLs alone", () => {
    const src = "https://res.cloudinary.com/demo/video/upload/v1/clip.mp4";
    expect(imageLoader({ src, width: 640 })).toBe(src);
  });

  it("sizes Unsplash images with query params", () => {
    const out = new URL(imageLoader({ src: "https://images.unsplash.com/photo-1?x=1", width: 828 }));
    expect(out.searchParams.get("w")).toBe("828");
    expect(out.searchParams.get("auto")).toBe("format");
    expect(out.searchParams.get("x")).toBe("1");
  });

  it("serves local and other remote images as is", () => {
    expect(imageLoader({ src: "/logo.png", width: 64 })).toBe("/logo.png");
    const avatar = "https://avatars.githubusercontent.com/u/1";
    expect(imageLoader({ src: avatar, width: 64 })).toBe(avatar);
  });
});
