'use client';

export default function AdminFilasPage() {
  const bullBoardUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') + '/admin/queues';

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-foreground">Filas BullMQ</h1>
      <div className="bg-background-secondary border border-border rounded-xl overflow-hidden">
        <iframe
          src={bullBoardUrl}
          className="w-full"
          style={{ height: 'calc(100vh - 160px)', border: 'none' }}
          title="Bull Board"
        />
      </div>
    </div>
  );
}
