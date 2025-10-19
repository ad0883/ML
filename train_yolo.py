"""
Train helper using ultralytics' YOLO API.

Example:
    python train/train_yolo.py --data train/data.yaml --epochs 50 --batch 16 --imgsz 640 --pretrained yolov8n.pt
"""
from ultralytics import YOLO
from pathlib import Path
import argparse

def train(data_yaml: str, epochs: int = 50, batch: int = 16, imgsz: int = 640, pretrained: str | None = None, name: str = 'meal-train'):
    """
    Train a YOLO model using ultralytics API.

    data_yaml: path to data.yaml
    pretrained: path or model string (e.g. 'yolov8n.pt') to use as a starting point
    """
    model = YOLO(pretrained or 'yolov8n.pt')
    # `model.train` supports many kwargs; we pass the important ones.
    model.train(data=data_yaml, epochs=epochs, batch=batch, imgsz=imgsz, name=name)
    print("Training started (see ultralytics' run directory for logs).")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Train YOLO model for meal detection.')
    parser.add_argument('--data', required=True, help='Path to data.yaml')
    parser.add_argument('--epochs', type=int, default=50)
    parser.add_argument('--batch', type=int, default=16)
    parser.add_argument('--imgsz', type=int, default=640)
    parser.add_argument('--pretrained', default=None, help='Pretrained model (eg yolov8n.pt)')
    parser.add_argument('--name', default='meal-train', help='Run name (ultralytics output folder)')
    args = parser.parse_args()

    if not Path(args.data).exists():
        raise SystemExit(f"data.yaml not found at {args.data}")

    train(args.data, epochs=args.epochs, batch=args.batch, imgsz=args.imgsz, pretrained=args.pretrained, name=args.name)
