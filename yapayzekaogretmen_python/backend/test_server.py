from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Test server is running"}

@app.post("/api/auth_simple/login")
async def login(email: str, password: str):
    if email == "admin@yapayzekaogretmen.com" and password == "admin123":
        return {
            "access_token": "test-token-123",
            "token_type": "bearer",
            "user": {
                "id": "1",
                "email": email,
                "full_name": "Sistem Yöneticisi",
                "role": "admin",
                "is_active": True
            }
        }
    return {"error": "Invalid credentials"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
