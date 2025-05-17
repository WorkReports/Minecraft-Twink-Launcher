from fastapi import FastAPI, Request
import uvicorn
import os
import json  # Импортируем библиотеку json для преобразования данных в строку

app = FastAPI()

@app.post("/receive")
async def receive_data(request: Request):
    data = await request.json()
    data_str = json.dumps(data)  # Преобразуем словарь в JSON-строку
    print(f"Получены данные: {data_str}")
    return {"status": "success", "message": f"Данные получены: {data_str}"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)