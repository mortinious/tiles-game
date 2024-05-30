import { TileType } from "components/tile";

const types = [
    "field",
    "forest",
    "mountain",
    "lake"
] as TileType[]

export const getRandomTileType = () => {
    return types[Math.floor(Math.random() * types.length)];
}