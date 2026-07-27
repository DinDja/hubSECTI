declare module "topojson-client" {
  export function merge(
    topology: unknown,
    objects: unknown[],
  ): { type: "MultiPolygon"; coordinates: number[][][][] }
  export function feature(
    topology: unknown,
    object: unknown,
  ): { type: "FeatureCollection"; features: unknown[] }
}
