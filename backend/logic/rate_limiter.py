from datetime import datetime, timedelta
from collections import defaultdict
from threading import Lock

class SimpleRateLimiter:
    """In-memory rate limiter to prevent report spamming."""
    
    def __init__(self, max_requests=3, window_minutes=5):
        self.max_requests = max_requests
        self.window_seconds = window_minutes * 60
        # Stores user_id -> [list of timestamps]
        self.requests = defaultdict(list)
        self.lock = Lock()
    
    def is_allowed(self, user_id: str) -> bool:
        """Checks if a user is allowed to submit another report."""
        with self.lock:
            now = datetime.now()
            window_start = now - timedelta(seconds=self.window_seconds)
            
            # Remove timestamps outside the current 5-minute window
            if user_id in self.requests:
                self.requests[user_id] = [
                    ts for ts in self.requests[user_id]
                    if ts >= window_start
                ]
            
            # Check if user has exceeded the limit
            if len(self.requests[user_id]) < self.max_requests:
                self.requests[user_id].append(now)
                return True
            
            return False

    def get_retry_after(self, user_id: str) -> int:
        """Calculates how many seconds the user must wait."""
        with self.lock:
            if user_id not in self.requests or not self.requests[user_id]:
                return 0
            
            oldest_request = self.requests[user_id][0]
            now = datetime.now()
            # User can try again 5 minutes after their oldest request
            available_at = oldest_request + timedelta(seconds=self.window_seconds)
            seconds_left = (available_at - now).total_seconds()
            
            return int(max(0, seconds_left))

# Create a global instance to be used across the app
global_rate_limiter = SimpleRateLimiter(max_requests=3, window_minutes=5)