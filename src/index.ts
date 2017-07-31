// add styles
import './style.css'
// three.js
import * as THREE from 'three'
import * as TWEEN from 'tween.js'

import { WorldMap, MapCell, CellType } from './model/worldmap'
import { Drone } from './model/drone'
import { Building, BuildingType } from './model/building'

import { MapRenderer } from './render/maprenderer'
import { DroneRenderer } from './render/dronerenderer'

// TODO Clean this up; no global code

// Build the world map
const width = 16
const height = 16
let map = new WorldMap(32, 32, 5, 16, 8, 3)

// Set up the drone
let drone = new Drone(Math.floor(map.width / 2), Math.floor(map.height / 2))

// create the scene
let scene = new THREE.Scene()

// Get existing DOM canvas
let canvas = <HTMLCanvasElement>document.getElementById('map')

let renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true })
renderer.shadowMap.enabled = true

// set size
const canvasWidth = window.innerWidth - 300
const canvasHeight = window.innerHeight
renderer.setSize(canvasWidth, canvasHeight)

// create the camera now that we know the renderer size
let camera = new THREE.PerspectiveCamera(75, renderer.getSize().width / renderer.getSize().height, 0.1, 1000)

// add canvas to dom
//document.body.appendChild(renderer.domElement)

// add lights
let light = new THREE.DirectionalLight(0xffffff, 1.0)
light.position.set(100, 100, 100)

// Shadow setup (use "shadowCamera" below to help in setup)
light.castShadow = true
light.shadow.camera.near = 100
light.shadow.camera.far = 200
light.shadow.camera.left = -50
light.shadow.camera.right = 50
light.shadow.camera.top = 50
light.shadow.camera.bottom = -50
light.shadow.mapSize.height = 1024
light.shadow.mapSize.width = 1024

scene.add(light)

// Visualize shadow camera (help while debugging)
// let shadowCamera = new THREE.CameraHelper(light.shadow.camera)
// scene.add(shadowCamera)

let light2 = new THREE.DirectionalLight(0xffffff, 1.0)
light2.position.set(-100, 100, -100)

scene.add(light2)

let mapRenderer = new MapRenderer(map)
mapRenderer.mesh.receiveShadow = true
scene.add(mapRenderer.mesh)

let droneRenderer = new DroneRenderer(drone, map)
droneRenderer.mesh.castShadow = true
scene.add(droneRenderer.root)

camera.position.x = 0
camera.position.y = 0
camera.position.z = 150

camera.lookAt(scene.position)

// Expose useful objects to the console (debugging/setup purpose)
window['map'] = map
window['camera'] = camera
window['scene'] = scene
window['droneRenderer'] = droneRenderer

// Get UI DOM elements
let buildAccumulator = <HTMLButtonElement>document.getElementById('buildAccumulator')
let buildSolar = <HTMLButtonElement>document.getElementById('buildSolar')
let buildWindmill = <HTMLButtonElement>document.getElementById('buildWindmill')
let buildGeothermal = <HTMLButtonElement>document.getElementById('buildGeothermal')
let buildResearch = <HTMLButtonElement>document.getElementById('buildResearch')
let infos = document.getElementById('infos')

// Enrich button to ease following code
buildAccumulator['buildingType'] = BuildingType.Accumulator
buildSolar['buildingType'] = BuildingType.SolarPanel
buildWindmill['buildingType'] = BuildingType.Windmill
buildGeothermal['buildingType'] = BuildingType.Geothermal
buildResearch['buildingType'] = BuildingType.Research
let buildButtons = [buildAccumulator, buildSolar, buildWindmill, buildGeothermal, buildResearch]

// Set up DOM events
canvas.addEventListener('mousedown', onDocumentMouseDown, false)
for (let bt of buildButtons) {
	let type = bt['buildingType']
	bt.addEventListener('click', function () { if (!bt.classList.contains('disabled')) { buildBuilding(type) } })
	bt.addEventListener('mouseenter', function () { setDescription(Building.getDescription(type)) })
	bt.addEventListener('mouseleave', function () { clearDescription() })
}

function buildBuilding(type: BuildingType) {
	console.log("TODO: build a " + type)
}

function setDescription(htmlText: string) {
	infos.innerHTML = htmlText;
}

function clearDescription() {
	setDescription('');
}

let clock = new THREE.Clock

function mainLoop(): void {
	requestAnimationFrame(mainLoop)
	let dt = clock.getDelta()
	updateSimulation(dt)
	render()
	// TWEEN.update()
}

let lastFlownOver = null

function updateSimulation(dt: number) {
	drone.updatePosition(dt)

	// Did the drone fly over an unexplored cell?
	let flownOver = map.getCell(Math.floor(drone.x), Math.floor(drone.y))
	if (flownOver != lastFlownOver) {
		lastFlownOver = flownOver;
		onEnterCell(flownOver);
	}
}

function onEnterCell(cell: MapCell) {
	// Reveal the cell if new
	if (!cell.explored) {
		cell.explored = true
		mapRenderer.updateFacesColor()
	}

	// Update UI
	let isEmpty = !cell.isBuilt()
	setButtonState(buildAccumulator, isEmpty && cell.type === CellType.Ground)
	setButtonState(buildSolar, isEmpty && cell.type === CellType.Ground)
	setButtonState(buildWindmill, isEmpty && cell.type === CellType.Ground)
	setButtonState(buildGeothermal, isEmpty && cell.type === CellType.Fumarole)
	setButtonState(buildResearch, isEmpty && cell.type === CellType.Ground)
}

/** Enable of disable button.
 * We do not use .disabled as we would lose the mouse events used for descriptions */
function setButtonState(button: Element, enabled: boolean) {
	if (!enabled) {
		button.classList.add('disabled')
	} else {
		// Priorizing simplicity here... See https://stackoverflow.com/a/196038/38096
		button.classList.remove('disabled')
	}
}

function render(): void {
	droneRenderer.updatePosition()
	renderer.render(scene, camera)
}

// Picking support; see https://stackoverflow.com/a/29373404/38096
var raycaster = new THREE.Raycaster()
var mouse = new THREE.Vector2()

/** Pick on click */
function onDocumentMouseDown(event) {
	event.preventDefault();
	mouse.x = ((event.clientX - renderer.domElement.offsetLeft) / renderer.domElement.clientWidth) * 2 - 1
	mouse.y = - ((event.clientY - renderer.domElement.offsetTop) / renderer.domElement.clientHeight) * 2 + 1
	raycaster.setFromCamera(mouse, camera)

	var intersects = raycaster.intersectObjects([mapRenderer.mesh]);
	if (intersects.length > 0) {
		var cell: MapCell = intersects[0].face['modelCell']
		drone.setTarget(cell.x, cell.y)
	}
}

mainLoop()
