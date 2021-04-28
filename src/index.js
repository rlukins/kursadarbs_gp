import * as THREE from 'three';
import { Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import Stats from 'three/examples/jsm/libs/stats.module';
import skybox from './assets/skybox.jpeg';


class Main {
    uniforms;
    velocity = new THREE.Vector3();
    moveForward = false;
	moveBackward = false;
    moveLeft = false;
    moveRight = false;
    moveSprint = false;
    acceleration = 0;
    raycaster = new THREE.Raycaster();
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 2000);
        this.camera.position.set(20, 20, 20);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0xEEEEEE);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer = renderer;
        document.body.appendChild(renderer.domElement);
        
        const controls = new PointerLockControls(this.camera, this.renderer.domElement);
        this.controls = controls;
        
        const stats = Stats();
        this.stats = stats;
        document.body.appendChild(stats.dom);

        this.clock = new THREE.Clock();
        this.createLights();
        this.clock = new THREE.Clock();
        this.setupEvents();
        this.createShader();
        this.createCubes();
        this.createFloor();
        this.createCrosshair();
        this.animate();
    }

    setupEvents() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        document.addEventListener( 'keydown', (event) => {
            switch (event.code) {
                case "KeyW":
                    this.moveForward = true;
                    break;
                case "KeyA":
                    this.moveLeft = true;
                    break;
                case "KeyS":
                    this.moveBackward = true;
                    break;
                case "KeyD":
                    this.moveRight = true;
                    break;
                case "ShiftLeft":
                    this.moveSprint = true;
                    break;
            }
        });

        document.addEventListener( 'keyup', (event) => {
            switch (event.code) {
                case "KeyW":
                    this.moveForward = false;
                    this.acceleration = 0;
                    break;
                case "KeyA":
                    this.moveLeft = false;
                    this.acceleration = 0;
                    break;
                case "KeyS":
                    this.moveBackward = false;
                    this.acceleration = 0;
                    break;
                case "KeyD":
                    this.moveRight = false;
                    this.acceleration = 0;
                    break;
                case "ShiftLeft":
                    this.moveSprint = false;
                    this.acceleration = 0;
                    break;
            }
        });

        document.addEventListener( 'click', () => {
            //console.log(this.controls.getDirection(new THREE.Vector3()).x);
            //let test = this.raycaster.ray.origin.copy(this.controls.getObject().position);
            this.raycaster.setFromCamera({x:0, y:0}, this.camera);
            var intersects = this.raycaster.intersectObjects(this.scene.children);
            this.addBox(intersects[0].point);
            this.controls.lock();
        });
    }
    
    addBox(pos) {
        var geometry = new THREE.BoxGeometry(10, 10, 10);
        var material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            fragmentShader: `
            #extension GL_OES_standard_derivatives : enable
            #ifdef GL_ES
            precision mediump float;
            #endif
            uniform float time;
            uniform vec2 resolution;
            varying vec2 vUv;
            varying vec3 vNormal;
            #define iTime time
            #define iResolution resolution
            float smin( float a, float b, float k ){
	            float h = clamp( 0.5 + 0.5*(b-a)/k, 0.0, 1.0 );
	            return mix( b, a, h ) - k*h*(1.0-h);
            }

            void mainImage( out vec4 fragColor, in vec2 fragCoord ){
                vec2 uv  = vUv;
                uv *= 100.;
                vec2 id = floor(uv);
                vec2 center = id + .5;
                vec2 st = fract(uv);
                float d = 1.;
                const float NNEI = 2.;
                for (float x = -NNEI; x <= NNEI; x++) {
                    for (float y = -NNEI; y < NNEI; y++) {
                        vec2 ndiff = vec2(x, y);
                        vec2 c = center + ndiff;
                        float r = length(c);
                        float a = atan(c.y, c.x);
                        r += sin(iTime * 5. - r*0.55) * min(r/5., 1.);
                        vec2 lc = vec2(r*cos(a), r*sin(a));
                        d = smin(d, length(uv - lc),0.65);
                    }
                }
                float w = fwidth(uv.y);
                vec3 col = vec3(smoothstep(0.31+w, 0.31-w, d));
	            col.r *= 0.6;
	            col.g *= 0.85;
                fragColor = vec4(col,1.0);
            }

            void main(void){
                mainImage(gl_FragColor, gl_FragCoord.xy);
            }`,
            vertexShader: `
            varying vec2 vUv;
            varying vec3 vNormal;

            void main() {
                vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
                vUv = uv;
                gl_Position = projectionMatrix * modelViewPosition; 
            }`
        });
        const newcube = new THREE.Mesh(geometry, material);
        //newcube.position.x = pos.x;
        newcube.position.x = Math.round( pos.x / 10) * 10;
        //console.log(newcube.position.x);
        newcube.position.y = Math.round( pos.y / 10) * 10 + 10;
        newcube.position.z = Math.round( pos.z / 10) * 10;
        this.scene.add(newcube);
    }

    /*createCrosshair() {
        var pMat = new THREE.ShaderMaterial({
            uniforms: { main_color: {value: {r: 1, g: 1, b: 1}},
                        border_color: {value: {r: 0, g: 0, b: 0.1}},
                       
                        thickness: {value:0.006},
                        height: {value:0.13},
                        offset: {value:0.05},
                        border: {value:0.003},
                       
                        opacity: {value: 1},
                        center: {value: {x: 0.5, y: 0.5}},
                        rotation: {value: 0}
                    },
             vertexShader: `
                    uniform float rotation;
                    uniform vec2 center;
                    #include <common>
                    varying vec2 vUv;
                    void main() {
                        vUv = uv;
                        vec4 mvPosition = modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );
                        vec2 scale;
                        scale.x = length( vec3( modelMatrix[ 0 ].x, modelMatrix[ 0 ].y, modelMatrix[ 0 ].z ) );
                        scale.y = length( vec3( modelMatrix[ 1 ].x, modelMatrix[ 1 ].y, modelMatrix[ 1 ].z ) );
                        #ifndef USE_SIZEATTENUATION
                            bool isPerspective = isPerspectiveMatrix( projectionMatrix );
                            if ( isPerspective ) scale *= - mvPosition.z;
                        #endif
                        vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
                        vec2 rotatedPosition;
                        rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
                        rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
                        mvPosition.xy += rotatedPosition;
                        gl_Position = projectionMatrix * mvPosition;
                    }
                `,
             fragmentShader: `
                uniform vec3 main_color;
                uniform vec3 border_color;
                uniform float opacity;
        
                uniform float thickness;
                uniform float height;
                uniform float offset;
                uniform float border;
        
                varying vec2 vUv;
                void main() {
        
                    float a = (step(abs(vUv.x - 0.5), thickness)) * step(abs(vUv.y - 0.5), height + offset) * step(offset, abs(vUv.y - 0.5)) + (step(abs(vUv.y - 0.5), thickness)) * step(abs(vUv.x - 0.5), height + offset) * step(offset, abs(vUv.x - 0.5));
                    float b = (step(abs(vUv.x - 0.5), thickness - border)) * step(abs(vUv.y - 0.5), height + offset - border) * step(offset + border, abs(vUv.y - 0.5)) + (step(abs(vUv.y - 0.5), thickness - border)) * step(abs(vUv.x - 0.5), height + offset - border) * step(offset + border, abs(vUv.x - 0.5));
                    gl_FragColor = vec4( mix(border_color, main_color, b), a * opacity);
                }
             `,
             transparent: true,
        });
        
        var sprite = new THREE.Sprite(pMat);
        
        this.scene.add(sprite);
        sprite.position.set(0,0,-5);
    }*/

    createCrosshair() {

    }
    
    createCubes() {     
        var geometry = new THREE.BoxGeometry(20, 20, 20);
        var material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            fragmentShader: `
            #extension GL_OES_standard_derivatives : enable
            #ifdef GL_ES
            precision mediump float;
            #endif
            uniform float time;
            uniform vec2 resolution;
            varying vec2 vUv;
            varying vec3 vNormal;
            #define iTime time
            #define iResolution resolution
            float smin( float a, float b, float k ){
	            float h = clamp( 0.5 + 0.5*(b-a)/k, 0.0, 1.0 );
	            return mix( b, a, h ) - k*h*(1.0-h);
            }

            void mainImage( out vec4 fragColor, in vec2 fragCoord ){
                vec2 uv  = vUv;
                uv *= 100.;
                vec2 id = floor(uv);
                vec2 center = id + .5;
                vec2 st = fract(uv);
                float d = 1.;
                const float NNEI = 2.;
                for (float x = -NNEI; x <= NNEI; x++) {
                    for (float y = -NNEI; y < NNEI; y++) {
                        vec2 ndiff = vec2(x, y);
                        vec2 c = center + ndiff;
                        float r = length(c);
                        float a = atan(c.y, c.x);
                        r += sin(iTime * 5. - r*0.55) * min(r/5., 1.);
                        vec2 lc = vec2(r*cos(a), r*sin(a));
                        d = smin(d, length(uv - lc),0.65);
                    }
                }
                float w = fwidth(uv.y);
                vec3 col = vec3(smoothstep(0.31+w, 0.31-w, d));
	            col.r *= 0.6;
	            col.g *= 0.85;
                fragColor = vec4(col,1.0);
            }

            void main(void){
                mainImage(gl_FragColor, gl_FragCoord.xy);
            }`,
            vertexShader: `
            varying vec2 vUv;
            varying vec3 vNormal;

            void main() {
                vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
                vUv = uv;
                gl_Position = projectionMatrix * modelViewPosition; 
            }`
        });
        for ( let i = 0; i < 500; i ++ ) {
            const box = new THREE.Mesh( geometry, material );
            box.position.x = Math.floor( Math.random() * 20 - 10 ) * 20;
            box.position.y = Math.floor( Math.random() * 20 ) * 20 + 10;
            box.position.z = Math.floor( Math.random() * 20 - 10 ) * 20;
            this.scene.add( box );
        }
    }
    createFloor() {
        const floorgeometry = new THREE.PlaneGeometry(2000, 2000, 100, 100);
        const floormaterial = new THREE.MeshBasicMaterial({ color: 0x0d224a });
        const floor = new THREE.Mesh(floorgeometry, floormaterial);
        floor.material.side = THREE.DoubleSide;
        floor.rotation.x = Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);
    }

    createLights() {
        this.scene.add(new THREE.AmbientLight(0x0d224a));
        this.scene.background = new THREE.Color( 0x0d224a );
        this.scene.fog = new THREE.Fog( 0xffffff, 10, 1500 );
        const light = new THREE.HemisphereLight( 0xeeeeff, 0x777788, 0.75 );
		light.position.set( 0.5, 1, 0.75 );
		this.scene.add( light );

        const geometry = new THREE.SphereGeometry(1000, 32, 32);
        const material = new THREE.MeshStandardMaterial({
            map: new THREE.TextureLoader().load(skybox),
            side: THREE.DoubleSide
        });
        this.skyboxtext = new THREE.Mesh(geometry, material);
        this.scene.add(this.skyboxtext);
    }

    createShader() {
        this.uniforms = {
            time: { type: 'float', value: 1.0 },
            resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
        }
    }

    animate() {
        this.stats.update();
        this.uniforms.time.value = this.clock.getElapsedTime();
        requestAnimationFrame(() => this.animate());
        this.velocity.set(0, 0, 0);
        if(this.controls.isLocked) {
            if(this.moveForward == true) {
                if(this.moveSprint == true) {
                    if(this.acceleration < 2) {
                        this.acceleration += 0.05
                    }
                    this.velocity.setX(this.acceleration);
                } else {
                    if(this.acceleration < 1) {
                        this.acceleration += 0.05
                    }
                    this.velocity.setX(this.acceleration);
                }
            }
            if(this.moveBackward == true) {
                if(this.acceleration < 1) {
                    this.acceleration += 0.05
                }
                this.velocity.setX(-this.acceleration);
            }
            if(this.moveLeft == true) {
                if(this.acceleration < 1) {
                    this.acceleration += 0.05
                }
                this.velocity.setZ(-this.acceleration);
            }
            if(this.moveRight == true) {
                if(this.acceleration < 1) {
                    this.acceleration += 0.05
                }
                this.velocity.setZ(this.acceleration);  
            }
        }
        this.controls.moveForward(this.velocity.x);
        this.controls.moveRight(this.velocity.z);
        this.renderer.render(this.scene, this.camera);
    }
}

(new Main());