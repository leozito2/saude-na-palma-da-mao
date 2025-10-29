interface PasswordResetToken {
  email: string
  token: string
  expiresAt: Date
  used: boolean
}

// Regex for 6-character alphanumeric token (letters and numbers)
const TOKEN_REGEX = /^[A-Z0-9]{6}$/

let resetTokens: PasswordResetToken[] = []

export const passwordResetService = {
  generateResetToken: (email: string): string => {
    // Generate a 6-character alphanumeric code
    const token = Math.random().toString(36).substring(2, 8).toUpperCase()

    // Remove any existing tokens for this email
    resetTokens = resetTokens.filter((rt) => rt.email !== email)

    // Create new token that expires in 15 minutes
    const resetToken: PasswordResetToken = {
      email,
      token,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      used: false,
    }

    resetTokens.push(resetToken)

    // Store in localStorage for persistence
    if (typeof window !== "undefined") {
      localStorage.setItem("resetTokens", JSON.stringify(resetTokens))
    }

    return token
  },

  validateResetToken: (email: string, token: string): { valid: boolean; error?: string } => {
    if (!TOKEN_REGEX.test(token)) {
      return { valid: false, error: "Formato de código inválido. Use 6 caracteres alfanuméricos." }
    }

    // Load tokens from localStorage if available
    if (typeof window !== "undefined") {
      const storedTokens = localStorage.getItem("resetTokens")
      if (storedTokens) {
        resetTokens = JSON.parse(storedTokens).map((rt: any) => ({
          ...rt,
          expiresAt: new Date(rt.expiresAt),
        }))
      }
    }

    const resetToken = resetTokens.find((rt) => rt.email === email && rt.token === token)

    if (!resetToken) {
      return { valid: false, error: "Código inválido" }
    }

    if (resetToken.used) {
      return { valid: false, error: "Código já foi utilizado" }
    }

    if (resetToken.expiresAt < new Date()) {
      return { valid: false, error: "Código expirado" }
    }

    return { valid: true }
  },

  useResetToken: (email: string, token: string): boolean => {
    const resetToken = resetTokens.find((rt) => rt.email === email && rt.token === token)

    if (resetToken) {
      resetToken.used = true

      // Store updated tokens
      if (typeof window !== "undefined") {
        localStorage.setItem("resetTokens", JSON.stringify(resetTokens))
      }

      return true
    }

    return false
  },
}
