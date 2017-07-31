export class Research {

    static readonly ACCUMULATOR_COST = 750
    static readonly SOLARPANEL_COST = 1000
    static readonly WINDMILL_COST = 1500

    public static getShortDescription(type: ResearchType): string {
        switch (type) {
            case ResearchType.Accumulator: return 'Improve Accumulators'
            case ResearchType.SolarPanel: return 'Improve Solar Panels'
            case ResearchType.WindTurbine: return 'Improve Wind Turbines'
            default:
                throw new Error('Missing switch case')
        }
    }

    /** Return a research cost in credits */
    public static getCost(type: ResearchType) {
        switch (type) {
            case ResearchType.Accumulator: return Research.ACCUMULATOR_COST
            case ResearchType.SolarPanel: return Research.SOLARPANEL_COST
            case ResearchType.WindTurbine: return Research.WINDMILL_COST
            default:
                throw new Error('Missing switch case')
        }
    }

    public static getDescription(type: ResearchType) {
        switch (type) {
            case ResearchType.Accumulator:
                return `
                <p class='title'>Improve Accumulators</p>
                <p class='text'>Research this to double the capacity of your accumulators.<p>
                <p class='text'>Can be searched once.</p>
                <br/>
                <p class='text'>Cost: ${Research.ACCUMULATOR_COST} credits</p>`

            case ResearchType.SolarPanel:
                return `
                <p class='title'>Improve Solar Panels</p>
                <p class='text'>Research this to double the production of your solar panels.<p>
                <p class='text'>Can be searched once.</p>
                <br/>
                <p class='text'>Cost: ${Research.SOLARPANEL_COST} credits</p>`

            case ResearchType.WindTurbine:
                return `
                <p class='title'>Improve Wind Turbines</p>
                <p class='text'>Research this to double the production of your wind turbines.<p>
                <p class='text'>Can be searched once.</p>
                <br/>
                <p class='text'>Cost: ${Research.WINDMILL_COST} credits</p>`

            default:
                throw new Error('Missing switch case')
        }
    }
}

export enum ResearchType {
    Accumulator, SolarPanel, WindTurbine
}
