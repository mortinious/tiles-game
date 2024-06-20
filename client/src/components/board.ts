import { Container, Graphics, Text, Point, FederatedWheelEvent } from "pixi.js";
import { BaseTile } from "./tiles/baseTile";
import colors from "../../../common/colors.json";
import { Game } from "./game";
import { PopupText } from "./popupText";
import { createTile, repeatWithDelay } from "../util/utils";
import { TileData } from "../../../common/tileData";
import { ResourceTile } from "./tiles/resourceTile";

export class Board extends Container{
    tiles: (BaseTile | null)[][];
    squareMarkers: Container;
    boardWidth: number;
    boardHeight: number;
    tileSize: number;
    game: Game;
    constructor (width: number, height: number, tileSize: number, tileData: TileData[][], game: Game) {
        super();
        this.game = game;
        this.tiles = [];
        this.tileSize = tileSize;
        this.boardWidth = width;
        this.boardHeight = height;
        this.children.forEach(x => x.destroy());
        this.pivot = {x: (width * tileSize) / 2, y: 0}
        this.squareMarkers = new Container();
        
        const border = new Graphics().rect(0, 0, width * this.tileSize, height * this.tileSize).stroke({alignment: 0, color: colors.areaborder, width: 10, join: "round"})
        this.addChild(border);
        for (let w = 0; w < width; w++) {
            const col = [] as (BaseTile | null)[];
            this.tiles.push(col);
            for (let h = 0; h < height; h++) {
                col.push(null);
                const square = new Graphics().rect(w * this.tileSize, h * this.tileSize, this.tileSize, this.tileSize).fill(((w + h) % 2) ? colors.boardsquare1 : colors.boardsquare2);
                this.addChild(square);
                const data = tileData[w][h];        
                if (data) {
                    if (data.playerId === undefined) continue;
                    const tile = createTile(data, this.tileSize, this.game, data.playerId);
                    if (tile) {
                        this.addTile(tile, w, h);
                        this.tiles[w][h] = tile;
                    }
                }
            }
        }

        this.addChild(this.squareMarkers);
    }

    addTile = (tile: BaseTile, gridX: number, gridY: number, score?: number) => {

        if (gridX < 0 || gridX >= this.boardWidth || gridY < 0 || gridY >= this.boardHeight || !!this.tiles[gridX][gridY]) {
            return null;
        }

        this.tiles[gridX][gridY] = tile;
        tile.x = gridX * this.tileSize;
        tile.y = gridY * this.tileSize;
        this.addChild(tile);

        if (!!score) {
            this.addChild(new PopupText(`+${score}`, tile.x + this.tileSize / 2, tile.y + this.tileSize / 2))
        }
    }

    markValidSquares = (tile: BaseTile) => {
        const coords: {x: number, y: number}[] = tile.getValidSquares(this.tiles);
        for (const coord of coords) {
            const marker = new Graphics().rect(coord.x * this.tileSize, coord.y * this.tileSize, this.tileSize, this.tileSize).stroke({color: "#66ff44", width: 3, alpha: 0.4, alignment: 1});
            marker.label = `${coord.x}:${coord.y}`;
            this.squareMarkers.addChild(marker)
            
        }
    }

    unmarkValidSquares = () => {
        this.squareMarkers.destroy();
        this.squareMarkers = new Container();
        this.addChild(this.squareMarkers);
    }

    useResource = (resources: string[], x: number, y: number, score?: number) => {
        const tile = this.tiles[x][y];
        for (const resource of resources) {
            (tile as ResourceTile).removeResource(resource);
        }

        repeatWithDelay((runCount) => {
            if (runCount === resources.length) {
                this.addChild(new PopupText(`+${score}`, x * this.tileSize + this.tileSize / 2, y * this.tileSize  + this.tileSize / 2))
            } else {
                this.addChild(new PopupText(`-[asset:resource_${resources[runCount]}]`, x * this.tileSize + this.tileSize / 2, y * this.tileSize  + this.tileSize / 2))
            }
        }, 350, resources.length + (score ? 1 : 0), true);
    }

    isCoordValid = (x: number, y: number) => {
        return !!this.squareMarkers.getChildByLabel(`${x}:${y}`);
    }

    isPosInside = (pos: Point) => {
        return pos.x >= 0 && pos.x < this.width && pos.y >= 0 && pos.y < this.height;
    }
}