import tensorflow as tf
import numpy as np
import cv2
from PIL import Image
import io

class LandUseClassifier:
    def __init__(self):
        self.model = self._build_cnn_model()
        self.class_names = ['agricultural_land', 'forest_cover', 'water_body', 'homestead', 'urban_area']
        self.colors = {
            'agricultural_land': [50, 205, 50],     # Lime Green
            'forest_cover': [34, 139, 34],          # Forest Green
            'water_body': [30, 144, 255],           # Dodger Blue
            'homestead': [255, 99, 71],             # Tomato
            'urban_area': [128, 128, 128]           # Gray
        }
        
    def _build_cnn_model(self):
        """Build a CNN model for land-use classification"""
        model = tf.keras.Sequential([
            tf.keras.layers.Conv2D(32, (3, 3), activation='relu', input_shape=(224, 224, 3)),
            tf.keras.layers.MaxPooling2D(2, 2),
            tf.keras.layers.Conv2D(64, (3, 3), activation='relu'),
            tf.keras.layers.MaxPooling2D(2, 2),
            tf.keras.layers.Conv2D(128, (3, 3), activation='relu'),
            tf.keras.layers.MaxPooling2D(2, 2),
            tf.keras.layers.Conv2D(128, (3, 3), activation='relu'),
            tf.keras.layers.MaxPooling2D(2, 2),
            tf.keras.layers.Flatten(),
            tf.keras.layers.Dropout(0.5),
            tf.keras.layers.Dense(512, activation='relu'),
            tf.keras.layers.Dense(len(self.class_names), activation='softmax')
        ])
        
        model.compile(
            optimizer='adam',
            loss='categorical_crossentropy',
            metrics=['accuracy']
        )
        
        # Initialize with random weights (in real scenario, load pre-trained weights)
        model.build(input_shape=(None, 224, 224, 3))
        return model
    
    def preprocess_image(self, image_bytes):
        """Preprocess image for model input"""
        # Convert bytes to PIL Image
        image = Image.open(io.BytesIO(image_bytes))
        
        # Convert to RGB if needed
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Convert to numpy array
        img_array = np.array(image)
        
        return img_array, image.size
    
    def segment_image(self, img_array, patch_size=224, overlap=0.5):
        """Segment image into patches for classification"""
        height, width = img_array.shape[:2]
        step_size = int(patch_size * (1 - overlap))
        
        patches = []
        patch_coords = []
        
        for y in range(0, height - patch_size + 1, step_size):
            for x in range(0, width - patch_size + 1, step_size):
                patch = img_array[y:y+patch_size, x:x+patch_size]
                # Resize if patch is smaller than expected
                if patch.shape[:2] != (patch_size, patch_size):
                    patch = cv2.resize(patch, (patch_size, patch_size))
                
                patches.append(patch)
                patch_coords.append((x, y, x+patch_size, y+patch_size))
        
        return np.array(patches), patch_coords
    
    def classify_patches(self, patches):
        """Classify image patches using the CNN model"""
        # Normalize pixel values
        patches_normalized = patches.astype(np.float32) / 255.0
        
        # Get predictions
        predictions = self.model.predict(patches_normalized, verbose=0)
        
        # Get class predictions
        class_indices = np.argmax(predictions, axis=1)
        confidences = np.max(predictions, axis=1)
        
        results = []
        for i, (class_idx, confidence) in enumerate(zip(class_indices, confidences)):
            # Only include predictions with reasonable confidence
            if confidence > 0.3:  # Threshold for confidence
                results.append({
                    'class': self.class_names[class_idx],
                    'confidence': float(confidence),
                    'patch_index': i
                })
        
        return results
    
    def detect_assets(self, image_bytes):
        """Main function to detect land-use assets in satellite imagery"""
        # Preprocess image
        img_array, original_size = self.preprocess_image(image_bytes)
        
        # Segment image into patches
        patches, patch_coords = self.segment_image(img_array)
        
        if len(patches) == 0:
            return []
        
        # Classify patches
        classifications = self.classify_patches(patches)
        
        # Convert results to bounding boxes
        results = []
        for result in classifications:
            patch_idx = result['patch_index']
            bbox = patch_coords[patch_idx]  # (x1, y1, x2, y2)
            
            results.append({
                'type': result['class'],
                'confidence': result['confidence'],
                'bbox': list(bbox)
            })
        
        return results
    
    def apply_random_forest_refinement(self, results, img_array):
        """Apply Random Forest for additional classification refinement"""
        from sklearn.ensemble import RandomForestClassifier
        from sklearn.preprocessing import StandardScaler
        
        # Extract features for Random Forest (simple color statistics)
        refined_results = []
        
        for result in results:
            x1, y1, x2, y2 = result['bbox']
            patch = img_array[y1:y2, x1:x2]
            
            # Extract color features
            features = []
            for channel in range(3):  # RGB channels
                channel_data = patch[:, :, channel]
                features.extend([
                    np.mean(channel_data),
                    np.std(channel_data),
                    np.percentile(channel_data, 25),
                    np.percentile(channel_data, 75)
                ])
            
            # For demo, we'll use simple rules instead of training RF
            # In real implementation, you'd train RF on labeled data
            mean_green = features[4]  # Mean of green channel
            mean_blue = features[8]   # Mean of blue channel
            
            # Refine classification based on color characteristics
            original_type = result['type']
            if mean_blue > 150 and result['type'] != 'water_body':
                result['type'] = 'water_body'
                result['confidence'] = min(result['confidence'] + 0.2, 1.0)
            elif mean_green > 120 and result['type'] in ['agricultural_land', 'forest_cover']:
                # Keep forest/agricultural classification but boost confidence
                result['confidence'] = min(result['confidence'] + 0.1, 1.0)
            
            refined_results.append(result)
        
        return refined_results
