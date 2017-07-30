// add styles
import './style.css'
// three.js
import * as THREE from 'three'
import * as TWEEN from 'tween.js'

import { WorldMap } from './model/worldmap'
import { Drone } from './model/drone'

import { MapRenderer } from './render/maprenderer'
import { DroneRenderer } from './render/dronerenderer'

// Build the world map
const width = 16
const height = 16
let map = new WorldMap(32, 32, 5, 16, 8, 3)

// Set up the drone
let drone = new Drone(Math.floor(map.width / 2), Math.floor(map.height / 2))

// create the scene
let scene = new THREE.Scene()

// create the camera
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)

let renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.shadowMap.enabled = true

// set size
renderer.setSize(window.innerWidth, window.innerHeight)

// add canvas to dom
document.body.appendChild(renderer.domElement)

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
document.addEventListener('mousedown', onDocumentMouseDown, false)

let clock = new THREE.Clock

function animate(): void {
	requestAnimationFrame(animate)
	let dt = clock.getDelta()
	updateSimulation(dt)
	render()
	// TWEEN.update()
}

function updateSimulation(dt: number) {
	drone.updatePosition(dt)
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
	mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1
	mouse.y = - (event.clientY / renderer.domElement.clientHeight) * 2 + 1
	raycaster.setFromCamera(mouse, camera)

	var intersects = raycaster.intersectObjects([mapRenderer.mesh]);
	if (intersects.length > 0) {
		var pos = intersects[0].face['modelPosition']
		drone.setTarget(pos.x, pos.y)
	}
}

animate()
