export class WorldMap {
    private grid: MapCell[]
    private numCells: number;

    constructor(public width: number, public height: number, fumaroles, rocks, treeSeed, waterSeed) {
        this.numCells = this.width * this.height
        this.setupGrid();
        this.generateResources(fumaroles, rocks, treeSeed, waterSeed);
    }

    /** Textual dump of the map. Debugging purpose */
    public dump() {
        for (let j = 0; j < this.height; j++) {
            let acc: string = ''
            for (let i = 0; i < this.width; i++) {
                acc += this.getCell(i, j).textType();
            }
            console.log(acc)
        }
    }

    /** Build a default grid of ground elements */
    private setupGrid() {
        this.grid = new Array(this.numCells)
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                this.grid[x + y * this.width] = new MapCell(CellType.Ground, x, y)
            }
        }
    }

    /** Randomly add the specified number of resources on the map */
    private generateResources(fumaroles, rocks, treeSeed, waterSeed) {
        for (let i = 0; i < fumaroles; i++) {
            this.getRandomCell().type = CellType.Fumarole
        }
        for (let i = 0; i < rocks; i++) {
            this.getRandomCell().type = CellType.Rock
        }
        for (let i = 0; i < treeSeed; i++) {
            this.getRandomCell().type = CellType.Tree
        }
        for (let i = 0; i < waterSeed; i++) {
            this.getRandomCell().type = CellType.Water
        }

        // TODO Automata-like algorithm to "grow" initial seeds of water and trees?
    }

    public getCell(x, y): MapCell {
        return this.grid[x + y * this.width]
    }

    private getRandomCell(): MapCell {
        return this.grid[Math.floor(Math.random() * this.numCells)]
    }
}

export class MapCell {
    public type: CellType
    public explored: boolean = false

    constructor(initialType: CellType, public x, public y) {
        this.type = initialType
    }

    /** Return the cell type as an ASCII character. Debugging purpose */
    public textType(): string {
        switch (this.type) {
            case CellType.Ground: return '.';
            case CellType.Fumarole: return 'F';
            case CellType.Rock: return 'R';
            case CellType.Tree: return 'T';
            case CellType.Water: return 'W';
            default: return '?'
        }
    }
}

export enum CellType {
    Ground, Tree, Rock, Water, Fumarole
}