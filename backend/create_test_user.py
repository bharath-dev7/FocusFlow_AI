import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))

from app.database import SessionLocal, engine, Base
from app.models import User
from app.auth import get_password_hash

def create_user():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    email = "test@example.com"
    password = "password123"
    
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        print(f"User {email} already exists! Password is likely '{password}'")
        db.close()
        return

    hashed_password = get_password_hash(password)
    new_user = User(email=email, password_hash=hashed_password)
    db.add(new_user)
    db.commit()
    print(f"✅ Successfully created test user!\nEmail: {email}\nPassword: {password}")
    db.close()

if __name__ == "__main__":
    create_user()
