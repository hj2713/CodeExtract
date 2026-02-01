// Type definitions for the AppearanceSettings component

export interface AppearanceSettingsState {
  computeEnvironment: "kubernetes" | "vm"
  gpuCount: number
  wallpaperTinting: boolean
}

export interface GpuInputProps {
  value: number
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onAdjustment: (adjustment: number) => void
  min?: number
  max?: number
}

export type ComputeEnvironment = "kubernetes" | "vm"
