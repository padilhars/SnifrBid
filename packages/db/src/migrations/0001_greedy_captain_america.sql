CREATE TABLE "tenant_portals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"portal_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tenant_portals_tenant_id_portal_id_unique" UNIQUE("tenant_id","portal_id")
);
--> statement-breakpoint
CREATE TABLE "tenant_ufs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"uf_code" char(2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tenant_ufs_tenant_id_uf_code_unique" UNIQUE("tenant_id","uf_code")
);
--> statement-breakpoint
ALTER TABLE "tenant_portals" ADD CONSTRAINT "tenant_portals_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_portals" ADD CONSTRAINT "tenant_portals_portal_id_portals_id_fk" FOREIGN KEY ("portal_id") REFERENCES "public"."portals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_ufs" ADD CONSTRAINT "tenant_ufs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_ufs" ADD CONSTRAINT "tenant_ufs_uf_code_ufs_code_fk" FOREIGN KEY ("uf_code") REFERENCES "public"."ufs"("code") ON DELETE cascade ON UPDATE no action;