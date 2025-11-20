import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

/**
 * Role-Based and Permission-Based Route Guard
 * Redirects to unauthorized page if user doesn't have required role or permissions
 */
const RoleRoute = ({ children, roles, permissions }) => {
  const { user } = useSelector((state) => state.auth)

  if (!user || !user.role) {
    return <Navigate to="/unauthorized" replace />
  }

  // Check role-based access
  const hasRole = roles ? roles.includes(user.role.name) : true

  // Check permission-based access
  let hasPermission = true
  if (permissions && permissions.length > 0) {
    const userPermissions = user.role.permissions || []
    
    // Check if user has any of the required permissions
    hasPermission = permissions.some(permission => {
      // Handle string format
      if (userPermissions.includes(permission)) return true
      
      // Handle object format
      const [module, action] = permission.split('_')
      if (module && action) {
        const modulePermission = userPermissions.find(p => 
          typeof p === 'object' && p.module === module
        )
        if (modulePermission && modulePermission.actions?.includes(action)) {
          return true
        }
      }
      
      return false
    })
  }

  const hasAccess = hasRole || hasPermission

  return hasAccess ? children : <Navigate to="/unauthorized" replace />
}

export default RoleRoute
