import tiles from "./tiles.json";

export type TileName = keyof typeof tiles; 

export type TileType = "resource" | "factory" | "culture";