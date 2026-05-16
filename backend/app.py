from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import cv2
import numpy as np
import json
import base64
from tensorflow.keras.models import load_model
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
import io
from PIL import Image
from webcam_detector import start_webcam_detection
from pathlib import Path

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Resolve project root and asset paths regardless of working directory
PROJECT_ROOT = Path(__file__).resolve().parent.parent
MODEL_PATH = PROJECT_ROOT / "best_model.h5"
CLASS_INDICES_PATH = PROJECT_ROOT / "class_indices.json"

# Load model and class indices
def _load_legacy_keras_model(model_path: str):
    """Attempt to load older Keras H5 models with legacy loader."""
    try:
        # Keras 2.15 provides legacy loading API for old H5 configs
        from keras.saving import legacy as legacy_saving  # type: ignore
        return legacy_saving.load_model(model_path, compile=False)
    except Exception:
        pass
    try:
        # TensorFlow alias
        import tensorflow as tf
        return tf.keras.models.load_model(model_path, compile=False)
    except Exception:
        raise

try:
    model = load_model(str(MODEL_PATH))
except TypeError as e:
    # Handle older configs (e.g., InputLayer with batch_shape)
    try:
        # Final fallback: map 'batch_shape' -> 'batch_input_shape' via custom InputLayer
        import tensorflow as tf
        from tensorflow import keras as tf_keras

        class InputLayerCompat(tf_keras.layers.InputLayer):
            @classmethod
            def from_config(cls, config):
                if 'batch_shape' in config and 'batch_input_shape' not in config:
                    config['batch_input_shape'] = config.pop('batch_shape')
                return super().from_config(config)

        model = tf_keras.models.load_model(
            str(MODEL_PATH), compile=False, custom_objects={'InputLayer': InputLayerCompat}
        )
    except Exception:
        model = _load_legacy_keras_model(str(MODEL_PATH))

with open(CLASS_INDICES_PATH, "r") as f:
    class_indices = json.load(f)
inv_map = {v: k for k, v in class_indices.items()}

face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)


def process_frame(frame):
    """Process a single frame and return detection results"""
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    gray = cv2.equalizeHist(gray)
    faces = face_cascade.detectMultiScale(
        gray, scaleFactor=1.1, minNeighbors=3, minSize=(30, 30)
    )

    print(f"[DEBUG] Frame shape: {frame.shape}, Faces detected: {len(faces)}")
    
    results = []
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
        
        is_fake = not label.lower().startswith("real")

        print(f"[DEBUG] Face at ({x1},{y1})-({x2},{y2}): {label} ({conf*100:.1f}%)")
        
        results.append({
            "label": label,
            "confidence": round(conf * 100, 2),
            "is_fake": is_fake,
            "bbox": {"x1": int(x1), "y1": int(y1), "x2": int(x2), "y2": int(y2)}
        })
    
    return results


@app.route('/api/analyze-frame', methods=['POST'])
def analyze_frame():
    """Analyze a single frame from webcam"""
    try:
        data = request.get_json()
        image_data = data.get('image', '')
        
        # Decode base64 image
        image_data = image_data.split(',')[1] if ',' in image_data else image_data
        image_bytes = base64.b64decode(image_data)
        image = Image.open(io.BytesIO(image_bytes))
        frame = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)

        # Debug: save one frame to inspect what is being received
        debug_path = Path(__file__).parent / "debug_frame.jpg"
        if not debug_path.exists():
            cv2.imwrite(str(debug_path), frame)
            print(f"[DEBUG] Saved debug frame: {frame.shape} -> {debug_path}", flush=True)
        
        # Process frame
        results = process_frame(frame)
        
        if not results:
            return jsonify({
                "status": "no_face",
                "message": "No face detected in frame"
            })
        
        # Return all detected faces
        fake_count = sum(1 for r in results if r['is_fake'])
        real_count = len(results) - fake_count
        
        return jsonify({
            "status": "success",
            "face_count": len(results),
            "fake_count": fake_count,
            "real_count": real_count,
            "faces": results,
            # Primary result (first/largest face) for backward compat
            "is_fake": results[0]['is_fake'],
            "confidence": results[0]['confidence'],
            "label": results[0]['label'],
            "bbox": results[0]['bbox']
        })
        
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/analyze-video', methods=['POST'])
def analyze_video():
    """Analyze uploaded video file"""
    try:
        if 'video' not in request.files:
            return jsonify({"status": "error", "message": "No video file provided"}), 400
        
        video_file = request.files['video']
        
        # Save video temporarily
        temp_path = "temp_video.mp4"
        video_file.save(temp_path)
        
        # Process video
        cap = cv2.VideoCapture(temp_path)
        frame_count = 0
        total_frames = 0
        fake_count = 0
        real_count = 0
        confidences = []
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            if frame_count % 10 == 0:
                results = process_frame(frame)
                if results:
                    total_frames += 1
                    result = results[0]
                    confidences.append(result['confidence'])
                    if result['is_fake']:
                        fake_count += 1
                    else:
                        real_count += 1
            
            frame_count += 1
        
        cap.release()
        
        if total_frames == 0:
            return jsonify({
                "status": "error",
                "message": "No faces detected in video"
            }), 400
        
        avg_confidence = sum(confidences) / len(confidences)
        is_fake = fake_count > real_count
        
        return jsonify({
            "status": "success",
            "is_fake": is_fake,
            "confidence": round(avg_confidence, 2),
            "frames_analyzed": total_frames,
            "fake_frames": fake_count,
            "real_frames": real_count
        })
        
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "ok", "message": "Backend is running"})

@app.route('/api/start-webcam', methods=['GET'])
def start_webcam():
    """
    Starts the local webcam detection (press Q to stop).
    Returns the detection summary when stopped.
    """
    try:
        results = start_webcam_detection()
        return jsonify({
            "status": "completed",
            "total_frames": len(results),
            "detections": results[-5:], 
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)