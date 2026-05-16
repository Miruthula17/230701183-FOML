# backend/webcam_detector.py
import cv2, json
import numpy as np
from tensorflow.keras.models import load_model
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from pathlib import Path

# Resolve project root and asset paths regardless of working directory
_PROJECT_ROOT = Path(__file__).resolve().parent.parent
_MODEL_PATH = _PROJECT_ROOT / "best_model.h5"
_CLASS_INDICES_PATH = _PROJECT_ROOT / "class_indices.json"

model = load_model(str(_MODEL_PATH))
with open(_CLASS_INDICES_PATH, "r") as f:
    class_indices = json.load(f)
inv_map = {v: k for k, v in class_indices.items()}

face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)

def start_webcam_detection():
    cap = cv2.VideoCapture(0)
    print(" Webcam started. Press 'Q' to quit.")
    results_summary = []

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, 1.1, 5)

        for (x, y, w, h) in faces:
            margin = int(0.15 * w)
            x1, y1 = max(0, x - margin), max(0, y - margin)
            x2, y2 = min(frame.shape[1], x + w + margin), min(frame.shape[0], y + h + margin)
            face = frame[y1:y2, x1:x2]

            if face.size == 0:
                continue

            face_resized = cv2.resize(face, (224, 224))
            inp = preprocess_input(np.expand_dims(face_resized.astype("float32"), axis=0))
            probs = model.predict(inp, verbose=0)[0]
            pred_idx = int(np.argmax(probs))
            label = inv_map[pred_idx]
            conf = float(np.max(probs))

            color = (0, 255, 0) if label.lower().startswith("real") else (0, 0, 255)
            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            cv2.putText(frame, f"{label} {conf:.2f}", (x1, y1 - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)

            results_summary.append({"label": label, "confidence": round(conf * 100, 2)})

        cv2.imshow("Deepfake Detector", frame)
        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()
    print(" Webcam stopped.")
    return results_summary
