import numpy as np
from .utils import clamp, rms_energy
import random
import time


class FakeModel:
    def __init__(self, seed: int | None = None):
        if seed is not None:
            random.seed(seed)
            np.random.seed(seed)

    def predict_prob(self, audio: np.ndarray) -> float:
        e = rms_energy(audio)
        noise = float(np.random.uniform(0.0, 0.2))
        base = (e * 2.0) + noise
        return clamp(base, 0.0, 1.0)
