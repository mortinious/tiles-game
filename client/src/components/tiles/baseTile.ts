import { Container, Graphics, Point, Sprite, Ticker} from "pixi.js";
import colors from "../../../../common/colors.json";
import { Tooltip } from "../tooltip";
import { Game } from "../game";
import { TileType } from "../../../../common/tileType";
import { loadAsset } from "../../util/utils";
import { ResourceTile } from "./resourceTile";
import { PopupText } from "../popupText";
import { DynamicText } from "../dynamicText";

export class BaseTile extends Container {
    type: TileType;
    cost: string[];
    dragging: boolean;
    placed: boolean;
    game: Game;
    constContainer: Container | undefined;
    tileSize;
    playerId: string;
    playerColors: Record<string, string>;

    constructor (type: TileType, cost: string[], tileSize: number, game: Game, playerId: string, playerColors: Record<string, string>) {
        super()
        this.type = type;
        this.cost = cost;
        this.dragging = false;
        this.playerId = playerId;
        this.game = game;
        this.zIndex = 20;
        this.tileSize = tileSize;
        this.placed = true;
        this.playerColors = playerColors;

        const onHover = (tile: BaseTile) => (this.game.tooltip as Tooltip).setText(tile.getTooltipText());
        const onHoverEnd = () => (this.game.tooltip as Tooltip).setText();

        const background = new Graphics().rect(0, 0, tileSize, tileSize).fill(playerColors.main).stroke({color: colors.areaborder, width: 3, alpha: 0.3, alignment: 1});
        this.addChild(background);

        this.eventMode = "dynamic";
        
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

    getTooltipText = () => ""

    onPlaced() {
        this.placed = true;
        if (this.constContainer) {
            this.constContainer.destroy();
        }
    }

    initHandArea() {
        this.placed = false;
        if (this.cost.length) {
            this.constContainer = new Container();
            this.constContainer.label = "costContainer";
            const doubleRows = this.cost.length > 4;
            const width = doubleRows ? ((this.cost.length - 1) * 10) + 30 : ((this.cost.length - 1) * 20) + 30;
            const height = doubleRows ? 50 : 30;
            this.constContainer.position = {x: this.width / 2 - (width / 2), y: 0 - height / 2};
            this.constContainer.addChild(new Graphics().roundRect(0, 0, width, height, 15).fill(this.playerColors.border).stroke({color: "black", width: 2, alpha: 0.5}));
            for (let i = 0; i < this.cost.length; i++) {
                const resource = this.cost[i];
                loadAsset(`resource_${resource}`).then(texture => {
                    const sprite = new Sprite(texture);
                    sprite.pivot = {x: sprite.width / 2, y: sprite.height / 2};
                    sprite.scale = 0.5;
                    if (doubleRows) {
                        sprite.position = {x: (i * 10) + 15, y: (height / 3) * (1 + ((i + 1) % 2))};
                    } else {
                        sprite.position = {x: (i * 20) + 15, y: height / 2};
                    }
                    (this.constContainer as Container).addChild(sprite);
                })
            }
            this.constContainer.zIndex = 10;
            this.addChild(this.constContainer);
        }
    }

    getValidSquares(tiles: (BaseTile | null)[][]): {x: number, y: number}[] {
        const withinBounds = (coord: {x: number, y: number}, col: any[]) => {
            return (coord.x > 0 && coord.x < tiles.length && coord.y > 0 && coord.y < col.length)
        }

        const valid: {x: number, y: number}[] = [];

        if (this.cost.length === 0) {
            for (let col = 0; col < tiles.length; col++) {
                for (let row = 0; row < tiles[col].length; row++) {
                    if (!tiles[col][row]) {
                        valid.push({x: col, y: row});
                    }
                }
            }
        } else {
            for (let col = 0; col < tiles.length; col++) {
                for (let row = 0; row < tiles[col].length; row++) {
                    const coordsToCheck = [
                        {x: col - 1, y: row},
                        {x: col + 1, y: row},
                        {x: col, y: row - 1},
                        {x: col, y: row + 1}
                    ]
                    let requiredResources = [...this.cost];
                    const adjacentResources: ResourceTile[] = [];
                    for (const coord of coordsToCheck) {
                        if (withinBounds(coord, tiles[col])) {
                            const tile = tiles[coord.x][coord.y];
                            if (tile && tile.type === "resource") {
                                adjacentResources.push(tile as ResourceTile);
                            }
                        }
                    }
                    for (const resTile of adjacentResources) {
                        for (const tileResource of resTile.resources) {
                            const index = requiredResources.findIndex(x => x === tileResource);
                            if (index > -1) {
                                requiredResources.splice(index, 1);
                            }
                        }
                        if (requiredResources.length === 0) {
                            break;
                        }
                    }
                    if (requiredResources.length === 0) {
                        valid.push({x: col, y: row});
                    }
                }
            }
        }

        return valid;
    }
}
