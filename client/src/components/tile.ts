import { getRandomTileType } from "../../../server/src/utils";
import { Container, Graphics} from "pixi.js";
import { TileType } from "../../../common/tileType";
import colors from "../../../common/colors.json";
import { Tooltip } from "./tooltip";
import { TileData, TileScoring } from "common/tileData";
import { Game } from "./game";

export class Tile extends Container{
    type: TileType;
    dragging: boolean;
    scoring: TileScoring[];
    game: Game;
    _arrows?: Graphics[];

    constructor (tiledata: TileData, tileSize: number, game: Game) {
        super()
        this.type = tiledata.type;
        this.dragging = false;
        this.game = game;
        this.zIndex = 20;
        const data = this.getTypeData();

        const onHover = (tile: Tile) => this.game.tooltip.setText(tile.getTooltipText());
        const onHoverEnd = () => this.game.tooltip.setText();

        const background = new Graphics().rect(0, 0, tileSize, tileSize).fill(data.color);
        this.addChild(background);

        const border = new Graphics().rect(0, 0, tileSize, tileSize).stroke({color: "black", width: 3, alpha: 0.3, alignment: 1});
        this.addChild(border);
        this.scoring = [];
        if (!!tiledata.scoring && tiledata.scoring.length === 4) {
            this.scoring = tiledata.scoring;
            const offset = -1;
            this._arrows = [
                this.addChild(this._createTriangle(offset, 25, 0, this.getTypeData(this.scoring[0].type).color)),
                this.addChild(this._createTriangle(25, offset, 90, this.getTypeData(this.scoring[1].type).color)),
                this.addChild(this._createTriangle(tileSize - offset, 25, 180, this.getTypeData(this.scoring[2].type).color)),
                this.addChild(this._createTriangle(25, tileSize - offset, 270, this.getTypeData(this.scoring[3].type).color))
            ]
        }

        this.eventMode = "static";
        
        this.on("mouseenter", e => {
            onHover(this);
        });

        this.on("mouseleave", e => {
            onHoverEnd()
        })
    }

    _createTriangle = (x: number, y: number, angle: number, color: string) => {
        const h = 10;
        const w = 16;
        const tri = new Graphics().poly([{x: 0, y: 0}, {x: h, y: w / 2}, {x: h, y: -w / 2}]).fill(color).stroke({color: "black", width: 2, alpha: 0.5, alignment: 0});
        tri.angle = angle;
        tri.position = {x, y};
        return tri; 
    }

    getTooltipText = () => {
        let text = `${this.getTypeData().name}\n\nBrickan ger 1 poäng för:`
        for (const entry of Object.entries(this.scoring)) {
            const dir = entry[0];
            const val = entry[1];
            text += `\n\n${this.getTypeData(val.type).name} ${this._getDirectionName(dir)}`
        }
        return text;
    }

    getTypeData = (type?: TileType) => {
        switch (type || this.type) {
            case "yellow":
                return {
                    color: colors.tileyellow,
                    name: "Gul bricka"
                }
            case "green":
                return {
                    color: colors.tilegreen,
                    name: "Grön bricka"
                }
            case "white":
                return {
                    color: colors.tilewhite,
                    name: "Vit bricka"
                }
            case "blue":
                return {
                    color: colors.tileblue,
                    name: "Blå bricka"
                }
        }
    }

    _getDirectionName = (dir: string) => {
        switch (dir) {
            case "west":
                return "till vänster."
            case "north":
                return "ovanför."
            case "east":
                return "till höger."
            case "south":
                return "nedanför."
        }
    }

    onPlaced = () => {
        if (this._arrows) {
            this._arrows.forEach(a => a.destroy());
        }
        this.scoring = {} as any;
    }
}
