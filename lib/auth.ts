import Cookies from 'js-cookie'

interface User {
  id: number
  role: string
  condominiumId?: number
  supplierId?: number
  name: string
  email: string
}

export const getToken = async (): Promise<string | null> => {
  return Cookies.get('token') || null
}

export const getUser = async (): Promise<User | null> => {
  const userStr = Cookies.get('user')
  if (!userStr) return null
  
  try {
    return JSON.parse(userStr)
  } catch (error) {
    console.error('Error parsing user data:', error)
    return null
  }
}

export const setToken = (token: string): void => {
  Cookies.set('token', token, { expires: 7 })
}

export const setUser = (user: User): void => {
  Cookies.set('user', JSON.stringify(user), { expires: 7 })
}

export const removeToken = (): void => {
  Cookies.remove('token')
}

export const removeUser = (): void => {
  Cookies.remove('user')
}

export const logout = (): void => {
  removeToken()
  removeUser()
}

export default {
  getToken,
  getUser,
  setToken,
  setUser,
  removeToken,
  removeUser,
  logout
} 