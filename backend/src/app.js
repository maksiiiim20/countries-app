const express = require("express");
const cors = require("cors");
const countriesRouter = require("./routes/countries");

const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL,
}));

app.use(express.json({ limit: "100kb" }));

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        data: { status: "ok" },
    });
});

app.use("/api/countries", countriesRouter);

app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: { message: "Nie znaleziono endpointu" },
    });
});

app.use((error, req, res, next) => {
    console.error(error);

    if (res.headersSent) {
        return next(error);
    }

    res.status(500).json({
        success: false,
        error: { message: "Wewnętrzny błąd serwera" },
    });
});

module.exports = app;
