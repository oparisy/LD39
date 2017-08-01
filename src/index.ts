// add styles
import './style.css'
// three.js
import * as THREE from 'three'

// Import OBJLoader and add it to THREE object
declare var require: any;
require('three-obj-loader')(THREE)

import { WorldMap, MapCell, CellType } from './model/worldmap'
import { Drone } from './model/drone'
import { Building, BuildingType } from './model/building'
import { Research, ResearchType } from './model/research'

import { MapRenderer } from './render/maprenderer'
import { DroneRenderer } from './render/dronerenderer'

import { BoundElement } from './ui/boundelement'
import { Overlay } from './ui/overlay'

/** The first game day starts at 8 AM */
const START_HOUR = 8

const START_CREDITS = 1000
const GRACE_DELAY = START_HOUR + 8 // After this date (in hours), the city will start increasingly consuming energy
const CITY_CONSUMPTION_INCREMENT_AFTER_GRACE_DELAY = 1000 // kW?
const CITY_CONSUMPTION_FACTOR_AT_NIGHT = 0.75
const ENERGY_PRICE = 0.3 // creds/kWh
const WINNING_DAY = 5 // Number of days before winning

/** One player minute => 12 in-game hours */
const GAME_HOURS_PER_PLAYER_MINUTE = 12

// TODO Clean this up; no global code

// Build the world map
let map = new WorldMap(24, 36, 5, 16, 8, 3)

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
camera.position.z = 160
camera.up = new THREE.Vector3(0, 0, 1)

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
let credits = new BoundElement(document.getElementById('credits'), START_CREDITS)
let power = new BoundElement(document.getElementById('power'), 0)
let maxPower = new BoundElement(document.getElementById('maxpower'), 0)
let incPower = new BoundElement(document.getElementById('incpower'), 0)
let decPower = new BoundElement(document.getElementById('decpower'), 0)
let gameTimeOfDay = new BoundElement(document.getElementById('timeOfDay'), START_HOUR, timeConverter) // The current game time, in hours
let gameTimeElapsed = new BoundElement(document.getElementById('day'), START_HOUR, dayConverter) // Total elapsed game time, in hours
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

let researchFacilityConstructed = false

// Enrich button to ease following code
buildAccumulator['buildingType'] = BuildingType.Accumulator
buildSolar['buildingType'] = BuildingType.SolarPanel
buildWindmill['buildingType'] = BuildingType.WindTurbine
buildGeothermal['buildingType'] = BuildingType.Geothermal
buildResearch['buildingType'] = BuildingType.Research
let buildButtons = [buildAccumulator, buildSolar, buildWindmill, buildGeothermal, buildResearch]

// Set up DOM events
canvas.addEventListener('mousedown', onDocumentMouseDown, false)
for (let bt of buildButtons) {
	let type = bt['buildingType']
	bt.addEventListener('click', function () { onBuildButtonClick(bt, type) });
	bt.addEventListener('mouseenter', function () { setDescription(Building.getDescription(type)) })
	bt.addEventListener('mouseleave', function () { clearDescription() })
}

function onBuildButtonClick(bt, type) {
	if (!bt.classList.contains('disabled') && currentCell != null) {
		credits.value -= Building.getCost(type)
		map.buildBuilding(type, currentCell)
		mapRenderer.cellBuilt(currentCell)

		if (type == BuildingType.Research && !researchFacilityConstructed) {
			researchFacilityConstructed = true
			addResearchButtons()
		}

		updateButtonsState(currentCell)
	}
}

let researchAccumulator: HTMLButtonElement = undefined
let researchSolarPanel: HTMLButtonElement = undefined
let researchWindTurbine: HTMLButtonElement = undefined

function addResearchButtons() {
	let container = document.getElementById('actionButtonsContainer')
	container.removeChild(buildResearch)

	researchAccumulator = buildResearchButton(ResearchType.Accumulator)
	researchSolarPanel = buildResearchButton(ResearchType.SolarPanel)
	researchWindTurbine = buildResearchButton(ResearchType.WindTurbine)
	container.appendChild(researchAccumulator)
	container.appendChild(researchSolarPanel)
	container.appendChild(researchWindTurbine)
}

function buildResearchButton(type: ResearchType): HTMLButtonElement {
	let bt = document.createElement('button')
	bt.classList.add('actionButton')
	bt.innerText = Research.getShortDescription(type)
	bt.addEventListener('click', function () { onResearchButtonClick(bt, type) });
	bt.addEventListener('mouseenter', function () { setDescription(Research.getDescription(type)) })
	bt.addEventListener('mouseleave', function () { clearDescription() })
	return bt
}

function onResearchButtonClick(bt, type) {
	if (!bt.classList.contains('disabled')) {
		credits.value -= Research.getCost(type)
		switch (type) {
			case ResearchType.Accumulator:
				Building.improvedAccumulators = true; break;
			case ResearchType.SolarPanel:
				Building.improvedSolarPanels = true; break;
			case ResearchType.WindTurbine:
				Building.improvedWindTurbines = true; break;
			default:
				throw new Error('Missing switch case')
		}

		let container = document.getElementById('actionButtonsContainer')
		container.removeChild(bt)

		updateButtonsState(currentCell)
	}
}

function updateResearchButtonsState() {
	if (researchFacilityConstructed) {
		if (!Building.improvedAccumulators) {
			setButtonState(researchAccumulator, credits.value >= Research.getCost(ResearchType.Accumulator))
		}
		if (!Building.improvedSolarPanels) {
			setButtonState(researchSolarPanel, credits.value >= Research.getCost(ResearchType.SolarPanel))
		}
		if (!Building.improvedWindTurbines) {
			setButtonState(researchWindTurbine, credits.value >= Research.getCost(ResearchType.WindTurbine))
		}
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
}

let currentCell: MapCell = null

enum GameResult {
	GoingOn, GameOver, Won
}

let outcome = GameResult.GoingOn

function updateSimulationAndScene(dt: number) {

	// Stop any simulation if the game is over or won
	if (outcome !== GameResult.GoingOn) {
		return
	}

	// Update the drone
	drone.updatePosition(dt)
	droneRenderer.updatePosition();

	// Update map animations
	mapRenderer.updateAnimation(dt)

	// Did the drone fly over an unexplored cell?
	let flownOver = map.getCell(Math.floor(drone.x), Math.floor(drone.y))
	if (flownOver != currentCell) {
		currentCell = flownOver;
		onEnterCell(flownOver);
	}

	// Perform power and cost simulation
	outcome = updateCounters(dt)

	// Misc. conditions may have changed; update buttons accordingly
	updateButtonsState(flownOver)

	// React to simulation outcome
	if (outcome === GameResult.GameOver) {
		let title = 'Game Over'
		let text = 'You could not provide power to your city long enough.<br>Reload and improve your strategy!'
		let color = 'orangered'
		showPopup(title, text, color)
	}

	if (outcome === GameResult.Won) {
		let title = 'Game Won'
		let text = 'You have succeded in providing power to your city during the agreed period of time.<br>Reload to play again!'
		let color = 'mediumseagreen'
		showPopup(title, text, color)
	}
}

function showPopup(title, text, color): Overlay {
	let overlay = new Overlay()
	let contents = `
		<div>
		<div class='title'>${title}</div>
		<div class='text'>${text}</div>
		</div>`
	overlay.show(contents, color)
	return overlay
}

function onEnterCell(cell: MapCell) {
	// Reveal the cell if new
	if (!cell.explored) {
		cell.explored = true
		mapRenderer.updateFacesColor()
	}
}

function updateButtonsState(cell: MapCell) {
	let isEmpty = !cell.isBuilt()
	setButtonState(buildAccumulator, isEmpty && cell.type === CellType.Ground && credits.value >= Building.getCost(BuildingType.Accumulator))
	setButtonState(buildSolar, isEmpty && cell.type === CellType.Ground && credits.value >= Building.getCost(BuildingType.SolarPanel))
	setButtonState(buildWindmill, isEmpty && cell.type === CellType.Ground && credits.value >= Building.getCost(BuildingType.WindTurbine))
	setButtonState(buildGeothermal, isEmpty && cell.type === CellType.Fumarole && credits.value >= Building.getCost(BuildingType.Geothermal))
	setButtonState(buildResearch, isEmpty && cell.type === CellType.Ground && credits.value >= Building.getCost(BuildingType.Research) && !researchFacilityConstructed)

	updateResearchButtonsState()
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

/** Update game counter and their UI.
 * dt is the elapsed player time, in seconds.
 * The simulation outcome is returned */
function updateCounters(dt): GameResult {

	let outcome = GameResult.GoingOn

	// Convert player minute to hours in game
	let dtInGameHours = GAME_HOURS_PER_PLAYER_MINUTE * dt / 60
	gameTimeOfDay.value = (gameTimeOfDay.value + dtInGameHours) % 24
	gameTimeElapsed.value += dtInGameHours

	if (gameTimeElapsed.value >= WINNING_DAY * 24) {
		outcome = GameResult.Won
	}

	// The values we need to compute
	let production = 0 // kW
	let consumption = 0 // kW
	let storageCapacity = 0 // kWh
	let currentStorage = power.value // kWh

	// Take buildings into account
	for (let building of map.buildings) {
		production += building.getProduction(gameTimeOfDay.value)
		consumption += building.getConsumption()
		storageCapacity += building.getStorageCapacity()
	}

	// The city takes its toll
	let cityConsumption = getCityConsumption(gameTimeOfDay.value, gameTimeElapsed.value)
	consumption += cityConsumption

	// Update storage
	let instantProduction = (production - consumption) * dtInGameHours // kWh
	currentStorage += instantProduction
	currentStorage = Math.min(currentStorage, storageCapacity)

	if (currentStorage < 0) {
		// We could not provide enough power...
		outcome = GameResult.GameOver
		currentStorage = 0 // Avoid screwing the UI
	} else {
		// The city pays us in return
		let instantCityConsumption = cityConsumption * dtInGameHours // kWh
		credits.value += instantCityConsumption * getEnergyPrice()
	}

	// Update UI
	power.value = currentStorage
	maxPower.value = storageCapacity
	incPower.value = production
	decPower.value = consumption

	return outcome
}

/** Return the city instant consumption in kW */
function getCityConsumption(currentGameTimeOfDay, elapsedGameTime) {
	let comsumption = elapsedGameTime < GRACE_DELAY ? 0 : (CITY_CONSUMPTION_INCREMENT_AFTER_GRACE_DELAY * (elapsedGameTime - GRACE_DELAY) / 24)
	if (isNightTime(currentGameTimeOfDay)) {
		// Less consumption at night
		comsumption *= CITY_CONSUMPTION_FACTOR_AT_NIGHT
	}
	return comsumption;
}

/** TODO This condition is duplicated in Building */
function isNightTime(currentGameTimeOfDay) {
	return currentGameTimeOfDay < 6 || currentGameTimeOfDay > 22
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
