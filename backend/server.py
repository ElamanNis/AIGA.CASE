from fastapi import FastAPI, HTTPException, Depends, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pymongo import MongoClient
from bson import ObjectId
import os
from datetime import datetime, timedelta
import uuid
from typing import Optional, List
import requests
from pydantic import BaseModel

app = FastAPI(title="AIGA Connect API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/')
client = MongoClient(MONGO_URL)
db = client.aiga_connect

# Security
security = HTTPBearer()

# Pydantic models
class UserRegistration(BaseModel):
    name: str
    email: str
    phone: str
    age: int
    weight: float
    height: float
    martial_arts_experience: str
    goals: str
    medical_conditions: Optional[str] = None
    emergency_contact: str
    role: str = "student"  # student, coach, parent

class TrainingSession(BaseModel):
    title: str
    description: str
    training_type: str
    coach_name: str
    date: str
    time: str
    duration_minutes: int
    max_participants: int
    price: float
    location: str = "AIGA Academy, г. Астана, ул. Ахмедьярова, 3"

class Booking(BaseModel):
    session_id: str
    student_id: str
    booking_date: str

# Auth functions
async def verify_session_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    
    # Check if token exists in sessions
    session = db.sessions.find_one({"session_token": token})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session token")
    
    # Check if session is expired
    if session["expires_at"] < datetime.now():
        raise HTTPException(status_code=401, detail="Session expired")
    
    return session

@app.get("/")
async def root():
    return {"message": "AIGA Connect API", "status": "active"}

@app.get("/api/auth/login")
async def login():
    # Redirect to Emergent Auth
    preview_url = "https://b14b3b75-ada1-472a-b369-78b0a2ae9404.preview.emergentagent.com"
    return {"auth_url": f"https://auth.emergentagent.com/?redirect={preview_url}/profile"}

@app.post("/api/auth/session")
async def create_session(request: Request):
    data = await request.json()
    session_id = data.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID required")
    
    # Call Emergent Auth API
    headers = {"X-Session-ID": session_id}
    response = requests.get("https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data", headers=headers)
    
    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    user_data = response.json()
    
    # Create/update user in database
    user_filter = {"email": user_data["email"]}
    existing_user = db.users.find_one(user_filter)
    
    if not existing_user:
        new_user = {
            "user_id": str(uuid.uuid4()),
            "email": user_data["email"],
            "name": user_data["name"],
            "picture": user_data["picture"],
            "created_at": datetime.now(),
            "profile_completed": False
        }
        db.users.insert_one(new_user)
        user_id = new_user["user_id"]
    else:
        user_id = existing_user["user_id"]
    
    # Create session token
    session_token = str(uuid.uuid4())
    session_record = {
        "session_token": session_token,
        "user_id": user_id,
        "expires_at": datetime.now() + timedelta(days=7),
        "created_at": datetime.now()
    }
    db.sessions.insert_one(session_record)
    
    return {
        "session_token": session_token,
        "user": {
            "user_id": user_id,
            "email": user_data["email"],
            "name": user_data["name"],
            "picture": user_data["picture"]
        }
    }

@app.post("/api/users/complete-profile")
async def complete_profile(profile: UserRegistration, session: dict = Depends(verify_session_token)):
    user_id = session["user_id"]
    
    profile_data = {
        "name": profile.name,
        "email": profile.email,
        "phone": profile.phone,
        "age": profile.age,
        "weight": profile.weight,
        "height": profile.height,
        "martial_arts_experience": profile.martial_arts_experience,
        "goals": profile.goals,
        "medical_conditions": profile.medical_conditions,
        "emergency_contact": profile.emergency_contact,
        "role": profile.role,
        "profile_completed": True,
        "updated_at": datetime.now()
    }
    
    db.users.update_one(
        {"user_id": user_id},
        {"$set": profile_data}
    )
    
    return {"message": "Профиль успешно завершен"}

@app.get("/api/users/profile")
async def get_profile(session: dict = Depends(verify_session_token)):
    user_id = session["user_id"]
    user = db.users.find_one({"user_id": user_id})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Remove MongoDB ObjectId from response
    user.pop("_id", None)
    return user

@app.post("/api/training-sessions")
async def create_training_session(session_data: TrainingSession, session: dict = Depends(verify_session_token)):
    user_id = session["user_id"]
    
    # Check if user is a coach
    user = db.users.find_one({"user_id": user_id})
    if not user or user.get("role") != "coach":
        raise HTTPException(status_code=403, detail="Only coaches can create training sessions")
    
    session_record = {
        "session_id": str(uuid.uuid4()),
        "coach_id": user_id,
        "title": session_data.title,
        "description": session_data.description,
        "training_type": session_data.training_type,
        "coach_name": session_data.coach_name,
        "date": session_data.date,
        "time": session_data.time,
        "duration_minutes": session_data.duration_minutes,
        "max_participants": session_data.max_participants,
        "current_participants": 0,
        "price": session_data.price,
        "location": session_data.location,
        "created_at": datetime.now(),
        "status": "active"
    }
    
    db.training_sessions.insert_one(session_record)
    session_record.pop("_id", None)
    return session_record

@app.get("/api/training-sessions")
async def get_training_sessions():
    sessions = list(db.training_sessions.find({"status": "active"}))
    
    # Remove MongoDB ObjectId and convert to list
    for session in sessions:
        session.pop("_id", None)
    
    return sessions

@app.post("/api/bookings")
async def create_booking(booking: Booking, session: dict = Depends(verify_session_token)):
    user_id = session["user_id"]
    
    # Check if session exists and has capacity
    training_session = db.training_sessions.find_one({"session_id": booking.session_id})
    if not training_session:
        raise HTTPException(status_code=404, detail="Training session not found")
    
    if training_session["current_participants"] >= training_session["max_participants"]:
        raise HTTPException(status_code=400, detail="Session is full")
    
    # Check if user already booked this session
    existing_booking = db.bookings.find_one({
        "session_id": booking.session_id,
        "student_id": user_id
    })
    
    if existing_booking:
        raise HTTPException(status_code=400, detail="Already booked this session")
    
    # Create booking
    booking_record = {
        "booking_id": str(uuid.uuid4()),
        "session_id": booking.session_id,
        "student_id": user_id,
        "booking_date": datetime.now().isoformat(),
        "status": "confirmed"
    }
    
    db.bookings.insert_one(booking_record)
    
    # Update session participant count
    db.training_sessions.update_one(
        {"session_id": booking.session_id},
        {"$inc": {"current_participants": 1}}
    )
    
    booking_record.pop("_id", None)
    return booking_record

@app.get("/api/bookings/my")
async def get_my_bookings(session: dict = Depends(verify_session_token)):
    user_id = session["user_id"]
    
    # Get user's bookings with session details
    bookings = list(db.bookings.find({"student_id": user_id}))
    
    booking_details = []
    for booking in bookings:
        training_session = db.training_sessions.find_one({"session_id": booking["session_id"]})
        if training_session:
            booking_detail = {
                "booking_id": booking["booking_id"],
                "session_id": booking["session_id"],
                "booking_date": booking["booking_date"],
                "status": booking["status"],
                "session": {
                    "title": training_session["title"],
                    "date": training_session["date"],
                    "time": training_session["time"],
                    "coach_name": training_session["coach_name"],
                    "location": training_session["location"],
                    "price": training_session["price"]
                }
            }
            booking_details.append(booking_detail)
    
    return booking_details

@app.get("/api/stats")
async def get_stats():
    total_users = db.users.count_documents({})
    total_sessions = db.training_sessions.count_documents({"status": "active"})
    total_bookings = db.bookings.count_documents({})
    
    return {
        "total_users": total_users,
        "total_sessions": total_sessions,
        "total_bookings": total_bookings
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)