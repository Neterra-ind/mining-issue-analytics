import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { useAuth } from '@/lib/auth'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('Corporate Communication Demo')

  function handleLogin() {
    login(name.trim() || 'Demo User')
    navigate('/')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-7 shadow-xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <h1 className="text-lg font-semibold text-slate-900">Mining Issue Analytics</h1>
          <p className="mt-1 text-sm text-slate-500">Industry, ESG & Corporate Reputation Intelligence</p>
        </div>

        <label className="mb-1.5 block text-xs font-medium text-slate-500">Nama Pengguna (demo)</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mb-4 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          placeholder="Nama Anda"
        />

        <button
          onClick={handleLogin}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <ShieldCheck className="h-4 w-4" />
          Masuk ke Dashboard Demo
        </button>

        <p className="mt-4 text-center text-xs text-slate-400">
          Prototype demo — tidak memerlukan kata sandi. Data yang ditampilkan bersifat contoh (DEMO DATA).
        </p>
      </div>
    </div>
  )
}
