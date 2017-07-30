// add styles
import './style.css'
// three.js
import * as THREE from 'three'
import { WorldMap } from './model/worldmap'
import { MapRenderer } from './render/maprenderer'

// Build the world map
const width = 16
const height = 16
let map = new WorldMap(32, 32, 5, 16, 8, 3)

// create the scene
let scene = new THREE.Scene()

// create the camera
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)

let renderer = new THREE.WebGLRenderer()

// set size
renderer.setSize(window.innerWidth, window.innerHeight)

// add canvas to dom
document.body.appendChild(renderer.domElement)

// add axis to the scene
let axis = new THREE.AxisHelper(10)

scene.add(axis)

// add lights
let light = new THREE.DirectionalLight(0xffffff, 1.0)

light.position.set(100, 100, 100)

scene.add(light)

let light2 = new THREE.DirectionalLight(0xffffff, 1.0)

light2.position.set(-100, 100, -100)

scene.add(light2)

let mapRenderer = new MapRenderer(map)
scene.add(mapRenderer.getMesh())

camera.position.x = 0
camera.position.y = 0
camera.position.z = 300

camera.lookAt(scene.position)

// Expose useful objects to the console (debugging/setup purpose)
window['map'] = map
window['camera'] = camera
window['scene'] = scene

function animate(): void {
	requestAnimationFrame(animate)
	render()
}

function render(): void {
	let timer = 0.002 * Date.now()
	// Update simulation here
	renderer.render(scene, camera)
}

animate()
