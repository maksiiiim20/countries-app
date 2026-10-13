const express = require("express");
const pool = require("../config/db");
const {
    getAllCountries,
    getCountryByCode,
    upsertCountry,
} = require("../services/countryRepository");
const {
    fetchCountryByCode,
    fetchAllCountries,
} = require("../services/countriesApi");
const { parseCountry } = require("../services/countryParser");

const router = express.Router();

router.get("/", async (req, res, next) => {
    try {
        const countries = await getAllCountries();

        res.json({
            success: true,
            data: countries,
        });
    } catch (error) {
        next(error);
    }
});

router.post("/sync", async (req, res, next) => {
    try {
        const rawCountries = await fetchAllCountries();

        let synced = 0;
        const errors = [];

        for (const raw of rawCountries) {
            try {
                const parsed = parseCountry(raw);
                await upsertCountry(parsed);
                synced++;
            } catch (error) {
                errors.push({
                    code: raw?.codes?.alpha_3 ?? "UNKNOWN",
                    message: error.message,
                });
            }
        }

        const countries = await getAllCountries();

        res.status(errors.length > 0 ? 207 : 200).json({
            success: errors.length === 0,
            message:
            errors.length === 0
            ? "Synchronizacja zakończona."
            : "Synchronizacja zakończona częściowo.",
            data: countries,
            synced,
            failed: errors.length,
            errors,
        });
    } catch (error) {
        next(error);
    }
});


router.get("/:code", async (req, res, next) => {
    try {
        const code = req.params.code.toUpperCase();

        if (!/^[A-Z]{3}$/.test(code)) {
            return res.status(400).json({
                success: false,
                error: { message: "Nieprawidłowy kod państwa" },
            });
        }

        let country = await getCountryByCode(code);

        if (!country) {
            const raw = await fetchCountryByCode(code);
            const parsed = parseCountry(raw);

            if (!parsed) {
                return res.status(502).json({
                    success: false,
                    error: { message: "Nie udało się przetworzyć danych z API" },
                });
            }

            country = await upsertCountry(parsed);
        }

        res.json({ success: true, data: country });
    } catch (error) {
        if (error.status === 404) {
            return res.status(404).json({
                success: false,
                error: { message: "Nie znaleziono państwa" },
            });
        }

        next(error);
    }
});

router.post("/", async (req, res, next) => {
    try {
        const {
            cca3,
            cca2 = null,
            nameCommon,
            officialName = null,
            capital = [],
            region = null,
            subregion = null,
            population,
            area = null,
            languages = {},
            currencies = {},
            flagUrl = null,
        } = req.body;

        if (
            typeof cca3 !== "string" ||
            !/^[A-Z]{3}$/i.test(cca3) ||
            typeof nameCommon !== "string" ||
            !nameCommon.trim() ||
            !Number.isSafeInteger(population) ||
            population < 0
        ) {
            return res.status(400).json({
                success: false,
                error: { message: "Nieprawidłowe dane państwa" },
            });
        }

        if (
            (cca2 !== null &&
            (typeof cca2 !== "string" || !/^[A-Z]{2}$/i.test(cca2))) ||
            !Array.isArray(capital) ||
            !capital.every((value) => typeof value === "string") ||
            (area !== null &&
            (typeof area !== "number" || !Number.isFinite(area) || area < 0)) ||
            !languages ||
            typeof languages !== "object" ||
            Array.isArray(languages) ||
            !currencies ||
            typeof currencies !== "object" ||
            Array.isArray(currencies) ||
            (flagUrl !== null &&
            (typeof flagUrl !== "string" ||
            !/^https:\/\/[^\s]+$/i.test(flagUrl)))
        ) {
            return res.status(400).json({
                success: false,
                error: { message: "Nieprawidłowy format pól państwa" },
            });
        }

        const country = {
            cca3: cca3.toUpperCase(),
            cca2: cca2 ? cca2.toUpperCase() : null,
            nameCommon: nameCommon.trim(),
            officialName,
            capital,
            region,
            subregion,
            population,
            area,
            languages,
            currencies,
            flagUrl,
        };

        const result = await pool.query(
            `INSERT INTO countries (
                cca3, cca2, name_common, official_name, capital,
                region, subregion, population, area, languages,
                currencies, flag_url
            )
            VALUES (
                $1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9,
                $10::jsonb, $11::jsonb, $12
            )
            RETURNING *`,
            [
                country.cca3,
                country.cca2,
                country.nameCommon,
                country.officialName,
                JSON.stringify(country.capital),
                                        country.region,
                                        country.subregion,
                                        country.population,
                                        country.area,
                                        JSON.stringify(country.languages),
                                        JSON.stringify(country.currencies),
                                        country.flagUrl,
            ]
        );

        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                error: { message: "Państwo o takim kodzie już istnieje" },
            });
        }

        next(error);
    }
});

router.put("/:code", async (req, res, next) => {
    try {
        const code = req.params.code.toUpperCase();
        const { nameCommon, population, region } = req.body;

        if (!/^[A-Z]{3}$/.test(code)) {
            return res.status(400).json({
                success: false,
                error: { message: "Nieprawidłowy kod państwa" },
            });
        }

        if (
            typeof nameCommon !== "string" ||
            !nameCommon.trim() ||
            !Number.isSafeInteger(population) ||
            population < 0 ||
            !(region === null || typeof region === "string")
        ) {
            return res.status(400).json({
                success: false,
                error: { message: "Nieprawidłowe dane aktualizacji" },
            });
        }

        const result = await pool.query(
            `UPDATE countries
            SET name_common = $1,
            population = $2,
            region = $3,
            updated_at = CURRENT_TIMESTAMP
            WHERE cca3 = $4
            RETURNING *`,
            [nameCommon.trim(), population, region, code]
        );

        if (!result.rowCount) {
            return res.status(404).json({
                success: false,
                error: { message: "Nie znaleziono państwa" },
            });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

router.delete("/:code", async (req, res, next) => {
    try {
        const code = req.params.code.toUpperCase();

        if (!/^[A-Z]{3}$/.test(code)) {
            return res.status(400).json({
                success: false,
                error: { message: "Nieprawidłowy kod państwa" },
            });
        }

        const result = await pool.query(
            "DELETE FROM countries WHERE cca3 = $1 RETURNING cca3",
            [code]
        );

        if (!result.rowCount) {
            return res.status(404).json({
                success: false,
                error: { message: "Nie znaleziono państwa" },
            });
        }

        res.json({
            success: true,
            data: { deleted: result.rows[0].cca3 },
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
