import React, { useState } from 'react'
import { View, StyleSheet, ScrollView } from 'react-native'
import { Card, TextInput, Button, Text, SegmentedButtons } from 'react-native-paper'
import { useRouter, Link } from 'expo-router'
import { useAuth } from '@/store/auth'

type Role = 'admin' | 'editor' | 'viewer'

export default function RegisterScreen() {
  const router = useRouter()
  const { register } = useAuth()
  
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('viewer')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async () => {
    if (!name || !email || !password) {
      setError('Please fill all fields')
      return
    }

    setError('')
    setLoading(true)
    try {
      await register(name, email, password, role)
      router.replace('/(tabs)')
    } catch (e: any) {
      console.error('Register error:', e)
      setError(e.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="headlineMedium" style={styles.title}>
        Create Account
      </Text>
      <Text style={styles.subtitle}>Sign up to get started</Text>

      <Card style={styles.card}>
        <Card.Content>
          <TextInput
            label="Full Name"
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={styles.input}
            left={<TextInput.Icon icon="account" />}
            placeholder="John Doe"
          />

          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
            left={<TextInput.Icon icon="email" />}
            placeholder="you@example.com"
          />

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            secureTextEntry
            style={styles.input}
            left={<TextInput.Icon icon="lock" />}
            placeholder="••••••••"
          />

          <Text style={styles.label}>Role</Text>
          <SegmentedButtons
            value={role}
            onValueChange={(value) => setRole(value as Role)}
            buttons={[
              { value: 'viewer', label: 'Viewer' },
              { value: 'editor', label: 'Editor' },
              { value: 'admin', label: 'Admin' },
            ]}
            style={styles.segmented}
          />

          <View style={styles.roleInfo}>
            <Text style={styles.roleDesc}>
              {role === 'admin' && '✓ Full access - manage everything'}
              {role === 'editor' && '✓ Can add leads and close as converted'}
              {role === 'viewer' && '✓ View only - cannot add or close leads'}
            </Text>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            mode="contained"
            onPress={onSubmit}
            loading={loading}
            disabled={loading}
            style={styles.button}
          >
            Create Account
          </Button>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <Button mode="text" compact>
                Sign In
              </Button>
            </Link>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fb',
  },
  content: {
    padding: 16,
    paddingTop: 60,
  },
  title: {
    color: '#263238',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },
  subtitle: {
    color: '#607d8b',
    textAlign: 'center',
    marginBottom: 32,
  },
  card: {
    backgroundColor: '#fff',
  },
  input: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#607d8b',
    marginBottom: 8,
    marginTop: 8,
  },
  segmented: {
    marginBottom: 8,
  },
  roleInfo: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  roleDesc: {
    fontSize: 13,
    color: '#263238',
  },
  error: {
    color: '#d32f2f',
    marginBottom: 12,
    textAlign: 'center',
  },
  button: {
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: '#607d8b',
    fontSize: 14,
  },
})
