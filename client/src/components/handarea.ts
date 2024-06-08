import { Container, Text, Graphics } from "pixi.js";
import { Tile } from "./tile";
import colors from "../../../common/colors.json";
import { Game } from "./game";
import { TileData } from "../../../common/tileData";
import { Tooltip } from "./tooltip";

export class HandArea extends Container {
    tileSize: number;
    tilesContainer: Container;
    areaWidth: number;
    areaHeight: number;
    game: Game;
    canPlaceTile: boolean;
    constructor (game: Game, tileSize: number) {
        super();
        this.game = game;
        this.tileSize = tileSize;
        this.canPlaceTile = false;

        this.areaWidth = (tileSize + 5) * 5 + 10;
        this.areaHeight = tileSize + 20;

        const background = new Graphics().roundRect(0, 0, this.areaWidth, this.areaHeight, 10).fill(colors.areabackground);
        this.addChild(background);

        const border = new Graphics().roundRect(0, 0, this.areaWidth, this.areaHeight, 10).stroke({color: colors.areaborder, width: 5, alignment: 1});
        this.addChild(border);

        this.tilesContainer = new Container();
        this.addChild(this.tilesContainer);

        this.tilesContainer.on("childRemoved", child => {
            this._refreshHand();
        });

        this.tilesContainer.on("childAdded", child => {
            this._refreshHand();
        });
    }

    addTile = (tileData: TileData) => {
        if (this.tilesContainer.children.length >= 5) {
            return null;
        }

        const tile = new Tile(tileData, this.tileSize, this.game);

        this.tilesContainer.addChild(tile);

        tile.on("pointerdown", e => {
            if (!this.canPlaceTile) {
                console.log("Not your turn")
                return;
            }
            const board = (this.parent as Game).board;
            if (!board) return;
            const pos = e.getLocalPosition(this);
            tile.x = pos.x - this.tileSize / 2;
            tile.y = pos.y - this.tileSize / 2;
            const shadow = new Graphics().rect(0, 0, this.tileSize, this.tileSize).fill({color: "white", alpha: 0.5});
            board.addChild(shadow);
            shadow.renderable = false;
            e.target.on("globalpointermove", e => {
                if (!board) return;
                const pos = e.getLocalPosition(this);
                tile.x = pos.x - this.tileSize / 2;
                tile.y = pos.y - this.tileSize / 2;
                const boardPos = e.getLocalPosition(board);
                if (board.isPosInside(boardPos)) {
                    shadow.renderable = true;
                    shadow.x = Math.floor(boardPos.x / this.tileSize) * this.tileSize;
                    shadow.y = Math.floor(boardPos.y / this.tileSize) * this.tileSize;
                } else {
                    shadow.renderable = false;
                }
            });

            e.target.on("pointerup", e => {
                if (!board) return;
                const pos = e.getLocalPosition(board);
                e.target.off("globalpointermove");
                e.target.off("pointerup");
                const gridX = Math.floor(pos.x / this.tileSize);
                const gridY = Math.floor(pos.y / this.tileSize);
                const index = this.tilesContainer.getChildIndex(e.target);
                this.game.placeTile(index, gridX, gridY, response => {
                    if (!!response && !!response.type) {
                        this.canPlaceTile = false;
                        board.addTile(tile, response.x, response.y, response.score);
                        e.target.off("pointerdown");
                        tile.onPlaced();
                        (this.game.tooltip as Tooltip).setText();
                    }
                    shadow.destroy();
                    this._refreshHand();
                })
            })
        })

        return tile;
    }

    _refreshHand = () => {
        const count = this.tilesContainer.children.length;
        this.tilesContainer.children.forEach((child, index) => {
            child.x = this.areaWidth / 2 - (count * ((this.tileSize) / 2)) - ((count - 1) * 5 / 2) + (index * (this.tileSize + 5));
            child.y = 10;
        });
    }
}