export declare const interests: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "interests";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "interests";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        tenantId: import("drizzle-orm/pg-core").PgColumn<{
            name: "tenant_id";
            tableName: "interests";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        name: import("drizzle-orm/pg-core").PgColumn<{
            name: "name";
            tableName: "interests";
            dataType: "string";
            columnType: "PgVarchar";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: 255;
        }>;
        keywordContexts: import("drizzle-orm/pg-core").PgColumn<{
            name: "keyword_contexts";
            tableName: "interests";
            dataType: "json";
            columnType: "PgJsonb";
            data: unknown;
            driverParam: unknown;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        isActive: import("drizzle-orm/pg-core").PgColumn<{
            name: "is_active";
            tableName: "interests";
            dataType: "boolean";
            columnType: "PgBoolean";
            data: boolean;
            driverParam: boolean;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        createdAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "created_at";
            tableName: "interests";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        updatedAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "updated_at";
            tableName: "interests";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
export declare const interestModalidades: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "interest_modalidades";
    schema: undefined;
    columns: {
        interestId: import("drizzle-orm/pg-core").PgColumn<{
            name: "interest_id";
            tableName: "interest_modalidades";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        modalidadeId: import("drizzle-orm/pg-core").PgColumn<{
            name: "modalidade_id";
            tableName: "interest_modalidades";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
export declare const interestPortals: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "interest_portals";
    schema: undefined;
    columns: {
        interestId: import("drizzle-orm/pg-core").PgColumn<{
            name: "interest_id";
            tableName: "interest_portals";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        portalId: import("drizzle-orm/pg-core").PgColumn<{
            name: "portal_id";
            tableName: "interest_portals";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
export declare const interestUfs: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "interest_ufs";
    schema: undefined;
    columns: {
        interestId: import("drizzle-orm/pg-core").PgColumn<{
            name: "interest_id";
            tableName: "interest_ufs";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        ufCode: import("drizzle-orm/pg-core").PgColumn<{
            name: "uf_code";
            tableName: "interest_ufs";
            dataType: "string";
            columnType: "PgChar";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: 2;
        }>;
    };
    dialect: "pg";
}>;
export declare const interestsRelations: import("drizzle-orm").Relations<"interests", {
    tenant: import("drizzle-orm").One<"tenants", true>;
    modalidades: import("drizzle-orm").Many<"interest_modalidades">;
    portals: import("drizzle-orm").Many<"interest_portals">;
    ufs: import("drizzle-orm").Many<"interest_ufs">;
}>;
export declare const interestModalidadesRelations: import("drizzle-orm").Relations<"interest_modalidades", {
    interest: import("drizzle-orm").One<"interests", true>;
    modalidade: import("drizzle-orm").One<"modalidades", true>;
}>;
export declare const interestPortalsRelations: import("drizzle-orm").Relations<"interest_portals", {
    interest: import("drizzle-orm").One<"interests", true>;
    portal: import("drizzle-orm").One<"portals", true>;
}>;
export declare const interestUfsRelations: import("drizzle-orm").Relations<"interest_ufs", {
    interest: import("drizzle-orm").One<"interests", true>;
    uf: import("drizzle-orm").One<"ufs", true>;
}>;
//# sourceMappingURL=interests.d.ts.map