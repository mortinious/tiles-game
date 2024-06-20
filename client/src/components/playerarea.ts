import { Container, Text } from "pixi.js";
import { Player } from "./player";
import colors from "../../../common/colors.json";
import { LargeTextStyle } from "../util/textstyles";
import { PlayerData } from "../../../common/playerData";
import { GameData } from "../../../common/gameData";

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
            this._refreshPlayersPostion();
        });

        this.playerContainer.on("childRemoved", e => {
            this._refreshPlayersPostion();
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

    updatePlayers = (gameData?: GameData) => {
        if (gameData) {
            this.playerContainer.children.sort((a, b) => gameData.players.findIndex(x => x.id === a.data.id) - gameData.players.findIndex(x => x.id === b.data.id));
        }
        this.playerContainer.children.forEach(child => {
            const data = gameData?.players.find(x => x.id === child.data.id);
            if (!data) return;
            child.updatePlayer(data);
        })
        this._refreshPlayersPostion();
    }

    removePlayer = (player: PlayerData) => {
        const existing = this.playerContainer.getChildByLabel(player.id);
        if (!!existing) {
            existing.destroy();
        }
    }

    _refreshPlayersPostion = () => {
        this.playerContainer.children.forEach((child, index) => {
            child.x = 0;
            child.y = index * 90;
        })
    }
}