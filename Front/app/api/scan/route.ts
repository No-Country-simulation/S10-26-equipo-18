import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PYTHON =
  process.env.PYTHON || (process.platform === "win32" ? "python" : "python3");
const SCRAPER = join(process.cwd(), "Guia", "repusense_scraper.py");
const FALLBACK_JSON = join(process.cwd(), "lib", "mock", "leads.generated.json");

const RATING_MIN = 1.5;
const RATING_MAX = 3.5;
const RESENAS_MIN = 10;
const RESENAS_MAX = 600;

interface ScanBody {
  ciudad?: string;
  rubro?: string;
  plataformas?: string[];
  ratingMax?: number;
  resenasMin?: number;
}

async function cargarFallback(): Promise<Record<string, unknown>[]> {
  try {
    const contenido = await readFile(FALLBACK_JSON, "utf-8");
    const data = JSON.parse(contenido);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function ejecutarScraper(opts: {
  ciudad: string;
  rubro: string;
  plataforma: string;
  ratingMax: number;
  resenasMin: number;
}): Promise<Record<string, unknown>[]> {
  const dir = await mkdtemp(join(tmpdir(), "repusense-scan-"));
  const dbFile = join(dir, "out.json");
  try {
    await new Promise<void>((resolve, reject) => {
      const child = spawn(
        PYTHON,
        [
          SCRAPER,
          "--ciudad",
          opts.ciudad,
          "--rubro",
          opts.rubro,
          "--plataforma",
          opts.plataforma,
          "--rating-max",
          String(opts.ratingMax),
          "--resenas-min",
          String(opts.resenasMin),
          "--limite",
          "10",
          "--db-file",
          dbFile,
        ],
        { cwd: process.cwd() },
      );
      let stderr = "";
      child.stderr.on("data", (d) => (stderr += d.toString()));
      child.on("error", (e) => reject(e));
      child.on("close", (code) =>
        code === 0
          ? resolve()
          : reject(new Error(stderr || `python salió con código ${code}`)),
      );
    });

    const contenido = await readFile(dbFile, "utf-8");
    const data = JSON.parse(contenido);
    return Array.isArray(data) ? data : [];
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

function filtrarFallback(
  todos: Record<string, unknown>[],
  opts: { ciudad: string; rubro: string; ratingMax: number; resenasMin: number },
): Record<string, unknown>[] {
  const ciudad = opts.ciudad.toLowerCase();
  const rubro = opts.rubro.toLowerCase();
  // Rango cerrado 1.5–3.5: quedan excluidos los ratings menores a 1.5 y mayores a 3.5.
  const candidatos = todos.filter((l) => {
    const c = String(l.ciudad || "").toLowerCase();
    const r = String(l.rubro || "").toLowerCase();
    if (c !== ciudad || r !== rubro) return false;
    const rating = Number(l.rating);
    const numResenas = Number(l.numResenas || l.num_resenas || 0);
    if (!Number.isFinite(rating)) return false;
    if (rating < RATING_MIN || rating > opts.ratingMax) return false;
    if (!Number.isFinite(numResenas) || numResenas < opts.resenasMin) return false;
    return true;
  });
  return candidatos.slice(0, 10);
}

export async function POST(request: Request) {
  let body: ScanBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const ciudad = body.ciudad?.trim();
  const rubro = body.rubro?.trim();
  if (!ciudad || !rubro) {
    return NextResponse.json(
      { error: "Faltan 'ciudad' y 'rubro'." },
      { status: 400 },
    );
  }

  const ratingMax =
    typeof body.ratingMax === "number" && Number.isFinite(body.ratingMax)
      ? Math.min(RATING_MAX, Math.max(RATING_MIN, body.ratingMax))
      : RATING_MAX;
  const resenasMin =
    typeof body.resenasMin === "number" && Number.isFinite(body.resenasMin)
      ? Math.min(RESENAS_MAX, Math.max(RESENAS_MIN, Math.floor(body.resenasMin)))
      : RESENAS_MIN;
  const plataformas =
    Array.isArray(body.plataformas) && body.plataformas.length > 0
      ? body.plataformas
      : ["Google Maps"];

  try {
    const ts = Date.now();
    const vistos = new Set<string>();
    const leads: Record<string, unknown>[] = [];
    let i = 0;

    // Intentar con Python; si falla (Vercel/sin Python), usar fallback con datos ya generados
    for (const plataforma of plataformas) {
      let parciales: Record<string, unknown>[] = [];
      try {
        parciales = await ejecutarScraper({
          ciudad,
          rubro,
          plataforma,
          ratingMax,
          resenasMin,
        });
      } catch {
        // Fallback sin Python
        if (parciales.length === 0) {
          const todos = await cargarFallback();
          parciales = filtrarFallback(todos, { ciudad, rubro, ratingMax, resenasMin }).map(
            (l) => ({ ...l, fuente: plataforma }),
          );
        }
      }
      for (const lead of parciales) {
        const key = `${String(lead.nombre).toLowerCase()}|${String(
          lead.ciudad,
        ).toLowerCase()}`;
        if (vistos.has(key)) continue;
        vistos.add(key);
        i += 1;
        leads.push({
          ...lead,
          id: `lead-scan-${ts}-${String(i).padStart(3, "0")}`,
        });
      }
    }

    if (leads.length === 0) {
      // Último recurso: usar fallback completo
      const todos = await cargarFallback();
      const parciales = filtrarFallback(todos, { ciudad, rubro, ratingMax, resenasMin });
      for (const lead of parciales) {
        i += 1;
        leads.push({ ...lead, id: `lead-scan-${ts}-${String(i).padStart(3, "0")}` });
      }
    }

    return NextResponse.json({
      leads,
      meta: { ciudad, rubro, plataformas, ratingMax, resenasMin, total: leads.length },
    });
  } catch (error) {
    const detalle = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: "El escaneo falló.",
        detalle,
      },
      { status: 500 },
    );
  }
}
