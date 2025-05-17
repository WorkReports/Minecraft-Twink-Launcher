from fastapi import FastAPI, Request
import uvicorn
import os

app = FastAPI()

@app.post("/receive")
async def receive_data(request: Request):
    data = await request.json()
    print("Получены данные: " + data)

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)