export type DeliveryType = 'SMS' | 'WHATSAPP' | 'EMAIL'

export interface Message {
  to: string
  body: string
  subject?: string  // email only
  from?: string     // optional sender override
}

export interface Sender {
  name: string
  supports: DeliveryType[]
  send(type: DeliveryType, message: Message): Promise<void>
}
