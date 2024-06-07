export type GameState = {
    stage: "readycheck" | "started" | "ended";
    round: number;
    turn: number;
}