import { Container, Graphics, GraphicsContext, Point } from "pixi.js";
import { Tile } from "./tile";

export class Board extends Container{
    tiles: (Tile | null)[][];
    boardWidth: number;
    boardHeight: number;
    tileSize: number;

    constructor (width: number, height: number, tileSize: number) {
        super();
        this.tiles = [];
        this.tileSize = tileSize;
        this.boardWidth = width;
        this.boardHeight = height;
        const border = new Graphics().rect(0, 0, width * tileSize, height * tileSize).stroke({alignment: 0, color: "#444422", width: 10, join: "round"})
        this.addChild(border);
        for (let w = 0; w < width; w++) {
            const col = [] as (Tile | null)[];
            for (let h = 0; h < height; h++) {
                col.push(null);
                const square = new Graphics().rect(w * tileSize, h * tileSize, tileSize, tileSize).fill(((w + h) % 2) ? "#bfddbf" : "#cceecc");
                this.addChild(square);                
            }
            this.tiles.push(col);
        }
    }

    addTile = (tile: Tile, x: number, y: number) => {

        const gridX = Math.floor(x / this.tileSize);
        const gridY = Math.floor(y / this.tileSize)

        if (gridX < 0 || gridX >= this.boardWidth || gridY < 0 || gridY >= this.boardHeight || !!this.tiles[gridX][gridY]) {
            return null;
        }

        this.tiles[gridX][gridY] = tile;
        tile.x = gridX * this.tileSize;
        tile.y = gridY * this.tileSize;
        this.addChild(tile);

        return tile;
    }

    isPosInside = (pos: Point) => {
        return pos.x >= 0 && pos.x < this.width && pos.y >= 0 && pos.y < this.height;
    }
}