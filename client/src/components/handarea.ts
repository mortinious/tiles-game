import { Container, Text, Graphics, Rectangle, Ticker } from "pixi.js";
import { BaseTile } from "./tiles/baseTile";
import colors from "../../../common/colors.json";
import { Game } from "./game";
import { TileData } from "../../../common/tileData";
import { Tooltip } from "./tooltip";
import { createTile } from "../util/utils";
import { app } from "..";

export class HandArea extends Container {
    tileSize: number;
    tilesContainer: Container;
    areaWidth: number;
    areaHeight: number;
    game: Game;
    canPlaceTile: boolean;
    expanded: boolean;
    constructor (game: Game, tileSize: number) {
        super();
        this.game = game;
        this.tileSize = tileSize;
        this.canPlaceTile = false;
        this.expanded = false;

        this.areaWidth = (tileSize + 5) * 3 + 10;
        this.areaHeight = tileSize + 20;

        this.pivot = {x: this.areaWidth / 2, y: this.areaHeight / 2};

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

        Ticker.shared.add(() => {
            if (this.expanded && this.y !== app.screen.height - this.tileSize) {
                const destY = app.screen.height - this.tileSize;
                if (this.y - destY > 10) {
                    this.y -= 10
                } else {
                    this.y = destY;
                }
            } else if (!this.expanded && this.y !== app.screen.height) {
                const destY = app.screen.height;
                if (destY - this.y > 10) {
                    this.y += 10
                } else {
                    this.y = destY;
                }
            }
        })
    }

    expand = () => {
        if (!this.expanded) {
            this.expanded = true;
        }
    }
    
    collapse = () => {
        if (this.expanded) {
            this.expanded = false;
        }
    }

    addTile = (tileData: TileData) => {
        if (this.tilesContainer.children.length >= 5) {
            return null;
        }

        const tile = createTile(tileData, this.tileSize, this.game, this.game.player.id);
        if (!tile) return null;
        this.tilesContainer.addChild(tile);
        tile.initHandArea();

        tile.on("pointerdown", e => {
            if (!this.canPlaceTile) {
                console.log("Not your turn")
                return;
            }
            const board = (this.parent as Game).board;
            if (!board) return;
            board.markValidSquares(tile);
            this.collapse();
            const pos = e.getLocalPosition(this);
            tile.pivot = {x: tile.width / 2, y: tile.height / 2};
            tile.scale = board.scale;
            tile.x = pos.x;
            tile.y = pos.y;
            const shadow = new Graphics();
            board.addChild(shadow);
            tile.on("globalpointermove", e => {
                if (!board) return;
                const pos = e.getLocalPosition(this);
                tile.x = pos.x;
                tile.y = pos.y;
                const boardPos = e.getLocalPosition(board);
                if (board.isPosInside(boardPos)) {
                    const coordX = Math.floor(boardPos.x / this.tileSize);
                    const coordY = Math.floor(boardPos.y / this.tileSize);
                    const isPosValid = board.isCoordValid(coordX, coordY);
                    if (shadow.x !== (coordX * this.tileSize) || shadow.y !== (coordY * this.tileSize)) {
                        shadow.clear();
                        shadow.rect(0, 0, this.tileSize, this.tileSize).fill({color: isPosValid ? "#66ff44" : "#ff6644", alpha: 0.4})
                        shadow.x = coordX * this.tileSize;
                        shadow.y = coordY * this.tileSize;
                    }
                } else {
                    shadow.clear();
                }
            });

            tile.on("pointerup", e => {
                if (!board) return;
                const pos = e.getLocalPosition(board);
                tile.off("globalpointermove");
                tile.off("pointerup");
                const gridX = Math.floor(pos.x / this.tileSize);
                const gridY = Math.floor(pos.y / this.tileSize);
                const index = this.tilesContainer.getChildIndex(tile);
                this.game.placeTile(index, gridX, gridY, (success, data) => {
                    tile.scale = 1;
                    tile.pivot = 0;
                    if (success) {
                        this.canPlaceTile = false;
                        board.addTile(tile, data.x, data.y, data.score);
                        tile.off("pointerdown");
                        tile.onPlaced();
                        (this.game.tooltip as Tooltip).setText();
                    }
                    shadow.destroy();
                    this._refreshHand();
                    board.unmarkValidSquares();
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