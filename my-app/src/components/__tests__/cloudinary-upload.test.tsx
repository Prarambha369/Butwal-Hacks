// @vitest-environment happy-dom

import { describe, it, expect, afterEach, vi, beforeEach } from "vitest";
import { render, cleanup, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { CloudinaryUpload } from "@/components/cloudinary-upload";

// ── Mock next/image ───────────────────────────────────────────────
vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const { fill, alt, ...rest } = props;
    // eslint-disable-next-line @next/next/no-img-element -- mock returns native img to avoid circular dep
    return <img alt={alt as string} data-fill={fill ? "true" : undefined} {...rest} />;
  },
}));

// ── Mock ImageCropDialog ──────────────────────────────────────────
vi.mock("@/components/image-crop-dialog", () => ({
  default: (props: { onConfirm: () => void; onCancel: () => void; aspectRatio: number }) => {
    return (
      <div data-testid="crop-dialog">
        <span>Adjust Profile Photo</span>
        <span>aspect: {props.aspectRatio}</span>
        <button data-testid="crop-confirm" onClick={props.onConfirm}>
          Apply &amp; Upload
        </button>
        <button data-testid="crop-cancel" onClick={props.onCancel}>
          Cancel
        </button>
      </div>
    );
  },
}));

// ── Mock XMLHttpRequest ───────────────────────────────────────────
// happy-dom has its own XHR implementation that we replace globally.
// We use a plain function as the constructor — when called with `new`,
// JavaScript uses the returned object (since it's an object, not primitive).
let mockXHRInstance: {
  open: ReturnType<typeof vi.fn>;
  send: ReturnType<typeof vi.fn>;
  abort: ReturnType<typeof vi.fn>;
  upload: { onprogress: ((e: { lengthComputable: boolean; loaded: number; total: number }) => void) | null };
  onload: (() => void) | null;
  onerror: (() => void) | null;
  onabort: (() => void) | null;
  status: number;
  responseText: string;
  readyState: number;
};

function createMockXHR() {
  const instance = {
    open: vi.fn(),
    send: vi.fn(),
    abort: vi.fn(),
    upload: { onprogress: null as ((e: { lengthComputable: boolean; loaded: number; total: number }) => void) | null },
    onload: null as (() => void) | null,
    onerror: null as (() => void) | null,
    onabort: null as (() => void) | null,
    status: 200,
    responseText: "",
    readyState: 4,
  };
  mockXHRInstance = instance;
  return instance;
}

beforeEach(() => {
  mockXHRInstance = undefined as any;
  globalThis.XMLHttpRequest = createMockXHR as unknown as typeof XMLHttpRequest;
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// ── Helpers ───────────────────────────────────────────────────────
const defaultProps = {
  onUpload: vi.fn(),
  onError: vi.fn(),
};

function createMockFile(name = "test.png", size = 1024, type = "image/png"): File {
  return new File([new ArrayBuffer(size)], name, { type });
}

function getFileInput(): HTMLInputElement {
  return document.querySelector('input[type="file"]') as HTMLInputElement;
}

function mockSignatureApi() {
  vi.spyOn(globalThis, "fetch").mockResolvedValue({
    ok: true,
    json: () =>
      Promise.resolve({
        signature: "test-sig",
        timestamp: 1234567890,
        cloudName: "demo",
        apiKey: "key",
        folder: "butwal-hacks/test-user",
      }),
  } as Response);
}

function selectFileAndConfirmCrop() {
  const fileInput = getFileInput();
  fireEvent.change(fileInput, { target: { files: [createMockFile("photo.png")] } });
  fireEvent.click(screen.getByTestId("crop-confirm"));
}

// ─────────────────────────────────────────────────────────────────────
// Render States
// ─────────────────────────────────────────────────────────────────────
describe("CloudinaryUpload — Render States", () => {
  it("renders upload button with default label when no image is provided", () => {
    render(<CloudinaryUpload {...defaultProps} />);

    expect(screen.getByText("Upload")).toBeInTheDocument();
    expect(screen.queryByAltText("Uploaded")).not.toBeInTheDocument();
  });

  it("renders custom label text", () => {
    render(<CloudinaryUpload {...defaultProps} label="Upload Avatar" />);

    expect(screen.getByText("Upload Avatar")).toBeInTheDocument();
  });

  it("renders image preview when currentImage is provided", () => {
    render(
      <CloudinaryUpload
        {...defaultProps}
        currentImage="https://res.cloudinary.com/demo/image/upload/v1/avatar.jpg"
      />
    );

    expect(screen.getByAltText("Uploaded")).toBeInTheDocument();
    expect(screen.getByTitle("Remove image")).toBeInTheDocument();
    expect(screen.queryByText("Upload")).not.toBeInTheDocument();
  });

  it("renders '1:1' badge for avatar entity type", () => {
    render(<CloudinaryUpload {...defaultProps} entityType="avatar" />);

    // The badge text "1:1" is part of a longer text node: "1:1 — crop after select"
    expect(screen.getByText(/1:1/)).toBeInTheDocument();
    expect(screen.queryByText(/16:9/)).not.toBeInTheDocument();
  });

  it("renders '16:9' badge for non-avatar entity types", () => {
    render(<CloudinaryUpload {...defaultProps} entityType="event_banner" />);

    expect(screen.getByText(/16:9/)).toBeInTheDocument();
    expect(screen.queryByText(/1:1/)).not.toBeInTheDocument();
  });

  it("defaults to '16:9' when entityType is not set", () => {
    render(<CloudinaryUpload {...defaultProps} />);

    expect(screen.getByText(/16:9/)).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────
// File Validation
// ─────────────────────────────────────────────────────────────────────
describe("CloudinaryUpload — File Validation", () => {
  it("calls onError when file exceeds 10MB", () => {
    const onError = vi.fn();
    render(<CloudinaryUpload {...defaultProps} onError={onError} />);

    const largeFile = createMockFile("large.png", 11 * 1024 * 1024);
    fireEvent.change(getFileInput(), { target: { files: [largeFile] } });

    expect(onError).toHaveBeenCalledWith(expect.stringContaining("10MB"));
  });

  it("calls onError when file is not an image", () => {
    const onError = vi.fn();
    render(<CloudinaryUpload {...defaultProps} onError={onError} />);

    const textFile = createMockFile("doc.pdf", 1024, "application/pdf");
    fireEvent.change(getFileInput(), { target: { files: [textFile] } });

    expect(onError).toHaveBeenCalledWith("Please select an image file");
  });

  it("opens crop dialog when a valid image is selected", () => {
    render(<CloudinaryUpload {...defaultProps} />);

    fireEvent.change(getFileInput(), { target: { files: [createMockFile("photo.png")] } });

    expect(screen.getByTestId("crop-dialog")).toBeInTheDocument();
    expect(screen.getByText("Adjust Profile Photo")).toBeInTheDocument();
  });

  it("does nothing when no file is selected (null files)", () => {
    render(<CloudinaryUpload {...defaultProps} />);

    fireEvent.change(getFileInput(), { target: { files: null } });

    expect(screen.queryByTestId("crop-dialog")).not.toBeInTheDocument();
    expect(defaultProps.onError).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────
// Crop Dialog Integration
// ─────────────────────────────────────────────────────────────────────
describe("CloudinaryUpload — Crop Dialog", () => {
  it("passes 1:1 aspect ratio for avatar entityType", () => {
    render(<CloudinaryUpload {...defaultProps} entityType="avatar" />);

    fireEvent.change(getFileInput(), { target: { files: [createMockFile("avatar.png")] } });

    expect(screen.getByText("aspect: 1")).toBeInTheDocument();
  });

  it("passes 16:9 aspect ratio for event_banner entityType", () => {
    render(<CloudinaryUpload {...defaultProps} entityType="event_banner" />);

    fireEvent.change(getFileInput(), { target: { files: [createMockFile("banner.png")] } });

    expect(screen.getByText("aspect: 1.7777777777777777")).toBeInTheDocument();
  });

  it("closes crop dialog on cancel", () => {
    render(<CloudinaryUpload {...defaultProps} />);

    fireEvent.change(getFileInput(), { target: { files: [createMockFile("photo.png")] } });
    expect(screen.getByTestId("crop-dialog")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("crop-cancel"));
    expect(screen.queryByTestId("crop-dialog")).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────
// Upload States
// ─────────────────────────────────────────────────────────────────────
describe("CloudinaryUpload — Upload States", () => {
  it("calls onUpload with the Cloudinary URL on successful upload", async () => {
    mockSignatureApi();
    const onUpload = vi.fn();
    render(<CloudinaryUpload {...defaultProps} onUpload={onUpload} />);

    selectFileAndConfirmCrop();

    await vi.waitFor(() => {
      expect(mockXHRInstance).toBeDefined();
      expect(mockXHRInstance.send).toHaveBeenCalled();
    });

    mockXHRInstance.status = 200;
    mockXHRInstance.responseText = JSON.stringify({
      secure_url: "https://res.cloudinary.com/demo/image/upload/v1/avatar.jpg",
    });
    mockXHRInstance.onload!();

    await vi.waitFor(() => {
      expect(onUpload).toHaveBeenCalledWith(
        "https://res.cloudinary.com/demo/image/upload/v1/avatar.jpg"
      );
    });
  });

  it("handles upload API signature error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: "Cloudinary not configured" }),
    } as Response);

    const onError = vi.fn();
    render(<CloudinaryUpload {...defaultProps} onError={onError} />);

    selectFileAndConfirmCrop();

    await vi.waitFor(() => {
      expect(onError).toHaveBeenCalledWith("Cloudinary not configured");
    });
  });
});
