import { useSelector } from 'react-redux'
import {
  selectCurrentUser,
  selectIsAuthenticated,
  selectCurrentUserRole,
} from '@/features/auth/authSlice'

export function useAuth() {
  const user = useSelector(selectCurrentUser)
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const role = useSelector(selectCurrentUserRole)

  const isOwner = role === 'OWNER'
  const isManager = role === 'MANAGER'
  const isRep = role === 'REP'
  const isOwnerOrManager = isOwner || isManager

  return {
    user,
    isAuthenticated,
    role,
    isOwner,
    isManager,
    isRep,
    isOwnerOrManager,
  }
}