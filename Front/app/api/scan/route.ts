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

interface ScanBody {
  ciudad?: string;
  rubro?: string;
  plataformas?: string[];
  ratingMax?: number;
  resenasMin?: number;
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

  const ratingMax = typeof body.ratingMax === "number" ? body.ratingMax : 3.5;
  const resenasMin = typeof body.resenasMin === "number" ? body.resenasMin : 10;
  const plataformas =
    Array.isArray(body.plataformas) && body.plataformas.length > 0
      ? body.plataformas
      : ["Google Maps"];

  try {
    const ts = Date.now();
    const vistos = new Set<string>();
    const leads: Record<string, unknown>[] = [];
    let i = 0;

    for (const plataforma of plataformas) {
      const parciales = await ejecutarScraper({
        ciudad,
        rubro,
        plataforma,
        ratingMax,
        resenasMin,
      });
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

    return NextResponse.json({
      leads,
      meta: { ciudad, rubro, plataformas, ratingMax, resenasMin, total: leads.length },
    });
  } catch (error) {
    const detalle = error instanceof Error ? error.message : String(error);
    const sinPython = /ENOENT/.test(detalle);
    return NextResponse.json(
      {
        error: sinPython
          ? `No se encontró Python ("${PYTHON}"). Instalá Python 3 para correr el scraper.`
          : "El scraper falló.",
        detalle,
      },
      { status: 500 },
    );
  }
}
