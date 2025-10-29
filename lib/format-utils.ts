export function formatCPF(value: string): string {
  // Remove all non-digits
  const numbers = value.replace(/\D/g, "")

  // Limit to 11 digits
  const limited = numbers.slice(0, 11)

  // Format as XXX.XXX.XXX-XX
  if (limited.length <= 3) {
    return limited
  } else if (limited.length <= 6) {
    return `${limited.slice(0, 3)}.${limited.slice(3)}`
  } else if (limited.length <= 9) {
    return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6)}`
  } else {
    return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6, 9)}-${limited.slice(9)}`
  }
}

export function formatCEP(value: string): string {
  // Remove all non-digits
  const numbers = value.replace(/\D/g, "")

  // Limit to 8 digits
  const limited = numbers.slice(0, 8)

  // Format as XXXXX-XXX
  if (limited.length <= 5) {
    return limited
  } else {
    return `${limited.slice(0, 5)}-${limited.slice(5)}`
  }
}

export function formatPhone(value: string): string {
  // Remove all non-digits
  const numbers = value.replace(/\D/g, "")

  // Limit to 11 digits
  const limited = numbers.slice(0, 11)

  // Format as (XX) XXXXX-XXXX or (XX) XXXX-XXXX
  if (limited.length <= 2) {
    return limited
  } else if (limited.length <= 6) {
    return `(${limited.slice(0, 2)}) ${limited.slice(2)}`
  } else if (limited.length <= 10) {
    return `(${limited.slice(0, 2)}) ${limited.slice(2, 6)}-${limited.slice(6)}`
  } else {
    return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`
  }
}
