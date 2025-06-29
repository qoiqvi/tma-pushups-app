export interface BotUpdate {
  update_id: number
  message?: BotMessage
  callback_query?: BotCallbackQuery
}

export interface BotMessage {
  message_id: number
  from: BotUser
  chat: BotChat
  text?: string
  date: number
  entities?: BotMessageEntity[]
}

export interface BotCallbackQuery {
  id: string
  from: BotUser
  message?: BotMessage
  inline_message_id?: string
  data?: string
}

export interface BotUser {
  id: number
  is_bot: boolean
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  is_premium?: boolean
}

export interface BotChat {
  id: number
  type: 'private' | 'group' | 'supergroup' | 'channel'
  first_name?: string
  last_name?: string
  username?: string
}

export interface BotMessageEntity {
  type: 'bot_command' | 'url' | 'email' | 'bold' | 'italic' | 'code' | 'pre'
  offset: number
  length: number
}

export interface BotWebAppInfo {
  url: string
}

export interface BotInlineKeyboardButton {
  text: string
  url?: string
  callback_data?: string
  web_app?: BotWebAppInfo
}

export interface BotInlineKeyboardMarkup {
  inline_keyboard: BotInlineKeyboardButton[][]
}

export interface SendMessageOptions {
  parse_mode?: 'Markdown' | 'HTML'
  reply_markup?: BotInlineKeyboardMarkup
  disable_web_page_preview?: boolean
  disable_notification?: boolean
}