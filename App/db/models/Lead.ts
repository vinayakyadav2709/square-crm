import { Model } from '@nozbe/watermelondb'
import { field, date, readonly, children, relation } from '@nozbe/watermelondb/decorators'

export default class Lead extends Model {
  static table = 'leads'
  static associations = {
    call_logs: { type: 'has_many' as const, foreignKey: 'lead_id' },
    categories: { type: 'belongs_to' as const, key: 'category_id' },
  } as const

  @field('name') name!: string
  @field('location') location!: string
  @field('phone') phone!: string
  @field('whatsapp_phone') whatsappPhone!: string
  @field('note') note?: string
  @field('status') status!: 'open' | 'closed'
  @field('category_id') categoryId?: string
  @field('created_by') createdBy!: string
  @date('closed_at') closedAt?: Date
  @field('closed_by') closedBy?: string
  @readonly @date('created_at') createdAt!: Date
  @readonly @date('updated_at') updatedAt!: Date
  @date('deleted_at') deletedAt?: Date

  // Relations
  @children('call_logs') callLogs: any
  @relation('categories', 'category_id') category: any

  // Helper methods
  get isOpen() {
    return this.status === 'open'
  }

  get isClosed() {
    return this.status === 'closed'
  }

  get isDeleted() {
    return !!this.deletedAt
  }
}
