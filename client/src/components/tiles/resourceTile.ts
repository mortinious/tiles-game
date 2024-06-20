import { Assets, Container, Sprite } from "pixi.js";
import { TileData } from "../../../../common/tileData";
import { Game } from "../game";
import { BaseTile } from "./baseTile";
import { TileName } from "../../../../common/tileType";
import { ResourceType } from "../../../../common/resource";
import { loadAsset } from "../../util/utils";

export class ResourceTile extends BaseTile {
    name: TileName;
    resources: ResourceType[];
    resContainer: Container;
    _positions = [
        [{x: this.width * 0.5, y: this.height * 0.5}],
        [{x: this.width * 0.33, y: this.height * 0.5}, {x: this.width * 0.67, y: this.height * 0.5}],
        [{x: this.width * 0.5, y: this.height * 0.30}, {x: this.width * 0.75, y: this.height * 0.60}, {x: this.width * 0.25, y: this.height * 0.60}],
        [{x: this.width * 0.25, y: this.height * 0.25}, {x: this.width * 0.75, y: this.height * 0.25}, {x: this.width * 0.75, y: this.height * 0.75}, {x: this.width * 0.25, y: this.height * 0.75}]
    ]
    constructor (name: TileName, cost: string[], tileSize: number, game: Game, playerId: string, colors: Record<string, string>, resources: ResourceType[]) {
        super("resource", cost, tileSize, game, playerId, colors);
        this.name = name;
        this.resources = resources;
        this.resContainer = new Container();
        this.addChild(this.resContainer);
        const total = this.resources.length;
        const assetPromises = [];
        for (let i = 0; i < total; i++) {
            const resource = this.resources[i];
            assetPromises.push(loadAsset(`resource_${resource}`).then(texture => {
                const sprite = new Sprite(texture);
                sprite.pivot = {x: sprite.width / 2, y: sprite.height / 2}
                this.resContainer.addChild(sprite);
            }))
        }
        Promise.all(assetPromises).finally(this.updateResourseSprites)

        this.on("pointerdown", e => {
            if (!this.placed) return;
            if (e.button === 0) {
                this.addResource(this.resources[0] || "mithril");
            } else {
                this.removeResource(this.resources[0]);
            }
        });
    }

    addResource = (resource: ResourceType, index?: number) => {
        if (this.resources.length >= 4) return null;
        this.resources.splice(index || 0, 0, resource);
        loadAsset(`resource_${resource}`).then(texture => {
            const sprite = new Sprite(texture);
            sprite.pivot = {x: sprite.width / 2, y: sprite.height / 2}
            this.resContainer.addChild(sprite);
            this.updateResourseSprites();
        })
        return resource;
    }

    removeResource = (requestedResource: string) => {
        if (this.resources.length <= 0) return null;
        const index = this.resources.findIndex(x => x === requestedResource);
        if (index === -1) return null;
        const resource = this.resources.splice(index, 1);
        const sprite = this.resContainer.removeChildAt(index)
        sprite.destroy();
        this.updateResourseSprites();
        return resource;
    }

    updateResourseSprites = () => {
        this.resContainer.children.forEach((sprite, index) => {
            sprite.position = this._positions[this.resContainer.children.length - 1][index];
            sprite.scale = this.resContainer.children.length === 1 ? 1 : 0.8
        });
    }
}