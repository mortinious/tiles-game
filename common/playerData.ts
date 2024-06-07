import { TileData } from "./tileData";

export type PlayerData = {
    id: string;
    name: string;
    color: string;
    disconnected: boolean;
    gameId: string | null; 
    score: number;
    tiles?: TileData[]
    ready?: boolean;
}