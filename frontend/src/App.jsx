
import { useCallback, useEffect, useState } from "react";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

function App() {
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [search, setSearch] = useState("");

  const loadCountries = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/countries`);
      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Nie udało się pobrać krajów.");
      }

      const data = Array.isArray(result.data)
      ? result.data
      : result.data
      ? [result.data]
      : [];

      setCountries(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message || "Nie można połączyć się z backendem.");
    } finally {
      setLoading(false);
    }
  }, []);

  
  useEffect(() => {
    loadCountries();
  }, [loadCountries]);

  
  async function handleRefresh() {
    setRefreshing(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/countries/sync`, {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Nie udało się zaktualizować danych."
        );
      }

      if (result.success === false) {
        setError(
          `${result.message} Zaktualizowano: ${result.synced}, błędy: ${result.failed}.`
        );
      }

     
      await loadCountries();
    } catch (err) {
      setError(err.message || "Wystąpił błąd podczas aktualizacji.");
    } finally {
      setRefreshing(false);
    }
  }

  const filteredCountries = countries.filter((country) => {
    const query = search.trim().toLowerCase();

    return (
      String(country.name_common ?? country.name ?? "")
      .toLowerCase()
      .includes(query) ||
      String(country.cca2 ?? "").toLowerCase().includes(query) ||
      String(country.cca3 ?? "").toLowerCase().includes(query)
    );
  });

  return (
    <main className="app">
    <header className="topbar">
    <div>
    <p className="eyebrow">COUNTRIES DATABASE</p>
    <h1>Countries</h1>
    <p className="subtitle">
    Dane krajów zapisane w PostgreSQL
    </p>
    </div>

    <button
    className="refresh-button"
    onClick={handleRefresh}
    disabled={refreshing || loading}
    >
    {refreshing ? (
      <>
      <span className="spinner" />
      Aktualizowanie...
      </>
    ) : (
      <>
      <span aria-hidden="true">↻</span>
      Refresh
      </>
    )}
    </button>
    </header>

    <section className="stats">
    <div className="stat-card">
    <span className="stat-label">Liczba krajów</span>
    <strong>{countries.length}</strong>
    </div>

    <div className="stat-card">
    <span className="stat-label">Źródło danych</span>
    <strong>PostgreSQL</strong>
    </div>

    <div className="stat-card">
    <span className="stat-label">Ostatni odczyt</span>
    <strong className="time-value">
    {lastUpdated
      ? lastUpdated.toLocaleTimeString("pl-PL")
      : "—"}
      </strong>
      </div>
      </section>

      <section className="content">
      <div className="table-toolbar">
      <div>
      <h2>Lista krajów</h2>
      <p>Wyszukuj kraje zapisane w bazie danych.</p>
      </div>

      <input
      className="search-input"
      type="search"
      placeholder="Szukaj kraju lub kodu..."
      value={search}
      onChange={(event) => setSearch(event.target.value)}
      />
      </div>

      {error && (
        <div className="error-message" role="alert">
        <strong>Wystąpił błąd</strong>
        <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="empty-state">Wczytywanie danych...</div>
      ) : (
        <div className="table-wrapper">
        <table>
        <thead>
        <tr>
        <th>Kod</th>
        <th>Nazwa kraju</th>
        <th>Stolica</th>
        <th>Region</th>
        <th>Populacja</th>
        <th>Powierzchnia (km²)</th>
        </tr>
        </thead>

        <tbody>
        {filteredCountries.map((country) => (
          <tr key={country.cca3}>
          <td>
          <span className="country-code">
          {country.cca3}
          </span>
          </td>
          <td>
          <strong>
          {country.name_common ?? country.name ?? "—"}
          </strong>
          <span className="official-name">
          {country.official_name ??
            country.name_official ??
            ""}
            </span>
            </td>
            <td>
            {Array.isArray(country.capital)
              ? country.capital.join(", ") || "—"
              : country.capital || "—"}
              </td>
              <td>
              <span className="region-tag">
              {country.region || "—"}
              </span>
              </td>
              <td>
              {country.population == null
                ? "—"
                : Number(country.population).toLocaleString("pl-PL")}
                </td>
                <td>
                {country.area == null
                  ? "—"
                  : Number(country.area).toLocaleString("pl-PL")}
                  </td>
                  </tr>
        ))}
        </tbody>
        </table>

        {filteredCountries.length === 0 && (
          <div className="empty-state">
          {countries.length === 0
            ? "Baza nie zawiera jeszcze żadnych krajów."
            : "Nie znaleziono pasujących krajów."}
            </div>
        )}
        </div>
      )}

      <footer className="table-footer">
      Wyświetlono {filteredCountries.length} z {countries.length} krajów
      </footer>
      </section>
      </main>
  );
}

export default App;
