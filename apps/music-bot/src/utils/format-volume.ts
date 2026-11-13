/** Round a gain converted to a percentage without exposing binary floating-point noise. */
export const formatVolume = (volume: number) => Math.round(volume * 100) / 100;
