import numpy as np
import time


def clamp(x: float, min_val: float = 0.0, max_val: float = 1.0) -> float:
    if x < min_val:
        return min_val
    if x > max_val:
        return max_val
    return x


def rms_energy(audio: np.ndarray) -> float:
    if audio.size == 0:
        return 0.0
    v = float(np.sqrt(np.mean(np.square(audio, dtype=np.float32), dtype=np.float32)))
    return clamp(v, 0.0, 1.0)


def now_ms() -> float:
    return time.perf_counter() * 1000.0
