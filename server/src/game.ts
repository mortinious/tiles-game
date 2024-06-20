import { Server } from "socket.io";
import { GameData } from "../../common/gameData";
import { PlayerData } from "../../common/playerData";
import { TileName, TileType } from "../../common/tileType";
import { GameState } from "../../common/gameState";
import { getRandomTile, shuffleArray } from "./utils";
import { GameConfig } from "../../common/gameConfig";
import { BonusData } from "../../common/bonusData";
import { TileData } from "../../common/tileData";
import tilesJson from "../../common/tiles.json";
import resourcesJson from "../../common/resources.json";
import { ResourceType } from "../../common/resource";
import { validateCultureTile, validateResourceTile } from "./tileValidator";

export class Game {
    id: string;
    name: string;
    bonusTiles: BonusData[];
    tiles: TileData[][];
    players: PlayerData[];
    state: GameState;
    config: GameConfig;
    deck: TileData[] = [];
    _io: Server;

    playerColors = [
        "red",
        "blue",
        "yellow",
        "white",
        "slategray",
        "pink",
    ]

    constructor(id: string, name: string, config: GameConfig, io: Server) {
        this.id = id;
        this.name = name;
        this.config = config;
        this.bonusTiles = [];
        this.tiles = Array.apply(null, Array(config.boardWidth)).map(() => Array(config.boardHeight));
        this.players = [];
        this.state = {stage: "readycheck", round: 1, turn: 0, finalRound: false}
        this.initDeck();
        this._io = io;
    }

    start = () => {
        this.state.stage = "started";
        shuffleArray(this.players);
        this.players.forEach((player, index) => player.color = this.playerColors[index]);
        this.players.forEach(player => this.addTilesToPlayer(player.id, 3));
    }

    end = () => {
        if (this.players.length === 0) {
            return;
        }
        const resetPlayerData = (player: PlayerData) => {
            player.gameId = null;
            player.ready = false;
            player.score = 0;
            player.tiles = [];
        }
        this.state.stage = "ended";
        const winningScore = this.players.sort((a, b) => b.score - a.score)[0].score;
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
        if (this.players.length === 0) {
            this.end();
        }
    }

    placeTile = (player: PlayerData, index: number, x: number, y: number) => {
        if (!player.tiles || !!this.tiles[x][y]) return null;

        const tile = player.tiles[index];
        if (!this.checkValid(tile, x, y)) {
            return null;
        }

        let resourcesPayed: {resources: string[], x: number, y: number, playerId: string, score: number}[] = []
        if (tile.cost.length > 0) {
            resourcesPayed = this.payTileCost(tile, x, y, player.id)
        }
            
        // Do scoring calc
        let score = 0;

        for (const resPayed of resourcesPayed) {
            const resPlayer = this.players.find(x => x.id === resPayed.playerId);
            if (resPlayer) {
                resPlayer.score += resPayed.score
            }
        }

        if (tile.type === "culture") {
            score = tile.data.score;
        }
        this.tiles[x][y] = tile;
        player.score += score;

        player.tiles.splice(index, 1)

        return {tile, x, y, score, resourcesPayed};
    }

    checkValid = (tile: TileData, x: number, y: number) => {
        switch (tile.type) {
            case "resource":
                return validateResourceTile(this.tiles, tile, x, y);
            case "culture":
                return validateCultureTile(this.tiles, tile, x, y);
            default:
                return false;
        }
    }

    payTileCost = (tile: TileData, x: number, y: number, playerId: string) => {
        const adjacentTiles = []
        const coordsToCheck = [
            {x: x - 1, y},
            {x, y: y - 1},
            {x: x + 1, y},
            {x, y: y + 1}
        ]
        for (const coord of coordsToCheck) {
            let nextTile = this.tiles[coord.x][coord.y];
            if (nextTile && nextTile.type === "resource") {
                adjacentTiles.push({tile: nextTile, coord});
            }
        }

        adjacentTiles.sort((a, b) => a.tile.playerId === playerId ? 1 : 0);
        const requiredResources = [...tile.cost];
        const usedResources: {resources: string[], x: number, y: number, playerId: string, score: number}[] = [];
        adjacentTiles.forEach(tile => {
            const resToRemove: ResourceType[] = [];
            (tile.tile.data.resources as ResourceType[]).forEach((res: ResourceType) => {
                const reqIndex = requiredResources.indexOf(res);
                if (reqIndex > -1) {
                    resToRemove.push(res);
                    requiredResources.splice(reqIndex, 1);
                }
            })
            const usedResourcesEntry = {resources: [] as ResourceType[], x: tile.coord.x, y: tile.coord.y, playerId: tile.tile.playerId as string, score: 0};
            for (const res of resToRemove) {
                const index = (tile.tile.data.resources as string[]).indexOf(res);
                (tile.tile.data.resources as ResourceType[]).splice(index, 1);
                usedResourcesEntry.resources.push(res);
                if (usedResourcesEntry.playerId !== playerId) {
                    usedResourcesEntry.score += resourcesJson[res].cost;
                }
            }
            if (usedResourcesEntry.resources.length > 0) {
                usedResources.push(usedResourcesEntry);
            }
        })

        return usedResources;
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
            const tile = this.deck.pop();
            newTiles.push({...tile, playerId} as TileData);
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
            state: this.state,
            deckSize: this.deck.length
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

    initDeck = () => {
        this.deck = [];
        for (const tile of Object.values(tilesJson)) {
            for (let i = 0; i < tile.count; i++) {
                this.deck.push(JSON.parse(JSON.stringify(tile.tile)));
            }
        }
        this.deck.sort(_ => Math.random() - 0.5);
    }
}