// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { QrScannerClient } from "../qr-scanner-client";

// ─── Mocks ───────────────────────────────────────────────────────────────────

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// Mock lucide-react (provided by test setup, but ensure it works)
vi.mock("lucide-react", () => ({
  Camera: () => null,
  CameraOff: () => null,
  Loader2: () => null,
  CheckCircle2: () => null,
  XCircle: () => null,
  Search: () => null,
  User: () => null,
}));

// Mock global fetch
const originalFetch = globalThis.fetch;

// Mock BarcodeDetector
const mockBarcodeDetector = {
  detect: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  globalThis.fetch = vi.fn();

  // Mock BarcodeDetector support — supported by default
  // @ts-expect-error - adding BarcodeDetector to globalThis for test
  globalThis.BarcodeDetector = vi.fn(() => mockBarcodeDetector);

  // Mock navigator.mediaDevices
  Object.defineProperty(navigator, "mediaDevices", {
    value: {
      getUserMedia: vi.fn(),
    },
    configurable: true,
  });
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  cleanup();
});

// ─────────────────────────────────────────────────────────────────────────────
// QrScannerClient Tests
// ─────────────────────────────────────────────────────────────────────────────
describe("QrScannerClient", () => {
  it("renders the camera scanner section heading", () => {
    render(<QrScannerClient eventId="test-event-123" />);

    expect(screen.getByText("Camera Scanner")).toBeDefined();
  });

  it("renders the manual check-in section heading", () => {
    render(<QrScannerClient eventId="test-event-123" />);

    expect(screen.getByText("Manual Check-in")).toBeDefined();
  });

  it("shows Start Camera button when camera is inactive", () => {
    render(<QrScannerClient eventId="test-event-123" />);

    expect(screen.getByText("Start Camera")).toBeDefined();
  });

  it("shows the manual check-in input with correct placeholder", () => {
    render(<QrScannerClient eventId="test-event-123" />);

    const input = screen.getByPlaceholderText(
      "Paste registration UUID from the QR page...",
    );
    expect(input).toBeDefined();
  });

  it("shows the Check In button in manual section", () => {
    render(<QrScannerClient eventId="test-event-123" />);

    expect(screen.getByText("Check In")).toBeDefined();
  });

  it("shows idle message when camera is off and BarcodeDetector is supported", () => {
    render(<QrScannerClient eventId="test-event-123" />);

    expect(
      screen.getByText(
        "Click 'Start Camera' to begin scanning QR codes from attendees.",
      ),
    ).toBeDefined();
  });

  it("shows unsupported message when BarcodeDetector is not available", () => {
    // @ts-expect-error - removing BarcodeDetector for test
    delete globalThis.BarcodeDetector;

    render(<QrScannerClient eventId="test-event-123" />);

    expect(
      screen.getByText(
        "QR code scanning is not available in this browser. Use the manual entry below.",
      ),
    ).toBeDefined();
  });

  it("shows unsupported badge when BarcodeDetector is not available", () => {
    // @ts-expect-error - removing BarcodeDetector for test
    delete globalThis.BarcodeDetector;

    render(<QrScannerClient eventId="test-event-123" />);

    expect(
      screen.getByText("QR scanner not supported in this browser"),
    ).toBeDefined();
  });

  it("disables Start Camera button when BarcodeDetector is not supported", () => {
    // @ts-expect-error - removing BarcodeDetector for test
    delete globalThis.BarcodeDetector;

    render(<QrScannerClient eventId="test-event-123" />);

    const button = screen.getByText("Start Camera").closest("button");
    expect(button?.disabled).toBe(true);
  });

  describe("manual check-in", () => {
    it("does not call toast when Check In button is clicked with empty input (button is disabled)", async () => {
      const { toast } = await import("sonner");
      render(<QrScannerClient eventId="test-event-123" />);

      const checkinButton = screen.getByText("Check In");
      fireEvent.click(checkinButton);

      expect(toast.error).not.toHaveBeenCalled();
    });

    it("disables Check In button when input is empty", () => {
      render(<QrScannerClient eventId="test-event-123" />);

      const checkinButton = screen.getByText("Check In").closest("button");
      expect(checkinButton?.disabled).toBe(true);
    });

    it("enables Check In button when input has text", () => {
      render(<QrScannerClient eventId="test-event-123" />);

      const input = screen.getByPlaceholderText(
        "Paste registration UUID from the QR page...",
      );
      fireEvent.change(input, { target: { value: "test-uuid" } });

      const checkinButton = screen.getByText("Check In").closest("button");
      expect(checkinButton?.disabled).toBe(false);
    });

    it("calls the check-in API when manual entry is submitted", async () => {
      const mockFetch = globalThis.fetch as ReturnType<typeof vi.fn>;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, attended: true }),
      });

      render(<QrScannerClient eventId="test-event-123" />);

      const input = screen.getByPlaceholderText(
        "Paste registration UUID from the QR page...",
      );
      fireEvent.change(input, {
        target: { value: "123e4567-e89b-12d3-a456-426614174000" },
      });

      const checkinButton = screen.getByText("Check In");
      fireEvent.click(checkinButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/events/checkin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            registration_id: "123e4567-e89b-12d3-a456-426614174000",
            attended: true,
          }),
        });
      });
    });

    it("triggers check-in on Enter key press", async () => {
      const mockFetch = globalThis.fetch as ReturnType<typeof vi.fn>;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, attended: true }),
      });

      render(<QrScannerClient eventId="test-event-123" />);

      const input = screen.getByPlaceholderText(
        "Paste registration UUID from the QR page...",
      );
      fireEvent.change(input, {
        target: { value: "123e4567-e89b-12d3-a456-426614174000" },
      });
      fireEvent.keyDown(input, { key: "Enter" });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });
  });

  describe("results feed", () => {
    it("does not show results feed when no scans have occurred", () => {
      render(<QrScannerClient eventId="test-event-123" />);

      expect(screen.queryByText(/checked in/)).toBeNull();
    });

    it("shows a success toast after a successful manual check-in", async () => {
      const { toast } = await import("sonner");
      const mockFetch = globalThis.fetch as ReturnType<typeof vi.fn>;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, attended: true }),
      });

      render(<QrScannerClient eventId="test-event-123" />);

      const input = screen.getByPlaceholderText(
        "Paste registration UUID from the QR page...",
      );
      fireEvent.change(input, {
        target: { value: "123e4567-e89b-12d3-a456-426614174000" },
      });

      const checkinButton = screen.getByText("Check In");
      fireEvent.click(checkinButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Checked in!");
      });
    });
  });

  describe("camera error state", () => {
    it("shows permission denied message when getUserMedia throws NotAllowedError", async () => {
      const getUserMedia = navigator.mediaDevices
        .getUserMedia as ReturnType<typeof vi.fn>;
      getUserMedia.mockRejectedValue(
        new DOMException("Permission denied", "NotAllowedError"),
      );

      render(<QrScannerClient eventId="test-event-123" />);

      const startButton = screen.getByText("Start Camera");
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(
          screen.getByText(
            "Camera permission denied. Allow camera access or use manual entry.",
          ),
        ).toBeDefined();
      });
    });

    it("shows generic error message when getUserMedia fails for other reasons", async () => {
      const getUserMedia = navigator.mediaDevices
        .getUserMedia as ReturnType<typeof vi.fn>;
      getUserMedia.mockRejectedValue(new Error("Camera not found"));

      render(<QrScannerClient eventId="test-event-123" />);

      const startButton = screen.getByText("Start Camera");
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(
          screen.getByText("Could not access camera. Use manual entry below."),
        ).toBeDefined();
      });
    });
  });
});
