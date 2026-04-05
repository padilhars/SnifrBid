export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  tenantId: string;
}

export interface Tenant {
  id: string;
  name: string;
  cnpj?: string;
  slug: string;
  planId: string;
  isActive: boolean;
  analysesUsedThisMonth: number;
  aiSource: 'platform' | 'own';
  currentPriceBrl: string;
  plan?: Plan;
}

export interface Plan {
  id: string;
  name: string;
  slug: string;
  maxInterests: number;
  maxPortals: number;
  maxAnalysesPerMonth: number;
  maxUsers: number;
  priceWithPlatformAiBrl: string;
  priceWithOwnAiBrl: string;
}

export interface Interest {
  id: string;
  tenantId: string;
  name: string;
  keywordContexts: Array<{ keyword: string; context: string }>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  modalidades?: Array<{ modalidade: { id: string; name: string; code: string } }>;
  portals?: Array<{ portal: { id: string; name: string; slug: string } }>;
  ufs?: Array<{ ufCode: string }>;
}

export interface Match {
  id: string;
  licitacaoId: string;
  interestId: string;
  tenantId: string;
  scoreTextual?: number;
  scoreSemantico?: number;
  scoreFinal?: number;
  matchedKeywords?: string[];
  status: 'pending' | 'analyzing' | 'analyzed' | 'dismissed' | 'quota_exceeded' | 'participando';
  createdAt: string;
  licitacao?: Licitacao;
  interest?: Interest;
  analyses?: Analysis[];
}

export interface Licitacao {
  id: string;
  portalId: string;
  externalId: string;
  objeto: string;
  orgaoNome?: string;
  orgaoCnpj?: string;
  ufCode?: string;
  valorEstimado?: string;
  status?: string;
  dataPublicacao?: string;
  dataAbertura?: string;
  dataEncerramento?: string;
  editalUrl?: string;
  portalUrl?: string;
  portal?: { name: string; slug: string };
  modalidade?: { name: string; code: string };
  documentos?: LicitacaoDocumento[];
  collectedAt: string;
  updatedAt: string;
}

export interface LicitacaoDocumento {
  id: string;
  tipo?: string;
  nome?: string;
  url: string;
  tamanhoBytes?: string;
  mimeType?: string;
}

export interface Analysis {
  id: string;
  matchId: string;
  tenantId: string;
  modelUsed: string;
  scoreAderencia?: number;
  nivelRisco?: 'baixo' | 'medio' | 'alto' | 'critico';
  complexidadeTecnica?: 'baixa' | 'media' | 'alta';
  estimativaChances?: 'baixa' | 'media' | 'alta';
  criterioJulgamento?: string;
  documentacaoExigida?: string[];
  requisitosTecnicos?: string[];
  pontosAtencao?: string[];
  dataEntregaProposta?: string;
  dataAberturaProposta?: string;
  resumo?: string;
  analiseCompleta?: string;
  errorMessage?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  tenantId: string;
  userId?: string;
  matchId?: string;
  type: string;
  channel: string;
  title?: string;
  body?: string;
  status: string;
  errorMessage?: string;
  sentAt?: string;
  createdAt: string;
}

export interface NotificationPreferences {
  id?: string;
  userId: string;
  telegramChatId?: string;
  telegramEnabled: boolean;
  emailEnabled: boolean;
  webpushEnabled: boolean;
  notifyNewMatch: boolean;
  notifyAnalysisComplete: boolean;
  notifyStatusChange: boolean;
  notifyDeadlineAlert: boolean;
  deadlineAlertDays: number;
}

export interface Portal {
  id: string;
  name: string;
  slug: string;
  adapterKey: string;
  baseUrl: string;
  isActive: boolean;
}

export interface Modalidade {
  id: string;
  name: string;
  code: string;
  portalId: string;
}

export interface UF {
  code: string;
  name: string;
}

export interface LicitacaoSnapshot {
  id: string;
  licitacaoId: string;
  contentHash: string;
  snapshot: Record<string, unknown>;
  changesDetected?: Record<string, unknown>;
  createdAt: string;
}
