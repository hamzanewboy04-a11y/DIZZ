import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Client } from 'pg'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('DATABASE_URL is required')
  process.exit(1)
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const schemaPath = path.join(__dirname, 'schema.sql')
const schemaSql = fs.readFileSync(schemaPath, 'utf8')

const client = new Client({ connectionString: databaseUrl })

async function main() {
  await client.connect()
  await client.query(schemaSql)
  console.log('Database schema initialized')
  await client.end()
}

main().catch(async (error) => {
  console.error(error)
  try {
    await client.end()
  } catch {}
  process.exit(1)
})
