import { nanoid } from 'nanoid';
import { put, get, update, tableNames } from './dynamo';

export interface Slot {
  slotId: string;
  tenantId: string;
  resourceId: string;
  startISO: string;
  endISO: string;
  status: 'free' | 'held' | 'booked';
  holdUntil?: number;
  ttl?: number;
}

export interface Booking {
  bookingId: string;
  tenantId: string;
  waNumber: string;
  resourceId: string;
  slotId: string;
  startISO: string;
  endISO: string;
  status: 'confirmed' | 'canceled';
  createdAt: string;
  audit?: any[];
}

export function buildSlotId(tenantId: string, resourceId: string, startISO: string): string {
  return `${tenantId}#${resourceId}#${startISO}`;
}

export async function getSlot(slotId: string): Promise<Slot | null> {
  try {
    const result = await get({
      TableName: tableNames.slots,
      Key: { slotId }
    });
    return result.Item as Slot || null;
  } catch (error) {
    console.error('❌ Error getting slot:', error);
    return null;
  }
}

export async function holdSlot({
  tenantId,
  resourceId,
  startISO,
  endISO,
  holdMs
}: {
  tenantId: string;
  resourceId: string;
  startISO: string;
  endISO: string;
  holdMs: number;
}): Promise<{ success: boolean; slotId: string; reason?: string }> {
  const slotId = buildSlotId(tenantId, resourceId, startISO);
  const now = Date.now();
  const holdUntil = now + holdMs;
  const ttl = Math.floor(holdUntil / 1000) + 60; // TTL with 60s buffer

  try {
    // Try to hold the slot with condition: allow if free OR if held but expired
    await put({
      TableName: tableNames.slots,
      Item: {
        slotId,
        tenantId,
        resourceId,
        startISO,
        endISO,
        status: 'held',
        holdUntil,
        ttl
      },
      ConditionExpression: 'attribute_not_exists(slotId) OR #status = :free OR (#status = :held AND holdUntil < :now)',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':free': 'free',
        ':held': 'held',
        ':now': now
      }
    });

    console.log(`✅ Slot held: ${slotId} until ${new Date(holdUntil).toISOString()}`);
    return { success: true, slotId };

  } catch (error: any) {
    if (error.name === 'ConditionalCheckFailedException') {
      console.log(`⚠️ Slot ${slotId} is not available for hold`);
      return { success: false, slotId, reason: 'Slot not available' };
    }
    console.error('❌ Error holding slot:', error);
    return { success: false, slotId, reason: 'Database error' };
  }
}

export async function confirmSlot({
  tenantId,
  waNumber,
  resourceId,
  startISO,
  endISO
}: {
  tenantId: string;
  waNumber: string;
  resourceId: string;
  startISO: string;
  endISO: string;
}): Promise<{ success: boolean; bookingId?: string; reason?: string }> {
  const slotId = buildSlotId(tenantId, resourceId, startISO);
  const now = Date.now();
  const bookingId = `bk_${nanoid()}`;

  try {
    // First, update slot to booked with condition: must be held and not expired
    await update({
      TableName: tableNames.slots,
      Key: { slotId },
      UpdateExpression: 'SET #status = :booked REMOVE holdUntil, #ttl',
      ConditionExpression: '#status = :held AND holdUntil >= :now',
      ExpressionAttributeNames: {
        '#status': 'status',
        '#ttl': 'ttl'
      },
      ExpressionAttributeValues: {
        ':booked': 'booked',
        ':held': 'held',
        ':now': now
      }
    });

    // Create booking record
    await put({
      TableName: tableNames.bookings,
      Item: {
        bookingId,
        tenantId,
        waNumber,
        resourceId,
        slotId,
        startISO,
        endISO,
        status: 'confirmed',
        createdAt: new Date().toISOString(),
        audit: [
          {
            action: 'created',
            timestamp: new Date().toISOString(),
            by: waNumber
          }
        ]
      }
    });

    console.log(`✅ Slot confirmed: ${slotId} -> booking: ${bookingId}`);
    return { success: true, bookingId };

  } catch (error: any) {
    if (error.name === 'ConditionalCheckFailedException') {
      console.log(`⚠️ Slot ${slotId} hold expired or not held`);
      return { success: false, reason: 'Hold expired or slot not held' };
    }
    console.error('❌ Error confirming slot:', error);
    return { success: false, reason: 'Database error' };
  }
}

export async function releaseSlot(slotId: string): Promise<boolean> {
  try {
    await update({
      TableName: tableNames.slots,
      Key: { slotId },
      UpdateExpression: 'SET #status = :free REMOVE holdUntil, #ttl',
      ExpressionAttributeNames: {
        '#status': 'status',
        '#ttl': 'ttl'
      },
      ExpressionAttributeValues: {
        ':free': 'free'
      }
    });

    console.log(`✅ Slot released: ${slotId}`);
    return true;
  } catch (error) {
    console.error('❌ Error releasing slot:', error);
    return false;
  }
}