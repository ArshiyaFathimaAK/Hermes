"""UC-03 Manage User Profile (FR-06).

Author: Sharad Rangaraju (AI-assisted draft; author review pending).
Purpose: validate and persist a versioned profile in SQLite. The API uses a fixed
demo identity; real Supabase Auth is not implemented here.
"""
from contextlib import contextmanager
from dataclasses import asdict, dataclass
import re
import sqlite3
from .catalog import ValidationError
from .repository import ConflictError


@dataclass
class Profile:
    user_id: str
    display_name: str
    email: str
    phone: str
    address: str
    version: int


class ProfileRepository:
    def __init__(self, db_path):
        self.db_path = str(db_path)
        with self.connection() as db:
            db.execute('''CREATE TABLE IF NOT EXISTS profiles (
              user_id TEXT PRIMARY KEY, display_name TEXT NOT NULL, email TEXT NOT NULL,
              phone TEXT NOT NULL, address TEXT NOT NULL, version INTEGER NOT NULL)''')

    @contextmanager
    def connection(self):
        db = sqlite3.connect(self.db_path, timeout=5)
        db.row_factory = sqlite3.Row
        db.execute('PRAGMA foreign_keys = ON')
        try:
            with db:
                yield db
        finally:
            db.close()

    def get(self, user_id):
        with self.connection() as db:
            row = db.execute('SELECT * FROM profiles WHERE user_id=?', (user_id,)).fetchone()
            return asdict(Profile(**dict(row))) if row else asdict(Profile(user_id, '', '', '', '', 0))

    def save(self, user_id, data, expected_version):
        with self.connection() as db:
            # Lock before reading: even two first-time saves cannot overwrite each other.
            db.execute('BEGIN IMMEDIATE')
            row = db.execute('SELECT version FROM profiles WHERE user_id=?', (user_id,)).fetchone()
            version = row['version'] if row else 0
            if version != expected_version:
                raise ConflictError('Your profile changed. Reload before saving again.')
            profile = Profile(user_id, data['display_name'], data['email'], data['phone'], data['address'], version + 1)
            values = (profile.display_name, profile.email, profile.phone, profile.address, profile.version, user_id)
            if row:
                db.execute('UPDATE profiles SET display_name=?,email=?,phone=?,address=?,version=? WHERE user_id=?', values)
            else:
                db.execute('INSERT INTO profiles(display_name,email,phone,address,version,user_id) VALUES(?,?,?,?,?,?)', values)
            return asdict(profile)


class ProfileService:
    def __init__(self, repository):
        self.repository = repository

    def get(self, user_id):
        return self.repository.get(user_id)

    def save(self, user_id, data):
        if not isinstance(data, dict):
            raise ValidationError('Send a JSON object.')
        for field in data:
            if field not in ('display_name', 'email', 'phone', 'address', 'version'):
                raise ValidationError(f'Unsupported profile field: {field}.')
        # Only strings are accepted; invalid JSON types get the same field message.
        name, email = data.get('display_name', ''), data.get('email', '')
        phone, address = data.get('phone', ''), data.get('address', '')
        if not isinstance(name, str) or not 1 <= len(name.strip()) <= 60:
            raise ValidationError('Enter your name (1-60 characters).')
        if not isinstance(email, str) or not re.fullmatch(r'[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+', email.strip()):
            raise ValidationError('Enter a valid email address.')
        if not isinstance(phone, str) or (phone.strip() and not re.fullmatch(r'[0-9 +()\-]{7,20}', phone.strip())):
            raise ValidationError('Enter a valid phone number.')
        if not isinstance(address, str) or len(address.strip()) > 120:
            raise ValidationError('Address must be 120 characters or fewer.')
        version = data.get('version')
        if type(version) is not int or version < 0:
            raise ValidationError('Send the current profile version.')
        normalized = dict(display_name=name.strip(), email=email.strip(), phone=phone.strip(), address=address.strip())
        return self.repository.save(user_id, normalized, version)
