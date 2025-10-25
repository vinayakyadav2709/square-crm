import React, { useState, useEffect } from 'react'
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { Card, TextInput, Button, Text, Chip, Divider } from 'react-native-paper'
import { useRouter } from 'expo-router'
import { useAuth } from '@/store/auth'
import { database } from '@/db'
import AuthSession from '@/db/models/AuthSession'
import { MaterialCommunityIcons } from '@expo/vector-icons'

export default function LoginScreen() {
  const router = useRouter()
  const { login, setUser } = useAuth()
  
  // State
  const [savedAccounts, setSavedAccounts] = useState<AuthSession[]>([])
  const [showNewLogin, setShowNewLogin] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Load saved accounts on mount
  useEffect(() => {
    loadSavedAccounts()
  }, [])

  const loadSavedAccounts = async () => {
    try {
      const accounts = await database.get<AuthSession>('auth_sessions').query().fetch()
      setSavedAccounts(accounts)
    } catch (error) {
      console.error('Error loading accounts:', error)
    }
  }

  // Select existing account
  const handleSelectAccount = async (account: AuthSession) => {
    try {
      // Set user from saved account
      setUser({
        id: account.userId,
        name: account.name,
        email: account.email,
        role: account.role as any,
      }, account.token)
      
      router.replace('/(tabs)')
    } catch (error: any) {
      setError('Failed to load account: ' + error.message)
    }
  }

  // Delete saved account
  const handleDeleteAccount = async (account: AuthSession) => {
    try {
      await database.write(async () => {
        await account.markAsDeleted()
      })
      loadSavedAccounts()
    } catch (error) {
      console.error('Error deleting account:', error)
    }
  }

  // Login with new credentials
  const handleNewLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password')
      return
    }

    setError('')
    setLoading(true)
    try {
      await login(email, password)
      router.replace('/(tabs)')
    } catch (e: any) {
      console.error('Login error:', e)
      setError(e.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="headlineMedium" style={styles.title}>
        Square CRM
      </Text>
      <Text style={styles.subtitle}>Select an account or login with new credentials</Text>

      {/* Saved Accounts */}
      {savedAccounts.length > 0 && !showNewLogin && (
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Saved Accounts
          </Text>
          {savedAccounts.map((account) => (
            <Card key={account.id} style={styles.accountCard}>
              <TouchableOpacity onPress={() => handleSelectAccount(account)}>
                <Card.Content style={styles.accountContent}>
                  <View style={styles.accountInfo}>
                    <MaterialCommunityIcons name="account-circle" size={40} color="#607d8b" />
                    <View style={styles.accountDetails}>
                      <Text style={styles.accountName}>{account.name}</Text>
                      <Text style={styles.accountEmail}>{account.email}</Text>
                      <Chip mode="flat" style={styles.roleChip} textStyle={styles.roleText}>
                        {account.role}
                      </Chip>
                    </View>
                  </View>
                  <TouchableOpacity 
                    onPress={(e) => {
                      e.stopPropagation()
                      handleDeleteAccount(account)
                    }}
                  >
                    <MaterialCommunityIcons name="close-circle" size={24} color="#e57373" />
                  </TouchableOpacity>
                </Card.Content>
              </TouchableOpacity>
            </Card>
          ))}

          <Divider style={styles.divider} />
        </View>
      )}

      {/* New Login Button or Form */}
      {!showNewLogin ? (
        <Button
          mode="outlined"
          onPress={() => setShowNewLogin(true)}
          style={styles.newLoginButton}
          icon="plus"
        >
          Login with New Account
        </Button>
      ) : (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.formTitle}>
              New Login
            </Text>

            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
              left={<TextInput.Icon icon="email" />}
            />

            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry
              style={styles.input}
              left={<TextInput.Icon icon="lock" />}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button
              mode="contained"
              onPress={handleNewLogin}
              loading={loading}
              disabled={loading}
              style={styles.loginButton}
            >
              Sign In
            </Button>

            <Button
              mode="text"
              onPress={() => setShowNewLogin(false)}
              disabled={loading}
            >
              Back to Saved Accounts
            </Button>

            {/* Register Link */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <Button 
                mode="text" 
                compact
                onPress={() => router.push('/(auth)/register')}
              >
                Sign Up
              </Button>
            </View>
          </Card.Content>
        </Card>
      )}
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#263238',
    marginBottom: 12,
  },
  accountCard: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  accountContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  accountDetails: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#263238',
  },
  accountEmail: {
    fontSize: 14,
    color: '#607d8b',
    marginTop: 2,
  },
  roleChip: {
    alignSelf: 'flex-start',
    marginTop: 6,
    height: 24,
    backgroundColor: '#e3f2fd',
  },
  roleText: {
    fontSize: 11,
    marginVertical: 0,
  },
  divider: {
    marginVertical: 16,
  },
  newLoginButton: {
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
  },
  formTitle: {
    color: '#263238',
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
  },
  error: {
    color: '#d32f2f',
    marginBottom: 12,
    textAlign: 'center',
  },
  loginButton: {
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  footerText: {
    color: '#607d8b',
    fontSize: 14,
  },
})
