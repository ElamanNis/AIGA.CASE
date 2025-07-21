#!/usr/bin/env python3
import os
import sys
from datetime import datetime, timedelta
import uuid
from pymongo import MongoClient

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/')
client = MongoClient(MONGO_URL)
db = client.aiga_connect

def seed_training_sessions():
    """Add sample training sessions to database"""
    
    # Sample sessions
    sessions = [
        {
            "session_id": str(uuid.uuid4()),
            "coach_id": "coach-1",  # Dummy coach ID
            "title": "Основы грэпплинга для начинающих",
            "description": "Изучение базовых техник грэпплинга, захватов и контроля позиции. Идеально для новичков.",
            "training_type": "beginner_grappling",
            "coach_name": "Мурат Досжанов",
            "date": (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d"),
            "time": "18:00",
            "duration_minutes": 90,
            "max_participants": 15,
            "current_participants": 3,
            "price": 3000.0,
            "location": "AIGA Academy, г. Астана, ул. Ахмедьярова, 3",
            "created_at": datetime.now(),
            "status": "active"
        },
        {
            "session_id": str(uuid.uuid4()),
            "coach_id": "coach-2",
            "title": "Бразильское джиу-джитсу (BJJ) - средний уровень",
            "description": "Продвинутые техники BJJ, работа на партере, переходы и болевые приемы.",
            "training_type": "bjj_intermediate",
            "coach_name": "Айбек Кудайбергенов",
            "date": (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d"),
            "time": "19:30",
            "duration_minutes": 120,
            "max_participants": 12,
            "current_participants": 8,
            "price": 4500.0,
            "location": "AIGA Academy, г. Астана, ул. Ахмедьярова, 3",
            "created_at": datetime.now(),
            "status": "active"
        },
        {
            "session_id": str(uuid.uuid4()),
            "coach_id": "coach-1",
            "title": "Детская группа грэпплинга (8-14 лет)",
            "description": "Безопасная и веселая тренировка для детей. Развитие координации, дисциплины и базовых навыков.",
            "training_type": "kids_grappling",
            "coach_name": "Алия Сагынбекова",
            "date": (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d"),
            "time": "16:00",
            "duration_minutes": 75,
            "max_participants": 20,
            "current_participants": 12,
            "price": 2500.0,
            "location": "AIGA Academy, г. Астана, ул. Ахмедьярова, 3",
            "created_at": datetime.now(),
            "status": "active"
        },
        {
            "session_id": str(uuid.uuid4()),
            "coach_id": "coach-3",
            "title": "Индивидуальная тренировка с тренером",
            "description": "Персональная тренировка с опытным тренером. Индивидуальный подход и быстрый прогресс.",
            "training_type": "private_session",
            "coach_name": "Марат Абдуллаев",
            "date": (datetime.now() + timedelta(days=5)).strftime("%Y-%m-%d"),
            "time": "20:00",
            "duration_minutes": 60,
            "max_participants": 1,
            "current_participants": 0,
            "price": 8000.0,
            "location": "AIGA Academy, г. Астана, ул. Ахмедьярова, 3",
            "created_at": datetime.now(),
            "status": "active"
        },
        {
            "session_id": str(uuid.uuid4()),
            "coach_id": "coach-2",
            "title": "Спаринг и соревновательная подготовка",
            "description": "Интенсивная тренировка для подготовки к соревнованиям. Спарринги и отработка турнирной тактики.",
            "training_type": "competition_prep",
            "coach_name": "Айбек Кудайбергенов",
            "date": (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d"),
            "time": "17:00",
            "duration_minutes": 150,
            "max_participants": 10,
            "current_participants": 7,
            "price": 5500.0,
            "location": "AIGA Academy, г. Астана, ул. Ахмедьярова, 3",
            "created_at": datetime.now(),
            "status": "active"
        },
        {
            "session_id": str(uuid.uuid4()),
            "coach_id": "coach-4",
            "title": "Женская группа грэпплинга",
            "description": "Специальная тренировка для женщин. Комфортная атмосфера, техническая работа и самооборона.",
            "training_type": "women_grappling",
            "coach_name": "Камила Есенова",
            "date": (datetime.now() + timedelta(days=4)).strftime("%Y-%m-%d"),
            "time": "18:30",
            "duration_minutes": 90,
            "max_participants": 15,
            "current_participants": 5,
            "price": 3500.0,
            "location": "AIGA Academy, г. Астана, ул. Ахмедьярова, 3",
            "created_at": datetime.now(),
            "status": "active"
        }
    ]
    
    # Clear existing sessions
    db.training_sessions.delete_many({})
    
    # Insert new sessions
    db.training_sessions.insert_many(sessions)
    print(f"Inserted {len(sessions)} training sessions")

def seed_coaches():
    """Add sample coach profiles"""
    coaches = [
        {
            "user_id": "coach-1",
            "email": "murat.doszhanov@aiga.kz",
            "name": "Мурат Досжанов", 
            "phone": "+7 701 123 4567",
            "age": 32,
            "weight": 78.5,
            "height": 180,
            "martial_arts_experience": "expert",
            "goals": "Обучение новичков основам грэпплинга и развитие спортивного сообщества в Астане",
            "medical_conditions": None,
            "emergency_contact": "Анна Досжанова +7 701 765 4321",
            "role": "coach",
            "profile_completed": True,
            "created_at": datetime.now(),
            "certifications": ["Certified Grappling Instructor", "BJJ Black Belt"],
            "experience_years": 12
        },
        {
            "user_id": "coach-2",
            "email": "aibekk@aiga.kz",
            "name": "Айбек Кудайбергенов",
            "phone": "+7 702 234 5678", 
            "age": 28,
            "weight": 85.0,
            "height": 185,
            "martial_arts_experience": "expert",
            "goals": "Подготовка спортсменов к международным соревнованиям по BJJ",
            "medical_conditions": None,
            "emergency_contact": "Динара Кудайбергенова +7 702 876 5432",
            "role": "coach",
            "profile_completed": True,
            "created_at": datetime.now(),
            "certifications": ["BJJ Black Belt", "IBJJF Certified Referee"],
            "experience_years": 8
        }
    ]
    
    # Insert coaches (don't delete existing users)
    for coach in coaches:
        db.users.update_one(
            {"user_id": coach["user_id"]},
            {"$set": coach},
            upsert=True
        )
    
    print(f"Inserted/Updated {len(coaches)} coach profiles")

if __name__ == "__main__":
    print("🏆 Seeding AIGA Academy database...")
    seed_coaches()
    seed_training_sessions()
    print("✅ Database seeding completed!")