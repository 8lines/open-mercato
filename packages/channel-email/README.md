# @open-mercato/channel-email

Email channel adapter for Open Mercato communication channels.

## Installation

```bash
npm install @open-mercato/channel-email
```

## Usage

```typescript
import { EmailAdapter, EMAIL_V2_CAPABILITIES, ThreadingEnricher } from '@open-mercato/channel-email'

const adapter = new EmailAdapter({
  smtp: {
    host: 'smtp.example.com',
    port: 587,
    secure: false,
    auth: { user: 'user', pass: 'pass' },
  },
  defaultFrom: 'noreply@yourdomain.com',
})

// Check capabilities
console.log(adapter.capabilities) // Email v2 capabilities
```

## Features

- **ChannelAdapterV2** implementation
- **Email Threading**: In-Reply-To, References, Subject matching
- **Rich Content**: HTML and plain text
- **Attachments**: Multiple file types
- **SMTP/IMAP**: Send and receive emails
- **Contact Cards**: vCard support

## Capabilities

| Feature | Supported |
|---------|-----------|
| Threading | ✅ |
| Rich Text | ✅ |
| File Sharing | ✅ (25MB max) |
| Read Receipts | ✅ |
| Delivery Receipts | ✅ |
| Inline Images | ✅ |
| Conversation History | ✅ |
| Contact Cards | ✅ |

## Threading

The adapter supports three threading modes:

- **headers**: Match only by In-Reply-To/References
- **subject**: Match only by Subject line similarity
- **hybrid**: Try headers first, fall back to subject

```typescript
import { ThreadingEnricher } from '@open-mercato/channel-email'

const enricher = new ThreadingEnricher({
  mode: 'hybrid',
  subjectPrefixes: ['Re:', 'Fwd:'],
  subjectMatchWindow: 60,
})
```
