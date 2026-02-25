"""
Sample Project - User Authentication Module
A demonstration project for Cog semantic code search.
"""

import hashlib
import secrets
from typing import Optional
from dataclasses import dataclass


@dataclass
class User:
    id: int
    username: str
    email: str
    password_hash: str


class AuthenticationError(Exception):
    pass


class UserDatabase:
    def __init__(self, connection_string: str):
        self.connection_string = connection_string
        self._users: dict[int, User] = {}

    def find_by_username(self, username: str) -> Optional[User]:
        for user in self._users.values():
            if user.username == username:
                return user
        return None

    def find_by_email(self, email: str) -> Optional[User]:
        for user in self._users.values():
            if user.email == email:
                return user
        return None

    def save(self, user: User) -> None:
        self._users[user.id] = user


class AuthService:
    def __init__(self, db: UserDatabase):
        self.db = db
        self._sessions: dict[str, int] = {}

    def hash_password(self, password: str) -> str:
        salt = secrets.token_hex(16)
        hash_value = hashlib.sha256((salt + password).encode()).hexdigest()
        return f"{salt}:{hash_value}"

    def verify_password(self, password: str, stored_hash: str) -> bool:
        salt, hash_value = stored_hash.split(":")
        computed = hashlib.sha256((salt + password).encode()).hexdigest()
        return secrets.compare_digest(computed, hash_value)

    def register(self, username: str, email: str, password: str) -> User:
        if self.db.find_by_username(username):
            raise AuthenticationError("Username already exists")
        if self.db.find_by_email(email):
            raise AuthenticationError("Email already registered")

        user = User(
            id=len(self.db._users) + 1,
            username=username,
            email=email,
            password_hash=self.hash_password(password),
        )
        self.db.save(user)
        return user

    def login(self, username: str, password: str) -> str:
        user = self.db.find_by_username(username)
        if not user:
            raise AuthenticationError("Invalid credentials")

        if not self.verify_password(password, user.password_hash):
            raise AuthenticationError("Invalid credentials")

        session_token = secrets.token_urlsafe(32)
        self._sessions[session_token] = user.id
        return session_token

    def logout(self, token: str) -> None:
        self._sessions.pop(token, None)

    def validate_session(self, token: str) -> Optional[int]:
        return self._sessions.get(token)


class EmailService:
    def __init__(self, smtp_host: str, smtp_port: int):
        self.smtp_host = smtp_host
        self.smtp_port = smtp_port

    def send_welcome_email(self, user: User) -> None:
        print(f"Sending welcome email to {user.email}")

    def send_password_reset(self, email: str, reset_token: str) -> None:
        print(f"Sending password reset to {email}")


class RateLimiter:
    def __init__(self, max_requests: int, window_seconds: int):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._requests: dict[str, list[float]] = {}

    def is_allowed(self, client_id: str) -> bool:
        import time

        now = time.time()

        if client_id not in self._requests:
            self._requests[client_id] = []

        self._requests[client_id] = [
            t for t in self._requests[client_id] if now - t < self.window_seconds
        ]

        if len(self._requests[client_id]) >= self.max_requests:
            return False

        self._requests[client_id].append(now)
        return True


def create_auth_service(db_path: str = ":memory:") -> AuthService:
    db = UserDatabase(db_path)
    return AuthService(db)
