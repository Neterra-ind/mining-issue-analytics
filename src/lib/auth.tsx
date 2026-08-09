import { createContext, useContext, useState, type ReactNode } from 'react'

const SESSION_KEY = 'midash:session'

interface AuthContextValue {
  isAuthenticated: boolean
  userName: string
  login: (name: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userName, setUserName] = useState<string>(() => sessionStorage.getItem(SESSION_KEY) ?? '')

  function login(name: string) {
    sessionStorage.setItem(SESSION_KEY, name)
    setUserName(name)
  }
  function logout() {
    sessionStorage.removeItem(SESSION_KEY)
    setUserName('')
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!userName, userName, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth harus dipakai di dalam AuthProvider')
  return ctx
}
