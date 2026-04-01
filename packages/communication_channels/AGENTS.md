# Communication Channels Package — Agent Guidelines

Use `@open-mercato/communication-channels` for linking internal Messages to external messaging platforms and managing thread/conversation mappings.

## MUST Rules

1. **MUST use the MessageChannelLink entity** — for linking internal Message IDs to external platform messages (Slack, Telegram, Discord, WhatsApp, etc.)
2. **MUST use the ChannelThreadMapping entity** — for mapping external conversations/threads to internal Message threads
3. **MUST include channelPayload for platform-specific data** — store thread IDs, metadata, and provider-specific information in the JSON field
4. **MUST track deliveryStatus correctly** — statuses: pending → sent → delivered, or failed with retry capability
5. **MUST scope queries by tenantId and organizationId** — thread mappings are tenant-specific data
6. **MUST update lastActivityAt on thread activity** — for sorting and sync operations

## When You Need Message Channel Linking

1. Use `MessageChannelLink` entity to link an internal `Message.id` to an external platform message
2. Set `channelType` to the appropriate provider (slack, telegram, discord, whatsapp, email, sms, webhook, msteams)
3. Store platform-specific metadata in `channelPayload` (e.g., thread_ts for Slack, message_id for Telegram)
4. Track delivery status for outbound sync verification

## When You Need Thread Mapping

1. Use `ChannelThreadMapping` entity to map an external conversation to an internal Message thread
2. Maintain `lastActivityAt` for sorting/sync operations
3. Scope by `tenantId` and `organizationId` for multi-tenant support
4. Store `channelId` as the provider-specific channel identifier (workspace+channel for Slack, chat_id for Telegram)

## Data Model

```
MessageChannelLink:
├── id (uuid)
├── messageId (uuid) → Message.id
├── externalMessageId (text)
├── channelType (text) → slack|telegram|discord|whatsapp|email|sms|webhook|msteams
├── providerKey (text, nullable)
├── channelPayload (json, nullable)
├── deliveryStatus (text) → pending|sent|delivered|failed
├── createdAt, updatedAt

ChannelThreadMapping:
├── id (uuid)
├── externalConversationId (text)
├── channelId (text)
├── messageThreadId (uuid) → MessageThread.id
├── tenantId (uuid, nullable)
├── organizationId (uuid, nullable)
├── lastActivityAt (timestamp)
├── createdAt, updatedAt
```

## Structure

```text
packages/communication_channels/
├── src/
│   ├── data/
│   │   ├── entities.ts      # MessageChannelLink, ChannelThreadMapping MikroORM entities
│   │   └── validators.ts    # Zod validators and input schemas
│   └── index.ts             # Module exports
├── package.json
├── tsconfig.json
├── build.mjs
└── jest.config.cjs
```

## Integrations

- Links to `@open-mercato/shared/modules/messages` types
- Compatible with external platform adapters from `@open-mercato/core/modules/integrations`
- Uses MikroORM for entity persistence (same as other packages in monorepo)

## Cross-Reference

- **Message types**: `packages/shared/src/modules/messages/types.ts`
- **Entity patterns**: `packages/core/src/modules/entities/data/entities.ts`
- **Integrations module**: `packages/core/src/modules/integrations/AGENTS.md`