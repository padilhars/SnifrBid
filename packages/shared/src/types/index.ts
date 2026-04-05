// Tipos alinhados com o schema do banco de dados

export interface Tenant {
  id: string;
  name: string;
  cnpj?: string | null;
  slug: string;
  planId: string;
  isActive: boolean;
  analysesUsedThisMonth: number;
  analysesResetAt: Date;
  currentPriceBrl: string;
  aiSource: 'platform' | 'own';
  settings: Record<string, unknown>;
  aiConfig?: TenantAIConfig | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantAIConfig {
  provider: string;
  model: string;
  apiKeyEncrypted: string;
  active: boolean;
}

export interface User {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'member' | 'system_admin';
  isActive: boolean;
  emailVerifiedAt?: Date | null;
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
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
  isActive: boolean;
  createdAt: Date;
}

export interface Portal {
  id: string;
  name: string;
  slug: string;
  adapterKey: string;
  baseUrl: string;
  isActive: boolean;
  config: Record<string, unknown>;
  createdAt: Date;
}

export interface Modalidade {
  id: string;
  name: string;
  code: string;
  portalId: string;
  isActive: boolean;
}

export interface Interest {
  id: string;
  tenantId: string;
  name: string;
  keywordContexts: KeywordContext[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface KeywordContext {
  keyword: string;
  context: string;
}

export interface Licitacao {
  id: string;
  portalId: string;
  externalId: string;
  modalidadeId?: string | null;
  ufCode?: string | null;
  orgaoNome?: string | null;
  orgaoCnpj?: string | null;
  objeto: string;
  valorEstimado?: string | null;
  status?: string | null;
  dataPublicacao?: Date | null;
  dataAbertura?: Date | null;
  dataEncerramento?: Date | null;
  editalUrl?: string | null;
  portalUrl?: string | null;
  rawData: Record<string, unknown>;
  contentHash?: string | null;
  collectedAt: Date;
  updatedAt: Date;
}

export interface Match {
  id: string;
  licitacaoId: string;
  interestId: string;
  tenantId: string;
  scoreTextual?: number | null;
  scoreSemantico?: number | null;
  scoreFinal?: number | null;
  matchedKeywords?: string[] | null;
  status: 'pending' | 'analyzing' | 'analyzed' | 'dismissed' | 'participando' | 'quota_exceeded';
  createdAt: Date;
}

export interface Analysis {
  id: string;
  matchId: string;
  tenantId: string;
  modelUsed: string;
  promptTokens?: number | null;
  completionTokens?: number | null;
  scoreAderencia?: number | null;
  nivelRisco?: 'baixo' | 'medio' | 'alto' | 'critico' | null;
  complexidadeTecnica?: 'baixa' | 'media' | 'alta' | null;
  estimativaChances?: 'baixa' | 'media' | 'alta' | null;
  criterioJulgamento?: string | null;
  documentacaoExigida?: string[] | null;
  requisitosTecnicos?: string[] | null;
  pontosAtencao?: string[] | null;
  dataVisitaTecnica?: Date | null;
  dataEntregaProposta?: Date | null;
  dataAberturaProposta?: Date | null;
  resumo?: string | null;
  analiseCompleta?: string | null;
  rawResponse?: Record<string, unknown> | null;
  errorMessage?: string | null;
  createdAt: Date;
}

export interface AiProvider {
  id: string;
  name: string;
  slug: string;
  apiBaseUrl?: string | null;
  modelDefault: string;
  modelsAvailable: string[];
  isActive: boolean;
  isDefault: boolean;
  config: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface AiProviderCredential {
  id: string;
  providerId: string;
  apiKeyEncrypted: string;
  isActive: boolean;
  lastTestedAt?: Date | null;
  lastTestStatus?: 'ok' | 'error' | null;
  lastTestError?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
