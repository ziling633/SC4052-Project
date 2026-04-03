"""
Campus-Flow-as-a-Service Backend API
Multi-stage system for real-time crowd monitoring
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from routes import reports, canteens
from database import init_firebase

load_dotenv()

# Initialize Firebase
init_firebase()

# Initialize FastAPI app
app = FastAPI(
    title="Campus-Flow-as-a-Service API",
    description="Real-time crowd monitoring system for NTU canteens",
    version="1.0.0"
)

# Configure CORS
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
print(f"🔗 Frontend URL: {FRONTEND_URL}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",      # Vite dev server
        "http://localhost:3000",      # Alternative frontend
        "http://127.0.0.1:5173",
        FRONTEND_URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(reports.router)
app.include_router(canteens.router)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to Campus-Flow-as-a-Service API",
        "docs": "/docs",
        "version": "1.0.0"
    }


@app.on_event("startup")
async def startup_event():
    """Startup event handler"""
    print("✅ Campus-Flow API starting up...")
    try:
        # Test database connection
        from database import get_db
        db = get_db()
        if db:
            test_doc = db.collection("_test").document("_test").get()
            print("✅ Database connection verified")
        else:
            print("⚠️  Database not initialized")
    except Exception as e:
        print(f"⚠️  Database connection warning: {e}")


@app.on_event("shutdown")
async def shutdown_event():
    """Shutdown event handler"""
    print("🛑 Campus-Flow API shutting down...")


if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("PORT", 8000))
    env = os.getenv("ENV", "development")
    
    print(f"🚀 Starting in {env} mode on port {port}...")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        reload=(env == "development")
    )
