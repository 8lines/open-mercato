# @open-mercato/communication-channels

Communication Channels module for Open Mercato — links internal Messages to external messaging platforms and manages thread/conversation mappings.

## Installation

```bash
yarn add @open-mercato/communication-channels
```

## Entities

### MessageChannelLink

Links a Message to an external messaging platform message.

```typescript
import { MessageChannelLink } from '@open-mercato/communication-channels'
```

**Fields:**
- `id` — UUID primary key
- `messageId` — Internal Message ID
- `externalMessageId` — External platform message ID
- `channelType` — Channel type (slack, telegram, discord, whatsapp, email, sms, webhook, msteams)
- `providerKey` — Provider-specific identifier
- `channelPayload` — Additional platform-specific data (JSON)
- `deliveryStatus` — Delivery status (pending, sent, delivered, failed)
- `createdAt`, `updatedAt` — Timestamps

### ChannelThreadMapping

Maps an external conversation/thread to an internal Message thread.

```typescript
import { ChannelThreadMapping } from '@open-mercato/communication-channels'
```

**Fields:**
- `id` — UUID primary key
- `externalConversationId` — External conversation/thread ID
- `channelId` — Channel identifier
- `messageThreadId` — Internal Message thread ID
- `tenantId`, `organizationId` — Tenant and organization scope
- `lastActivityAt` — Last activity timestamp
- `createdAt`, `updatedAt` — Timestamps

## Validators

```typescript
import {
  createMessageChannelLinkSchema,
  createChannelThreadMappingSchema,
  updateMessageChannelLinkSchema,
  updateChannelThreadMappingSchema,
} from '@open-mercato/communication-channels'
```

## Development

```bash
# Build
yarn workspace @open-mercato/communication-channels build

# Test
yarn workspace @open-mercato/communication-channels test

# Type check
yarn workspace @open-mercato/communication-channels typecheck
```