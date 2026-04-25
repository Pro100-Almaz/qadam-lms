import { ref, computed } from 'vue'

interface User {
  id: string
  name: string
  email: string
  role: 'admin'
}

const user = ref<User | null>(null)
const isAuthenticated = computed(() => !!user.value)

function loadSession() {
  const stored = localStorage.getItem('auth_user')
  if (stored) {
    try {
      user.value = JSON.parse(stored)
    } catch {
      localStorage.removeItem('auth_user')
    }
  }
}

function login(username: string, password: string): boolean {
  if (username === 'admin' && password === 'admin') {
    user.value = {
      id: '1',
      name: 'Admin',
      email: 'admin@qadam.edu.kz',
      role: 'admin',
    }
    localStorage.setItem('auth_user', JSON.stringify(user.value))
    return true
  }
  return false
}

function logout() {
  user.value = null
  localStorage.removeItem('auth_user')
}

loadSession()

export function useAuth() {
  return { user, isAuthenticated, login, logout }
}
