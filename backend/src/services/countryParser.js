
// src/services/countryParser.js

/**
 * Sprawdza, czy wartość jest zwykłym obiektem.
 */
function isObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * Zwraca tekst bez zbędnych spacji lub null,
 * jeśli wartość nie jest prawidłowym tekstem.
 */
function cleanString(value) {
    if (typeof value !== "string") {
        return null;
    }

    const cleaned = value.trim();
    return cleaned.length > 0 ? cleaned : null;
}

/**
 * Normalizuje kod kraju do wielkich liter.
 */
function normalizeCode(value, length) {
    const code = cleanString(value)?.toUpperCase();

    if (!code || !new RegExp(`^[A-Z]{${length}}$`).test(code)) {
        return null;
    }

    return code;
}

/**
 * Odczytuje nazwy stolic z formatu REST Countries API v5.
 * API może zwrócić tablicę obiektów albo tablicę tekstów.
 */
function parseCapitals(value) {
    if (!Array.isArray(value)) {
        return [];
    }

    return [
        ...new Set(
            value
            .map((capital) => {
                if (typeof capital === "string") {
                    return cleanString(capital);
                }

                if (isObject(capital)) {
                    return cleanString(capital.name);
                }

                return null;
            })
            .filter(Boolean)
        ),
    ];
}

/**
 * Normalizuje języki do obiektu JSON.
 * Obsługuje tablicę obiektów lub obiekt klucz-wartość.
 */
function parseLanguages(value) {
    if (Array.isArray(value)) {
        const languages = {};

        for (const language of value) {
            if (!isObject(language)) {
                continue;
            }

            const code = cleanString(
                language.code ?? language.id ?? language.iso639_1
            );

            const name = cleanString(
                language.name ?? language.common ?? language.official
            );

            if (code && name) {
                languages[code] = name;
            } else if (name) {
                languages[name] = name;
            }
        }

        return languages;
    }

    if (isObject(value)) {
        const languages = {};

        for (const [key, name] of Object.entries(value)) {
            const cleanedName = cleanString(name);

            if (cleanedName) {
                languages[key] = cleanedName;
            }
        }

        return languages;
    }

    return {};
}

/**
 * Normalizuje waluty do obiektu JSON.
 */
function parseCurrencies(value) {
    if (!isObject(value)) {
        return {};
    }

    const currencies = {};

    for (const [code, currency] of Object.entries(value)) {
        if (typeof currency === "string") {
            const name = cleanString(currency);

            if (name) {
                currencies[code] = { name };
            }

            continue;
        }

        if (!isObject(currency)) {
            continue;
        }

        const name = cleanString(currency.name);
        const symbol = cleanString(currency.symbol);

        currencies[code] = {
            ...(name ? { name } : {}),
            ...(symbol ? { symbol } : {}),
        };
    }

    return currencies;
}

/**
 * Normalizuje populację do liczby całkowitej.
 */
function parsePopulation(value) {
    if (
        typeof value !== "number" ||
        !Number.isSafeInteger(value) ||
        value < 0
    ) {
        return null;
    }

    return value;
}

/**
 * Normalizuje powierzchnię kraju.
 */
function parseArea(value) {
    if (
        typeof value !== "number" ||
        !Number.isFinite(value) ||
        value < 0
    ) {
        return null;
    }

    return value;
}

/**
 * Odczytuje adres flagi, jeśli API go udostępnia.
 */
function parseFlagUrl(flag) {
    if (!isObject(flag)) {
        return null;
    }

    const candidate =
    cleanString(flag.png) ??
    cleanString(flag.svg) ??
    cleanString(flag.url);

    if (!candidate) {
        return null;
    }

    try {
        const url = new URL(candidate);

        if (url.protocol === "https:" || url.protocol === "http:") {
            return url.toString();
        }
    } catch {
        // Nieprawidłowy adres flagi.
    }

    return null;
}

/**
 * Parsuje i waliduje pojedynczy kraj z REST Countries API v5.
 *
 * Zwracany obiekt odpowiada kolumnom tabeli countries:
 * cca3, cca2, name, official_name, capital, region,
 * subregion, population, area, languages, currencies, flag_url.
 */
function parseCountry(raw) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
        throw new Error("Dane kraju muszą być obiektem.");
    }

    const codes = raw.codes ?? {};
    const names = raw.names ?? {};

    const cca3 =
    typeof codes.alpha_3 === "string"
    ? codes.alpha_3.trim().toUpperCase()
    : null;

    const cca2 =
    typeof codes.alpha_2 === "string"
    ? codes.alpha_2.trim().toUpperCase()
    : null;

    const nameCommon =
    typeof names.common === "string" ? names.common.trim() : null;

    const nameOfficial =
    typeof names.official === "string" ? names.official.trim() : null;

    if (!cca3 || !/^[A-Z]{3}$/.test(cca3)) {
        throw new Error("Nieprawidłowy kod kraju alpha_3.");
    }

    if (!cca2 || !/^[A-Z]{2}$/.test(cca2)) {
        throw new Error("Nieprawidłowy kod kraju alpha_2.");
    }

    if (!nameCommon) {
        throw new Error("Brak wymaganej nazwy kraju: names.common.");
    }

    return {
        cca3,
        cca2,
        name_common: nameCommon,
        name_official: nameOfficial || nameCommon,
        capital: parseCapitals(raw.capitals),
        region:
        typeof raw.region === "string" ? raw.region.trim() || null : null,
        subregion:
        typeof raw.subregion === "string"
        ? raw.subregion.trim() || null
        : null,
        population: parsePopulation(raw.population),
        area: parseArea(raw.area),
        languages: parseLanguages(raw.languages),
        currencies: parseCurrencies(raw.currencies),
        flag_url: parseFlagUrl(raw.flag),
    };
}

module.exports = {
    parseCountry,
};

