import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, ArrowRight, Building2, ExternalLink, Terminal, Webhook } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Image
          src="/flexwhere-logo.svg"
          alt="FlexWhere"
          width={180}
          height={36}
          className="h-9 w-auto"
          priority
        />
        <div className="h-8 w-px bg-border" />
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Embrava Sensors</h1>
          <p className="text-sm text-muted-foreground">
            DMS Integration Dashboard
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/events">
          <Card className="group hover:border-primary hover:shadow-md hover:shadow-primary/5 transition-all cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Events</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Activity className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                View incoming events from Embrava sensors including bookings and
                status changes
              </CardDescription>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                View events <ArrowRight className="h-3 w-3" />
              </span>
            </CardContent>
          </Card>
        </Link>

        <Link href="/workplaces">
          <Card className="group hover:border-primary hover:shadow-md hover:shadow-primary/5 transition-all cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Workplaces</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Manage workspace configurations linked to Embrava Desk Signs
              </CardDescription>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                Manage workplaces <ArrowRight className="h-3 w-3" />
              </span>
            </CardContent>
          </Card>
        </Link>

        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Webhooks</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Webhook className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Webhooks are automatically registered on startup. Check the console
              for registration status.
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Embrava Portal */}
      <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ExternalLink className="h-5 w-5 text-primary" />
            Embrava Device Management
          </CardTitle>
          <CardDescription>
            To configure and manage your Embrava devices, visit the{' '}
            <a
              href="https://portal.embrava.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-medium hover:underline underline-offset-2 inline-flex items-center gap-1"
            >
              Embrava Portal <ExternalLink className="h-3 w-3" />
            </a>
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Dev Setup */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Terminal className="h-5 w-5 text-primary" />
              Quick Start
            </CardTitle>
            <CardDescription>
              Use the{' '}
              <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono text-xs font-semibold">
                /dev
              </code>{' '}
              skill in Claude Code to automatically set up the entire dev environment
              in one command — ngrok, Docker, and the dev server.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Manual Setup</CardTitle>
            <CardDescription>
              Follow these steps to start receiving events from Embrava
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <h3 className="text-sm font-medium">1. Start MongoDB</h3>
              <pre className="bg-muted p-2.5 rounded-lg text-xs font-mono">docker-compose up -d</pre>
            </div>
            <div className="space-y-1.5">
              <h3 className="text-sm font-medium">2. Start ngrok tunnel</h3>
              <pre className="bg-muted p-2.5 rounded-lg text-xs font-mono">ngrok http 3000</pre>
            </div>
            <div className="space-y-1.5">
              <h3 className="text-sm font-medium">3. Set webhook URL and restart</h3>
              <pre className="bg-muted p-2.5 rounded-lg text-xs font-mono">
                WEBHOOK_BASE_URL=https://your-url.ngrok-free.app{'\n'}bun run dev
              </pre>
            </div>
            <div className="space-y-1.5">
              <h3 className="text-sm font-medium">4. Add workplaces</h3>
              <p className="text-xs text-muted-foreground">
                Go to the Workplaces page and add your desk configurations with
                DeskSignIDs matching your Embrava sensors.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
