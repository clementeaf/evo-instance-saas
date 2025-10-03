# Messaging Providers

This application supports multiple WhatsApp messaging providers through an abstraction layer. This allows you to easily switch between different providers without changing your application code.

## Available Providers

### 1. Evolution API (Default)

**Best for:** MVP, self-hosted solutions, rapid prototyping, multi-tenant SaaS

**Pros:**
- ✅ Free and open source
- ✅ Self-hosted control
- ✅ No business verification required
- ✅ QR code authentication (easy setup)
- ✅ Full WhatsApp Web feature set
- ✅ Great for multi-instance architecture
- ✅ Real-time webhooks

**Cons:**
- ❌ Requires server infrastructure
- ❌ Scaling requires more servers (at ~2000+ instances)
- ❌ Uses WhatsApp Web protocol (less official)
- ❌ Higher infrastructure costs at scale

**When to use:**
- Building an MVP
- 0-2000 instances
- Need full control over infrastructure
- Want to avoid Meta's verification process
- Rapid development and iteration

**Configuration:**
```bash
MESSAGING_PROVIDER=evolution
EVOLUTION_API_BASE_URL=http://localhost:8080
EVOLUTION_API_API_KEY=your-api-key
EVOLUTION_DRY_RUN=false
```

**Scalability:**
- **0-100 instances**: Excellent ($20-50/month VPS)
- **100-500 instances**: Good ($100-300/month)
- **500-2000 instances**: Requires optimization ($500-1500/month)
- **2000+ instances**: Consider migrating to Meta

---

### 2. Meta WhatsApp Cloud API

**Best for:** Enterprise, high-scale applications, official business presence

**Pros:**
- ✅ Official Meta infrastructure (no servers needed)
- ✅ Highly scalable (Meta handles infrastructure)
- ✅ Lower cost at very high scale
- ✅ Better for enterprise clients
- ✅ Official business verification
- ✅ SLA and support from Meta

**Cons:**
- ❌ Requires Meta Business verification
- ❌ Complex initial setup
- ❌ Template message requirements for first contact
- ❌ More restrictive policies
- ❌ No QR code (uses pre-registered numbers)
- ❌ Higher barrier to entry

**When to use:**
- 2000+ instances
- Enterprise clients that require it
- Need official Meta verification
- High message volume
- Want zero infrastructure management

**Configuration:**
```bash
MESSAGING_PROVIDER=meta
META_ACCESS_TOKEN=your-system-user-access-token
META_PHONE_NUMBER_ID=your-phone-number-id
```

**Setup Requirements:**
1. Create Meta Developer Account
2. Create Business App
3. Complete Business Verification
4. Get WhatsApp Business Account
5. Generate System User Access Token
6. Register phone number

**Scalability:**
- Infinite (Meta handles all infrastructure)
- First 1000 conversations/month: FREE
- Cost per conversation after that (varies by region)

---

## Switching Between Providers

### 1. Via Environment Variable

Simply change the `MESSAGING_PROVIDER` environment variable:

```bash
# Use Evolution API
MESSAGING_PROVIDER=evolution

# Use Meta WhatsApp Cloud API
MESSAGING_PROVIDER=meta
```

Restart your application for changes to take effect.

### 2. Programmatically

You can also create providers programmatically:

```typescript
import { MessagingProviderFactory } from './services/messaging';

// Create Evolution provider
const evolutionProvider = MessagingProviderFactory.create('evolution');

// Create Meta provider
const metaProvider = MessagingProviderFactory.create('meta');

// Use singleton instance (recommended)
const provider = MessagingProviderFactory.getInstance();
```

---

## Hybrid Strategy (Recommended for Growth)

As you scale, consider using both providers:

### Phase 1: MVP (0-200 instances)
- ✅ Use Evolution API exclusively
- Focus: Product-market fit
- Cost: $50-200/month

### Phase 2: Growth (200-1000 instances)
- ✅ Primary: Evolution API
- ✅ Prepare Meta integration code
- ✅ Optimize Evolution infrastructure
- Cost: $200-800/month

### Phase 3: Scale (1000-5000 instances)
- ✅ Offer both options to customers
  - Free/Basic tier: Evolution API
  - Premium tier: Meta WhatsApp Cloud API
- ✅ Gradual migration of high-volume clients
- Cost: Variable (mixed infrastructure)

### Phase 4: Enterprise (5000+ instances)
- ✅ Primary: Meta WhatsApp Cloud API
- ✅ Evolution API for specific use cases
- Cost: Mostly per-conversation pricing

---

## Provider Comparison

| Feature | Evolution API | Meta Cloud API |
|---------|--------------|----------------|
| **Cost (100 instances)** | $100-300/month | ~$0 (free tier) |
| **Cost (2000 instances)** | $1000-2000/month | Variable (per conversation) |
| **Setup Time** | 30 minutes | 3-7 days (verification) |
| **QR Code Auth** | ✅ Yes | ❌ No |
| **Business Verification** | ❌ Not required | ✅ Required |
| **Infrastructure** | Self-hosted | Meta-hosted |
| **Scalability** | Good (up to ~2000) | Unlimited |
| **Official Support** | Community | Meta |
| **Message Templates** | ❌ Not required | ✅ Required (first contact) |
| **Webhooks** | ✅ Real-time | ✅ Real-time |
| **Multi-tenant** | ✅ Excellent | ⚠️ Requires mapping |

---

## Migration Guide

When migrating from Evolution to Meta (or vice versa):

### Database Considerations

The `evolutionInstanceName` field in your database stores the provider-specific instance identifier. When migrating:

1. Keep the field name for backward compatibility
2. Update the value to the new provider's identifier
3. Update the `status` field appropriately

### Code Changes Required

**None!** The abstraction layer handles all provider differences. Just change the environment variable.

### Webhook Changes

Both providers send webhooks, but formats differ slightly. Ensure your webhook handler supports both formats if running hybrid mode.

---

## Adding New Providers

To add a new messaging provider:

1. Create a new file: `backend/src/services/messaging/yourprovider.provider.ts`
2. Implement the `MessagingProvider` interface
3. Add to the factory in `provider.factory.ts`
4. Update environment variables in `.env.example`
5. Update this documentation

Example:

```typescript
import { MessagingProvider } from './provider.interface';

export class YourProvider implements MessagingProvider {
  getProviderName(): string {
    return 'yourprovider';
  }

  async createInstance(tenantId: string, instanceName: string, webhookUrl?: string) {
    // Your implementation
  }

  // Implement other methods...
}
```

---

## Best Practices

1. **Start with Evolution API** for MVP and early development
2. **Prepare for Meta** by using the abstraction layer from day 1
3. **Monitor costs** - track instances and messages per provider
4. **Test both providers** before committing to production
5. **Use environment-specific configs** - Evolution for dev, Meta for prod
6. **Plan migration early** - before hitting Evolution's scale limits
7. **Offer choice** - let enterprise clients choose Meta if they prefer

---

## Troubleshooting

### Evolution API Issues

**Problem:** Instances not connecting
- Check EVOLUTION_API_BASE_URL is correct
- Verify Evolution API is running
- Check API key is valid
- Review Evolution API logs

**Problem:** QR codes not generating
- Ensure Evolution API version is compatible
- Check webhook configuration
- Verify instance creation succeeded

### Meta API Issues

**Problem:** "Access token invalid"
- Regenerate System User token
- Check token hasn't expired
- Verify token has correct permissions

**Problem:** "Phone number not verified"
- Complete business verification
- Register phone number in Meta dashboard
- Wait for approval (can take 24-48 hours)

**Problem:** "Template message required"
- Create and approve message templates
- Use templates for first contact
- Regular messages only after customer responds

---

## Support

For Evolution API: https://github.com/EvolutionAPI/evolution-api
For Meta WhatsApp Cloud API: https://developers.facebook.com/docs/whatsapp/cloud-api

---

## Future Providers

Potential providers to add:
- Twilio WhatsApp API
- 360Dialog
- Vonage (Nexmo)
- Other self-hosted solutions

Contributions welcome!
