# @open-mercato/channel-slack

Slack channel adapter for Open Mercato communication channels.

## Installation

```bash
npm install @open-mercato/channel-slack
```

## Usage

```typescript
import { createSlackAdapter, FULL_SLACK_CAPABILITIES } from '@open-mercato/channel-slack'

const adapter = createSlackAdapter({
  botToken: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
})

// Use with communication-channels package
console.log('Provider:', adapter.providerKey)
console.log('Capabilities:', adapter.capabilities)
```

## Features

- **Full ChannelAdapterV2 implementation** - Implements all v2 methods including reactions, editing, history
- **Block Kit conversion** - Convert between Slack Block Kit and markdown
- **Message enrichment** - Add Slack-specific metadata to messages
- **Rich Block Kit renderer** - React components for rendering Slack messages

## API

### SlackAdapter

```typescript
const adapter = new SlackAdapter({
  botToken: 'xoxb-...',
  signingSecret: 'secret',
  appId: 'A01...',
  teamId: 'T01...',
})
```

### Methods

- `sendMessage(input)` - Send a message (v1)
- `verifyWebhook(input)` - Verify webhook signature (v1)
- `normalizeInbound(raw)` - Normalize inbound message (v2)
- `convertOutbound(input)` - Convert outbound to Slack format (v2)
- `sendReaction(input)` - Add reaction (v2)
- `removeReaction(input)` - Remove reaction (v2)
- `editMessage(input)` - Edit message (v2)
- `deleteMessage(input)` - Delete message (v2)
- `fetchHistory(input)` - Fetch conversation history (v2)
- `resolveContact(input)` - Resolve user contact info (v2)
- `getChannelInfo(input)` - Get channel info (v2)
- `updatePresence(input)` - Update presence (v2)
- `getPresence(input)` - Get user presence (v2)

## Requirements

- Node.js 18+
- @open-mercato/communication-channels (peer dependency)

## Capabilities

| Feature | Supported |
|---------|-----------|
| Threading | ✅ |
| Rich Text | ✅ |
| File Sharing | ✅ (10MB max) |
| Reactions | ✅ |
| Multi-reaction per user | ✅ |
| Edit Message | ✅ |
| Delete Message | ✅ |
| Presence | ✅ |
| Rich Blocks | ✅ |
| Interactive Components | ✅ |
| Inline Images | ✅ |
| Conversation History | ✅ |
| Stickers | ✅ |