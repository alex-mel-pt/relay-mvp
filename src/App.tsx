import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { resolveToken, getConsumerData, getMerchantData } from './lib/supabase'
import type { User } from './lib/types'
import ConsumerPage from './pages/ConsumerPage'
import MerchantPage from './pages/MerchantPage'
import LoginPage from './pages/LoginPage'

export default function App() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [user, setUser] = useState<User | null>(null)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }

    async function load() {
      setLoading(true)
      setError(null)

      const resolved = await resolveToken(token!)
      if (!resolved) {
        setError('Invalid or expired link')
        setLoading(false)
        return
      }
      setUser(resolved)

      if (resolved.role === 'consumer') {
        const d = await getConsumerData(token!)
        setData(d)
      } else {
        const d = await getMerchantData(token!)
        setData(d)
      }
      setLoading(false)
    }

    load()
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-peel-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-peel-blue border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-peel-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  if (!token || error) {
    return <LoginPage error={error} />
  }

  if (!user || !data) {
    return <LoginPage error="Something went wrong" />
  }

  if (user.role === 'consumer') {
    return <ConsumerPage user={user} data={data} token={token} />
  }

  return <MerchantPage user={user} data={data} />
}
