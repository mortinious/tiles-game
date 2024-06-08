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
import { GameConfig } from "common/gameConfig";
import { ReadyCheckPopup } from "./readyCheckPopup";
import { ConfigArea } from "./configArea";

export class Game extends Container {
    tileSize = 50;
    data: GameData;
    board: Board | null;
    handArea: HandArea | null;
    tooltip: Tooltip | null;
    playerArea: PlayerArea;
    socket: Socket;
    leaveCallback: (games: GameData[]) => void;
    player: PlayerData;
    titleText: BitmapText;
    setupContainer: Container | null;

    constructor (socket: Socket, playerId: string, data: GameData, leaveCallback: (games: GameData[]) => void) {
        super();
        this.socket = socket;
        this.data = data;
        this.tileSize = 50;
        this.board = null;
        this.handArea = null;
        this.tooltip = null;
        this.setupContainer = null;
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

    startGame = () => {
        if (this.setupContainer) {
            this.setupContainer.destroy();
        }

        this.board = new Board(this.data.config.boardWidth, this.data.config.boardHeight, this.tileSize, this.data.tiles, this);
        this.board.position = {x: app.screen.width / 2 - this.board.width / 2, y: 120}
        this.addChild(this.board);

        this.handArea = new HandArea(this, this.tileSize);
        this.handArea.position = {x: this.board.x + this.board.width / 2 - this.handArea.areaWidth / 2, y: this.board.y + this.board.height + this.tileSize / 2}
        const isItYourTurn = this.data.players[this.data.state.turn].id === this.player.id;
        if (isItYourTurn) {
            this.handArea.canPlaceTile = true;
        }
        this.addChild(this.handArea);

        this.player.tiles?.forEach(this.handArea.addTile);

        this.tooltip = new Tooltip();
        this.tooltip.x = app.screen.width - 270;
        this.tooltip.y = 120;
        this.addChild(this.tooltip);
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

        if (this.data.state.stage !== "readycheck") {
            this.startGame();
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

        this.playerArea.x = 20;
        this.playerArea.y = 120;
        this.addChild(this.playerArea);

        let readyCheckPopup: ReadyCheckPopup;
        let configArea: ConfigArea;
        if (this.data.state.stage === "readycheck") {
            this.setupContainer = new Container();
            this.addChild(this.setupContainer);
            readyCheckPopup = new ReadyCheckPopup(this.data, this.player.id, (ready: boolean, waiting: boolean) => {
                if (ready) {
                    this.socket.emit(events.game.ReadyCheck, {ready: true});
                } else {
                    if (!waiting) {
                        this.socket.emit(events.game.GameStart);
                    } else {
                        this.socket.emit(events.game.ReadyCheck, {ready: false});
                    }
                }
            })
            readyCheckPopup.position = {x: app.screen.width / 2 - 150, y: 150};
            this.setupContainer.addChild(readyCheckPopup);

            configArea = new ConfigArea(this.data.config, (config: Partial<GameConfig>) => {
                this.socket.emit(events.game.UpdateConfig, {config: config});
            });
            configArea.position = {x: app.screen.width / 2 - 150, y: 300}
            this.setupContainer.addChild(configArea);
        }

        this.socket.on(events.game.PlayerJoin, data => {
            this.data.players.push(data.player);
            this.playerArea.addPlayer(data.player, this.data);
            const waiting = this.data.players.filter(x => !x.ready).length;
            readyCheckPopup.updateReadyCheckButton(waiting);
        })

        this.socket.on(events.game.PlayerUpdate, data => {
            this.updatePlayer(data.player);
        })

        this.socket.on(events.game.ReadyCheck, data => {
            this.updatePlayer(data.player);
            const waiting = this.data.players.filter(x => !x.ready).length;
            readyCheckPopup.updateReadyCheckButton(waiting);
        })

        this.socket.on(events.game.GameStart, (data: {game: GameData}) => {
            Object.assign(this.data, data.game);
            readyCheckPopup.destroy();
            this.startGame();
            if (!this.handArea || !this.board) return;
            this.playerArea.rerender();
            const player = this.data.players.find((x: PlayerData) => x.id === this.player.id) as PlayerData
            Object.assign(this.player, player);
            player.tiles?.forEach(this.handArea.addTile);
            const isItYourTurn = this.data.players[this.data.state.turn].id === this.player.id;
            if (isItYourTurn && this.handArea) {
                this.handArea.canPlaceTile = true;
            }
            this.addChild(new Notice(`Spelet har startat!\nRunda ${this.data.state.round}: ${getPossessiveName(this.data.players[0].name, isItYourTurn)} tur.`, 2000))
            this.setTitleText(`Runda ${this.data.state.round}: ${getPossessiveName(this.data.players[0].name, isItYourTurn)} tur.`)
            this.board.addBonusTiles(data.game.bonusTiles);
        })

        this.socket.on(events.game.PlayerLeave, data => {
            this.data.players.splice(this.data.players.findIndex(x => x.id === data.player.id), 1);
            this.playerArea.removePlayer(data.player);
            const waiting = this.data.players.filter(x => !x.ready).length;
            readyCheckPopup.updateReadyCheckButton(waiting);
        })

        this.socket.on(events.game.PlaceTile, data => {
            if (!this.board) return;
            this.board.addTile(new Tile({type: data.type}, this.tileSize, this), data.x, data.y, data.score);
            this.playerArea.updatePlayerScore(data.playerId, data.score);
        });

        this.socket.on(events.game.DrawTile, data => {
            if (!this.handArea) return;
            for (const tileData of data.tiles) {
                this.handArea.addTile(tileData);
                this.handArea._refreshHand();
            }
        });

        this.socket.on(events.game.NextTurn, (data: {state: GameState}) => {
            const playerTurn = this.data.players[data.state.turn];
            console.log(`Round ${data.state.round}: ${playerTurn.name}'s turn`);
            Object.assign(this.data.state, data.state);
            const isItYourTurn = this.data.players[this.data.state.turn].id === this.player.id;
            if (isItYourTurn && this.handArea) {
                this.handArea.canPlaceTile = true;
            }
            const text = data.state.finalRound ? 
                `Sista rundan: ${getPossessiveName(playerTurn.name, isItYourTurn)} tur` : 
                `Runda ${data.state.round}: ${getPossessiveName(playerTurn.name, isItYourTurn)} tur`
            this.addChild(new Notice(text, 2000))
            this.setTitleText(text)
        })

        this.socket.on(events.game.GameEnd, (data: {winners: PlayerData[]}): void => {
            this.data.state.stage = "ended";
            const winnersNames = data.winners.map(x => x.name).join(", ");
            const text = `${winnersNames} vann spelet!`;
            this.addChild(new Notice(`Spelet avslutat!\n${text}`, 4000))
            this.setTitleText(text);
        })

        this.socket.on(events.game.UpdateConfig, (data: {config: GameConfig}) => {
            Object.assign(this.data.config, data.config);
            if (this.setupContainer) {
                (this.setupContainer.getChildAt(1) as ConfigArea).update();
            }
        });
    }
}