export type EqualizerBand = {
  band: number;
  gain: number;
};

export type EQPreset = {
  Flat: EqualizerBand[];
  Classical: EqualizerBand[];
  Club: EqualizerBand[];
  Dance: EqualizerBand[];
  FullBass: EqualizerBand[];
  FullBassTreble: EqualizerBand[];
  FullTreble: EqualizerBand[];
  Headphones: EqualizerBand[];
  LargeHall: EqualizerBand[];
  Live: EqualizerBand[];
  Party: EqualizerBand[];
  Pop: EqualizerBand[];
  Reggae: EqualizerBand[];
  Rock: EqualizerBand[];
  Ska: EqualizerBand[];
  Soft: EqualizerBand[];
  SoftRock: EqualizerBand[];
  Techno: EqualizerBand[];
};

export const BAND_COUNT = 15;

const makeBands = (arr: number[]) => {
  return Array.from(
    {
      length: BAND_COUNT,
    },
    (_, i) => ({
      band: i,
      gain: arr[i] ? arr[i] / 30 : 0,
    })
  ) as EqualizerBand[];
};

export const EqualizerConfigurationPreset: Readonly<EQPreset> = Object.freeze({
  Flat: makeBands([]),
  Classical: makeBands([
    -1.11022e-15, -1.11022e-15, -1.11022e-15, -1.11022e-15, -1.11022e-15,
    -1.11022e-15, -7.2, -7.2, -7.2, -9.6,
  ]),
  Club: makeBands([
    -1.11022e-15, -1.11022e-15, 8.0, 5.6, 5.6, 5.6, 3.2, -1.11022e-15,
    -1.11022e-15, -1.11022e-15,
  ]),
  Dance: makeBands([
    9.6, 7.2, 2.4, -1.11022e-15, -1.11022e-15, -5.6, -7.2, -7.2, -1.11022e-15,
    -1.11022e-15,
  ]),
  FullBass: makeBands([
    -8.0, 9.6, 9.6, 5.6, 1.6, -4.0, -8.0, -10.4, -11.2, -11.2,
  ]),
  FullBassTreble: makeBands([
    7.2, 5.6, -1.11022e-15, -7.2, -4.8, 1.6, 8.0, 11.2, 12.0, 12.0,
  ]),
  FullTreble: makeBands([
    -9.6, -9.6, -9.6, -4.0, 2.4, 11.2, 16.0, 16.0, 16.0, 16.8,
  ]),
  Headphones: makeBands([
    4.8, 11.2, 5.6, -3.2, -2.4, 1.6, 4.8, 9.6, 12.8, 14.4,
  ]),
  LargeHall: makeBands([
    10.4, 10.4, 5.6, 5.6, -1.11022e-15, -4.8, -4.8, -4.8, -1.11022e-15,
    -1.11022e-15,
  ]),
  Live: makeBands([-4.8, -1.11022e-15, 4.0, 5.6, 5.6, 5.6, 4.0, 2.4, 2.4, 2.4]),
  Party: makeBands([
    7.2, 7.2, -1.11022e-15, -1.11022e-15, -1.11022e-15, -1.11022e-15,
    -1.11022e-15, -1.11022e-15, 7.2, 7.2,
  ]),
  Pop: makeBands([
    -1.6, 4.8, 7.2, 8.0, 5.6, -1.11022e-15, -2.4, -2.4, -1.6, -1.6,
  ]),
  Reggae: makeBands([
    -1.11022e-15, -1.11022e-15, -1.11022e-15, -5.6, -1.11022e-15, 6.4, 6.4,
    -1.11022e-15, -1.11022e-15, -1.11022e-15,
  ]),
  Rock: makeBands([8.0, 4.8, -5.6, -8.0, -3.2, 4.0, 8.8, 11.2, 11.2, 11.2]),
  Ska: makeBands([
    -2.4, -4.8, -4.0, -1.11022e-15, 4.0, 5.6, 8.8, 9.6, 11.2, 9.6,
  ]),
  Soft: makeBands([
    4.8, 1.6, -1.11022e-15, -2.4, -1.11022e-15, 4.0, 8.0, 9.6, 11.2, 12.0,
  ]),
  SoftRock: makeBands([
    4.0, 4.0, 2.4, -1.11022e-15, -4.0, -5.6, -3.2, -1.11022e-15, 2.4, 8.8,
  ]),
  Techno: makeBands([
    8.0, 5.6, -1.11022e-15, -5.6, -4.8, -1.11022e-15, 8.0, 9.6, 9.6, 8.8,
  ]),
});
