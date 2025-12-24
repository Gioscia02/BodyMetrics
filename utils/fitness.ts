export interface FitnessMetrics {
  bmi?: { value: number; status: string; color: string };
  bodyFat?: { value: number; method: string };
  whtr?: { value: number; status: string; color: string }; // Waist to Height Ratio
}

export const calculateFitnessMetrics = (
  measurements: Record<string, number>,
  gender?: 'male' | 'female',
  heightCm?: number,
  age?: number
): FitnessMetrics => {
  const metrics: FitnessMetrics = {};
  
  const weight = measurements['Peso'];
  const waist = measurements['Vita'];
  const neck = measurements['Collo'];
  const hips = measurements['Fianchi'];

  // 1. BMI Calculation
  if (weight && heightCm) {
    const heightM = heightCm / 100;
    const bmi = weight / (heightM * heightM);
    let status = '';
    let color = '';

    if (bmi < 18.5) { status = 'Sottopeso'; color = 'text-blue-600 bg-blue-50 border-blue-200'; }
    else if (bmi < 25) { status = 'Normopeso'; color = 'text-emerald-600 bg-emerald-50 border-emerald-200'; }
    else if (bmi < 30) { status = 'Sovrappeso'; color = 'text-orange-600 bg-orange-50 border-orange-200'; }
    else { status = 'Obeso'; color = 'text-red-600 bg-red-50 border-red-200'; }

    metrics.bmi = { value: parseFloat(bmi.toFixed(1)), status, color };
  }

  // 2. Navy Body Fat Calculation
  // Richiede: Altezza, Vita, Collo (e Fianchi per le donne)
  if (gender && heightCm && waist && neck) {
    let bodyFat = 0;
    // Formule US Navy Method
    try {
      if (gender === 'male') {
        // Uomini: 495 / (1.0324 - 0.19077 * log10(vita - collo) + 0.15456 * log10(altezza)) - 450
        // Nota: Le formule originali usano cm
        if (waist - neck > 0) {
            bodyFat = 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(heightCm)) - 450;
        }
      } else {
        // Donne: 495 / (1.29579 - 0.35004 * log10(vita + fianchi - collo) + 0.22100 * log10(altezza)) - 450
        if (hips && (waist + hips - neck > 0)) {
            bodyFat = 495 / (1.29579 - 0.35004 * Math.log10(waist + hips - neck) + 0.22100 * Math.log10(heightCm)) - 450;
        }
      }
    } catch (e) {
      console.warn("Errore calcolo BF", e);
    }

    if (bodyFat > 0 && bodyFat < 70) {
      metrics.bodyFat = { value: parseFloat(bodyFat.toFixed(1)), method: 'Navy Method' };
    }
  }

  // 3. Waist-to-Height Ratio (WHtR)
  // Ottimo indicatore di rischio metabolico e grasso viscerale
  if (waist && heightCm) {
    const ratio = waist / heightCm;
    let status = '';
    let color = '';

    // Cut-offs generali
    if (ratio <= 0.34) { status = 'Estremamente Magro'; color = 'text-blue-600 bg-blue-50'; }
    else if (ratio <= 0.49) { status = 'Sano'; color = 'text-emerald-600 bg-emerald-50'; }
    else if (ratio <= 0.59) { status = 'Sovrappeso'; color = 'text-orange-600 bg-orange-50'; }
    else { status = 'Rischio Alto'; color = 'text-red-600 bg-red-50'; }

    metrics.whtr = { value: parseFloat(ratio.toFixed(2)), status, color };
  }

  return metrics;
};