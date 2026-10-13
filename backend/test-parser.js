
const { parseCountry } = require("./src/services/countryParser");

const example = {
    codes: {
        alpha_2: "pl",
        alpha_3: "pol",
    },
    names: {
        common: "Poland",
        official: "Republic of Poland",
    },
    capitals: [{ name: "Warsaw" }],
    region: "Europe",
    subregion: "Central Europe",
    population: 37600000,
    area: 312696,
    languages: [{ code: "pl", name: "Polish" }],
    currencies: {
        PLN: { name: "Polish złoty", symbol: "zł" },
    },
    flag: {
        png: "https://example.com/poland.png",
    },
};

console.log(parseCountry(example));
