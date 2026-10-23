from fastapi import FastAPI

app = FastAPI(
    title="Radar de Reputación en Crisis - API",
    description="Backend oficial para la automatización de prospección comercial y análisis de reseñas.",
    version="1.0.0"
)

@app.get("/")
async def root():
    return {
        "status": "success",
        "message": "Backend de Radar de Reputación en Crisis funcionando correctamente 🚀"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}