import { TileData } from "../../common/tileData";
import tilesJson from "../../common/tiles.json";

export const getRandomTile = (): Partial<TileData> => {
    const tiles = Object.values(tilesJson);
    return tiles[Math.floor(Math.random() * tiles.length)].tile as Partial<TileData>;
}

export const shuffleArray = (array: any[]) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}