import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import { fileURLToPath } from 'node:url'

const dbFilePath = fileURLToPath(new URL('../db.json', import.meta.url))

const adapter = new JSONFile(dbFilePath)

export const db = new Low(adapter, { users: [], expenses: [] })

export const initializeDb = async () => {
  await db.read()
  db.data ||= { users: [], expenses: [] }
  db.data.users ||= []
  db.data.expenses ||= []
  await db.write()
}