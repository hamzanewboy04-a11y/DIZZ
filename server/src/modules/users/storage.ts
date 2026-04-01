import * as mock from '../../shared/mock.js'
import { dbPool, hasDatabase } from '../../db/client.js'
import type { User } from '../../shared/domain.js'

type UserRow = {
  id: number
  name: string
  roles: string[]
}

function mapUserRow(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    roles: row.roles as User['roles'],
  }
}

class InMemoryUserStorage {
  getMe(): User {
    return mock.users[0]
  }

  list(): User[] {
    return mock.users
  }
}

class DatabaseUserStorage {
  async getMe(): Promise<User> {
    const result = await dbPool!.query<UserRow>(`
      SELECT id, name, roles
      FROM users
      ORDER BY id ASC
      LIMIT 1
    `)

    const user = result.rows[0]
    if (!user) throw new Error('No users found')
    return mapUserRow(user)
  }

  async list(): Promise<User[]> {
    const result = await dbPool!.query<UserRow>(`
      SELECT id, name, roles
      FROM users
      ORDER BY id ASC
    `)

    return result.rows.map(mapUserRow)
  }
}

const inMemoryStorage = new InMemoryUserStorage()
const databaseStorage = hasDatabase() ? new DatabaseUserStorage() : null

export const userStorage = {
  getMe() {
    return databaseStorage ? databaseStorage.getMe() : inMemoryStorage.getMe()
  },
  list() {
    return databaseStorage ? databaseStorage.list() : inMemoryStorage.list()
  },
}
