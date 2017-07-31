import { MapCell } from './worldmap'

export class Building {

    static readonly ACCUMULATOR_CAPACITY = 100
    static readonly ACCUMULATOR_COST = 75
    static readonly SOLARPANEL_PRODUCTION_MAX = 10
    static readonly SOLARPANEL_COST = 10
    static readonly WINDMILL_PRODUCTION_MAX = 100
    static readonly WINDMILL_COST = 150
    static readonly GEOTHERMAL_PRODUCTION = 1000
    static readonly GEOTHERMAL_COST = 1000
    static readonly RESEARCH_BASE_CONSUMPTION = 100
    static readonly RESEARCH_COST = 500

    constructor(private type: BuildingType, private location: MapCell) { }

    /** Return the buiding actual power production, in kW */
    public getProduction(currentGameTime: number): number {
        switch (this.type) {
            case BuildingType.Accumulator: return 0
            case BuildingType.SolarPanel:
                if (currentGameTime < 6 || currentGameTime > 22) {
                    // It's night
                    return 0;
                } else {
                    // A basic triangle function
                    let efficiency = (currentGameTime < 14) ?
                        (currentGameTime - 6) / (14 - 6) :
                        (22 - currentGameTime) / (22 - 14)
                    return efficiency * Building.SOLARPANEL_PRODUCTION_MAX
                }
            case BuildingType.Windmill:
                return this.location.windEfficiency * Building.WINDMILL_PRODUCTION_MAX
            case BuildingType.Geothermal:
                return Building.GEOTHERMAL_PRODUCTION
            case BuildingType.Research:
                return 0
            default:
                throw new Error('Missing switch case')
        }
    }

    /** Return the building actual power consumption, in kW */
    public getConsumption(): number {
        switch (this.type) {
            case BuildingType.Research: return Building.RESEARCH_BASE_CONSUMPTION
            default: return 0
        }
    }

    /** Return the building energy storage, in kWh */
    public getStorageCapacity(): number {
        switch (this.type) {
            case BuildingType.Accumulator: return Building.ACCUMULATOR_CAPACITY
            default: return 0
        }
    }

    /** Return a building cost in credits */
    public static getCost(type: BuildingType) {
        switch (type) {
            case BuildingType.Accumulator: return Building.ACCUMULATOR_COST
            case BuildingType.SolarPanel: return Building.SOLARPANEL_COST
            case BuildingType.Windmill: return Building.WINDMILL_COST
            case BuildingType.Geothermal: return Building.GEOTHERMAL_COST
            case BuildingType.Research: return Building.RESEARCH_COST
            default:
                throw new Error('Missing switch case')
        }
    }

    public static getDescription(type: BuildingType) {
        switch (type) {
            case BuildingType.Accumulator:
                return `
                <p class='title'>Accumulator</p>
                <p class='text'>Use this to increase your power storage capacity and anticipate for low production periods.<p>
                <p class='text'>Can be built on any non-constructed ground zone.</p>
                <br/>
                <p class='text'>Storage capacity: ${Building.ACCUMULATOR_CAPACITY} kWh</p>
                <p class='text'>Cost: ${Building.ACCUMULATOR_COST} credits</p>`

            case BuildingType.SolarPanel:
                return `
                <p class='title'>Solar Panel</p>
                <p class='text'>A cheap source of energy, but power output will depend on the time of the day.<p>
                <p class='text'>Can be built on any non-constructed ground zone.</p>
                <br/>
                <p class='text'>Max production: ${Building.SOLARPANEL_PRODUCTION_MAX} kW</p>
                <p class='text'>Cost: ${Building.SOLARPANEL_COST} credits</p>`

            case BuildingType.Windmill:
                return `
                <p class='title'>Windmill</p>
                <p class='text'>A good source of energy. Power output will depend of the implantation zone.<p>
                <p class='text'>Can be built on any non-constructed ground zone.</p>
                <br/>
                <p class='text'>Max production: ${Building.WINDMILL_PRODUCTION_MAX} kW</p>
                <p class='text'>Cost: ${Building.WINDMILL_COST} credits</p>`

            case BuildingType.Geothermal:
                return `
                <p class='title'>Geothermal Plant</p>
                <p class='text'>An expensive but powerful source of energy. Power output is stable.<p>
                <p class='text'>Can be built only on a fumarole.</p>
                <br/>
                <p class='text'>Production: ${Building.GEOTHERMAL_PRODUCTION} kW</p>
                <p class='text'>Cost: ${Building.GEOTHERMAL_COST} credits</p>`

            case BuildingType.Research:
                return `
                <p class='title'>Research Facility</p>
                <p class='text'>Use this to research energy sources improvements.<p>
                <p class='text'>Can be built on any non-constructed ground zone.</p>
                <br/>
                <p class='text'>Base consumption: ${Building.RESEARCH_BASE_CONSUMPTION} kW</p>
                <p class='text'>Cost: ${Building.GEOTHERMAL_COST} credits</p>`

            default:
                return "<span class='error'>No description for this building</span>";
        }
    }
}

export enum BuildingType {
    Accumulator, SolarPanel, Windmill, Geothermal, Research
}