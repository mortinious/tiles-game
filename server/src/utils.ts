import { TileType } from "../../common/tileType";

const types = [
    "green",
    "yellow",
    "blue",
    "white"
] as TileType[]

export const getRandomTileType = () => {
    return types[Math.floor(Math.random() * types.length)];
}

export const shuffleArray = (array: any[]) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}