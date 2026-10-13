/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {};

exports.up = (pgm) => {
    pgm.createTable("countries", {
        cca3: {
            type: "varchar(3)",
                    primaryKey: true,
        },
        cca2: {
            type: "varchar(2)",
                    unique: true,
        },
        name_common: {
            type: "text",
            notNull: true,
        },
        official_name: {
            type: "text",
        },
        capital: {
            type: "jsonb",
            notNull: true,
            default: pgm.func("'[]'::jsonb"),
        },
        region: {
            type: "text",
        },
        subregion: {
            type: "text",
        },
        population: {
            type: "bigint",
            notNull: true,
            default: 0,
        },
        area: {
            type: "numeric",
        },
        languages: {
            type: "jsonb",
            notNull: true,
            default: pgm.func("'{}'::jsonb"),
        },
        currencies: {
            type: "jsonb",
            notNull: true,
            default: pgm.func("'{}'::jsonb"),
        },
        flag_url: {
            type: "text",
        },
        created_at: {
            type: "timestamptz",
            notNull: true,
            default: pgm.func("current_timestamp"),
        },
        updated_at: {
            type: "timestamptz",
            notNull: true,
            default: pgm.func("current_timestamp"),
        },
    });

    pgm.createIndex("countries", "name_common");
    pgm.createIndex("countries", "region");
};

exports.down = (pgm) => {
    pgm.dropTable("countries");
};
