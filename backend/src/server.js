require("dotenv").config();

const app = require("./app");
const pool = require("./config/db");

const port = Number(process.env.PORT) || 3000;

async function start() {
    await pool.query("SELECT 1");

    app.listen(port, () => {
        console.log(`Backend działa na http://localhost:${port}`);
    });
}

start().catch((error) => {
    console.error("Nie udało się uruchomić backendu:", error);
    process.exit(1);
});
