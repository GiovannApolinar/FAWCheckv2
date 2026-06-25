import * as mobilenet from '@tensorflow-models/mobilenet';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-cpu';
import '@tensorflow/tfjs-backend-webgl';

export type PhotoWarningKind = 'not_maize' | 'unusable';

export interface PhotoValidationWarning {
  kind: PhotoWarningKind;
  title: string;
  message: string;
}

export interface PhotoValidationResult {
  warnings: PhotoValidationWarning[];
}

type QualityMetrics = {
  width: number;
  height: number;
  minDimension: number;
  averageBrightness: number;
  contrast: number;
  blurVariance: number;
  vegetationRatio: number;
};

type ContentSignal = {
  shouldWarn: boolean;
  label?: string;
  hasMaizeSignal: boolean;
  hasPlantSignal: boolean;
};

const NON_PLANT_KEYWORDS = [
  'person',
  'man',
  'woman',
  'boy',
  'girl',
  'face',
  'dog',
  'cat',
  'bird',
  'horse',
  'cow',
  'sheep',
  'car',
  'truck',
  'bus',
  'motorcycle',
  'bicycle',
  'airplane',
  'boat',
  'train',
  'laptop',
  'computer',
  'keyboard',
  'monitor',
  'screen',
  'cellular telephone',
  'phone',
  'book',
  'notebook',
  'wallet',
  'bottle',
  'cup',
  'plate',
  'pizza',
  'burger',
  'sandwich',
  'banana',
  'orange',
  'apple',
  'chair',
  'sofa',
  'couch',
  'table',
  'desk',
  'bed',
  'toilet',
];

const PLANT_KEYWORDS = [
  'wheat',
  'grass',
  'leaf',
  'plant',
  'rapeseed',
  'sunflower',
  'daisy',
  'hay',
];

const MAIZE_KEYWORDS = [
  'corn',
  'maize',
  'cornfield',
  'corn field',
  'corn cob',
  'corncob',
  'ear',
];

let classifierPromise: Promise<mobilenet.MobileNet | null> | null = null;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch(() => {
        clearTimeout(timer);
        resolve(null);
      });
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to load image.'));
    image.src = src;
  });
}

function getSampleDimensions(width: number, height: number, maxSide = 192): { width: number; height: number } {
  const scale = Math.min(1, maxSide / Math.max(width, height));

  return {
    width: Math.max(48, Math.round(width * scale)),
    height: Math.max(48, Math.round(height * scale)),
  };
}

function formatReasons(reasons: string[]): string {
  if (reasons.length === 0) {
    return '';
  }

  if (reasons.length === 1) {
    return reasons[0];
  }

  if (reasons.length === 2) {
    return `${reasons[0]} and ${reasons[1]}`;
  }

  return `${reasons.slice(0, -1).join(', ')}, and ${reasons[reasons.length - 1]}`;
}

function analyzeQuality(image: HTMLImageElement): QualityMetrics {
  const { width: sampleWidth, height: sampleHeight } = getSampleDimensions(image.naturalWidth, image.naturalHeight);
  const canvas = document.createElement('canvas');
  canvas.width = sampleWidth;
  canvas.height = sampleHeight;

  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) {
    return {
      width: image.naturalWidth,
      height: image.naturalHeight,
      minDimension: Math.min(image.naturalWidth, image.naturalHeight),
      averageBrightness: 127,
      contrast: 0,
      blurVariance: 0,
      vegetationRatio: 0,
    };
  }

  context.drawImage(image, 0, 0, sampleWidth, sampleHeight);
  const imageData = context.getImageData(0, 0, sampleWidth, sampleHeight);
  const { data, width, height } = imageData;

  const grayscale = new Float32Array(width * height);
  let brightnessSum = 0;
  let brightnessSquaredSum = 0;
  let vegetationPixels = 0;

  for (let offset = 0, index = 0; offset < data.length; offset += 4, index += 1) {
    const red = data[offset];
    const green = data[offset + 1];
    const blue = data[offset + 2];
    const brightness = 0.2126 * red + 0.7152 * green + 0.0722 * blue;

    grayscale[index] = brightness;
    brightnessSum += brightness;
    brightnessSquaredSum += brightness * brightness;

    const excessGreen = (2 * green) - red - blue;
    if (excessGreen > 24 && green > red * 0.85 && green > blue * 0.85) {
      vegetationPixels += 1;
    }
  }

  const totalPixels = width * height;
  const averageBrightness = brightnessSum / totalPixels;
  const contrast = Math.sqrt(Math.max(0, (brightnessSquaredSum / totalPixels) - (averageBrightness * averageBrightness)));

  let laplacianSum = 0;
  let laplacianSquaredSum = 0;
  let laplacianCount = 0;

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = y * width + x;
      const laplacian =
        grayscale[index - width] +
        grayscale[index + width] +
        grayscale[index - 1] +
        grayscale[index + 1] -
        (4 * grayscale[index]);

      laplacianSum += laplacian;
      laplacianSquaredSum += laplacian * laplacian;
      laplacianCount += 1;
    }
  }

  const laplacianMean = laplacianCount > 0 ? laplacianSum / laplacianCount : 0;
  const blurVariance = laplacianCount > 0
    ? Math.max(0, (laplacianSquaredSum / laplacianCount) - (laplacianMean * laplacianMean))
    : 0;

  return {
    width: image.naturalWidth,
    height: image.naturalHeight,
    minDimension: Math.min(image.naturalWidth, image.naturalHeight),
    averageBrightness,
    contrast,
    blurVariance,
    vegetationRatio: vegetationPixels / totalPixels,
  };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isKeywordMatch(label: string, keywords: string[]): boolean {
  return keywords.some((keyword) => {
    const pattern = new RegExp(`(^|[^a-z])${escapeRegExp(keyword)}([^a-z]|$)`, 'i');
    return pattern.test(label);
  });
}

async function ensureClassifier(): Promise<mobilenet.MobileNet | null> {
  if (!classifierPromise) {
    classifierPromise = (async () => {
      try {
        try {
          await tf.setBackend('webgl');
        } catch {
          await tf.setBackend('cpu');
        }

        await tf.ready();
        return await mobilenet.load({ version: 2, alpha: 1 });
      } catch {
        classifierPromise = null;
        return null;
      }
    })();
  }

  return classifierPromise;
}

async function analyzeContent(image: HTMLImageElement): Promise<ContentSignal | null> {
  const classifier = await withTimeout(ensureClassifier(), 3500);
  if (!classifier) {
    return null;
  }

  const predictions = await withTimeout(classifier.classify(image, 3), 2500);
  if (!predictions || predictions.length === 0) {
    return null;
  }

  const normalizedPredictions = predictions.map((prediction) => ({
    label: prediction.className.toLowerCase(),
    probability: prediction.probability,
  }));

  const primary = normalizedPredictions[0];
  const hasMaizeSignal = normalizedPredictions.some((prediction) => isKeywordMatch(prediction.label, MAIZE_KEYWORDS));
  const hasPlantSignal = normalizedPredictions.some((prediction) => isKeywordMatch(prediction.label, PLANT_KEYWORDS));
  const hasStrongNonPlantSignal =
    primary.probability >= 0.45 &&
    isKeywordMatch(primary.label, NON_PLANT_KEYWORDS);
  const hasStrongNonMaizeSignal =
    primary.probability >= 0.35 &&
    !hasMaizeSignal;

  return {
    shouldWarn: !hasMaizeSignal && (hasStrongNonPlantSignal || hasStrongNonMaizeSignal),
    label: primary.label,
    hasMaizeSignal,
    hasPlantSignal,
  };
}

function buildUnusableWarning(metrics: QualityMetrics): PhotoValidationWarning | null {
  const reasons: string[] = [];

  if (metrics.minDimension < 240) {
    reasons.push('the image is too small');
  }

  if (metrics.blurVariance < 10) {
    reasons.push('it looks blurry');
  }

  if (metrics.averageBrightness < 45) {
    reasons.push('it is too dark');
  }

  if (metrics.averageBrightness > 235) {
    reasons.push('it is too bright');
  }

  if (metrics.contrast < 18) {
    reasons.push('leaf details are hard to see');
  }

  if (reasons.length === 0) {
    return null;
  }

  return {
    kind: 'unusable',
    title: 'Photo may be unusable',
    message: `This photo may be hard to assess because ${formatReasons(reasons)}. Retake it with the maize leaf in focus and well lit.`,
  };
}

function buildNotMaizeWarning(metrics: QualityMetrics, contentSignal: ContentSignal | null): PhotoValidationWarning | null {
  if (contentSignal?.shouldWarn) {
    const contentMessage = contentSignal.hasPlantSignal
      ? `This image looks more like "${contentSignal.label}" than maize/corn. Retake it with the maize leaves centered in the frame.`
      : `This image looks more like "${contentSignal.label}" than a maize/corn plant. Retake it with the maize leaves centered in the frame.`;

    return {
      kind: 'not_maize',
      title: 'Photo may not show maize/corn',
      message: contentMessage,
    };
  }

  if (contentSignal?.hasMaizeSignal) {
    return null;
  }

  if (metrics.vegetationRatio < 0.03 && metrics.averageBrightness > 55 && metrics.contrast > 20) {
    return {
      kind: 'not_maize',
      title: 'Photo may not show maize/corn',
      message: 'This image does not clearly look like a maize/corn plant. Retake it with the maize leaves filling most of the frame.',
    };
  }

  return null;
}

export async function validatePhoto(source: string): Promise<PhotoValidationResult> {
  const image = await loadImage(source);
  const metrics = analyzeQuality(image);
  const warnings: PhotoValidationWarning[] = [];

  const unusableWarning = buildUnusableWarning(metrics);
  if (unusableWarning) {
    warnings.push(unusableWarning);
  }

  const contentSignal = await analyzeContent(image);
  const notMaizeWarning = buildNotMaizeWarning(metrics, contentSignal);
  if (notMaizeWarning) {
    warnings.push(notMaizeWarning);
  }

  return { warnings };
}
