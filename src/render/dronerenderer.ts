import * as THREE from 'three'
import { Drone } from '../model/drone'
import { WorldMap } from '../model/worldmap'
import { MapRenderer } from './maprenderer'

export class DroneRenderer {

    /** The drone is at 20 meters from the ground */
    static readonly height = 20

    /** The drone has a radius of 2 meters (they're big drones Brent) */
    static readonly radius = 2

    /** World coordinates; floats */
    private xw: number
    private yw: number
    private zw: number

    /** To be added to the scene */
    public root: THREE.Object3D

    public mesh: THREE.Mesh
    private lineGeom: THREE.Geometry
    private lineMaterial: THREE.LineDashedMaterial

    public constructor(public drone: Drone, private map: WorldMap) {
        // The drone geometry
        let geom = new THREE.CylinderGeometry(DroneRenderer.radius, DroneRenderer.radius, DroneRenderer.radius / 4, 32)
        let material = new THREE.MeshNormalMaterial()
        this.mesh = new THREE.Mesh(geom, material)
        this.mesh.rotateX(Math.PI / 2)

        // Compute initial drone mesh position (required to set up line material)
        this.updateDroneMeshPosition()

        // A line between the drone and the ground
        let mp = this.mesh.position
        this.lineGeom = new THREE.Geometry();
        this.lineGeom.vertices.push(
            new THREE.Vector3(mp.x, mp.y, mp.z),
            new THREE.Vector3(mp.x, mp.y, 0))
        this.lineGeom.computeLineDistances()

        this.lineMaterial = new THREE.LineDashedMaterial({
            color: 0x7fffff, dashSize: 1, gapSize: 2, scale: 1
        })
        var line = new THREE.Line(this.lineGeom, this.lineMaterial)

        // A parent, invisible Object3D
        this.root = new THREE.Object3D()
        this.root.add(this.mesh)
        this.root.add(line)

    }

    private updateDroneMeshPosition() {
        // Invert y axis to comply with world coordinates
        this.xw = (this.drone.x - this.map.width / 2 + 0.5) * MapRenderer.side
        this.yw = - (this.drone.y - this.map.height / 2 + 0.5) * MapRenderer.side
        this.zw = DroneRenderer.height

        this.mesh.position.set(this.xw, this.yw, this.zw)
    }

    public updatePosition() {
        this.updateDroneMeshPosition()

        this.lineGeom.vertices[0].set(this.xw, this.yw, this.zw)
        this.lineGeom.vertices[1].set(this.xw, this.yw, 0)
        this.lineGeom.verticesNeedUpdate = true

        this.lineGeom.computeLineDistances()
        this.lineGeom.lineDistancesNeedUpdate = true
    }
}