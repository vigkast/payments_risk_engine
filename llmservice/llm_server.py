from fastapi import FastAPI
from pydantic import BaseModel
from transformers import pipeline
from fastapi.responses import JSONResponse
import uvicorn

app = FastAPI()
generator = pipeline("text2text-generation", model="google/flan-t5-base")  # You can swap for any open-source model

class PromptRequest(BaseModel):
    prompt: str

@app.post("/generate")
async def generate(request: PromptRequest):
    result = generator(request.prompt, max_new_tokens=64)
    return JSONResponse(content={"generated_text": result[0]['generated_text']})

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5005)