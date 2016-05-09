import $ from 'jquery'
import _ from 'lodash'
import TweenMax from 'gsap'

// import three and make it global
// so plugins can hook onto the namespace THREE
import THREE from 'three'
window.THREE = THREE

import ConvolutionShader from 'three/shaders/ConvolutionShader'
import CopyShader from 'three/shaders/CopyShader'
import EffectComposer from 'three/postprocessing/EffectComposer'
import MaskPass from 'three/postprocessing/MaskPass'
import RenderPass from 'three/postprocessing/RenderPass'
import ShaderPass from 'three/postprocessing/ShaderPass'
import BloomPass from 'three/postprocessing/BloomPass'
import AnaglyphEffect from 'three/effects/AnaglyphEffect'

// application
class App {
  constructor() {
    this.$canvas = null

    this.renderer = null
    this.camera = null
    this.scene = null
    this.composer = null
    this.mesh = null
    this.effect = null

    this.colors = []

    this.sceneWidth = window.innerWidth
    this.sceneHeight = window.innerHeight

    $(document).ready(() => {
      this.init()
      this.resize()
    })
  }

  init() {

    // canvas
    this.$canvas = $('#canvas')

    // mouse
    this.cursorX = window.innerWidth / 2
    this.cursorY = window.innerHeight / 2

    // renderer
    this.renderer = new THREE.WebGLRenderer({ canvas: this.$canvas[0], antialias: true })
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(this.sceneWidth, this.sceneHeight)

    this.effect = new THREE.AnaglyphEffect( this.renderer )
    this.effect.setSize( this.sceneWidth/2, this.sceneHeight/2 )

    // camera
    this.camera = new THREE.PerspectiveCamera(30, this.sceneWidth / this.sceneHeight, 1, 1000)
    this.camera.position.z = 400

    // light
    this.light = new THREE.AmbientLight( 0xFFFFFF) // soft white light

    // scene & world
    this.scene = new THREE.Scene()
    this.createWorld()

    // render & animation ticker
    TweenMax.ticker.fps(60)
    TweenMax.ticker.addEventListener('tick', () => { this.tick() })

    // resize handler, resize once
    $(window).resize(() => { this.resize() })

    $('body').on('mousemove', (e) => {
      this.cursorX = this.map_range(e.clientX, 0, window.innerWidth, 0, 1)
      this.cursorY = this.map_range(e.clientY, 0, window.innerHeight, 0, 1)

      this.rotate(this.cursorX)
    })
  }

  createWorld() {
    // create world here, do epic shit, make art

    this.meshes = []
    this.materials = []

    // composer
    this.composer = new THREE.EffectComposer(this.renderer)

    // render pass, will render the scene from the camera perspective to the framebuffer
    let renderPass = new THREE.RenderPass(this.scene, this.camera)
    this.composer.addPass(renderPass)

    // adds a bloom to the previous pass
    let bloomPass = new THREE.BloomPass(5, 50, 1.25, 512)
    bloomPass.enabled = true;
    this.composer.addPass(bloomPass)

    // copies the previous pass and sets it as the end of the post processing filter chain
    let effectCopy = new THREE.ShaderPass(THREE.CopyShader);
    effectCopy.renderToScreen = true;
    this.composer.addPass(effectCopy);


    this.unitWidth = this.sceneWidth / 200

    // create geometry
    // this.geoPixel = new THREE.PlaneGeometry( this.unitWidth, this.unitWidth )

    var length = 120
    this.geoPixel = new THREE.Geometry()

    this.geoPixel.vertices.push(
      new THREE.Vector3((0 - length/2),(0-length/2)),
      new THREE.Vector3((0 - length/2), length/2),
      new THREE.Vector3(length/2,length/2),
      new THREE.Vector3(length/2,(0-length/2)),
      new THREE.Vector3((0 - length/2),(0-length/2))
    )
    

    for (var i = 0; i < 5; i++) {
      if (i%2 == 0) {
        this.colors[i] =  new THREE.Color(0XF5C8F6)
      }else{
        this.colors[i] =  new THREE.Color(0X9FECDE)
      }
    }
    console.log(this.geoPixel)
    // material
    this.material = new THREE.LineBasicMaterial({ 
      color: '#FFF', 
      // vertexColors: THREE.VertexColors,
      depthWrite: false,
      // shading: THREE.FlatShading
    })


    
    
    

    for (var i=0 ; i < Math.floor(this.sceneWidth / this.unitWidth ); i++) {
      for( var j=0 ; j < Math.floor(this.sceneHeight / this.unitWidth ); j++){
      // for( var j=0 ; j < 1; j++){
      // create mesh
      var mesh = new THREE.Line( this.geoPixel, this.material )

       // position
       var posX = this.map_range(i*this.unitWidth, 0, this.sceneWidth, -this.sceneWidth/2, this.sceneWidth*2)
       var posY = this.map_range(j*this.unitWidth, 0, this.sceneHeight, -this.sceneHeight/2, this.sceneHeight*2)
       mesh.position.set( i*this.unitWidth - this.sceneWidth / 2 -this.unitWidth/2, j*this.unitWidth - this.sceneHeight/2 + this.unitWidth/2, 0)

       // scale
       mesh.scale.set(.5,.5,.5)
       
       var rotation = this.map_range(Math.random()/10, 0, 1, 0, 2*Math.PI)
       mesh.rotation.set(0,rotation,0)

       this.meshes.push(mesh)
       this.scene.add(mesh)
      }
      
    }

    this.geoPixel.colorsNeedUpdate = true
    console.log(this.geoPixel.colorsNeedUpdate)
    this.geoPixel.colors = this.colors

    // this.scene.add( this.light )
    // this.color()
    
  }

  tick() {
    this.update()
    this.draw()
  }

  update() {
    // this.mesh.rotation.x += 0.005
    // this.mesh.rotation.y += 0.01
  }

  draw() {
    this.renderer.render(this.scene, this.camera)
    // this.composer.render()
    // this.effect.render(this.scene, this.camera)
  }

  resize() {

    // update vars
    this.sceneWidth = window.innerWidth
    this.sceneHeight = window.innerHeight

    // update camera
    this.camera.aspect = this.sceneWidth / this.sceneHeight
    this.camera.updateProjectionMatrix()

    // update renderer
    this.renderer.setSize(this.sceneWidth, this.sceneHeight)
  }

  rotate( progress ){
    _.each(this.meshes, (m) => {
      var rotationY = this.map_range(progress, 0, 1, 0, 3*(2*Math.PI))
      var rotationX = this.map_range(progress, 0, 1, 0, 3*(2*Math.PI))
      m.rotation.set(-rotationX,rotationY,0)
    })
  }

  color(){
    // for (var i = 0; i < this.meshes.length / 5; i++) {
    //   var m = this.meshes[Math.floor(Math.random()*this.meshes.length)]
    //   // m.material.color.set(0X9FECDE)
    //   // m.material.color.set(0XFFFFFF)
    // }
  }

  map_range(value, low1, high1, low2, high2) {
    return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
  }
}

// export already created instance
export let app = new App()
