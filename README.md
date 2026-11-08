# Enflasyon Hesaplama Projesi

## Teknoloji Yığını ve Mimari
* **Veri İşleme & Hesaplama Motoru:** Python (Pandas, NumPy)
* **Backend API:** FastAPI (Python)
* **Veritabanı:** PostgreSQL (Docker üzerinden)
* **Frontend:** React (Vite)

## Klasör Yapısı
* `datas/`: Günlük çekilen ham CSV fiyat verileri (`markaadı_tarih.csv`)
* `scripts/`: Eksik gün ve bozuk dosya tespit scriptleri
* `backend/app/pipeline/`: Veri temizleme, birleştirme ve normalizasyon kodları
* `backend/app/engine/`: Laspeyres/Jevons endeks ve enflasyon hesaplama motoru
* `backend/app/api/`: Web sitesi için FastAPI endpoint'leri
* `frontend/`: React kullanıcı arayüzü

## Kurulum
1. Veritabanını başlatmak için: `docker compose up -d`
2. Backend paketlerini kurmak için: `pip install -r backend/requirements.txt`
3. API'yi çalıştırmak için: `uvicorn backend.app.main:app --reload`