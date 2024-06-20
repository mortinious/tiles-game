import express from "express";
import http from "http";
import {Socket, Server} from "socket.io";
import Events from "../../common/events.json";
import path from "path";
import { Game } from "./game";
import { PlayerData } from "../../common/playerData";
import { GameConfig } from "../../common/gameConfig";

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer);

let tokens: Record<string, string> = {};
let players = {} as {[key: string]: PlayerData};
let games: Game[] = [];
let nextId = 0;

io.on("connection", (socket: Socket) => {
    console.log("connected socket: " + socket.id);

    let playerId = tokens[socket.handshake.auth.token];
    let player = players[playerId];
    socket.data.playerId = playerId;

    if (!player?.name) {
        const token = `${(Math.floor(Math.random()*100000000))}`.padStart(8, "0");
        const newId = `${nextId++}`
        console.log("New player joined, got id: " + newId)
        players[newId] = {id: newId, name: "", disconnected: false, gameId: null, color: "green", score: 0};
        player = players[newId];
        tokens[token] = newId;
        socket.data.playerId = newId;
        socket.emit(Events.global.RequestUsername, {token: token, player});
    } else {
        console.log(`Player ${player.name} reconnected with id: ${player.id}`);
        player.disconnected = false;
        const game = !player.gameId ? null : games.find(x => x.id === player.gameId);
        if (!game || game.state.stage === "ended") {
            socket.join("lobby");
            socket.emit(Events.global.Reconnected, {player: player, games: games.map(g => g.getGameData())});
        } else {
            socket.join(game.id);
            player.ready = false;
            const gameData = games.find(x => x.id === player.gameId)?.getGameData();
            socket.emit(Events.global.Reconnected, {player: player, game: gameData});
            if (gameData?.state.stage === "readycheck") {
                const waiting = gameData.players.filter(x => x.ready !== true).length;
                io.to(gameData.gameId).emit(Events.game.ReadyCheck, {player: {id: player.id, ready: false} as Partial<PlayerData>, waiting});
            }
        }
    }

    socket.on("disconnect", () => {
        console.log(`Player ${player.name} with id ${player.id} disconnected`);
        player.disconnected = true;
        if (!!player.gameId) {
            const game = games.find(x => x.id === player.gameId);
            if (!!game) {
                socket.to(game.id).emit(Events.global.Disconnected, {player});
            }
        }
    });

    socket.on(Events.global.RequestUsername, (data: any, callback: (response: any) => void): void => {
        player.name = data.name;
        socket.join("lobby");
        callback({success: true, games: games.map(g => g.getGameData())});
    })

    socket.on(Events.game.PlayerJoin, (data: any, callback: (response: any) => void): void => {
        const game = games.find(x => x.id === data.gameId);
        if (!game || game.state.stage !== "readycheck") {
            callback({success: false});
            return;
        }
        game.addUser(player);
        socket.join(game.id);
        socket.leave("lobby");
        socket.broadcast.to("lobby").emit(Events.lobby.PlayerJoinGame, {gameId: game.id, player});
        socket.broadcast.to(game.id).emit(Events.game.PlayerJoin, {player});
        callback({success: true, game: game.getGameData()})
    });

    socket.on(Events.game.PlayerLeave, (data: any, callback: (response: any) => void): void => {
        if (!player) {
            callback({success: true, games: games.map(x => x.getGameData())})
            return;
        }
        const game = games.find(x => x.id === player.gameId);
        if (!game) {
            callback({success: true, games: games.map(x => x.getGameData())})
            return;
        }
        game.removeUser(player);
        socket.broadcast.to("lobby").emit(Events.lobby.PlayerLeaveGame, {gameId: game.id, player: player});
        socket.broadcast.to(game.id).emit(Events.game.PlayerLeave, {player: player});
        socket.join("lobby");
        socket.leave(game.id);
        callback({success: true, games: games.map(x => x.getGameData())})
    });

    socket.on(Events.lobby.NewGame, () => {
        const game = new Game(`game-${games.length}`, `Spel ${games.length + 1}`, {boardWidth: 10, boardHeight: 10, rounds: 10}, io);
        games.push(game);
        io.to("lobby").emit(Events.lobby.GameAdded, {game: game.getGameData()});
    });

    socket.on(Events.game.ReadyCheck, (data: any): void => {
        const game = games.find(x => x.id === player.gameId);
        if (!game) return;
        player.ready = data.ready;
        const waiting = game.players.filter(x => x.ready !== true).length;
        io.to(game.id).emit(Events.game.ReadyCheck, {player: {id: player.id, ready: data.ready} as Partial<PlayerData>, waiting});
    })

    socket.on(Events.game.GameStart, () => {
        const game = games.find(x => x.id === player.gameId);
        if (!game) return;
        game.start();
        io.to(game.id).emit(Events.game.GameStart, {game: game.getGameData()});
        io.to("lobby").emit(Events.lobby.GameUpdated, {game: game.getGameData()})
    })

    socket.on(Events.game.PlaceTile, (data: any, callback: (response: any) => void): void => {
        const game = games.find(x => x.id === player.gameId);
        if (!game) return;
        const response = game.placeTile(player, data.index, data.x, data.y);
        if (response != null) {
            socket.broadcast.to(game.id).emit(Events.game.PlaceTile, response);
            const isNewRound = game.nextTurn();
            setTimeout(() => {
                if (isNewRound) {
                    if (game.state.stage === "ended") {
                        io.to(game.id).emit(Events.game.GameEnd, {winners: game.state.winners});
                        io.to("lobby").emit(Events.lobby.GameUpdated, {game: game.getGameData()});
                        const index = games.findIndex(x => x.id === player.gameId);
                        games.splice(index, 1);
                        return;
                    } else {
                        io.to(game.id).fetchSockets().then(sockets => {
                            for (const s of sockets) {
                                const tiles = game.addTilesToPlayer(s.data.playerId, 1);
                                s.emit(Events.game.DrawTile, {tiles})
                            }
                        })
                    }
                }
                io.to(game.id).emit(Events.game.NextTurn, {state: game.state});
            }, 2000);
        }
        callback(response);
    });

    socket.on(Events.game.UpdateConfig, (data: {config: Partial<GameConfig>}) => {
        const game = games.find(x => x.id === player.gameId);
        if (!game || game.state.stage !== "readycheck") return;
        if (game.updateConfig(data.config)) {
            console.log(game.config)
            io.to(game.id).emit(Events.game.UpdateConfig, {config: game.config});
        }
    })

    socket.on(Events.admin.ResetGames, () => {
        games = [];
        for (const player of Object.values(players)) {
            player.gameId = null;
            player.ready = false;
            player.score = 0;
            player.tiles = [];
        }
        io.emit(Events.admin.ResetGames);
    })

    socket.on(Events.admin.ResetAll, () => {
        games = [];
        players = {};
        tokens = {};
        io.emit(Events.admin.ResetAll);
    })

})

app.use(express.static(path.join(__dirname, "../../dist/client")))
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../../dist/client/index.html"));
})
const port = process.env["TILES_GAME_PORT"] || 8080;
httpServer.listen(port, () => {
    console.log(`Server started on port ${port}`)
})