export class Building {
    public static getDescription(type: BuildingType) {
        switch (type) {
            case BuildingType.Accumulator:
                return `
                <p class='title'>Accumulator</p>
                <p class='text'>Use this to increase your power storage capacity and anticipate for low production periods.<p>
                <p class='text'>Can be built on any non-constructed ground zone.</p>`

            case BuildingType.SolarPanel:
                return `
                <p class='title'>Solar Panel</p>
                <p class='text'>A cheap source of energy, but power output will depend on the time of the day.<p>
                <p class='text'>Can be built on any non-constructed ground zone.</p>`

            case BuildingType.Windmill:
                return `
                <p class='title'>Windmill</p>
                <p class='text'>A good source of energy. Power output will depend of the implantation zone.<p>
                <p class='text'>Can be built on any non-constructed ground zone.</p>`

            case BuildingType.Geothermal:
                return `
                <p class='title'>Geothermal Plant</p>
                <p class='text'>An expensive but powerful source of energy. Power output is stable.<p>
                <p class='text'>Can be built only on a fumarole.</p>`

            case BuildingType.Research:
                return `
                <p class='title'>Research Facility</p>
                <p class='text'>Use this to research energy sources improvements.<p>
                <p class='text'>Can be built on any non-constructed ground zone.</p>`

            default:
                return "<span class='error'>No description for this building</span>";
        }
    }
}

export enum BuildingType {
    Accumulator, SolarPanel, Windmill, Geothermal, Research
}