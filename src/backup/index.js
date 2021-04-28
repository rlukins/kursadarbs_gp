import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { FirstPersonControls } from 'three/examples/jsm/controls/FirstPersonControls';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import carModel from './assets/car2.gltf';

class Main {
    uniforms;
    constructor() {
        const objects = [];
        let raycaster;
        let moveForward = false;
		let moveBackward = false;
		let moveLeft = false;
		let moveRight = false;
		let canJump = false;
        let prevTime = performance.now();
		const velocity = new THREE.Vector3();
		const direction = new THREE.Vector3();
		const vertex = new THREE.Vector3();
		const color = new THREE.Color();

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0xEEEEEE);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer = renderer;
        document.body.appendChild(renderer.domElement);

        //this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls = new PointerLockControls(this.camera, document.body);
        this.scene.add(this.controls.getObject());

        const onKeyDown = function ( event ) {
            switch ( event.code ) {
                case 'ArrowUp':
                case 'KeyW':
                    moveForward = true;
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    moveLeft = true;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    moveBackward = true;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    moveRight = true;
                    break;
                case 'Space':
                    if ( canJump === true ) velocity.y += 350;
                    canJump = false;
                    break;
            }
        };

        const onKeyUp = function(event) {
            switch ( event.code ) {
                case 'ArrowUp':
                case 'KeyW':
                    moveForward = false;
                    break;

                case 'ArrowLeft':
                case 'KeyA':
                    moveLeft = false;
                    break;

                case 'ArrowDown':
                case 'KeyS':
                    moveBackward = false;
                    break;

                case 'ArrowRight':
                case 'KeyD':
                    moveRight = false;
                    break;

            }
        };

        document.addEventListener( 'keydown', onKeyDown );
		document.addEventListener( 'keyup', onKeyUp );

        this.clock = new THREE.Clock();

        this.loader = new GLTFLoader();

        this.createLights();
        this.clock = new THREE.Clock();
        this.setupEvents();
        this.createShader();
        this.createWorld();
        this.createFloor();
        this.createCar();
        this.animate();
    }

    setupEvents() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
    
    createWorld() {
        this.camera.position.set(20, 20, 0);
        var geometry = new THREE.BoxGeometry(20, 20, 20);
        var material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            fragmentShader: `
            uniform float time; 
            varying vec2 vUv;
            varying vec3 vNormal;

            #define N(h) fract(sin(vec4(6,9,1,0)*h) * 9e2)

            void main(void) {
                vec4 o; 
                vec2 u = vUv.xy;
                float e, d, i=0.;
                vec4 p;
                for(float i=1.; i<12.; i++) {
                    d = floor(e = i*5.1+time);
                    p = N(d)+.1;
                    e -= d;
                    for(float d=0.; d<10.;d++)
                        o += p*(2.0-e)/1e3/length(u-(p-e*(N(d*i)-.5)).xy);  
                }
	 
                gl_FragColor = vec4(o.rgb, 1);
            }`,
            vertexShader: `
            varying vec2 vUv;
            varying vec3 vNormal;

            void main() {
                vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
                vUv = uv;
                vNormal = normal;
                gl_Position = projectionMatrix * modelViewPosition; 
            }`,
        });

        var cube = new THREE.Mesh(geometry, material);
        cube.position.set(0, 0.5, 0);
        this.scene.add(cube);
        for ( let i = 0; i < 500; i ++ ) {
            const boxMaterial = new THREE.MeshPhongMaterial( { specular: 0xffffff, flatShading: true, vertexColors: true } );
            const box = new THREE.Mesh( geometry, material );
            box.position.x = Math.floor( Math.random() * 20 - 10 ) * 20;
            box.position.y = Math.floor( Math.random() * 20 ) * 20 + 10;
            box.position.z = Math.floor( Math.random() * 20 - 10 ) * 20;

            this.scene.add( box );
        }

    }

    createFloor() {
        const floorgeometry = new THREE.PlaneGeometry(2000, 2000, 100, 100);
        const floormaterial = new THREE.MeshBasicMaterial({ color: 0x668866 });
        const floor = new THREE.Mesh(floorgeometry, floormaterial);
        floor.material.side = THREE.DoubleSide;
        floor.rotation.x = Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);
    }

    createLights() {
        this.scene.add(new THREE.AmbientLight(0x777777));
        this.scene.background = new THREE.Color( 0xffffff );
        this.scene.fog = new THREE.Fog( 0xffffff, 10, 250 );
        const light = new THREE.HemisphereLight( 0xeeeeff, 0x777788, 0.75 );
		light.position.set( 0.5, 1, 0.75 );
		this.scene.add( light );
    }

    createCar() {
        this.loader.load(carModel, (gltf) => {
            this.car = gltf.scene;
            this.car.scale.x = 0.5;
            this.car.scale.y = 0.5;
            this.car.scale.z = 0.5;
            this.car.position.set(0, 0, 2);
            this.scene.add(this.car);
        }, undefined, function (error) {
            console.error(error);
        });
    }

    createShader() {
        this.uniforms = {
            time: { type: 'float', value: 1.0 },
            resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
        }
    }

    animate() {
        //this.controls.update();
        this.uniforms.time.value = this.clock.getElapsedTime();
        requestAnimationFrame(() => this.animate());
        const now = new Date();
        this.renderer.render(this.scene, this.camera);
    }
}

(new Main());