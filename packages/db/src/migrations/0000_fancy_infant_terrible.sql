CREATE TABLE "ai_provider_credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_id" uuid NOT NULL,
	"api_key_encrypted" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_tested_at" timestamp with time zone,
	"last_test_status" varchar(20),
	"last_test_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_providers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(50) NOT NULL,
	"api_base_url" varchar(255),
	"model_default" varchar(100) NOT NULL,
	"models_available" text[] DEFAULT '{}' NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ai_providers_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"user_id" uuid,
	"action" varchar(100) NOT NULL,
	"resource_type" varchar(100),
	"resource_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"ip_address" "inet",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(50) NOT NULL,
	"max_interests" integer DEFAULT 3 NOT NULL,
	"max_portals" integer DEFAULT 1 NOT NULL,
	"max_analyses_per_month" integer DEFAULT 50 NOT NULL,
	"max_users" integer DEFAULT 1 NOT NULL,
	"price_with_platform_ai_brl" numeric(10, 2) DEFAULT '0' NOT NULL,
	"price_with_own_ai_brl" numeric(10, 2) DEFAULT '0' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "plans_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" varchar(255) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"cnpj" varchar(18),
	"slug" varchar(100) NOT NULL,
	"plan_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"analyses_used_this_month" integer DEFAULT 0 NOT NULL,
	"analyses_reset_at" timestamp with time zone DEFAULT now() NOT NULL,
	"current_price_brl" numeric(10, 2) DEFAULT '0' NOT NULL,
	"ai_source" varchar(20) DEFAULT 'platform' NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ai_config" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tenants_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"role" varchar(50) DEFAULT 'member' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"email_verified_at" timestamp with time zone,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "modalidades" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(150) NOT NULL,
	"code" varchar(20) NOT NULL,
	"portal_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "modalidades_code_portal_id_unique" UNIQUE("code","portal_id")
);
--> statement-breakpoint
CREATE TABLE "portals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(50) NOT NULL,
	"adapter_key" varchar(50) NOT NULL,
	"base_url" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" varchar(50) DEFAULT 'now()' NOT NULL,
	CONSTRAINT "portals_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "ufs" (
	"code" char(2) PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interest_modalidades" (
	"interest_id" uuid NOT NULL,
	"modalidade_id" uuid NOT NULL,
	CONSTRAINT "interest_modalidades_interest_id_modalidade_id_pk" PRIMARY KEY("interest_id","modalidade_id")
);
--> statement-breakpoint
CREATE TABLE "interest_portals" (
	"interest_id" uuid NOT NULL,
	"portal_id" uuid NOT NULL,
	CONSTRAINT "interest_portals_interest_id_portal_id_pk" PRIMARY KEY("interest_id","portal_id")
);
--> statement-breakpoint
CREATE TABLE "interest_ufs" (
	"interest_id" uuid NOT NULL,
	"uf_code" char(2) NOT NULL,
	CONSTRAINT "interest_ufs_interest_id_uf_code_pk" PRIMARY KEY("interest_id","uf_code")
);
--> statement-breakpoint
CREATE TABLE "interests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"keyword_contexts" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "licitacao_documentos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"licitacao_id" uuid NOT NULL,
	"tipo" varchar(100),
	"nome" varchar(500),
	"url" text NOT NULL,
	"tamanho_bytes" numeric,
	"mime_type" varchar(100),
	"content_hash" varchar(64),
	"downloaded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "licitacoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"portal_id" uuid NOT NULL,
	"external_id" varchar(255) NOT NULL,
	"modalidade_id" uuid,
	"uf_code" char(2),
	"orgao_nome" varchar(500),
	"orgao_cnpj" varchar(18),
	"objeto" text NOT NULL,
	"valor_estimado" numeric(18, 2),
	"status" varchar(100),
	"data_publicacao" timestamp with time zone,
	"data_abertura" timestamp with time zone,
	"data_encerramento" timestamp with time zone,
	"edital_url" text,
	"portal_url" text,
	"raw_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"content_hash" varchar(64),
	"search_vector" "tsvector",
	"embedding" vector(768),
	"collected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analyses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"model_used" varchar(100) NOT NULL,
	"prompt_tokens" integer,
	"completion_tokens" integer,
	"score_aderencia" integer,
	"nivel_risco" varchar(20),
	"complexidade_tecnica" varchar(20),
	"estimativa_chances" varchar(20),
	"criterio_julgamento" varchar(100),
	"documentacao_exigida" text[],
	"requisitos_tecnicos" text[],
	"pontos_atencao" text[],
	"data_visita_tecnica" timestamp with time zone,
	"data_entrega_proposta" timestamp with time zone,
	"data_abertura_propostas" timestamp with time zone,
	"resumo" text,
	"analise_completa" text,
	"raw_response" text,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "match_user_watchlist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"match_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "match_user_watchlist_user_id_match_id_unique" UNIQUE("user_id","match_id")
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"licitacao_id" uuid NOT NULL,
	"interest_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"score_textual" real,
	"score_semantico" real,
	"score_final" real,
	"matched_keywords" text[],
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "matches_licitacao_id_interest_id_unique" UNIQUE("licitacao_id","interest_id")
);
--> statement-breakpoint
CREATE TABLE "licitacao_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"licitacao_id" uuid NOT NULL,
	"content_hash" varchar(64) NOT NULL,
	"snapshot" jsonb NOT NULL,
	"changes_detected" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"telegram_chat_id" varchar(100),
	"telegram_enabled" boolean DEFAULT false NOT NULL,
	"email_enabled" boolean DEFAULT true NOT NULL,
	"webpush_enabled" boolean DEFAULT false NOT NULL,
	"webpush_subscription" jsonb,
	"notify_new_match" boolean DEFAULT true NOT NULL,
	"notify_analysis_complete" boolean DEFAULT true NOT NULL,
	"notify_status_change" boolean DEFAULT true NOT NULL,
	"notify_deadline_alert" boolean DEFAULT true NOT NULL,
	"deadline_alert_days" integer DEFAULT 3 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid,
	"match_id" uuid,
	"type" varchar(100) NOT NULL,
	"channel" varchar(50) NOT NULL,
	"title" varchar(500),
	"body" text,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_provider_credentials" ADD CONSTRAINT "ai_provider_credentials_provider_id_ai_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."ai_providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modalidades" ADD CONSTRAINT "modalidades_portal_id_portals_id_fk" FOREIGN KEY ("portal_id") REFERENCES "public"."portals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interest_modalidades" ADD CONSTRAINT "interest_modalidades_interest_id_interests_id_fk" FOREIGN KEY ("interest_id") REFERENCES "public"."interests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interest_modalidades" ADD CONSTRAINT "interest_modalidades_modalidade_id_modalidades_id_fk" FOREIGN KEY ("modalidade_id") REFERENCES "public"."modalidades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interest_portals" ADD CONSTRAINT "interest_portals_interest_id_interests_id_fk" FOREIGN KEY ("interest_id") REFERENCES "public"."interests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interest_portals" ADD CONSTRAINT "interest_portals_portal_id_portals_id_fk" FOREIGN KEY ("portal_id") REFERENCES "public"."portals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interest_ufs" ADD CONSTRAINT "interest_ufs_interest_id_interests_id_fk" FOREIGN KEY ("interest_id") REFERENCES "public"."interests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interest_ufs" ADD CONSTRAINT "interest_ufs_uf_code_ufs_code_fk" FOREIGN KEY ("uf_code") REFERENCES "public"."ufs"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interests" ADD CONSTRAINT "interests_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "licitacao_documentos" ADD CONSTRAINT "licitacao_documentos_licitacao_id_licitacoes_id_fk" FOREIGN KEY ("licitacao_id") REFERENCES "public"."licitacoes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "licitacoes" ADD CONSTRAINT "licitacoes_portal_id_portals_id_fk" FOREIGN KEY ("portal_id") REFERENCES "public"."portals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "licitacoes" ADD CONSTRAINT "licitacoes_modalidade_id_modalidades_id_fk" FOREIGN KEY ("modalidade_id") REFERENCES "public"."modalidades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "licitacoes" ADD CONSTRAINT "licitacoes_uf_code_ufs_code_fk" FOREIGN KEY ("uf_code") REFERENCES "public"."ufs"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analyses" ADD CONSTRAINT "analyses_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analyses" ADD CONSTRAINT "analyses_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_user_watchlist" ADD CONSTRAINT "match_user_watchlist_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_user_watchlist" ADD CONSTRAINT "match_user_watchlist_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_user_watchlist" ADD CONSTRAINT "match_user_watchlist_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_licitacao_id_licitacoes_id_fk" FOREIGN KEY ("licitacao_id") REFERENCES "public"."licitacoes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_interest_id_interests_id_fk" FOREIGN KEY ("interest_id") REFERENCES "public"."interests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "licitacao_snapshots" ADD CONSTRAINT "licitacao_snapshots_licitacao_id_licitacoes_id_fk" FOREIGN KEY ("licitacao_id") REFERENCES "public"."licitacoes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_interests_keywords" ON "interests" USING btree ("keyword_contexts");--> statement-breakpoint
CREATE INDEX "uniq_portal_external" ON "licitacoes" USING btree ("portal_id","external_id");--> statement-breakpoint
CREATE INDEX "idx_licitacoes_portal" ON "licitacoes" USING btree ("portal_id");--> statement-breakpoint
CREATE INDEX "idx_licitacoes_uf" ON "licitacoes" USING btree ("uf_code");--> statement-breakpoint
CREATE INDEX "idx_licitacoes_data_publicacao" ON "licitacoes" USING btree ("data_publicacao");--> statement-breakpoint
CREATE INDEX "idx_watchlist_user" ON "match_user_watchlist" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_watchlist_tenant" ON "match_user_watchlist" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_matches_tenant" ON "matches" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_matches_status" ON "matches" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_matches_created" ON "matches" USING btree ("created_at");