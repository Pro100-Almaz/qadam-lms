export type NotificationAction = 'register' | 'login' | 'grading' | 'psychological_state'

export interface Notification {
  id: number
  action: NotificationAction
  send_time: string
  message: string
}
