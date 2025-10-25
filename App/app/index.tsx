import { Redirect } from 'expo-router'
import { useAuth } from '@/store/auth'

export default function Index() {
  const { isAuthenticated } = useAuth()

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />
  }

  return <Redirect href="/(auth)/login" />
}
