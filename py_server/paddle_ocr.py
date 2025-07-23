from fastapi import FastAPI, UploadFile, File
from paddleocr import PaddleOCR
import json
from datetime import datetime
import os

app = FastAPI()

ocr = PaddleOCR(use_angle_cls=True, lang='en')  # Uses CPU with AVX

@app.post("/ocr")
async def perform_ocr(file: UploadFile = File(...)):
    # Save the uploaded image to a temp file
    temp_path = f"temp_uploads/{file.filename}"
    os.makedirs("temp_uploads", exist_ok=True)

    with open(temp_path, "wb") as f:
        content = await file.read()
        f.write(content)

    # Run OCR
    result = ocr.ocr(temp_path, cls=True)

    # Save to JSON file for review
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_path = f"ocr_results/result_{timestamp}.json"
    os.makedirs("ocr_results", exist_ok=True)

    with open(output_path, "w") as json_file:
        json.dump(result, json_file, indent=2)

    return {"message": "OCR complete", "output_file": output_path, "results": result}
