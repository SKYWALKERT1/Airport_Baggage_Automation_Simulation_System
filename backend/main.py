import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from simulation import run_simulation_stream

app = FastAPI(title="Havalimanı Bagaj Simülasyonu API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:8000",
        "http://localhost:8001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


class SimulationParams(BaseModel):
    scanner_count: int = Field(default=3, ge=1, le=10)
    flight_count: int = Field(default=5, ge=1, le=20)
    arrival_rate: float = Field(default=10.0, ge=1.0, le=30.0)
    sim_duration: int = Field(default=480, ge=60, le=1440)


@app.get("/")
def health():
    return {"status": "ok", "message": "Bagaj simülasyonu API çalışıyor"}


@app.post("/simulate/stream")
def simulate_stream(params: SimulationParams):
    """
    SSE endpoint: simülasyonu adım adım akıtır.
    Her adımda `data: {...}\\n\\n` formatında JSON gönderir.
    """
    def event_generator():
        try:
            for event in run_simulation_stream(
                scanner_count=params.scanner_count,
                flight_count=params.flight_count,
                arrival_rate=params.arrival_rate,
                sim_duration=params.sim_duration,
            ):
                yield f"data: {json.dumps(event)}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
