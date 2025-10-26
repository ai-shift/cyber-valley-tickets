export const LAYER_NAMES = {
  "Bpn data": "bpn_data",
  Bridge: "bridge",
  Districts: "districts",
  Dots: "dots",
  Leasehold: "leasehold",
  Lots: "lots",
  Objects: "objects",
  Path: "paths",
  Regions: "regions",
} as const;

export type LayerDisplayName = keyof typeof LAYER_NAMES;
export type LayerApiName = (typeof LAYER_NAMES)[LayerDisplayName];
