import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'

export function useAuth() {
  const store = useAuthStore()
  const { user, isAuthenticated, isSessionLoading } = storeToRefs(store)
  return {
    user,
    isAuthenticated,
    isSessionLoading,
    login: store.login,
    logout: store.logout,
    initSession: store.initSession,
    fetchCurrentUser: store.fetchCurrentUser,
    updateProfile: store.updateProfile,
    uploadAvatar: store.uploadAvatar,
  }
}
