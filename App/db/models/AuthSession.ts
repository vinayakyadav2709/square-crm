import { Model } from '@nozbe/watermelondb'
import { field, readonly, date } from '@nozbe/watermelondb/decorators'

export default class AuthSession extends Model {
  static table = 'auth_sessions'

  @field('user_id') userId!: string
  @field('email') email!: string
  @field('name') name!: string
  @field('role') role!: string
  @field('token') token!: string
  @readonly @date('created_at') createdAt!: Date
}
