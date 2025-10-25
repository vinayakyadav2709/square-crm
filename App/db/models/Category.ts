import { Model } from '@nozbe/watermelondb'
import { field, date, readonly, children } from '@nozbe/watermelondb/decorators'

export default class Category extends Model {
  static table = 'categories'
  static associations = {
    leads: { type: 'has_many' as const, foreignKey: 'category_id' },
  } as const

  @field('name') name!: string
  @field('type') type!: 'converted' | 'rejected'
  @field('created_by') createdBy!: string
  @readonly @date('created_at') createdAt!: Date
  @readonly @date('updated_at') updatedAt!: Date
  @date('deleted_at') deletedAt?: Date

  // Relations
  @children('leads') leads: any

  // Helper methods
  get isConverted() {
    return this.type === 'converted'
  }

  get isRejected() {
    return this.type === 'rejected'
  }

  get isDeleted() {
    return !!this.deletedAt
  }
}
