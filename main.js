import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.121.1/examples/jsm/controls/OrbitControls.js";

let sizes = { height: window.innerHeight, width: window.innerWidth };
const canvas = document.querySelector("canvas");
let transitionHappening = false;
let offset = 0;
// RENDERER
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });

renderer.setSize(sizes.width, sizes.height);

window.addEventListener("resize", () => {
  sizes.height = window.innerHeight;
  sizes.width = window.innerWidth;

  if (window.innerWidth <= 600) {
    mainObject.scale.set(0.5, 0.5, 0.5);
    offset = 2;
    camera.position.x = -2 + offset;
  } else {
    mainObject.scale.set(1, 1, 1);
    offset = 0;
  }
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  renderer.setSize(sizes.width, sizes.height);
});

// TEXTURES LOADER

let textureLoader = new THREE.TextureLoader();
let particlesTexture = textureLoader.load("https://raw.githubusercontent.com/adar5h/adar5h.github.io/master/assets/textures/star_01.png");
let shadowTexture = textureLoader.load("https://raw.githubusercontent.com/adar5h/adar5h.github.io/master/assets/textures/simpleShadow.jpg");

// SCENE
const scene = new THREE.Scene();

// CAMERA
const camera = new THREE.PerspectiveCamera(
  45,
  sizes.width / sizes.height,
  0.1,
  1000
);
camera.position.z = 7;
camera.position.x = -2;

// ELEMENTS

let innerObjectGeometry = new THREE.IcosahedronGeometry(1, 1);
let outerObjectGeometry = new THREE.IcosahedronGeometry(1, 1);

let innerObjectMaterial = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  flatShading: true,
});

let outerObjectMaterial = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  wireframe: true,
  side: THREE.DoubleSide,
});

let innerObject = new THREE.Mesh(innerObjectGeometry, innerObjectMaterial);
let outerObject = new THREE.Mesh(outerObjectGeometry, outerObjectMaterial);

outerObject.scale.set(0, 0, 0);
setTimeout(() => {
  gsap.to(outerObject.scale, { x: 1.25, y: 1.25, z: 1.25, duration: 1 });
}, 2500);
// outerObject.geometry.scale.set(1.25)
gsap.to(outerObject.scale, { x: 1.75, y: 1.75, z: 1.75, duration: 2.5 });

let mainObject = new THREE.Group();
mainObject.add(innerObject);
mainObject.add(outerObject);
if (window.innerWidth <= 600) {
  mainObject.scale.set(0.5, 0.5, 0.5);
  offset = 2;
  camera.position.x += offset;
}
scene.add(mainObject);

let makeClouds = () => {
  let clouds = new THREE.Group();
  let cloudPositions = [
    { x: -15, y: 7, z: 0 },
    { x: -15, y: 7, z: -15 },
    { x: 5, y: 5, z: -14 },
    { x: 15, y: 7, z: 0 },
  ];
  let cubeMaterial = new THREE.MeshBasicMaterial({ color: "white" });
  let cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
  for (let i = 0; i < 4; i++) {
    let cloud = new THREE.Group();
    for (let j = 0; j < 8; j++) {
      let cubeMesh = new THREE.Mesh(cubeGeometry, cubeMaterial);
      cubeMesh.material.color =
        j % 2 == 0 ? new THREE.Color("black") : new THREE.Color("white");
      cubeMesh.rotation.x = (Math.random() * Math.PI) / 2;
      cubeMesh.rotation.y = (Math.random() * Math.PI) / 2;
      cubeMesh.rotation.z = (Math.random() * Math.PI) / 2;
      cubeMesh.position.x = j - Math.random() * 0.1;
      let scaleRandom = Math.random();
      cubeMesh.scale.set(scaleRandom, scaleRandom, scaleRandom);
      cloud.add(cubeMesh);
    }
    cloud.position.set(
      cloudPositions[i].x,
      cloudPositions[i].y,
      cloudPositions[i].z
    );
    // cloud.position.x = Math.sin(i * Math.PI)
    clouds.add(cloud);
  }

  return clouds;
};

let clouds = makeClouds();
scene.add(clouds);

// PLANE
const geometry = new THREE.PlaneGeometry(100, 15);
const material = new THREE.MeshBasicMaterial({
  color: new THREE.Color("#222"), // #ffddff
  transparent: true,
  side: THREE.DoubleSide,
});
const plane = new THREE.Mesh(geometry, material);
plane.rotation.x = Math.PI / 2;
plane.position.y = -1.5;
plane.position.z = 0;

mainObject.castShadow = true;

scene.add(plane);

// SHADOW

const mainObjectShadow = new THREE.Mesh(
  new THREE.PlaneBufferGeometry(1.5, 1.5),
  new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    alphaMap: shadowTexture,
    opacity: 1,
  })
);
mainObjectShadow.rotation.x = -Math.PI * 0.5;
mainObjectShadow.position.y = plane.position.y + 0.02;
mainObjectShadow.position.x = 0;

scene.add(mainObjectShadow);

// PARTICLES

let bgParticlesGeometry = new THREE.BufferGeometry();
let count = 1500;

let positions = new Float32Array(count * 3);

for (let i = 0; i < count * 3; i++) {
  positions[i] = (Math.random() - 0.5) * 15;
}

bgParticlesGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(positions, 3)
);

let bgParticlesMaterial = new THREE.PointsMaterial();
bgParticlesMaterial.size = 0.15;
bgParticlesMaterial.sizeAttenuation = true;
bgParticlesMaterial.transparent = true;
bgParticlesMaterial.alphaMap = particlesTexture;
bgParticlesMaterial.depthWrite = false;
bgParticlesMaterial.color = new THREE.Color("white");

let bgParticles = new THREE.Points(bgParticlesGeometry, bgParticlesMaterial);

scene.add(bgParticles);

// LIGHT
const directionalLight = new THREE.DirectionalLight(0xff0000, 1);
directionalLight.position.x = -5;
scene.add(directionalLight);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const hemisphereLight = new THREE.HemisphereLight(0x0000ff, 0x00ff00, 1);
scene.add(hemisphereLight);

// CONTROLS
let controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

renderer.render(scene, camera);

// HELPERS
// const axesHelper = new THREE.AxesHelper(5);
// scene.add(axesHelper);

// const gridHelper = new THREE.GridHelper(10, 10);
// scene.add(gridHelper);

// const directionalLightHelper = new THREE.DirectionalLightHelper(
//   directionalLight
// );
// scene.add(directionalLightHelper);

// DEBUG PANEL
// const gui = new dat.GUI();
// const cameraFolder = gui.addFolder("Camera");
// cameraFolder.add(camera.position, "x").min(-15).max(15).step(0.01);
// cameraFolder.add(camera.position, "y").min(-15).max(15).step(0.01);
// cameraFolder.add(camera.position, "z").min(-15).max(15).step(0.01);
// cameraFolder.open();

// camera.lookAt(mainObject.position);

// MOUSE

let mouseX = 0;
let mouseY = 0;
let targetX = 0;
let targetY = 0;

const windowX = window.innerWidth / 2;
const windowY = window.innerHeight / 2;

let onDocumentMouseMove = (event) => {
  mouseX = event.clientX - windowX;
  mouseY = event.clientY - windowY;
};
document.addEventListener("mousemove", onDocumentMouseMove);

// ANIMATING
const clock = new THREE.Clock();
let rotationMode = true;
let animate = () => {
  let elapsedTime = clock.getElapsedTime();

  mainObject.position.y = (1 + Math.sin(elapsedTime)) * 0.25;
  let factor = 1 * mainObject.position.y;
  if (mainObject.position.y > 0.5) {
    factor += 0.1;
  }
  if (mainObject.position.y <= 0.000008) {
    rotationMode = !rotationMode;
  }

  if (rotationMode) {
    innerObject.rotation.y += factor * 5 * 0.05;
    outerObject.rotation.z += -1 * factor * 0.1;
    outerObject.rotation.y += -1 * factor * 0.1;
  } else {
    innerObject.rotation.y -= factor * 5 * 0.05;
    outerObject.rotation.z -= -1 * factor * 0.1;
    outerObject.rotation.y -= -1 * factor * 0.1;
  }

  bgParticles.rotation.z += 0.005;
  bgParticles.rotation.x += 0.005;

  targetX = mouseX * 0.001;
  targetY = mouseY * 0.001;
  bgParticles.rotation.y += 0.5 * (targetX - bgParticles.rotation.y);

  if (transitionHappening) {
    camera.lookAt(mainObject.position);
  }

  clouds.position.x = Math.sin(elapsedTime * 0.5);

  clouds.position.z = Math.cos(elapsedTime * 0.1);

  mainObjectShadow.material.opacity = 0.7 - mainObject.position.y;
  // bgParticles.rotation.x += 0.5 * (targetY - bgParticles.rotation.x);

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
};

document.addEventListener("mousewheel", (e) => {
  // camera.position.z -= e.deltaY * 0.001;
});

let scrollPercent = 0;

document.body.onscroll = () => {
  //calculate the current scroll progress as a percentage
  scrollPercent =
    ((document.documentElement.scrollTop || document.body.scrollTop) /
      ((document.documentElement.scrollHeight || document.body.scrollHeight) -
        document.documentElement.clientHeight)) *
    100;
};

let viewNum = 0;
document.getElementById("next-view").addEventListener("click", (e) => {
  viewNum = (viewNum + 1) % 5;
  switchAnimation();
});

document.getElementById("prev-view").addEventListener("click", (e) => {
  viewNum = viewNum > 0 ? Math.abs((viewNum - 1) % 5) : -1;
  if (viewNum != -1) {
    switchAnimation();
  } else {
    viewNum = 0;
  }
});

let animateView0 = () => {
  gsap.to(camera.position, { y: 1, x: 0, z: 7 });
  camera.rotation.set(0, 0, 0);
  setTimeout(() => {
    innerObject.geometry = new THREE.IcosahedronGeometry(1, 1);

    gsap.to(innerObject.scale, { x: 1, y: 1, z: 1, duration: 1 });
    gsap.to(camera.position, { x: -2 });
    transitionHappening = false;
  }, 1000);
  gsap.to(innerObject.scale, { x: 0, y: 0, z: 0, duration: 1 });
};

let animateView1 = () => {
  transitionHappening = true;
  gsap.to(camera.position, { y: 8, x: 1, z: 0 });

  gsap.to(camera.position, { y: 5, x: 0, z: 3, delay: 1, duration: 1 });

  setTimeout(() => {
    innerObject.geometry = new THREE.TorusGeometry(0.75, 0.2, 16, 100);

    gsap.to(innerObject.scale, { x: 1, y: 1, z: 1, duration: 1 });
  }, 1000);
  gsap.to(innerObject.scale, { x: 0, y: 0, z: 0, duration: 1 });

  // hemisphereLight.color = new THREE.Color(0xff0000)
  // hemisphereLight.groundColor = new THREE.Color(0xff00ff)
  // console.log(directionalLight, hemisphereLight) // groundColor
  // console.log(directionalLight.color, hemisphereLight.color)
};

let animateView2 = () => {
  transitionHappening = true;
  gsap.to(camera.position, { y: 5, x: 0, z: -6 });
  gsap.to(camera.position, { y: 1, x: 0, z: -3, delay: 1, duration: 1 });

  setTimeout(() => {
    innerObject.geometry = new THREE.SphereGeometry(
      1,
      4,
      9,
      0,
      Math.PI * 2,
      Math.PI * 2,
      Math.PI * 2
    );

    gsap.to(innerObject.scale, { x: 1, y: 1, z: 1, duration: 1 });
  }, 1000);
  gsap.to(innerObject.scale, { x: 0, y: 0, z: 0, duration: 1 });
  // gsap.to(camera.position, { y: 3, x: 2, z: 0 });
  // gsap.to(camera.position, { y: 1, x: 7, z: 0, delay: 1, duration:1 });
};

let animateView3 = () => {
  transitionHappening = true;
  gsap.to(camera.position, { y: 2, x: -1.3, z: 2 });
  gsap.to(camera.position, { y: 1, x: -2, z: 5, delay: 1, duration: 1 });

  setTimeout(() => {
    innerObject.geometry = new THREE.OctahedronGeometry(1, 1);

    gsap.to(innerObject.scale, { x: 1, y: 1, z: 1, duration: 1 });
  }, 1000);
  gsap.to(innerObject.scale, { x: 0, y: 0, z: 0, duration: 1 });
};

let animateView4 = () => {
  gsap.to(camera.position, { y: 1, x: 0, z: 7 });

  setTimeout(() => {
    innerObject.geometry = new THREE.IcosahedronGeometry(1, 1);

    gsap.to(innerObject.scale, { x: 1, y: 1, z: 1, duration: 1 });

    transitionHappening = false;

    gsap.to(camera.position, { y: 1, x: 2 - offset, z: 7 });
  }, 1500);
  gsap.to(innerObject.scale, { x: 0, y: 0, z: 0, duration: 1 });
};

let switchAnimation = () => {
  if (viewNum == 0) {
    animateView0();
  } else if (viewNum == 1) {
    animateView1();
  } else if (viewNum == 2) {
    animateView2();
  } else if (viewNum == 3) {
    animateView3();
  } else if (viewNum == 4) {
    animateView4();
  }
};

// setInterval(() => {
//   document.getElementById("next-view").click();
// }, 4000);

let listenScroll = () => {
  if (scrollPercent > 0 && scrollPercent < 15 && viewNum != 0) {
    viewNum = 0;
    switchAnimation();
  } else if (scrollPercent > 20 && scrollPercent < 35 && viewNum != 1) {
    viewNum = 1;
    switchAnimation();
  } else if (scrollPercent > 45 && scrollPercent < 60 && viewNum != 2) {
    viewNum = 2;
    switchAnimation();
  } else if (scrollPercent > 60 && scrollPercent < 80 && viewNum != 3) {
    viewNum = 3;
    switchAnimation();
  } else if (scrollPercent > 85 && scrollPercent < 100 && viewNum != 4) {
    viewNum = 4;
    switchAnimation();
  }
};

setInterval(() => {
  listenScroll();
}, 500);


window.scrollTo({ top: 0, behavior: 'smooth' })
animate();