from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
from .model import FakeModel
from .risk_engine import RiskEngine
from .utils import now_ms

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.websocket("/ws/audio")
async def ws_audio(websocket: WebSocket):
    await websocket.accept()
    engine = RiskEngine(maxlen=5, alpha=0.4)
    model = FakeModel()
    try:
        while True:
            raw = await websocket.receive_bytes()
            try:
                audio = np.frombuffer(raw, dtype=np.float32)
            except Exception:
                await websocket.send_json(
                    {"error": "invalid_audio_buffer", "latency_ms": 0.0}
                )
                continue
            t0 = now_ms()
            p = model.predict_prob(audio)
            risk, level = engine.update(p)
            t1 = now_ms()
            await websocket.send_json(
                {
                    "probability": float(round(p, 6)),
                    "risk": float(round(risk, 6)),
                    "level": level,
                    "latency_ms": float(round(t1 - t0, 3)),
                }
            )
    except WebSocketDisconnect:
        return
    except Exception:
        try:
            await websocket.close()
        except Exception:
            pass
        return
