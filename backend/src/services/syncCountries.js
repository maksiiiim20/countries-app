const { fetchAllCountries } = require("./countriesApi");
const { parseCountry } = require("./countryParser");
const { upsertCountry } = require("./countryRepository");

async function syncCountries() {
    const rawCountries = await fetchAllCountries();

    let saved = 0;
    let rejected = 0;

    for (const raw of rawCountries) {
        const country = parseCountry(raw);

        if (!country) {
            rejected++;
            continue;
        }

        await upsertCountry(country);
        saved++;
    }

    return { received: rawCountries.length, saved, rejected };
}

module.exports = { syncCountries };
