import { BonusData } from "./bonusData";
import { GameConfig } from "./gameConfig";
import { GameState } from "./gameState";
import { PlayerData } from "./playerData";
import { TileData } from "./tileData";

export type GameData = {
    gameId: string;
    name: string;
    config: GameConfig;
    bonusTiles: BonusData[];
    tiles: TileData[][];
    players: PlayerData[];
    state: GameState;
    deckSize: number;
}