export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Branding — oculto em mobile */}
      <div className="hidden md:flex md:w-1/2 bg-primary flex-col justify-center items-center p-12 text-primary-foreground">
        <div className="max-w-sm text-center">
          <div className="text-4xl font-bold mb-4">SnifrBid</div>
          <p className="text-xl mb-8 opacity-90">Monitore licitações públicas com inteligência artificial</p>
          <ul className="text-left space-y-3 opacity-80">
            <li className="flex items-center gap-2">
              <span className="text-lg">✓</span>
              <span>Matching automático com seu perfil de negócio</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-lg">✓</span>
              <span>Análise de viabilidade por IA em segundos</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-lg">✓</span>
              <span>Alertas por Telegram, email e notificações</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-lg">✓</span>
              <span>Monitoramento de mudanças em tempo real</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Formulário */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background-secondary">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}
