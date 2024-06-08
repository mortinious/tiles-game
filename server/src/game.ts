import { Server } from "socket.io";
import { GameData } from "../../common/gameData";
import { PlayerData } from "../../common/playerData";
import { TileType } from "../../common/tileType";
import { GameState } from "../../common/gameState";
import { getRandomTileType, shuffleArray } from "./utils";
import { GameConfig } from "../../common/gameConfig";
import { BonusData } from "../../common/bonusData";

export class Game {
    id: string;
    name: string;
    bonusTiles: BonusData[];
    tiles: TileType[][];
    players: PlayerData[];
    state: GameState;
    config: GameConfig;
    _io: Server;

    constructor(id: string, name: string, config: GameConfig, io: Server) {
        this.id = id;
        this.name = name;
        this.config = config;
        this.bonusTiles = [];
        this.tiles = Array.apply(null, Array(config.boardWidth)).map(() => Array(config.boardHeight));
        this.players = [];
        this.state = {stage: "readycheck", round: 1, turn: 0, finalRound: false}
        this._io = io;
    }

    start = () => {
        let modifiersPlaced = 0;
        let tries = 0;
        do {
            const x = Math.floor(Math.random() * this.config.boardWidth);
            const y = Math.floor(Math.random() * this.config.boardHeight);
            if (x !== 0 && y !== 0 && x !== this.config.boardWidth - 1 && y !== this.config.boardHeight - 1 && !this.bonusTiles.find(bonus => bonus.x === x && bonus.y === y)) {
                const val = Math.round(Math.random()) + 1;
                this.bonusTiles.push({text: `+${val}`, value: val, x: x, y: y});
                tries = 0;
                modifiersPlaced++;
                console.log(`Placed modifier +${val} on ${x}:${y}`);
            }
            tries++;
        } while (modifiersPlaced < this.players.length + 1 && tries < 10);
        this.state.stage = "started";
        shuffleArray(this.players);
        this.players.forEach(player => this.addTilesToPlayer(player.id, 5));
    }

    end = () => {
        const resetPlayerData = (player: PlayerData) => {
            player.gameId = null;
            player.ready = false;
            player.score = 0;
            player.tiles = [];
        }
        this.state.stage = "ended";
        const winningScore = this.players.sort((a, b) => a.score - b.score)[0].score;
        const winners = this.players.filter(p => p.score === winningScore).map(p => {
            return {
                name: p.name,
                score: p.score
            }
        });
        this.state.winners = winners;
        this.players.forEach(resetPlayerData);
    }

    addUser = (player: PlayerData) => {
        this.players.push(player);
        player.gameId = this.id;
    }

    removeUser = (player: PlayerData) => {
        if (this.state.stage !== "ended") {
            this.players.splice(this.players.findIndex(x => x.id === player.id), 1);
        }
        player.gameId = null;
    }

    placeTile = (player: PlayerData, index: number, x: number, y: number) => {
        if (!player.tiles || !!this.tiles[x][y]) return null;
        const tile = player.tiles.splice(index, 1)[0];
        // Do scoring calc
        let score = 0;
        let nextScore = 1;
        const bonus = this.bonusTiles.find(bonus => bonus.x === x && bonus.y === y);
        const scoring = tile.scoring || [];
        if (x > 0 && scoring[0].type === this.tiles[x - 1][y]) {
            score += nextScore++;
        }
        if (y > 0 && scoring[1].type === this.tiles[x][y - 1]) {
            score += nextScore++;
        }
        if (x < this.config.boardWidth - 1 && scoring[2].type === this.tiles[x + 1][y]) {
            score += nextScore++;
        }
        if (y < this.config.boardHeight - 1 && scoring[3].type === this.tiles[x][y + 1]) {
            score += nextScore++;
        }
        if (bonus) {
            score += bonus.value;
        }
        this.tiles[x][y] = tile.type;
        player.score += score;
        return {playerId: player.id, type: tile.type, x, y, score};
    }

    nextTurn = () => {
        let isNewRound = false;
        this.state.turn++;
        if (this.state.turn >= this.players.length) {
            if (this.state.finalRound) {
                this.end();
                return true;
            }
            this.state.turn = 0;
            this.state.round++;
            this.state.finalRound = this.state.round === this.config.rounds;
            
            isNewRound = true;
        }
        console.log(`Next turn! Round ${this.state.round} Turn ${this.state.turn}`)
        return isNewRound;
    }

    addTilesToPlayer = (playerId: string, number: number) => {
        const player = this.players.find(x => x.id === playerId);
        if (!player) return [];
        if (player.tiles === undefined) {
            player.tiles = [];
        }
        const newTiles = [];
        for (let i = 0; i < number; i++) {
            newTiles.push({type: getRandomTileType(), scoring: [
                {type: getRandomTileType(), negated: false},
                {type: getRandomTileType(), negated: false},
                {type: getRandomTileType(), negated: false},
                {type: getRandomTileType(), negated: false}
            ]});
        }
        player.tiles.push(...newTiles);
        return newTiles;
    }

    getGameData = (): GameData => {
        return {
            gameId: this.id,
            name: this.name,
            config: this.config,
            bonusTiles: this.bonusTiles,
            tiles: this.tiles,
            players: this.players,
            state: this.state
        }
    }

    updateConfig = (config: Partial<GameConfig>): GameConfig | undefined => {
        let updated = false;
        if ((config.boardHeight !== undefined && config.boardHeight !== this.config.boardHeight) || (config.boardWidth !== undefined && config.boardWidth !== this.config.boardWidth)) {
            this.config.boardHeight = config.boardHeight || this.config.boardHeight;
            this.config.boardWidth = config.boardWidth || this.config.boardWidth;
            this.tiles = Array.apply(null, Array(this.config.boardWidth)).map(() => Array(this.config.boardHeight));
            updated = true;
        }
        if (config.rounds !== undefined && config.rounds !== this.config.rounds) {
            this.config.rounds = config.rounds;
            updated = true;
        }
        if (updated) {
            return this.config;
        }
    }
}