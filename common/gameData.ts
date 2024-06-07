import { BonusData } from "./bonusData";
import { GameConfig } from "./gameConfig";
import { GameState } from "./gameState";
import { PlayerData } from "./playerData";
import { TileType } from "./tileType";

export type GameData = {
    gameId: string;
    name: string;
    config: GameConfig;
    bonusTiles: BonusData[];
    tiles: TileType[][];
    players: PlayerData[];
    state: GameState;
}