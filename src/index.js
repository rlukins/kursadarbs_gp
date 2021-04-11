import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

class Main {
    uniforms;
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0xEEEEEE);
        renderer.shadowMap.enabled = true;
        this.renderer = renderer;
        document.body.appendChild(renderer.domElement);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.clock = new THREE.Clock();

        this.createLights();
        this.clock = new THREE.Clock();
        this.setupEvents();
        this.createShader();
        this.createWorld();
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
        this.camera.position.set(10, 0, 0);
        var geometry = new THREE.BoxGeometry(1,1,1);
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
        this.scene.add(cube);
    }

    createLights() {
        this.scene.add(new THREE.AmbientLight(0x777777));
    }

    createShader() {
        this.uniforms = {
            time: { type: 'float', value: 1.0 },
            resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
        }
    }

    animate() {
        this.controls.update();
        this.uniforms.time.value = this.clock.getElapsedTime();
        requestAnimationFrame(() => this.animate());
        const now = new Date();
        this.renderer.render(this.scene, this.camera);
    }
}

(new Main());