import { embravaClient } from './client';

const WEBHOOK_PATTERNS = ['ngrok', 'localhost', 'embrava-sensors', '127.0.0.1'];

/**
 * Check if a webhook URL matches our cleanup patterns.
 */
function shouldDeleteWebhook(url: string): boolean {
  return WEBHOOK_PATTERNS.some((pattern) => url.toLowerCase().includes(pattern));
}

/**
 * Register webhooks with the Embrava DMS.
 * This function:
 * 1. Gets all existing webhooks
 * 2. Deletes webhooks matching our patterns (ngrok, localhost, etc.)
 * 3. Registers new EVENT and WORKSPACE webhooks
 */
export async function registerWebhooks(baseUrl: string): Promise<void> {
  const webhookSecret = process.env.WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error('WEBHOOK_SECRET environment variable is not set');
  }

  if (!baseUrl) {
    throw new Error('baseUrl is required for webhook registration');
  }

  console.log('Starting webhook registration...');
  console.log(`Base URL: ${baseUrl}`);

  // 1. Get all existing webhooks
  console.log('Fetching existing webhooks...');
  const existingWebhooks = await embravaClient.getWebhooks();
  console.log(`Found ${existingWebhooks.length} existing webhooks`);

  // 2. Delete webhooks matching our patterns
  const webhooksToDelete = existingWebhooks.filter((wh) => shouldDeleteWebhook(wh.url));
  console.log(`Found ${webhooksToDelete.length} webhooks to delete`);

  for (const webhook of webhooksToDelete) {
    try {
      await embravaClient.deleteWebhook(webhook.id);
      console.log(`Deleted webhook ${webhook.id}: ${webhook.type} - ${webhook.url}`);
    } catch (error) {
      console.error(`Failed to delete webhook ${webhook.id}:`, error);
    }
  }

  // 3. Register new EVENT webhook
  const eventWebhookUrl = `${baseUrl}/api/embrava/events`;
  console.log(`Registering EVENT webhook: ${eventWebhookUrl}`);
  try {
    await embravaClient.createWebhook(eventWebhookUrl, webhookSecret, 'EVENT');
    console.log('EVENT webhook registered successfully');
  } catch (error) {
    console.error('Failed to register EVENT webhook:', error);
    throw error;
  }

  // 4. Register new WORKSPACE webhook
  const workspaceWebhookUrl = `${baseUrl}/api/embrava/workspace`;
  console.log(`Registering WORKSPACE webhook: ${workspaceWebhookUrl}`);
  try {
    await embravaClient.createWebhook(workspaceWebhookUrl, webhookSecret, 'WORKSPACE');
    console.log('WORKSPACE webhook registered successfully');
  } catch (error) {
    console.error('Failed to register WORKSPACE webhook:', error);
    throw error;
  }

  console.log('Webhook registration complete!');
}

/**
 * Clean up all webhooks matching our patterns without registering new ones.
 * Useful for cleanup during shutdown or testing.
 */
export async function cleanupWebhooks(): Promise<void> {
  console.log('Cleaning up webhooks...');

  const existingWebhooks = await embravaClient.getWebhooks();
  const webhooksToDelete = existingWebhooks.filter((wh) => shouldDeleteWebhook(wh.url));

  for (const webhook of webhooksToDelete) {
    try {
      await embravaClient.deleteWebhook(webhook.id);
      console.log(`Deleted webhook ${webhook.id}: ${webhook.type} - ${webhook.url}`);
    } catch (error) {
      console.error(`Failed to delete webhook ${webhook.id}:`, error);
    }
  }

  console.log('Webhook cleanup complete!');
}
