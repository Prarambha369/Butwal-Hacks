// @vitest-environment happy-dom

import { describe, it, expect, afterEach, vi, beforeEach } from "vitest";
import { render, cleanup, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const { fill, loader, alt, ...rest } = props;
    return (
      // eslint-disable-next-line @next/next/no-img-element -- test double for next/image
      <img
        alt={alt as string}
        data-fill={fill ? "true" : undefined}
        data-loader={loader ? "cloudinary" : undefined}
        {...rest}
      />
    );
  },
}));

// The real dialog crops on a canvas; the double hands back a 16:9 crop of the
// chosen type so the upload path runs end to end.
vi.mock("@/components/image-crop-dialog", () => ({
  default: (props: { file: File; onConfirm: (b: Blob) => void; aspectRatio: number }) => (
    <div data-testid="crop-dialog" data-aspect={props.aspectRatio}>
      <button onClick={() => props.onConfirm(new Blob([new ArrayBuffer(2048)], { type: props.file.type }))}>
        Apply crop
      </button>
    </div>
  ),
}));

const updateEventBanner = vi.fn();
vi.mock("@/lib/actions/events", () => ({
  updateEventBanner: (...args: unknown[]) => updateEventBanner(...args),
}));

import { BannerUploadButton } from "@/components/organizer/banner-upload-button";

let xhr: {
  open: ReturnType<typeof vi.fn>;
  send: ReturnType<typeof vi.fn>;
  abort: ReturnType<typeof vi.fn>;
  upload: { onprogress: null };
  onload: (() => void) | null;
  onerror: (() => void) | null;
  onabort: (() => void) | null;
  status: number;
  responseText: string;
};
let sentForm: FormData | null = null;

beforeEach(() => {
  sentForm = null;
  globalThis.XMLHttpRequest = function MockXHR() {
    xhr = {
      open: vi.fn(),
      send: vi.fn((body: FormData) => {
        sentForm = body;
        xhr.status = 200;
        xhr.responseText = JSON.stringify({
          secure_url: "https://res.cloudinary.com/demo-cloud/image/upload/v1/butwal-hacks/auth0|me/new.jpg",
          public_id: "butwal-hacks/auth0|me/new",
        });
        queueMicrotask(() => xhr.onload?.());
      }),
      abort: vi.fn(),
      upload: { onprogress: null },
      onload: null,
      onerror: null,
      onabort: null,
      status: 0,
      responseText: "",
    };
    return xhr;
  } as unknown as typeof XMLHttpRequest;

  vi.spyOn(globalThis, "fetch").mockResolvedValue({
    ok: true,
    json: () =>
      Promise.resolve({
        signature: "sig",
        timestamp: 1,
        cloudName: "demo-cloud",
        apiKey: "key",
        folder: "butwal-hacks/auth0|me",
        uploadParams: { allowed_formats: "jpg,png,webp" },
      }),
  } as Response);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  updateEventBanner.mockReset();
  refresh.mockReset();
});

const fileInput = () => screen.getByTestId("cloudinary-file-input") as HTMLInputElement;
const file = (type: string, size: number, name = "banner") => new File([new ArrayBuffer(size)], name, { type });

describe("BannerUploadButton", () => {
  it("only offers JPG, PNG and WebP in the file picker", () => {
    render(<BannerUploadButton eventId="event-1" eventTitle="HackDay" currentBannerUrl={null} />);
    expect(fileInput()).toHaveAttribute("accept", "image/jpeg,image/png,image/webp");
    expect(screen.getByText("No banner yet")).toBeInTheDocument();
  });

  it("uploads, crops to 16:9, saves the public_id and refreshes the page", async () => {
    updateEventBanner.mockResolvedValue({
      success: true,
      banner_url: "https://res.cloudinary.com/demo-cloud/image/upload/v1/butwal-hacks/auth0|me/new.jpg",
      removed: false,
    });
    render(<BannerUploadButton eventId="event-1" eventTitle="HackDay" currentBannerUrl={null} />);

    fireEvent.change(fileInput(), { target: { files: [file("image/jpeg", 300_000)] } });
    expect(screen.getByTestId("crop-dialog")).toHaveAttribute("data-aspect", String(16 / 9));
    fireEvent.click(screen.getByText("Apply crop"));

    await waitFor(() => expect(updateEventBanner).toHaveBeenCalledWith("event-1", "butwal-hacks/auth0|me/new"));
    // The signed restriction travels with the upload.
    expect(sentForm?.get("allowed_formats")).toBe("jpg,png,webp");
    expect(await screen.findByText(/Banner saved/)).toBeInTheDocument();
    expect(screen.getByAltText("HackDay banner")).toBeInTheDocument();
    expect(refresh).toHaveBeenCalled();
  });

  it("rejects a GIF before anything is uploaded", () => {
    render(<BannerUploadButton eventId="event-1" currentBannerUrl={null} />);
    fireEvent.change(fileInput(), { target: { files: [file("image/gif", 1000)] } });
    expect(screen.getByRole("alert")).toHaveTextContent("Banners must be a JPG, PNG or WebP image.");
    expect(screen.queryByTestId("crop-dialog")).not.toBeInTheDocument();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("rejects a file over 5 MB before anything is uploaded", () => {
    render(<BannerUploadButton eventId="event-1" currentBannerUrl={null} />);
    fireEvent.change(fileInput(), { target: { files: [file("image/png", 6 * 1024 * 1024)] } });
    expect(screen.getByRole("alert")).toHaveTextContent("6.0 MB");
    expect(screen.queryByTestId("crop-dialog")).not.toBeInTheDocument();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("shows the server's refusal and keeps the old banner", async () => {
    updateEventBanner.mockResolvedValue({ success: false, error: "Only the event organizer can change its banner." });
    render(
      <BannerUploadButton
        eventId="event-1"
        eventTitle="HackDay"
        currentBannerUrl="https://res.cloudinary.com/demo-cloud/image/upload/v1/old.jpg"
      />,
    );
    fireEvent.change(fileInput(), { target: { files: [file("image/webp", 1000)] } });
    fireEvent.click(screen.getByText("Apply crop"));
    expect(await screen.findByRole("alert")).toHaveTextContent("Only the event organizer");
    expect(screen.getByAltText("HackDay banner")).toHaveAttribute(
      "src",
      "https://res.cloudinary.com/demo-cloud/image/upload/v1/old.jpg",
    );
    expect(refresh).not.toHaveBeenCalled();
  });

  it("offers Replace and Remove once a banner exists", async () => {
    updateEventBanner.mockResolvedValue({ success: true, banner_url: null, removed: true });
    render(<BannerUploadButton eventId="event-1" currentBannerUrl="https://res.cloudinary.com/demo-cloud/image/upload/v1/old.jpg" />);
    expect(screen.getByRole("button", { name: /Replace banner/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Remove banner" }));
    await waitFor(() => expect(updateEventBanner).toHaveBeenCalledWith("event-1", ""));
    expect(await screen.findByText("Banner removed.")).toBeInTheDocument();
  });
});
