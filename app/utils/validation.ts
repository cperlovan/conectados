export const validateInput = {
  text: (value: string, maxLength: number): string => {
    return value.trim().slice(0, maxLength)
  },

  email: (value: string): string => {
    return value.trim().toLowerCase()
  },

  password: (value: string): string => {
    return value
  },

  phone: (value: string): string => {
    return value.replace(/[^\d+\-\s]/g, '')
  },

  rif: (value: string): string => {
    return value.replace(/[^\d\-A-Za-z]/g, '').toUpperCase()
  }
} 