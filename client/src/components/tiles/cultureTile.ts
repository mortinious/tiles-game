import { Text, Sprite, Point } from "pixi.js";
import { Game } from "../game";
import { BaseTile } from "./baseTile";
import { TileName } from "../../../../common/tileType";
import { loadAsset } from "../../util/utils";
import { ResourceTile } from "./resourceTile";

export class CultureTile extends BaseTile {
    name: TileName;
    points: number;
    pointText?: Text;
    constructor (name: TileName, cost: string[], tileSize: number, game: Game, playerId: string, colors: Record<string, string>, points: number) {
        super("culture", cost, tileSize, game, playerId, colors);
        this.name = name;
        this.points = points;
        loadAsset(`culture_${name}`).then(texture => {
            const sprite = new Sprite(texture);
            sprite.pivot = {x: sprite.width / 2, y: sprite.height / 2}
            sprite.position = {x: this.tileSize / 2, y: this.tileSize / 2};
            this.addChild(sprite);
        })
    }

    onPlaced(): void {
        super.onPlaced();
        if (this.pointText) {
            this.pointText.destroy();
        }
    }

    initHandArea(): void {
        super.initHandArea();
        this.pointText = new Text({text: this.points, style: {fontSize: 25, fill: "#ffffaa", fontWeight: "600", stroke: {color: "#aaaa44", width: 4, alignment: 1}}})
        this.pointText.anchor = 0.5;
        this.pointText.position = {x: this.tileSize / 2, y: this.height - 35};
        this.pointText.zIndex = 100;
        this.addChild(this.pointText);
    }
}