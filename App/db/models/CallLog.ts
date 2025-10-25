import { Model } from '@nozbe/watermelondb'
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators'

export default class CallLog extends Model {
  static table = 'call_logs'
  static associations = {
    leads: { type: 'belongs_to' as const, key: 'lead_id' },
  } as const

  @field('lead_id') leadId!: string
  @field('called_by') calledBy!: string
  @field('log_note') logNote!: string
  @date('call_date') callDate!: Date
  @readonly @date('created_at') createdAt!: Date
  @readonly @date('updated_at') updatedAt!: Date
  @date('deleted_at') deletedAt?: Date

  // Relations
  @relation('leads', 'lead_id') lead: any

  // Helper methods
  get isDeleted() {
    return !!this.deletedAt
  }
}
