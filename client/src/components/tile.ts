import { Container, Graphics, Point, Ticker} from "pixi.js";
import { TileType } from "../../../common/tileType";
import colors from "../../../common/colors.json";
import { Tooltip } from "./tooltip";
import { TileData, TileScoring } from "../../../common/tileData";
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

        const onHover = (tile: Tile) => (this.game.tooltip as Tooltip).setText(tile.getTooltipText());
        const onHoverEnd = () => (this.game.tooltip as Tooltip).setText();

        this.pivot = 0.5;

        const background = new Graphics().rect(0, 0, tileSize, tileSize).fill(data.color).stroke({color: "black", width: 3, alpha: 0.3, alignment: 1});
        this.addChild(background);
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
            if (!!onHover) {
                onHover(this);
            }
        });

        this.on("mouseleave", e => {
            if (!!onHoverEnd) {
                onHoverEnd()
            }
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
        const name = this.getTypeData().name;
        if (!this.scoring || this.scoring.length === 0) {
            return `${name}\n\nLägg en bricka som vill ligga bredvid en ${name.toLocaleLowerCase()} bredvid denna bricka för poäng`;
        }
        let text = `${name}\n\nBrickan ger poäng för:`
        text += `\n\n- ${this.getTypeData(this.scoring[0].type).name} ${this._getDirectionName(0)}`;
        text += `\n\- ${this.getTypeData(this.scoring[1].type).name} ${this._getDirectionName(1)}`;
        text += `\n\- ${this.getTypeData(this.scoring[2].type).name} ${this._getDirectionName(2)}`;
        text += `\n\- ${this.getTypeData(this.scoring[3].type).name} ${this._getDirectionName(3)}`;
        text += "\n\nDu får 1 poäng för 1 matchad färg"
        text += "\n3 poäng för 2 matchade färger"
        text += "\n6 poäng för 3 matchade färger"
        text += "\n10 poäng för 10 matchade färger"
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

    _getDirectionName = (index: number) => {
        return ["till vänster.", "ovanför.", "till höger.", "nedanför."][index];
    }

    onPlaced = () => {
        if (this._arrows) {
            this._arrows.forEach(a => a.destroy());
        }
        this.scoring = null;
    }
}
