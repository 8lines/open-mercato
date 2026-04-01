# @open-mercato/channel-whatsapp

WhatsApp Business API v2 adapter for Open Mercato communication channels.

## Installation

```bash
npm install @open-mercato/channel-whatsapp
```

## Usage

```typescript
import { WhatsAppAdapter, WHATSAPP_V2_CAPABILITIES } from '@open-mercato/channel-whatsapp'

const adapter = new WhatsAppAdapter({
  phoneNumberId: '123456789',
  accessToken: 'YOUR_ACCESS_TOKEN',
  businessAccountId: 'YOUR_BUSINESS_ACCOUNT_ID',
})

// Check capabilities
console.log(adapter.capabilities) // WhatsApp v2 capabilities
```

## Features

- **ChannelAdapterV2** implementation
- **Interactive Messages**: Buttons, Lists
- **Reactions**: Single emoji per user
- **Rich Media**: Images, Video, Audio, Documents, Stickers
- **Location Sharing**
- **Contact Cards** (vCard)

## Capabilities

| Feature | Supported |
|---------|-----------|
| Threading | ✅ |
| Rich Text | ✅ |
| File Sharing | ✅ (16MB max) |
| Read Receipts | ✅ |
| Delivery Receipts | ✅ |
| Typing Indicators | ✅ |
| Reactions | ✅ |
| Interactive Components | ✅ |
| Contact Cards | ✅ |
| Location Sharing | ✅ |
| Voice Notes | ✅ |
| Stickers | ✅ |
