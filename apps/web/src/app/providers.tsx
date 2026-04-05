'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { queryClient } from '@/lib/queryClient';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      storageKey="snifrbid-theme"
    >
      <QueryClientProvider client={queryClient}>
        <Toaster richColors position="top-right" />
        {children}
      </QueryClientProvider>
    </ThemeProvider>
  );
}
