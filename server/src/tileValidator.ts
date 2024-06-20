import { TileData } from "../../common/tileData";


export const validateResourceTile = (tiles: TileData[][], tile: TileData, x: number, y: number) => {
    if (!validateCost(tiles, tile, x, y)) {
        return false;
    }
    return true;
}

export const validateCultureTile = (tiles: TileData[][], tile: TileData, x: number, y: number) => {
    if (!validateCost(tiles, tile, x, y)) {
        return false;
    }
    return true;
}

const withinBounds = (x: number, y: number, width: number, height: number) => {
    return x > 0 && x < width && y > 0 && y <height;
}

const validateCost = (tiles: TileData[][], tile: TileData, x: number, y: number) => {
    if (tile.cost.length === 0) {
        if (!withinBounds(x, y, tiles.length, tiles[0].length)) {
            return false;
        }
        return !tiles[x][y];
    } else {
        if (!withinBounds(x, y, tiles.length, tiles[0].length)) {
            return false;
        }

        const coordsToCheck = [
            {x: x - 1, y: y},
            {x: x + 1, y: y},
            {x: x, y: y - 1},
            {x: x, y: y + 1}
        ]
        let requiredResources = [...tile.cost];
        const adjacentResources: TileData[] = [];
        for (const coord of coordsToCheck) {
            if (withinBounds(coord.x, coord.y, tiles.length, tiles[Math.min(Math.max(coord.x, 0), tiles.length)].length)) {
                const tile = tiles[coord.x][coord.y];
                if (tile && tile.type === "resource") {
                    adjacentResources.push(tile);
                }
            }
        }
        for (const resTile of adjacentResources) {
            for (const tileResource of resTile.data.resources) {
                const index = requiredResources.findIndex(x => x === tileResource);
                if (index > -1) {
                    requiredResources.splice(index, 1);
                }
            }
            if (requiredResources.length === 0) {
                return true;;
            }
        }
    }
}