from fastapi import FastAPI

app = FastAPI(
    title="Enflasyon Hesaplama API",
    description="Web kazıma verileriyle Laspeyres/Jevons bazlı enflasyon hesaplama servisi",
    version="0.1.0"
)

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "Enflasyon API çalışıyor"}