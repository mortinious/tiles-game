import { Container, Graphics, Text, Point } from "pixi.js";
import { Tile } from "./tile";
import colors from "../../../common/colors.json";
import { TileData } from "common/tileData";
import { Game } from "./game";
import { TileType } from "common/tileType";
import { LargeTextStyle, MediumTextStyle } from "../util/textstyles";
import { BonusData } from "common/bonusData";
import { ScoreNotice } from "./scoreNotice";

export class Board extends Container{
    tiles: (Tile | null)[][];
    boardWidth: number;
    boardHeight: number;
    tileSize: number;
    game: Game;

    constructor (width: number, height: number, tileSize: number, tiles: TileType[][], game: Game) {
        super();
        this.game = game;
        this.tiles = [];
        this.tileSize = tileSize;
        this.boardWidth = width;
        this.boardHeight = height;
        const border = new Graphics().rect(0, 0, width * tileSize, height * tileSize).stroke({alignment: 0, color: colors.areaborder, width: 10, join: "round"})
        this.addChild(border);
        for (let w = 0; w < width; w++) {
            const col = [] as (Tile | null)[];
            this.tiles.push(col);
            for (let h = 0; h < height; h++) {
                col.push(null);
                const square = new Graphics().rect(w * tileSize, h * tileSize, tileSize, tileSize).fill(((w + h) % 2) ? colors.boardsquare1 : colors.boardsquare2);
                this.addChild(square);                
                if (tiles[w][h]) {
                    this.addTile(new Tile({type: tiles[w][h], scoring: []}, this.tileSize, this.game), w, h);
                }
            }
        }
        this.addBonusTiles(game.data.bonusTiles);
    }

    addTile = (tile: Tile, gridX: number, gridY: number, score?: number) => {

        if (gridX < 0 || gridX >= this.boardWidth || gridY < 0 || gridY >= this.boardHeight || !!this.tiles[gridX][gridY]) {
            return null;
        }

        this.tiles[gridX][gridY] = tile;
        tile.x = gridX * this.tileSize;
        tile.y = gridY * this.tileSize;
        this.addChild(tile);

        if (score !== undefined) {
            this.addChild(new ScoreNotice(score, tile.x + this.tileSize / 2, tile.y + this.tileSize / 2))
        }
    }

    addBonusTiles = (bonuses: BonusData[]) => {
        for (const bonus of bonuses) {
            const bonusText = new Text({text: bonus.text, style: MediumTextStyle});
            bonusText.zIndex = 10;
            bonusText.anchor = 0.5;
            bonusText.position = {x: bonus.x * this.tileSize + this.tileSize / 2, y: bonus.y * this.tileSize + this.tileSize / 2}
            this.addChild(bonusText);
        }
    }

    isPosInside = (pos: Point) => {
        return pos.x >= 0 && pos.x < this.width && pos.y >= 0 && pos.y < this.height;
    }
}