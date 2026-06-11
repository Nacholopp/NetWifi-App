from __future__ import annotations

from fastapi import FastAPI
from pydantic import BaseModel

from ml.inference.prediction_service import PredictionService


app = FastAPI(title="WiFi Coverage Analytics Service")
prediction_service = PredictionService()


class PredictionRequest(BaseModel):
    layoutImageData: str
    apMaskImageData: str


class PredictionResponse(BaseModel):
    predictionImageData: str


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/predict", response_model=PredictionResponse)
def predict(request: PredictionRequest) -> PredictionResponse:
    prediction_image = prediction_service.predict(
        layout_image_data=request.layoutImageData,
        ap_mask_image_data=request.apMaskImageData,
    )
    return PredictionResponse(predictionImageData=prediction_image)
