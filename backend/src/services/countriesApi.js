const BASE_URL = "https://api.restcountries.com/countries/v5";

const FIELDS = [
    "names.common",
"names.official",
"codes.alpha_2",
"codes.alpha_3",
"capitals",
"region",
"subregion",
"population",
"area",
"languages",
"currencies",
"flag",
].join(",");

async function fetchWithTimeout(url, timeoutMs = 10000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${
                    process.env.REST_COUNTRIES_API_KEY || "rc_live_demo"
                }`,
            },
        });

        let body;

        try {
            body = await response.json();
        } catch {
            const error = new Error("REST Countries zwróciło nieprawidłowy JSON.");
            error.status = 502;
            throw error;
        }

        if (!response.ok || body?.errors?.length) {
            const error = new Error(
                body?.errors?.[0]?.message ||
                `REST Countries API zwróciło HTTP ${response.status}.`
            );

            error.status = response.status >= 400 ? response.status : 502;
            throw error;
        }

        return body;
    } catch (error) {
        if (error.name === "AbortError") {
            const timeoutError = new Error(
                "Przekroczono czas oczekiwania na REST Countries API."
            );
            timeoutError.status = 504;
            throw timeoutError;
        }

        throw error;
    } finally {
        clearTimeout(timer);
    }
}

function normalizeCode(code) {
    if (typeof code !== "string" || !/^[a-z]{3}$/i.test(code.trim())) {
        const error = new Error("Kod państwa musi zawierać 3 litery.");
        error.status = 400;
        throw error;
    }

    return code.trim().toUpperCase();
}

function getCountryObjects(body) {
    // API response handling
    if (Array.isArray(body?.data?.objects)) {
        return body.data.objects;
    }

    // table respons handling
    if (Array.isArray(body?.data)) {
        return body.data;
    }

    // single object repsonse handling
    if (body?.data && typeof body.data === "object") {
        return [body.data];
    }

    return [];
}

async function fetchCountryByCode(code) {
    const normalizedCode = normalizeCode(code);

    const url = new URL(
        `${BASE_URL}/codes.alpha_3/${encodeURIComponent(normalizedCode)}`
    );

    url.searchParams.set("response_fields", FIELDS);

    const body = await fetchWithTimeout(url.toString());
    const countries = getCountryObjects(body);

    //
    const country = countries.find(
        (item) =>
        item?.codes?.alpha_3?.toUpperCase() === normalizedCode
    );

    if (!country) {
        const error = new Error(
            `Nie znaleziono państwa o kodzie ${normalizedCode} albo API zwróciło niezgodne dane.`
        );
        error.status = 404;
        throw error;
    }

    return country;
}

async function fetchAllCountries() {
    const url = new URL(BASE_URL);
    url.searchParams.set("limit", "100");
    url.searchParams.set("offset", "0");
    url.searchParams.set("response_fields", FIELDS);

    const body = await fetchWithTimeout(url.toString());
    const countries = getCountryObjects(body);

    if (countries.length === 0) {
        throw new Error(
            "REST Countries API nie zwróciło listy państw w oczekiwanym formacie."
        );
    }

    return countries;
}

module.exports = {
    fetchAllCountries,
    fetchCountryByCode,
};
