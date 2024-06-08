import { PlayerData } from "./playerData";

export type GameState = {
    stage: "readycheck" | "started" | "ended";
    round: number;
    turn: number;
    finalRound: boolean;
    winners?: Partial<PlayerData>[];
}