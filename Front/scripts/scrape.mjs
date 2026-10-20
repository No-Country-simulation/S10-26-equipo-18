import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  readFileSync,
  writeFileSync,
  rmSync,
  existsSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * RepuSense · Orquestador del scraper
 *
 * Corre `Guia/repusense_scraper.py` para varias combinaciones de ciudad/rubro,
 * junta los leads en un único JSON y lo deja listo para que el front lo consuma.
 *
 *    npm run scrape
 *
 * Requiere Python 3 instalado (el scraper no usa dependencias externas).
 * Salida: lib/mock/leads.generated.json
 */

const __dirname = dirname(fileURLToPath(import.meta.url));
const FRONT = join(__dirname, "..");
const SCRAPER = join(FRONT, "Guia", "repusense_scraper.py");
const OUT = join(FRONT, "lib", "mock", "leads.generated.json");

const PYTHON =
  process.env.PYTHON || (process.platform === "win32" ? "python" : "python3");

const COMBOS = [
  { ciudad: "Buenos Aires", rubro: "Restaurantes", plataforma: "Google Maps" },
  { ciudad: "Buenos Aires", rubro: "Clínicas Dentales", plataforma: "Google Maps" },
  { ciudad: "Bogotá", rubro: "Centros Estéticos", plataforma: "Google Maps" },
  { ciudad: "Bogotá", rubro: "Gimnasios", plataforma: "Google Maps" },
  { ciudad: "Medellín", rubro: "Hoteles Boutique", plataforma: "TripAdvisor" },
  { ciudad: "CDMX", rubro: "Clínicas Dentales", plataforma: "Google Maps" },
  { ciudad: "CDMX", rubro: "Restaurantes", plataforma: "Yelp" },
  { ciudad: "Guadalajara", rubro: "Restaurantes", plataforma: "Google Maps" },
  { ciudad: "Lima", rubro: "Gimnasios", plataforma: "Google Maps" },
  { ciudad: "Santiago", rubro: "Veterinarias", plataforma: "Google Maps" },
  { ciudad: "Cali", rubro: "Centros Estéticos", plataforma: "Google Maps" },
];

function slug(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function checkPython() {
  const probe = spawnSync(PYTHON, ["--version"], { encoding: "utf-8" });
  if (probe.error) {
    console.error(
      `\n[scrape] No se encontró Python ("${PYTHON}"). Instalá Python 3 y volvé a intentar.`,
    );
    console.error("        https://www.python.org/downloads/\n");
    process.exit(1);
  }
}

function main() {
  checkPython();

  if (!existsSync(SCRAPER)) {
    console.error(`\n[scrape] No se encontró el scraper en: ${SCRAPER}\n`);
    process.exit(1);
  }

  const tmp = mkdtempSync(join(tmpdir(), "repusense-"));
  const leads = [];
  const vistos = new Set();

  console.log(`\n[scrape] Ejecutando ${COMBOS.length} búsquedas con ${PYTHON}...\n`);

  for (const combo of COMBOS) {
    const tmpFile = join(tmp, `${slug(combo.ciudad)}-${slug(combo.rubro)}.json`);
    const res = spawnSync(
      PYTHON,
      [
        SCRAPER,
        "--ciudad",
        combo.ciudad,
        "--rubro",
        combo.rubro,
        "--plataforma",
        combo.plataforma,
        "--limite",
        "10",
        "--db-file",
        tmpFile,
      ],
      { stdio: "inherit" },
    );

    if (res.error || res.status !== 0) {
      console.error(
        `\n[scrape] Falló la búsqueda ${combo.ciudad} / ${combo.rubro}`,
      );
      rmSync(tmp, { recursive: true, force: true });
      process.exit(1);
    }

    const encontrados = JSON.parse(readFileSync(tmpFile, "utf-8"));
    encontrados.forEach((lead, i) => {
      const id = `lead-${slug(combo.ciudad)}-${slug(combo.rubro)}-${String(
        i + 1,
      ).padStart(3, "0")}`;
      if (vistos.has(id)) return;
      vistos.add(id);
      leads.push({ ...lead, id });
    });
  }

  rmSync(tmp, { recursive: true, force: true });
  writeFileSync(OUT, JSON.stringify(leads, null, 2), "utf-8");

  console.log(`\n[scrape] Listo: ${leads.length} leads escritos en`);
  console.log(`         ${OUT}\n`);
  console.log("[scrape] El front los toma automáticamente al recargar.\n");
}

main();
