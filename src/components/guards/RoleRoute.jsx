import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

/**
 * Role-Based Route Guard
 * Redirects to unauthorized page if user doesn't have required role
 */
const RoleRoute = ({ children, roles }) => {
  const { user } = useSelector((state) => state.auth)

  if (!user || !user.role) {
    return <Navigate to="/unauthorized" replace />
  }

  const hasRole = roles.includes(user.role.name)

  return hasRole ? children : <Navigate to="/unauthorized" replace />
}

export default RoleRoute
