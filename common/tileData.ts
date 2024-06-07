import { TileType } from "./tileType"

export type TileData = {
    type: TileType,
    scoring?: TileScoring[]
}

export type TileScoring = {
    type: TileType,
    negated: boolean
}