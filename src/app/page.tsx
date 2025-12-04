import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Building2, Webhook } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Embrava DMS Integration - Manage workplaces and view sensor events
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/events">
          <Card className="hover:border-primary transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Events</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardDescription>
                View incoming events from Embrava sensors including bookings and
                user status changes
              </CardDescription>
            </CardContent>
          </Card>
        </Link>

        <Link href="/workplaces">
          <Card className="hover:border-primary transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Workplaces</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardDescription>
                Manage workspace configurations linked to Embrava Desk Signs
              </CardDescription>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Webhooks</CardTitle>
            <Webhook className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription>
              Webhooks are automatically registered on startup. Check the console
              for registration status.
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>
            Follow these steps to start receiving events from Embrava
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">1. Start MongoDB</h3>
            <pre className="bg-muted p-3 rounded-md text-sm">
              docker-compose up -d
            </pre>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">2. Start ngrok tunnel</h3>
            <pre className="bg-muted p-3 rounded-md text-sm">ngrok http 3000</pre>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">3. Set webhook URL and restart</h3>
            <pre className="bg-muted p-3 rounded-md text-sm">
              export WEBHOOK_BASE_URL=https://your-url.ngrok-free.app{'\n'}
              npm run dev
            </pre>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">4. Add workplaces</h3>
            <p className="text-sm text-muted-foreground">
              Go to the Workplaces page and add your desk configurations with
              DeskSignIDs matching your Embrava sensors.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
