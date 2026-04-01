import * as mock from '../../shared/mock.js'
import { dbPool, hasDatabase } from '../../db/client.js'
import type { Project } from '../../shared/domain.js'

type ProjectRow = {
  id: number
  name: string
}

class InMemoryProjectStorage {
  list(): Project[] {
    return mock.projects
  }
}

class DatabaseProjectStorage {
  async list(): Promise<Project[]> {
    const result = await dbPool!.query<ProjectRow>(`
      SELECT id, name
      FROM projects
      ORDER BY id ASC
    `)

    return result.rows
  }
}

const inMemoryStorage = new InMemoryProjectStorage()
const databaseStorage = hasDatabase() ? new DatabaseProjectStorage() : null

export const projectStorage = {
  list() {
    return databaseStorage ? databaseStorage.list() : inMemoryStorage.list()
  },
}
