from collections import deque


class RiskEngine:
    def __init__(self, maxlen: int = 5, alpha: float = 0.4):
        self.buffer = deque(maxlen=maxlen)
        self.alpha = alpha
        self.ema = None

    def update(self, p: float) -> tuple[float, str]:
        self.buffer.append(p)
        if self.ema is None:
            self.ema = p
        else:
            self.ema = self.alpha * p + (1.0 - self.alpha) * self.ema
        avg = sum(self.buffer) / len(self.buffer)
        risk = 0.6 * avg + 0.4 * self.ema
        level = "GREEN"
        if risk >= 0.7:
            level = "RED"
        elif risk >= 0.3:
            level = "YELLOW"
        return risk, level
