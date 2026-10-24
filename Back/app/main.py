from fastapi import FastAPI
from app.api.endpoints.ia_router import router as ia_router

app = FastAPI(title="Backend Reputación B2B", version="1.0.0")

app.include_router(ia_router)

@app.get("/")
def read_root():
    return {"message": "¡Backend de Reputación B2B andando de diez!"}

@app.get("/")
async def root():
    return {
        "status": "success",
        "message": "Backend de Radar de Reputación en Crisis funcionando correctamente 🚀"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}