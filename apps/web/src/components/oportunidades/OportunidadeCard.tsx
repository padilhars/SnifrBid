'use client';

import Link from 'next/link';
import { Star, Flag, X, ExternalLink } from 'lucide-react';
import { cn, formatDate, formatCurrency, scoreBgColor } from '@/lib/utils';
import type { Match } from '@/types';

interface OportunidadeCardProps {
  match: Match;
  onFavorite?: (matchId: string) => void;
  onParticipando?: (matchId: string) => void;
  onDismiss?: (matchId: string) => void;
  isFavorited?: boolean;
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pendente', className: 'bg-warning/10 text-warning border-warning/30' },
  analyzing: { label: 'Analisando', className: 'bg-info/10 text-info border-info/30' },
  analyzed: { label: 'Analisada', className: 'bg-success/10 text-success border-success/30' },
  dismissed: { label: 'Dispensada', className: 'bg-border text-foreground-muted border-border' },
  quota_exceeded: { label: 'Limite atingido', className: 'bg-danger/10 text-danger border-danger/30' },
};

export function OportunidadeCard({ match, onFavorite, onParticipando, onDismiss, isFavorited }: OportunidadeCardProps) {
  const lic = match.licitacao;
  if (!lic) return null;

  const score = match.scoreFinal;
  const s = score !== null && score !== undefined ? Math.round(score * 100) : null;
  const statusConfig = STATUS_LABELS[match.status] ?? { label: match.status, className: '' };

  return (
    <div className="bg-background-secondary border border-border rounded-xl p-5 hover:border-primary/30 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex flex-wrap gap-1.5">
          {lic.ufCode && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-background-tertiary text-foreground-muted border border-border">
              {lic.ufCode}
            </span>
          )}
          {lic.portal && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              {lic.portal.name}
            </span>
          )}
        </div>
        <span className={cn('text-xs px-2 py-0.5 rounded-full border shrink-0', statusConfig.className)}>
          {statusConfig.label}
        </span>
      </div>

      {/* Órgão */}
      {lic.orgaoNome && (
        <p className="text-xs text-foreground-muted mb-1">{lic.orgaoNome}</p>
      )}

      {/* Objeto */}
      <p
        className="text-sm text-foreground font-medium line-clamp-3 mb-3"
        title={lic.objeto}
      >
        {lic.objeto}
      </p>

      {/* Metadados */}
      <div className="flex flex-wrap gap-3 text-xs text-foreground-muted mb-3">
        {lic.modalidade && <span>{lic.modalidade.name}</span>}
        {lic.valorEstimado && (
          <span className="font-medium text-foreground">{formatCurrency(lic.valorEstimado)}</span>
        )}
        {lic.dataEncerramento && (
          <span className="text-warning">Encerra: {formatDate(lic.dataEncerramento)}</span>
        )}
      </div>

      {/* Barra de relevância */}
      {s !== null && (
        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 h-1.5 rounded-full bg-background-tertiary overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', s >= 80 ? 'bg-success' : s >= 60 ? 'bg-warning' : 'bg-foreground-hint')}
              style={{ width: `${s}%` }}
            />
          </div>
          <span className={cn('text-xs font-bold', scoreBgColor(score), 'px-1.5 py-0.5 rounded')}>
            {s}/100
          </span>
        </div>
      )}

      {/* Ações */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <Link
          href={`/oportunidades/${match.id}`}
          className="flex-1 text-center text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
        >
          Ver detalhes
        </Link>

        <button
          onClick={() => onFavorite?.(match.id)}
          title={isFavorited ? 'Remover dos favoritos — só você verá' : 'Adicionar aos meus favoritos — só você verá'}
          className={cn(
            'p-1.5 rounded-lg border transition-colors',
            isFavorited
              ? 'bg-warning/10 border-warning/30 text-warning'
              : 'border-border text-foreground-muted hover:border-warning/30 hover:text-warning',
          )}
        >
          <Star size={14} fill={isFavorited ? 'currentColor' : 'none'} />
        </button>

        <button
          onClick={() => onParticipando?.(match.id)}
          title="Marcar para o time — todos os usuários verão aqui"
          className={cn(
            'p-1.5 rounded-lg border transition-colors',
            match.status === 'participando'
              ? 'bg-success/10 border-success/30 text-success'
              : 'border-border text-foreground-muted hover:border-success/30 hover:text-success',
          )}
        >
          <Flag size={14} />
        </button>

        <button
          onClick={() => onDismiss?.(match.id)}
          title="Dispensar para o time inteiro"
          className="p-1.5 rounded-lg border border-border text-foreground-muted hover:border-danger/30 hover:text-danger transition-colors"
        >
          <X size={14} />
        </button>

        {lic.portalUrl && (
          <a
            href={lic.portalUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Acessar no portal"
            className="p-1.5 rounded-lg border border-border text-foreground-muted hover:text-foreground transition-colors"
          >
            <ExternalLink size={14} />
          </a>
        )}
      </div>
    </div>
  );
}
