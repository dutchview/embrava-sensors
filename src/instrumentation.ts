export async function register() {
  // Only run on Node.js runtime (not edge)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('Starting application initialization...');

    try {
      // Dynamically import to avoid issues with edge runtime
      const { connectToDatabase } = await import('@/lib/db');
      const { registerWebhooks } = await import('@/lib/embrava');

      // 1. Connect to MongoDB
      console.log('Connecting to MongoDB...');
      await connectToDatabase();
      console.log('Connected to MongoDB successfully');

      // 2. Register webhooks if WEBHOOK_BASE_URL is set
      const webhookBaseUrl = process.env.WEBHOOK_BASE_URL;

      if (webhookBaseUrl) {
        console.log('Registering webhooks...');
        await registerWebhooks(webhookBaseUrl);
        console.log('Webhooks registered successfully');
      } else {
        console.warn(
          'WEBHOOK_BASE_URL is not set. Skipping webhook registration. ' +
            'To receive webhooks from Embrava, start ngrok and set WEBHOOK_BASE_URL.'
        );
      }

      console.log('Application initialization complete!');
    } catch (error) {
      console.error('Application initialization failed:', error);
      // Don't throw - allow the app to start even if initialization fails
      // This allows viewing the UI without full Embrava integration
    }
  }
}
