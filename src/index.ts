// add styles
import './style.css'
// three.js
import * as THREE from 'three'
import * as TWEEN from 'tween.js'

import { WorldMap, MapCell } from './model/worldmap'
import { Drone } from './model/drone'

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

// Set up DOM events
canvas.addEventListener('mousedown', onDocumentMouseDown, false)

let clock = new THREE.Clock

function mainLoop(): void {
	requestAnimationFrame(mainLoop)
	let dt = clock.getDelta()
	updateSimulation(dt)
	render()
	// TWEEN.update()
}

function updateSimulation(dt: number) {
	drone.updatePosition(dt)

	// Did the drone fly over an unexplored cell?
	let flownOver = map.getCell(Math.floor(drone.x), Math.floor(drone.y))
	if (!flownOver.explored) {
		reveal(flownOver)
	}
}

function reveal(cell: MapCell) {
	cell.explored = true
	mapRenderer.updateFacesColor()
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
