import { BitmapText, Container, FederatedWheelEvent, Graphics, Rectangle, Text } from "pixi.js";
import { Board } from "./board";
import { HandArea } from "./handarea";
import { Tooltip } from "./tooltip";
import { PlayerArea } from "./playerarea";
import { app } from "../index";
import { GameData } from "../../../common/gameData";
import { Socket } from "socket.io-client";
import events from "../../../common/events.json"
import colors from "../../../common/colors.json"
import { GameState } from "../../../common/gameState";
import { SmallTextStyle } from "../util/textstyles";
import { PlayerData } from "../../../common/playerData";
import { Notice } from "./notice";
import { createTile, getPossessiveName } from "../util/utils";
import { GameConfig } from "../../../common/gameConfig";
import { ReadyCheckPopup } from "./readyCheckPopup";
import { ConfigArea } from "./configArea";
import { TileData } from "../../../common/tileData";

export class Game extends Container {
    tileSize = 80;
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

    getPlayerColors = (playerId: string) => {
        const player = this.data.players.find(x => x.id === playerId);
        if (!player || !Object.keys(colors.playercolors).includes(player.color)) return null;
        return colors.playercolors[player.color as keyof typeof colors.playercolors];
    }

    placeTile = (index: number, x: number, y: number, callback: (success: boolean, data?: any) => void) => {
        if (!this.board ||x < 0 || x >= this.data.config.boardWidth || y < 0 || y >= this.data.config.boardHeight || !this.board.isCoordValid(x, y)) {
            callback(false);
            return;
        }
        this.socket.emit(events.game.PlaceTile, {index, x, y}, (response: any) => {
            const success = response && !!response.tile;
            if (success) {
                this.data.tiles[response.x][response.y] = response.type;
                this.player.score += response.score;
                for (const res of response.resourcesPayed) {
                    if (!this.board) return;
                    this.board.useResource(res.resources, res.x, res.y, res.score);
                    this.playerArea.updatePlayerScore(res.playerId, res.score);
                }
                this.playerArea.updatePlayer({id: this.player.id, score: this.player.score});
            }
            callback(success, response);
        });
    }

    setTitleText = (text: string) => {
        this.titleText.text = text;
    }

    startGame = () => {
        if (this.setupContainer) {
            this.setupContainer.destroy();
        }

        const boardContainer = new Container();
        this.board = new Board(this.data.config.boardWidth, this.data.config.boardHeight, this.tileSize, this.data.tiles, this);
        this.board.position = {x: this.board.width / 2, y: 0};
        boardContainer.addChild(this.board);
        boardContainer.position = {x: app.screen.width / 2, y: 120};
        boardContainer.pivot = {x: this.board.width / 2, y: 0}
        boardContainer.setSize(this.board.width);
        boardContainer.eventMode = "static";
        boardContainer.hitArea = new Rectangle(0, 0, boardContainer.width, boardContainer.height);
        boardContainer.on("wheel", (e: FederatedWheelEvent) => {
            if (!this.board) return;
            e.preventDefault();
            const delta = e.deltaY / 1000;
            if (this.board.scale.x + delta < 0.5) {
                this.board.scale = 0.5;
            } else if (this.board.scale.x + delta > 1) {
                this.board.scale = 1;
            } else {
                this.board.scale.x += delta;
                this.board.scale.y += delta;
            }
        })
        this.addChild(boardContainer);

        this.handArea = new HandArea(this, this.tileSize);
        this.handArea.position = {x: app.screen.width / 2, y: app.screen.height}
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

        this.eventMode = "static";
        this.on("globalpointermove", event => {
            if (!this.handArea?.expanded && event.y > app.screen.height - (this.tileSize * 0.5)) {
                this.handArea?.expand();
            } else if (!!this.handArea?.expanded && event.y < app.screen.height - (this.tileSize * 1.5)) {
                this.handArea?.collapse();
            }
        })
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
            this.playerArea.updatePlayers(data.game);
            const player = this.data.players.find((x: PlayerData) => x.id === this.player.id) as PlayerData
            Object.assign(this.player, player);
            player.tiles?.forEach(this.handArea.addTile);
            const isItYourTurn = this.data.players[this.data.state.turn].id === this.player.id;
            if (isItYourTurn && this.handArea) {
                this.handArea.canPlaceTile = true;
            }
            this.addChild(new Notice(`Spelet har startat!\nRunda ${this.data.state.round}: ${getPossessiveName(this.data.players[0].name, isItYourTurn)} tur.`, 2000))
            this.setTitleText(`Runda ${this.data.state.round}: ${getPossessiveName(this.data.players[0].name, isItYourTurn)} tur.`)
        })

        this.socket.on(events.game.PlayerLeave, data => {
            this.data.players.splice(this.data.players.findIndex(x => x.id === data.player.id), 1);
            this.playerArea.removePlayer(data.player);
            const waiting = this.data.players.filter(x => !x.ready).length;
            readyCheckPopup.updateReadyCheckButton(waiting);
        })

        this.socket.on(events.game.PlaceTile, (data: any) => {
            if (!this.board) return;
            const player = this.data.players.find(x => x.id === data.tile.playerId);
            if (!player) return;
            const tileData = data.tile;
            const tile = createTile(tileData, this.tileSize, this, player.id);
            if (!tile) return;
            this.board.addTile(tile, data.x, data.y, data.score);
            for (const res of data.resourcesPayed) {
                this.board.useResource(res.resources, res.x, res.y, res.score);
                this.playerArea.updatePlayerScore(res.playerId, res.score);
            }
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
                `Runda ${data.state.round} av ${this.data.config.rounds}: ${getPossessiveName(playerTurn.name, isItYourTurn)} tur`
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