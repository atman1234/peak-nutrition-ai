import type { Units } from '../types/profile'

// Conversion constants
const CM_TO_INCHES = 0.393701
const INCHES_TO_CM = 2.54
const KG_TO_LBS = 2.20462
const LBS_TO_KG = 0.453592

export interface DisplayUnits {
  height: string
  weight: string
  heightSuffix: string
  weightSuffix: string
}

export function getDisplayUnits(units: Units): DisplayUnits {
  if (units === 'imperial') {
    return {
      height: 'inches',
      weight: 'lbs',
      heightSuffix: 'in',
      weightSuffix: 'lbs'
    }
  } else {
    return {
      height: 'cm',
      weight: 'kg',
      heightSuffix: 'cm',
      weightSuffix: 'kg'
    }
  }
}

// Height conversions
export function cmToInches(cm: number): number {
  return Math.round(cm * CM_TO_INCHES * 10) / 10
}

export function inchesToCm(inches: number): number {
  return Math.round(inches * INCHES_TO_CM * 10) / 10
}

export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalInches = cmToInches(cm)
  const feet = Math.floor(totalInches / 12)
  const inches = Math.round((totalInches % 12) * 10) / 10
  return { feet, inches }
}

export function feetInchesToCm(feet: number, inches: number): number {
  const totalInches = feet * 12 + inches
  return inchesToCm(totalInches)
}

// Weight conversions
export function kgToLbs(kg: number): number {
  return Math.round(kg * KG_TO_LBS * 10) / 10
}

export function lbsToKg(lbs: number): number {
  return Math.round(lbs * LBS_TO_KG * 100) / 100
}

// Display formatting - values are stored in user's preferred units
export function formatHeight(height: number | null, units: Units): string {
  if (!height) return '--'
  
  if (units === 'imperial') {
    // Height is stored in inches for imperial users
    const feet = Math.floor(height / 12)
    const inches = Math.round((height % 12) * 10) / 10
    return `${feet}'${inches}"`
  } else {
    // Height is stored in cm for metric users
    return `${height} cm`
  }
}

export function formatWeight(weight: number | null, units: Units): string {
  if (!weight) return '--'
  
  if (units === 'imperial') {
    // Weight is stored in lbs for imperial users
    return `${weight} lbs`
  } else {
    // Weight is stored in kg for metric users
    return `${weight} kg`
  }
}

// Convert display values to storage values (always store in metric)
export function convertHeightToStorage(value: number, units: Units): number {
  if (units === 'imperial') {
    return inchesToCm(value)
  }
  return value
}

export function convertWeightToStorage(value: number, units: Units): number {
  if (units === 'imperial') {
    return lbsToKg(value)
  }
  return value
}

// Convert storage values to display values
export function convertHeightFromStorage(heightCm: number | null, units: Units): number {
  if (!heightCm) return 0
  if (units === 'imperial') {
    return cmToInches(heightCm)
  }
  return heightCm
}

export function convertWeightFromStorage(weightKg: number | null, units: Units): number {
  if (!weightKg) return 0
  if (units === 'imperial') {
    return kgToLbs(weightKg)
  }
  return weightKg
}