import { Container, Text } from "pixi.js";
import { Player } from "./player";
import colors from "../../../common/colors.json";
import { PlayerData } from "common/playerData";
import { LargeTextStyle } from "../util/textstyles";
import { GameData } from "common/gameData";

export class PlayerArea extends Container{
    playerContainer: Container<Player>;
    constructor () {
        super();

        const text = new Text({text: "Spelare", style: LargeTextStyle})
        this.addChild(text);

        this.playerContainer = new Container();
        this.playerContainer.y = 50;
        this.addChild(this.playerContainer);

        this.playerContainer.on("childAdded", e => {
            this._refreshPlayers();
        });

        this.playerContainer.on("childRemoved", e => {
            this._refreshPlayers();
        });
    }

    addPlayer = (data: PlayerData, gameData: GameData) => {
        const existing = this.playerContainer.getChildByLabel(data.id) as Player;
        if (!!existing) {
            existing.updatePlayer(data);
        } else {
            this.playerContainer.addChild(new Player(data, gameData));
        }
    }

    updatePlayer = (data: Partial<PlayerData>) => {
        const existing = this.playerContainer.getChildByLabel(data.id || "") as Player;
        if (!existing) return;
        existing.updatePlayer(data);
    }

    updatePlayerScore = (id: string, scoreToAdd: number) => {
        const existing = this.playerContainer.getChildByLabel(id) as Player;
        if (!existing) return;
        existing.updatePlayer({id, score: existing.data.score + scoreToAdd});
    }

    rerender = () => {
        this.playerContainer.children.forEach((child, index) => {
            child.updatePlayer(child.data);
        })
    }

    removePlayer = (player: PlayerData) => {
        const existing = this.playerContainer.getChildByLabel(player.id);
        if (!!existing) {
            existing.destroy();
        }
    }

    _refreshPlayers = () => {
        this.playerContainer.children.forEach((child, index) => {
            child.x = 0;
            child.y = index * 50;
        })
    }
}