import { GameData } from "common/gameData";
import { BitmapText, Container, Graphics, Rectangle, Text } from "pixi.js";
import { LargeTextStyle, MediumTextStyle, SmallTextStyle } from "../util/textstyles";
import { app } from "..";
import colors from "../../../common/colors.json";
import { Socket } from "socket.io-client";
import events from "../../../common/events.json";
import { PlayerData } from "common/playerData";


export class Lobby extends Container {

    games: GameData[];
    gamesContainer: Container;
    scrollOffset = 0;
    constructor(socket: Socket, games: GameData[], joinGameCallback: (data: any) => void ) {
        super();

        this.games = games;

        const playerId = localStorage.getItem("userId");

        const joinGame = (gameId: string) => {
            socket.emit(events.game.PlayerJoin, {gameId: gameId, playerId: playerId}, (data: any) => {
                if (data.success) {
                    joinGameCallback(data.game);
                    this.destroy();
                }
            })
        }

        const createGame = () => {
            socket.emit(events.lobby.NewGame);
        }

        const text = new Text({text: "Lobby", style: LargeTextStyle});
        text.position = {x: app.screen.width / 2, y : 100};
        text.anchor = 0.5;
        this.addChild(text);

        const createButton = new Container();
        const buttonBack = new Graphics().roundRect(0, 0, 100, 40, 5).fill(colors.tilegreen).stroke({color: "black", width: 4, alignment: 1, alpha: 0.3});
        createButton.eventMode = "static";
        createButton.on("click", () => {
            createGame();
        })
        const buttonText = new Text({text: "Nytt spel", style: SmallTextStyle});
        buttonText.position = {x: 50, y: 20};
        buttonText.anchor = 0.5;
        createButton.addChild(buttonBack);
        createButton.addChild(buttonText);
        createButton.position = {x: app.screen.width / 2 - 50, y : 130};
        this.addChild(createButton);

        this.gamesContainer = new Container();
        this.addChild(this.gamesContainer);

        this.games.forEach(g => this.addGame(g, joinGame));
        this.updateGameOrder();

        this.gamesContainer.y = 300;
        this.gamesContainer.eventMode = "static";
        this.gamesContainer.hitArea = new Rectangle(0,0,app.screen.width, 400);
        this.gamesContainer.on("wheel", (e) => {
            if (e.deltaY < 0 && this.scrollOffset < this.games.length - 3) {
                this.scrollOffset += 0.1;
                this.updateGameOrder();
            } else if (e.deltaY > 0 && this.scrollOffset > 0) {
                this.scrollOffset -= 0.1;
                this.updateGameOrder();
            }
        })

        socket.on(events.lobby.GameAdded, data => {
            this.games.push(data.game);
            this.addGame(data.game, joinGame);
        });

        socket.on(events.lobby.GameUpdated, data => {
            const index = this.games.findIndex(x => x.gameId === data.game.gameId);
            this.games.splice(index, 1, data.game);
        });

        socket.on(events.lobby.GameRemoved, data => {
            const index = this.games.findIndex(x => x.gameId === data.game.gameId);
            this.games.splice(index, 1);
            this.removeGame(index);
        });

        socket.on(events.lobby.PlayerJoinGame, (data) => {
            this.addPlayer(data.gameId, data.player);
        })

        socket.on(events.lobby.PlayerLeaveGame, (data) => {
            this.removePlayer(data.gameId, data.player);
        })

        this.on("destroyed", () => {
            socket.off(events.lobby.GameAdded);
            socket.off(events.lobby.GameUpdated);
            socket.off(events.lobby.GameRemoved);
            socket.off(events.lobby.PlayerJoinGame);
            socket.off(events.lobby.PlayerLeaveGame);
        });
    }

    addGame = (game: GameData, joinCallback: (gameId: string) => void) => {
        const gc = this.createGameContainer(game,  joinCallback);
        this.gamesContainer.addChild(gc);
        this.updateGameOrder();
    }

    removeGame = (index: number) => {
        this.gamesContainer.removeChildAt(index);
        this.updateGameOrder();
    }

    updatePlayer = (gameId: string, player: PlayerData) => {
        const gc = this.gamesContainer.getChildByLabel(gameId);
        if (!gc) return;
        const players = gc.getChildByLabel("players");
        if (!!players) {
            const text = players.getChildByLabel(player.id) as Text;
            text.text = player.name;
        }
    }   

    addPlayer = (gameId: string, player: PlayerData) => {
        const gc = this.gamesContainer.getChildByLabel(gameId);
        if (!gc) return;
        const players = gc.getChildByLabel("players");
        if (!!players) {
            const playerText = new Text({text: player.name, style: SmallTextStyle})
            playerText.label = player.id;
            playerText.position = {x: 10, y: 90 + players.children.length * 25};
            players.addChild(playerText);
        }
    }   

    removePlayer = (gameId: string, player: PlayerData) => {
        const gc = this.gamesContainer.getChildByLabel(gameId);
        if (!gc) return;
        const players = gc.getChildByLabel("players");
        if (!!players) {
            const text = players.getChildByLabel(player.id);
            if (!text) return;
            players.removeChild(text);
        }
    }

    updateGameOrder = () => {
        this.gamesContainer.children.forEach((gc, index) => {
            gc.position = {x: 50 + (index * 250) - (250 * this.scrollOffset), y: 0};
        })
    }

    createGameContainer = (game: GameData, joinCallback: (gameId: string) => void) => {
        const gameContainer = new Container();
        gameContainer.label = game.gameId;
        gameContainer.addChild(new Graphics().roundRect(0, 0, 200, 300, 10).fill(colors.tileyellow).stroke({color: "black", width: 5, alpha: 0.3, alignment: 1}));
        const title = new Text({text: game.name, style: MediumTextStyle})
        title.anchor = 0.5;
        title.position = {x: 100, y: 20};
        gameContainer.addChild(title);

        const statusText = new BitmapText({text: game.state.stage === "started" ? "Påbörjat" : "Ej påbörjat", style: SmallTextStyle})
        statusText.label = "status";
        statusText.anchor = 0.5;
        statusText.position = {x: 100, y: 50};
        gameContainer.addChild(statusText);

        const playerTitle = new Text({text: "Spelare:", style: SmallTextStyle})
        playerTitle.anchor = 0;
        playerTitle.position = {x: 10, y: 70};
        gameContainer.addChild(playerTitle);

        const playersContainer = new Container();
        playersContainer.label = "players"
        gameContainer.addChild(playersContainer);

        game.players.forEach((player, index) => {
            if (index > 6) {
                return;
            }
            let text = (player.disconnected ? "❌ " : "🟢 ") + player.name;
            if (index === 6) {
                text = `+ ${game.players.length - (index + 1)} spelare till...`;
            }
            const playerText = new BitmapText({text: text, style: SmallTextStyle})
            playerText.label = player.id;
            playerText.position = {x: 10, y: 90 + index* 25};
            playersContainer.addChild(playerText);
        });

        if (game.state.stage === "readycheck") {
            const button = new Container();
            const buttonBack = new Graphics().roundRect(0, 0, 80, 30, 5).fill(colors.tilegreen).stroke({color: "black", width: 4, alignment: 1, alpha: 0.3});
            button.eventMode = "static";
            button.on("click", () => {
                joinCallback(game.gameId);
            })
            const buttonText = new Text({text: "Gå med", style: SmallTextStyle});
            buttonText.position = {x: 40, y: 15};
            buttonText.anchor = 0.5;
            button.addChild(buttonBack);
            button.addChild(buttonText);
            button.position = {x: 60, y: 260};
            gameContainer.addChild(button);
        }

        return gameContainer;
    }


}