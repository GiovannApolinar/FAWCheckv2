// src/lib/classifyImage.ts

import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-cpu';
import '@tensorflow/tfjs-backend-webgl';

let model: tf.GraphModel | null = null;

export async function classifyMaizeDamage(base64Image: string): Promise<'damaged' | 'not damaged'> {
  // Load model once
  if (!model) {
    await tf.setBackend('webgl');
    await tf.ready();

    // ⚠️ Replace this with your own model URL later
    model = await tf.loadGraphModel('https://tfhub.dev/google/tfjs-model/imagenet/mobilenet_v2_100_224/classification/3/default/1', { fromTFHub: true });
  }

  // Convert Base64 image to tensor
  const img = new Image();
  img.src = base64Image;

  await new Promise((resolve) => {
    img.onload = resolve;
  });

  const tensor = tf.browser.fromPixels(img)
    .resizeNearestNeighbor([224, 224])
    .toFloat()
    .div(255.0)
    .expandDims();

  const prediction = model.predict(tensor) as tf.Tensor;
  const values = await prediction.data();

  const maxVal = Math.max(...values);
  const index = values.indexOf(maxVal);

  // Simulated logic: map top class index to "damaged" or "not damaged"
  return index % 2 === 0 ? 'damaged' : 'not damaged'; // 🧪 Replace with your logic later
}
