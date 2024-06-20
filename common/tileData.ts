import { TileName, TileType } from "./tileType"

export type TileData = {
    type: TileType;
    name: TileName;
    cost: string[];
    data: Record<string, any>;
    playerId?: string;
}