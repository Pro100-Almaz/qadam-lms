import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'

export function useAuth() {
  const store = useAuthStore()
  const {
    user,
    assignedRoles,
    availableRoles,
    activeRole,
    activeRoles,
    isAuthenticated,
    isSessionLoading,
  } = storeToRefs(store)
  return {
    user,
    assignedRoles,
    availableRoles,
    activeRole,
    activeRoles,
    isAuthenticated,
    isSessionLoading,
    login: store.login,
    logout: store.logout,
    initSession: store.initSession,
    fetchCurrentUser: store.fetchCurrentUser,
    updateProfile: store.updateProfile,
    uploadAvatar: store.uploadAvatar,
    setActiveRole: store.setActiveRole,
  }
}
