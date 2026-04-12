import { afterEach, describe, expect, it, vi } from 'vitest'
import { registerUser } from './registerUser'

describe('registerUser', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns parsed response when request is successful', async () => {
    const fakeResponse = { username: 'nacho', email: 'nacho@example.com', role: 'USER' }

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 201,
      text: async () => JSON.stringify(fakeResponse),
    })

    const result = await registerUser({
      username: 'nacho',
      email: 'nacho@example.com',
      password: 'abcde123',
    })

    expect(result).toEqual(fakeResponse)
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
  })

  it('throws backend message when request fails with JSON error body', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 409,
      text: async () => JSON.stringify({ message: 'Ya existe un usuario con ese email' }),
    })

    await expect(
      registerUser({
        username: 'nacho',
        email: 'nacho@example.com',
        password: 'abcde123',
      }),
    ).rejects.toThrow('Ya existe un usuario con ese email')
  })

  it('throws generic status message when error body is not JSON', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'server error',
    })

    await expect(
      registerUser({
        username: 'nacho',
        email: 'nacho@example.com',
        password: 'abcde123',
      }),
    ).rejects.toThrow('Error 500')
  })
})

