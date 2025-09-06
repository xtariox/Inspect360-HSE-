// Domain validation
export const ALLOWED_DOMAINS = ['ocp.com']

export const USER_ROLES = {
  INSPECTOR: 'inspector',
  MANAGER: 'manager', 
  ADMIN: 'admin'
} as const

export const USER_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
} as const

export const isValidCompanyEmail = (email: string): boolean => {
  return ALLOWED_DOMAINS.some(domain => email.toLowerCase().endsWith(`@${domain}`))
}