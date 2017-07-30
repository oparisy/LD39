import * as THREE from 'three'
import { WorldMap, MapCell, CellType } from '../model/worldmap'

export class MapRenderer {

    /** 10 meters wide ground patches */
    public static readonly side = 10

    private geom: THREE.Geometry
    public mesh: THREE.Mesh

    constructor(private map: WorldMap) {
        // Build a plane with the proper number of subdivisions
        this.geom = new THREE.PlaneGeometry(map.width * MapRenderer.side, map.height * MapRenderer.side, map.width, map.height)

        // Model -> view reference (for easier updates)
        for (var i = 0; i < this.geom.faces.length; i++) {
            let face = this.geom.faces[i]

            // Two triangles per patch...
            let idx = Math.floor(i / 2)

            // Same convention as in WorldMap (idx = x + y * width)
            let y = Math.floor(idx / this.map.width)
            let x = idx % this.map.width
            let cell: MapCell = this.map.getCell(x, y)
            face['modelCell'] = cell
        }

        // Color faces
        // TODO Consider switching to BufferGeometry and using https://stackoverflow.com/a/44836160/38096
        let material = new THREE.MeshBasicMaterial({ color: 0x7f7f7f, vertexColors: THREE.FaceColors })
        this.updateFacesColor()

        // Build final mesh
        this.mesh = new THREE.Mesh(this.geom, material)
    }

    public updateFacesColor() {
        for (var i = 0; i < this.geom.faces.length; i++) {
            let face = this.geom.faces[i]
            let cell = face['modelCell']
            face.color.setHex(this.getCellColor(cell));
        }

        // To be on the safe side
        this.geom.colorsNeedUpdate = true
    }

    private getCellColor(cell: MapCell): number {
        if (!cell.explored) {
            return 0xa6a6a6 // Fog color
        }

        switch (cell.type) {
            case CellType.Ground: return 0x00cc00
            case CellType.Fumarole: return 0xff3300
            case CellType.Rock: return 0x999966
            case CellType.Tree: return 0x009933
            case CellType.Water: return 0x3399ff
            default: return 0xff00ff // Unknown => Blender fuchsia
        }
    }
}
