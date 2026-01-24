import cv2
import os
import numpy as np

def color_quantization(img, k=8):
    data = np.float32(img).reshape((-1, 3))
    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 20, 0.001)
    ret, label, center = cv2.kmeans(data, k, None, criteria, 10, cv2.KMEANS_RANDOM_CENTERS)
    center = np.uint8(center)
    result = center[label.flatten()]
    result = result.reshape(img.shape)
    return result

image_dir = 'public/images/'

for filename in os.listdir(image_dir):
    if filename.endswith('.webp'):
        img_path = os.path.join(image_dir, filename)
        img = cv2.imread(img_path)
        if img is not None:
            # Réduire les couleurs
            quantized = color_quantization(img, k=6)
            # Détecter les contours
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            edges = cv2.Canny(gray, 100, 200)
            # Dilater les contours pour les rendre plus visibles
            kernel = np.ones((2, 2), np.uint8)
            dilated = cv2.dilate(edges, kernel, iterations=1)
            # Appliquer les contours sur l'image quantifiée
            cartoon = cv2.bitwise_and(quantized, quantized, mask=cv2.bitwise_not(dilated))
            # Sauvegarder l'image transformée
            cv2.imwrite(img_path, cartoon)
            print(f"Transformée: {filename}")
        else:
            print(f"Erreur de lecture: {filename}")
