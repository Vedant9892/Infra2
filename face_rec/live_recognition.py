import cv2
import numpy as np
from mtcnn import MTCNN
from keras_facenet import FaceNet
import os
from datetime import datetime
import geocoder

def load_embeddings():
    """Load embeddings from all person folders in Trained Model/"""
    trained_model_dir = os.path.join(os.path.dirname(__file__), "Trained_Model")
    
    if not os.path.exists(trained_model_dir):
        print(f"Error: Trained Model directory not found at {trained_model_dir}")
        return None, None, None
    
    all_embeddings = []
    all_folder_names = []
    person_info = {}  # Maps folder_name to (display_name, age)
    
    # Scan each person folder
    for person_folder in os.listdir(trained_model_dir):
        person_path = os.path.join(trained_model_dir, person_folder)
        
        if not os.path.isdir(person_path):
            continue
        
        encodings_file = os.path.join(person_path, "encodings.npz")
        
        if os.path.exists(encodings_file):
            try:
                data = np.load(encodings_file)
                embeddings = data['embeddings']
                
                # Get folder name (for matching)
                folder_name = str(data.get('folder_name', data.get('name', person_folder)))
                
                # Get display info
                display_name = str(data.get('name', folder_name))
                age = str(data.get('age', 'N/A'))
                
                # Store person info
                person_info[folder_name] = (display_name, age)
                
                # Add all embeddings for this person
                for embedding in embeddings:
                    all_embeddings.append(embedding)
                    all_folder_names.append(folder_name)
                    
                print(f"Loaded {len(embeddings)} embeddings for '{display_name}' (Age: {age})")
            except Exception as e:
                print(f"Error loading {encodings_file}: {e}")
    
    if not all_embeddings:
        print("Error: No trained models found. Please run train_faces_enhanced.py first.")
        return None, None, None
    
    print(f"Total loaded: {len(all_embeddings)} embeddings from {len(person_info)} people")
    return np.array(all_embeddings), np.array(all_folder_names), person_info
