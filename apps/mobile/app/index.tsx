import { useEffect, useState } from 'react'
import { Redirect } from 'expo-router'
import { getAccessToken } from '@/lib/auth'
import LoadingView from '@/components/LoadingView'

export default function Index() {
  const [destination, setDestination] = useState<'/(auth)/login' | '/(tabs)/jobs' | null>(null)

  useEffect(() => {
    getAccessToken().then((token) => {
      setDestination(token ? '/(tabs)/jobs' : '/(auth)/login')
    })
  }, [])

  if (!destination) return <LoadingView />
  return <Redirect href={destination} />
}
