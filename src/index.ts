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

import { BoundElement } from './ui/boundelement'

let CITY_CONSUMPTION = 0 // kW
let ENERGY_PRICE = 5 // creds/kWh
let WINNING_DAY = 6 // Number of days before winning

/** The first game day starts at 8 AM */
const START_HOUR = 8

/** One player minute => 8 in-game hours */
const GAME_HOURS_PER_PLAYER_MINUTE = 8

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
let buildAccumulator = document.getElementById('buildAccumulator')
let buildSolar = document.getElementById('buildSolar')
let buildWindmill = document.getElementById('buildWindmill')
let buildGeothermal = document.getElementById('buildGeothermal')
let buildResearch = document.getElementById('buildResearch')
let infos = document.getElementById('infos')

// Bind UI numeric values
let credits = new BoundElement(document.getElementById('credits'), 0)
let power = new BoundElement(document.getElementById('power'), 0)
let maxPower = new BoundElement(document.getElementById('maxpower'), 0)
let incPower = new BoundElement(document.getElementById('incpower'), 0)
let decPower = new BoundElement(document.getElementById('decpower'), 0)
let gameTime = new BoundElement(document.getElementById('timeOfDay'), START_HOUR, timeConverter) // The current game time, in hours
let elapsed = new BoundElement(document.getElementById('day'), 0, dayConverter) // Total elapsed game time, in hours
let winningDay = new BoundElement(document.getElementById('winningDay'), WINNING_DAY)

function timeConverter(time: number) {
	let hour = time < 13 ? Math.floor(time) : Math.floor(time - 12)
	let min = (Math.floor((time % 1) * 6) * 10).toString() // 10mn precision is enough
	if (min === '0') { min = '00' }
	let suffix = time < 13 ? 'AM' : 'PM'
	return `${hour}:${min} ${suffix}`
}

function dayConverter(time: number) {
	return (1 + Math.floor(time / 24)).toString()
}

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
	bt.addEventListener('click', function () { onButtonClick(bt, type) });
	bt.addEventListener('mouseenter', function () { setDescription(Building.getDescription(type)) })
	bt.addEventListener('mouseleave', function () { clearDescription() })
}

function onButtonClick(bt, type) {
	if (!bt.classList.contains('disabled') && currentCell != null) {
		map.buildBuilding(type, currentCell)
		mapRenderer.cellBuilt(currentCell)
		updateButtonsState(currentCell)
	}
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
	updateSimulationAndScene(dt)
	render()
	// TWEEN.update()
}

let currentCell: MapCell = null

function updateSimulationAndScene(dt: number) {

	// Update the drone
	drone.updatePosition(dt)
	droneRenderer.updatePosition();

	// Did the drone fly over an unexplored cell?
	let flownOver = map.getCell(Math.floor(drone.x), Math.floor(drone.y))
	if (flownOver != currentCell) {
		currentCell = flownOver;
		onEnterCell(flownOver);
	}

	let outcome = updateCounters(dt)
}

function onEnterCell(cell: MapCell) {
	// Reveal the cell if new
	if (!cell.explored) {
		cell.explored = true
		mapRenderer.updateFacesColor()
	}

	updateButtonsState(cell)
}

function updateButtonsState(cell: MapCell) {
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

enum GameResult {
	GoingOn, GameOver, Won
}

/** Update game counter and their UI.
 * dt is the elapsed player time, in seconds.
 * The simulation outcome is returned */
function updateCounters(dt): GameResult {

	let outcome = GameResult.GoingOn

	// Convert player minute to hours in game
	let elapsedGameTimeInHour = GAME_HOURS_PER_PLAYER_MINUTE * dt / 60
	gameTime.value = (gameTime.value + elapsedGameTimeInHour) % 24
	elapsed.value += elapsedGameTimeInHour

	if (elapsed.value >= WINNING_DAY * 24) {
		outcome = GameResult.Won
	}

	// The values we need to compute
	let production = 0 // kW
	let consumption = 0 // kW
	let storageCapacity = 0 // kWh
	let currentStorage = power.value // kWh

	// Take buildings into account
	for (let building of map.buildings) {
		production += building.getProduction(gameTime.value)
		consumption += building.getConsumption()
		storageCapacity += building.getStorageCapacity()
	}

	// Update storage
	let instantProduction = (production - consumption) * elapsedGameTimeInHour // kWh
	currentStorage += instantProduction
	currentStorage = Math.min(currentStorage, storageCapacity)

	if (currentStorage < 0) {
		outcome = GameResult.GameOver
		currentStorage = 0 // Avoid screwing the UI
	}

	// The city takes its toll
	let instantCityConsumption = getCityConsumption(gameTime.value) * elapsedGameTimeInHour // kWh
	currentStorage -= instantCityConsumption

	// The city pays us in return
	credits.value += instantCityConsumption * getEnergyPrice()

	// Update UI
	power.value = currentStorage
	maxPower.value = storageCapacity
	incPower.value = production
	decPower.value = consumption

	return outcome
}

/** Return the city instant consumption in kW.
	TODO Should be a function of time of day */
function getCityConsumption(currentGameTime) {
	return CITY_CONSUMPTION;
}

/** Return the current energy price (in credits per kWh) */
function getEnergyPrice() {
	return ENERGY_PRICE;
}

function render(): void {
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
