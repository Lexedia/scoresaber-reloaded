import { eq, sql } from 'drizzle-orm'
import { db } from '../db'
import { tableCountsTable, TableCountsTableRow } from '../db/schema'

export class TableCountsRepository {
  public static async getCounts(): Promise<TableCountsTableRow> {
    const [ counts ] = await db.select().from(tableCountsTable).where(eq(tableCountsTable.id, 1))

    if (!counts) {
      throw new Error('Table counts row missing from \'scoresaber-table-counts\'')
    }

    return counts
  }

  public static async reconcile(): Promise<void> {
    await db.execute(sql`SELECT "reconcile_scoresaber-table-counts"()`)
  }
}
