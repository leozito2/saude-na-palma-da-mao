export interface User {
  id: string
  nome_completo: string
  email: string
  cpf: string
  sexo: string
  endereco_completo: string
  data_nascimento: string
  telefone?: string
  endereco?: string
  cidade?: string
  estado?: string
  cep?: string
  createdAt: Date
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
}

let currentUser: User | null = null

export const authService = {
  register: async (userData: {
    nome_completo: string
    email: string
    password: string
    cpf: string
    sexo: string
    endereco_completo: string
    data_nascimento: string
    telefone?: string
  }): Promise<{ success: boolean; error?: string; user?: User }> => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error || "Erro ao criar conta" }
      }

      currentUser = data.user

      // Store current user in localStorage for session persistence
      if (typeof window !== "undefined") {
        localStorage.setItem("currentUser", JSON.stringify(data.user))
      }

      return { success: true, user: data.user }
    } catch (error) {
      console.error("Register error:", error)
      return { success: false, error: "Erro ao criar conta. Tente novamente." }
    }
  },

  login: async (email: string, password: string): Promise<{ success: boolean; error?: string; user?: User }> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error || "Email ou senha incorretos" }
      }

      currentUser = data.user

      // Store current user in localStorage for session persistence
      if (typeof window !== "undefined") {
        localStorage.setItem("currentUser", JSON.stringify(data.user))
      }

      return { success: true, user: data.user }
    } catch (error) {
      console.error("Login error:", error)
      return { success: false, error: "Erro ao fazer login. Tente novamente." }
    }
  },

  logout: async (): Promise<void> => {
    currentUser = null
    if (typeof window !== "undefined") {
      localStorage.removeItem("currentUser")
    }
  },

  getCurrentUser: (): User | null => {
    if (typeof window !== "undefined" && !currentUser) {
      const storedUser = localStorage.getItem("currentUser")
      if (storedUser) {
        currentUser = JSON.parse(storedUser)
      }
    }
    return currentUser
  },

  resetPassword: async (email: string): Promise<{ success: boolean; error?: string }> => {
    // This is handled by the send-reset-code API route
    return { success: true }
  },

  updateUser: async (userData: {
    nome_completo: string
    email: string
    telefone?: string
    data_nascimento?: string
    endereco?: string
    cidade?: string
    estado?: string
    cep?: string
  }): Promise<{ success: boolean; error?: string; user?: User }> => {
    if (!currentUser) {
      return { success: false, error: "Usuário não autenticado" }
    }

    // TODO: Implement API route for updating user
    // For now, just update localStorage
    const updatedUser: User = {
      ...currentUser,
      nome_completo: userData.nome_completo,
      email: userData.email,
      telefone: userData.telefone,
      data_nascimento: userData.data_nascimento || currentUser.data_nascimento,
      endereco: userData.endereco,
      cidade: userData.cidade,
      estado: userData.estado,
      cep: userData.cep,
    }

    currentUser = updatedUser

    if (typeof window !== "undefined") {
      localStorage.setItem("currentUser", JSON.stringify(updatedUser))
    }

    return { success: true, user: updatedUser }
  },
}
