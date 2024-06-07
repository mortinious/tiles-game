import { Application, BitmapText, Container, Graphics, Text } from "pixi.js";
import { Board } from "./board";
import { HandArea } from "./handarea";
import { Tooltip } from "./tooltip";
import { PlayerArea } from "./playerarea";
import { app } from "../index";
import { GameData } from "common/gameData";
import { Socket } from "socket.io-client";
import events from "../../../common/events.json"
import colors from "../../../common/colors.json"
import { GameState } from "../../../common/gameState";
import { LargeTextStyle, SmallTextStyle } from "../util/textstyles";
import { PlayerData } from "common/playerData";
import { Tile } from "./tile";
import { Notice } from "./notice";
import { getPossessiveName } from "../util/utils";

export class Game extends Container {
    tileSize = 50;
    data: GameData;
    board;
    handArea;
    tooltip;
    playerArea;
    socket;
    leaveCallback;
    player;
    titleText: BitmapText;

    constructor (socket: Socket, playerId: string, data: GameData, leaveCallback: (games: GameData[]) => void) {
        super();
        this.socket = socket;
        this.data = data;
        this.tileSize = 50;
        this.board = new Board(this.data.config.boardWidth, this.data.config.boardHeight, this.tileSize, this.data.tiles, this);
        this.handArea = new HandArea(this, this.tileSize);
        this.tooltip = new Tooltip();
        this.playerArea = new PlayerArea();
        this.leaveCallback = leaveCallback;
        this.player = this.data.players.find((x: PlayerData) => x.id === playerId) as PlayerData;
        this.titleText = new BitmapText({style: {fill: "black", fontWeight: "600", fontSize: 50}});

        data.players.forEach(player => {
            this.playerArea.addPlayer(player, this.data);
        })

        this.init();

        this.on("destroyed", () => {
            socket.off(events.game.PlayerJoin);
            socket.off(events.game.PlayerUpdate);
            socket.off(events.game.PlayerLeave);
        });
    }

    getCurrentPlayerTurn = () => {
        return this.data.players[this.data.state.turn];
    }

    updateReadyCheckButton = (readyCheckPopup: Container) => {
        const title = (readyCheckPopup.getChildByLabel("title") as Text);
        const button = readyCheckPopup.getChildByLabel("button");
        const waiting = this.data.players.some(x => !x.ready);
        if (!title || !button) return;
        if (!this.player.ready) {
            title.text = "Är du redo?";
            (button.children[0] as Text).text = "Jag är redo!";
            button.alpha = 1;
        } else if (!waiting) {
            title.text = "Alla är redo!";
            (button.children[0] as Text).text = "Starta spelet";
            button.alpha = 1;
        } else {
            title.text = "Inväntar spelare";
            (button.children[0] as Text).text = "Avbryt";
        }
    }

    updatePlayer = (player: Partial<PlayerData>) => {
        const playerData = this.data.players.find(x => x.id === player.id);
        if (!playerData) return;
        Object.assign(playerData, player);
        this.playerArea.updatePlayer(player);
    }

    placeTile = (index: number, x: number, y: number, callback: (data: any) => void) => {
        if (x < 0 || x >= this.data.config.boardWidth || y < 0 || y >= this.data.config.boardHeight) {
            callback(null);
            return;
        }
        this.socket.emit(events.game.PlaceTile, {index, x, y}, (response: any) => {
            if (!!response.type) {
                this.data.tiles[response.x][response.y] = response.type;
                this.player.score += response.score;
                this.playerArea.updatePlayer({id: this.player.id, score: this.player.score});
            }
            callback(response);
        });
    }

    setTitleText = (text: string) => {
        this.titleText.text = text;
    }

    init = () => {

        const leaveGame = () => {
            this.socket.emit(events.game.PlayerLeave, {playerId: this.player.id}, (response: any) => {
                if (response.success) {
                    this.leaveCallback(response.games);
                }
            })
        }

        this.titleText.anchor = 0.5;
        this.titleText.x = app.screen.width / 2;
        this.titleText.y = 70;
        if (this.data.state.stage === "started") {
            const playerTurn = this.data.players[this.data.state.turn];
            this.setTitleText(`Runda ${this.data.state.round}: ${getPossessiveName(playerTurn.name)} tur`)
        }
        this.addChild(this.titleText);

        const boardContainer = this.board;
        boardContainer.x = app.screen.width / 2 - boardContainer.width / 2;
        boardContainer.y = 120;
        this.addChild(boardContainer);

        const handAreaContainer = this.handArea;
        handAreaContainer.x = boardContainer.x + boardContainer.width / 2 - handAreaContainer.areaWidth / 2;
        handAreaContainer.y = boardContainer.y + boardContainer.height + this.tileSize / 2;
        this.addChild(handAreaContainer);

        if (this.data.state.stage !== "readycheck") {
            this.player.tiles?.forEach(this.handArea.addTile);
        }

        const leaveButton = new Container();
        const buttonBack = new Graphics().roundRect(0, 0, 120, 40, 5).fill(colors.tilegreen).stroke({color: "black", width: 4, alignment: 1, alpha: 0.3});
        leaveButton.eventMode = "static";
        leaveButton.on("click", () => {
            leaveGame();
        })
        const buttonText = new Text({text: "Lämna spel", style: SmallTextStyle});
        buttonText.position = {x: 60, y: 20};
        buttonText.anchor = 0.5;
        leaveButton.addChild(buttonBack);
        leaveButton.addChild(buttonText);
        leaveButton.position = {x: 10, y : 10};
        this.addChild(leaveButton);

        this.tooltip.x = app.screen.width - 270;
        this.tooltip.y = 120;
        this.addChild(this.tooltip);

        this.playerArea.x = 20;
        this.playerArea.y = 120;
        this.addChild(this.playerArea);

        let readyCheckPopup: Container;
        if (this.data.state.stage === "readycheck") {
            readyCheckPopup = new Container();
            readyCheckPopup.addChild(new Graphics().roundRect(0, 0, 300, 120, 10).fill(colors.tilewhite).stroke({color: colors.areaborder, width: 5}))
            const title = new Text({text: "Är du redo?", style: LargeTextStyle});
            title.anchor = 0.5;
            title.position = {x: 150, y: 40};
            title.label = "title";
            readyCheckPopup.addChild(title);
            readyCheckPopup.position = {x: app.screen.width / 2 - 150, y: 200};

            const button = new Graphics().roundRect(90, 70, 120, 40, 5).fill(colors.tileyellow).stroke({color: colors.areaborder, width: 5});
            button.eventMode = "static";
            button.label = "button";
            const buttonText = new Text({text: "Jag är redo!", style: SmallTextStyle});
            buttonText.anchor = 0.5;
            buttonText.position = {x: 150, y: 90};
            button.addChild(buttonText);
            button.eventMode = "static";

            button.on("pointerdown", () => {
                const waiting = this.data.players.some(x => !x.ready);
                if (!this.player.ready) {
                    this.socket.emit(events.game.ReadyCheck, {ready: true});
                } else {
                    if (!waiting) {
                        this.socket.emit(events.game.GameStart);
                    } else {
                        this.socket.emit(events.game.ReadyCheck, {ready: false});
                    }
                }
            });

            readyCheckPopup.addChild(button);

            this.addChild(readyCheckPopup);

            this.updateReadyCheckButton(readyCheckPopup);
        }

        this.socket.on(events.game.PlayerJoin, data => {
            this.data.players.push(data.player);
            this.playerArea.addPlayer(data.player, this.data);
            this.updateReadyCheckButton(readyCheckPopup);
        })

        this.socket.on(events.game.PlayerUpdate, data => {
            this.updatePlayer(data.player);
        })

        this.socket.on(events.game.ReadyCheck, data => {
            this.updatePlayer(data.player);
            this.updateReadyCheckButton(readyCheckPopup);
        })

        this.socket.on(events.game.GameStart, (data: {game: GameData}) => {
            Object.assign(this.data, data.game);
            readyCheckPopup.destroy();
            this.playerArea.rerender();
            const player = this.data.players.find((x: PlayerData) => x.id === this.player.id) as PlayerData
            Object.assign(this.player, player);
            player.tiles?.forEach(this.handArea.addTile);
            this.addChild(new Notice(`Spelet har startat!\nRunda ${this.data.state.round}: ${getPossessiveName(this.data.players[0].name)} tur.`, 2000))
            this.setTitleText(`Runda ${this.data.state.round}: ${getPossessiveName(this.data.players[0].name)} tur.`)
            this.board.addBonusTiles(data.game.bonusTiles);
        })

        this.socket.on(events.game.PlayerLeave, data => {
            this.data.players.splice(this.data.players.findIndex(x => x.id === data.player.id), 1);
            this.playerArea.removePlayer(data.player);
            this.updateReadyCheckButton(readyCheckPopup);
        })

        this.socket.on(events.game.PlaceTile, data => {
            this.board.addTile(new Tile({type: data.type}, this.tileSize, this), data.x, data.y);
            this.playerArea.updatePlayerScore(data.playerId, data.score)
        });

        this.socket.on(events.game.DrawTile, data => {
            for (const tileData of data.tiles) {
                this.handArea.addTile(tileData);
                this.handArea._refreshHand();
            }
        });

        this.socket.on(events.game.NextTurn, (data: {state: GameState}) => {
            const playerTurn = this.data.players[data.state.turn];
            console.log(`Round ${data.state.round}: ${playerTurn.name}'s turn`);
            Object.assign(this.data.state, data.state);
            this.addChild(new Notice(`Runda ${data.state.round}: ${getPossessiveName(playerTurn.name)} tur`, 2000))
            this.setTitleText(`Runda ${data.state.round}: ${getPossessiveName(playerTurn.name)} tur`)
        })
    }
}