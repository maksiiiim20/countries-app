const pool = require("../config/db");

async function upsertCountry(country) {
    const query = `
    INSERT INTO countries (
        cca3, cca2, name_common, official_name,
        capital, region, subregion, population,
        area, languages, currencies, flag_url, updated_at
    )
    VALUES (
        $1, $2, $3, $4, $5::jsonb, $6, $7, $8,
        $9, $10::jsonb, $11::jsonb, $12, CURRENT_TIMESTAMP
    )
    ON CONFLICT (cca3) DO UPDATE SET
    cca2 = EXCLUDED.cca2,
    name_common = EXCLUDED.name_common,
    official_name = EXCLUDED.official_name,
    capital = EXCLUDED.capital,
    region = EXCLUDED.region,
    subregion = EXCLUDED.subregion,
    population = EXCLUDED.population,
    area = EXCLUDED.area,
    languages = EXCLUDED.languages,
    currencies = EXCLUDED.currencies,
    flag_url = EXCLUDED.flag_url,
    updated_at = CURRENT_TIMESTAMP
    RETURNING *;
    `;

    const values = [
        country.cca3,
        country.cca2,
        country.name_common,
        country.name_official,
        JSON.stringify(country.capital),
        country.region,
        country.subregion,
        country.population,
        country.area,
        JSON.stringify(country.languages),
        JSON.stringify(country.currencies),
        country.flagUrl,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
}

async function getAllCountries() {
    const result = await pool.query(
        "SELECT * FROM countries ORDER BY name_common"
    );
    return result.rows;
}

async function getCountryByCode(code) {
    const result = await pool.query(
        "SELECT * FROM countries WHERE cca3 = $1",
        [code.toUpperCase()]
    );

    return result.rows[0] ?? null;
}

module.exports = {
    upsertCountry,
    getAllCountries,
    getCountryByCode,
};
