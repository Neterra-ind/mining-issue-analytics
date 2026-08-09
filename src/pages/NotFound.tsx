import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-4xl font-semibold text-slate-300">404</p>
      <p className="mt-2 text-sm text-slate-500">Halaman tidak ditemukan.</p>
      <Link to="/" className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
        Kembali ke Dashboard
      </Link>
    </div>
  )
}
