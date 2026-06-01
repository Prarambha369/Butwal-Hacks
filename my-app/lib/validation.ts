import { toast } from "sonner"

export const VALIDATION = {
  SEARCH: {
    MAX_LENGTH: 100,
    ALLOWED_CHARS: /^[a-zA-Z0-9\s\-'_]*$/,
  },
  EMAIL: {
    REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50,
    ALLOWED_CHARS: /^[a-zA-Z\s\-'\.]*$/,
  },
} as const

export function validateSearchInput(input: string): { valid: boolean; error?: string } {
  if (input.length > VALIDATION.SEARCH.MAX_LENGTH) {
    return {
      valid: false,
      error: `Search query must be less than ${VALIDATION.SEARCH.MAX_LENGTH} characters`,
    }
  }

  if (!VALIDATION.SEARCH.ALLOWED_CHARS.test(input)) {
    return {
      valid: false,
      error: "Search query contains invalid characters",
    }
  }

  return { valid: true }
}

export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, "")
    .slice(0, VALIDATION.SEARCH.MAX_LENGTH)
}

export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email) {
    return { valid: false, error: "Email is required" }
  }

  if (!VALIDATION.EMAIL.REGEX.test(email)) {
    return { valid: false, error: "Please enter a valid email address" }
  }

  return { valid: true }
}

export function handleValidationError(error: string): void {
  toast.error(error, {
    description: "Please check your input and try again",
    duration: 4000,
  })
}

export function handleSuccess(message: string, description?: string): void {
  toast.success(message, {
    description,
    duration: 3000,
  })
}
