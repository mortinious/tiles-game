import { Container, Text, Graphics } from "pixi.js";
import { Tile } from "./tile";
import { board } from "../index";
import { getRandomTileType } from "../util/utils";

export class HandArea extends Container {
    tileSize: number;
    tilesContainer: Container;
    areaWidth: number;
    areaHeight: number;
    constructor (tileSize: number) {
        super();
        this.tileSize = tileSize;

        this.areaWidth = (tileSize + 5) * 5 + 10;
        this.areaHeight = tileSize + 20;

        const background = new Graphics().roundRect(0, 0, this.areaWidth, this.areaHeight, 10).fill("#555544");
        this.addChild(background);

        const border = new Graphics().roundRect(0, 0, this.areaWidth, this.areaHeight, 10).stroke({color: "#444422", width: 5, alignment: 1});
        this.addChild(border);

        this.tilesContainer = new Container();
        this.addChild(this.tilesContainer);

        const addTileButton = new Container({position: {x: -30, y: 35}});
        addTileButton.addChild(new Graphics().circle(0, 0, 20).fill("#555544")) 
        addTileButton.addChild(new Graphics().circle(0, 0, 20).stroke({color: "#444422", alignment: 0, width: 3})) 
        addTileButton.addChild(new Graphics().rect(-15, -3, 30, 6).fill("#ddddaa"));
        addTileButton.addChild(new Graphics().rect(-3, -15, 6, 30).fill("#ddddaa"));
        addTileButton.eventMode = "static";
        addTileButton.on("mousedown", e => {
            if (this.tilesContainer.children.length >= 5) return;
            this.addTile(new Tile(getRandomTileType(), this.tileSize))
        })
        this.addChild(addTileButton);

        this.tilesContainer.on("childRemoved", child => {
            this._refreshHand();
        });

        this.tilesContainer.on("childAdded", child => {
            this._refreshHand();
        });
    }

    addTile = (tile: Tile) => {
        if (this.tilesContainer.children.length >= 5) {
            return null;
        }

        this.tilesContainer.addChild(tile);

        tile.on("pointerdown", e => {
            const pos = e.getLocalPosition(this);
            tile.x = pos.x - this.tileSize / 2;
            tile.y = pos.y - this.tileSize / 2;
            tile.alpha = 0.5;
            const shadow = new Graphics().rect(0, 0, this.tileSize, this.tileSize).fill({color: "white", alpha: 0.5});
            board.addChild(shadow);
            shadow.renderable = false;
            e.target.on("globalpointermove", e => {
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
                const pos = e.getLocalPosition(board);
                if (board.addTile(tile, pos.x, pos.y)) {
                    e.target.off("pointerdown");
                }
                e.target.off("globalpointermove");
                e.target.off("pointerup");
                e.target.alpha = 1;
                shadow.destroy();
                this._refreshHand();
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