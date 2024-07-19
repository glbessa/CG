const canvas = document.getElementById('canvas');
const gl = canvas.getContext('webgl2');

// Check if webgl is available
if (!gl) {
    console.log("WebGL2 not supported");
}

var start = null;
var fps = 30;
var secondsToNextFrame = 1 / fps;
var programInfo = null;

const objectsPath = {
    pineTree: [
        "./assets/PineTree_1.obj",
        "./assets/PineTree_2.obj",
        "./assets/PineTree_3.obj",
        "./assets/PineTree_4.obj"
    ],
    birchTree: [
        "./assets/BirchTree_1.obj",
        "./assets/BirchTree_2.obj",
        "./assets/BirchTree_3.obj",
    ],
    deadBirchTree: [
        "./assets/BirchTree_Dead_1.obj",
        "./assets/BirchTree_Dead_2.obj",
        "./assets/BirchTree_Dead_3.obj",
    ],
    palmTree: [
        "./assets/PalmTree_1.obj",
        "./assets/PalmTree_2.obj",
    ],
    commonTree: [
        "./assets/CommonTree_1.obj",
        "./assets/CommonTree_2.obj",
    ],
    cactus: [
        "./assets/Cactus_1.obj",
        "./assets/Cactus_2.obj",
    ],
    willow: [
        "./assets/Willow_1.obj",
        "./assets/Willow_2.obj",
        "./assets/Willow_3.obj",
    ],
    treeStump: [
        "./assets/TreeStump.obj",
        "./assets/TreeStump_Moss.obj",
    ],
    wheat: [
        "./assets/Wheat.obj",
    ],
    corn: [
        "./assets/Corn_1.obj",
        "./assets/Corn_2.obj",
    ],
    bush: [
        "./assets/Bush_1.obj",
        "./assets/Bush_2.obj",
        "./assets/BushBerries_1.obj",
        "./assets/BushBerries_2.obj",
    ],
    grass: [
        "./assets/Grass.obj",
        "./assets/Grass_2.obj",
        "./assets/Grass_Short.obj",
    ],
    flowers: [
        "./assets/Flowers.obj",
    ],
    plane: [
        "./assets/10450_Rectangular_Grass_Patch_v1_iterations-2.obj"
    ]
}
var objects = {}

// Chunks parameters
//var chunks = []
//const chunkSize = [100, 100, 100]
var mapObjects = []
var mapSize
var cellSize

// Procedural parameters
var seed
const limits = {
    birchTree: null,
    bush: null,
    commonTree: null,
    cactus: null,
    grass: null,
    palmTree: null,
    pineTree: null,
    empty: null
}

// Camera parameters
var zNear
var zFar
var cameraFieldOfView
var cameraPosition
var cameraTarget
var cameraSpeed

// Others parameters
const up = [0, 1, 0]
var aspect

// Controls
var initialMousePosition

function loadLimits() {
    limits.commonTree = parseInt(document.getElementById("commonTreeProb").value)
    limits.palmTree = parseInt(document.getElementById("palmTreeProb").value)
    limits.pineTree = parseInt(document.getElementById("pineTreeProb").value)
    limits.bush = parseInt(document.getElementById("bushProb").value)
    limits.birchTree = parseInt(document.getElementById("birchTreeProb").value)
    limits.cactus = parseInt(document.getElementById("cactusProb").value)
    limits.empty = parseInt(document.getElementById("emptyProb").value)
    limits.grass = parseInt(document.getElementById("grassProb").value)
    var sumLimits = 0
    var accLimits = 0
    for (var l in limits) {
        sumLimits += limits[l]
    }
    for (var l in limits) {
        limits[l] = limits[l] / sumLimits + accLimits
        accLimits = limits[l]
    }
    console.log("Limits loaded")
}

function generateMap() {
    const mainRng = new Math.seedrandom(seed)
    const objPosInCellRng = new Math.seedrandom(mainRng())
    const objSubTypeRng = new Math.seedrandom(mainRng())
    const objTypeRng = new Math.seedrandom(mainRng())

    mapF = Math.floor(mapSize / 2)
    var objs = []
    var pos
    var value

    objs.push({objectType: "plane", objectIdx: 0, position: [0, 0, -0.8], scale: [1, 1, 0.08], rotation: [0, 0, 0]})
    for (let i = -1 * mapF; i < mapF; i += cellSize) {
        for (let j = -1 * mapF; j < mapF; j += cellSize) {
            pos = [Math.ceil(objPosInCellRng.quick() * cellSize), Math.ceil(objPosInCellRng.quick() * cellSize)]
            //value = objTypeRng()
            value = (noise.simplex2(i, j) + 1) / 2
            
            if (value < limits.birchTree)
                objs.push({objectType: "birchTree", objectIdx: Math.floor(objects.birchTree.length * objSubTypeRng()), position: [pos[0] + i, pos[1] + j, 0], scale: [1, 1, 1], rotation: [degToRad(90), 0, 0]})
            else if (value < limits.bush)
                objs.push({objectType: "bush", objectIdx: Math.floor(objects.bush.length * objSubTypeRng()), position: [pos[0] + i, pos[1] + j, 0], scale: [1, 1, 1], rotation: [degToRad(90), 0, 0]})
            else if (value < limits.commonTree)
                objs.push({objectType: "commonTree", objectIdx: Math.floor(objects.commonTree.length * objSubTypeRng()), position: [pos[0] + i, pos[1] + j, 0], scale: [1, 1, 1], rotation: [degToRad(90), 0, 0]})
            else if (value < limits.cactus)
                objs.push({objectType: "cactus", objectIdx: Math.floor(objects.cactus.length * objSubTypeRng()), position: [pos[0] + i, pos[1] + j, 0], scale: [1, 1, 1], rotation: [degToRad(90), 0, 0]})
            else if (value < limits.grass)
                objs.push({objectType: "grass", objectIdx: Math.floor(objects.grass.length * objSubTypeRng()), position: [pos[0] + i, pos[1] + j, 0], scale: [1, 1, 1], rotation: [degToRad(90), 0, 0]})
            else if (value < limits.palmTree)
                objs.push({objectType: "palmTree", objectIdx: Math.floor(objects.palmTree.length * objSubTypeRng()), position: [pos[0] + i, pos[1] + j, 0], scale: [1, 1, 1], rotation: [degToRad(90), 0, 0]})
            else if (value < limits.pineTree)
                objs.push({objectType: "pineTree", objectIdx: Math.floor(objects.pineTree.length * objSubTypeRng()), position: [pos[0] + i, pos[1] + j, 0], scale: [1, 1, 1], rotation: [degToRad(90), 0, 0]})
            else if (value < limits.empty)
                continue
        }
    }

    console.log("Map generated")
    return objs
}

async function loadAllModels() {
    let objs = {}
    for (let objType in objectsPath) {
        objs[objType] = []
        for (let path of objectsPath[objType]) {
            await loadObjModel(gl, programInfo, path).then((data) => objs[objType].push(data))
        }
    }

    console.log("Models loaded")
    return objs
}

async function init() {
    twgl.resizeCanvasToDisplaySize(gl.canvas)
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
    gl.enable(gl.DEPTH_TEST)

    aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    loadLimits()

    twgl.setAttributePrefix("a_")

    var vertex_shader_source = await fetch("./shader.vert").then((response) => response.text()).then((data) => data);
    var fragment_shader_source = await fetch("./shader.frag").then((response) => response.text()).then((data) => data);

    programInfo = twgl.createProgramInfo(gl, [vertex_shader_source, fragment_shader_source]);
    gl.useProgram(programInfo.program);

    objects = await loadAllModels()
    mapObjects = generateMap()
}

function setupControls() {
    window.addEventListener("keydown", (event) => {
        switch (event.key) {
            case "w":
                moveForward()
                break;
            case "a":
                moveLeft()
                break;
            case "s":
                moveBackward()
                break;
            case "d":
                moveRight()
                break;
            case "q":
                moveDown()
                break
            case "e":
                moveUp()
                break
            case "ArrowUp":
                lookUp()
                break
            case "ArrowDown":
                lookDown()
                break
            case "ArrowRight":
                lookRight()
                break
            case "ArrowLeft":
                lookLeft()
                break
        }
    })
    window.addEventListener("mousedown", (event) => {
        initialMousePosition = [event.pageX, event.pageY]
    })
    window.addEventListener("mouseup", (event) => {
        const mouseMovement = [initialMousePosition[0] - event.pageX, initialMousePosition[1] - event.pageY]
    })
    window.addEventListener("wheel", (event) => {
        // Future zoom in and out
    })
    document.getElementById("txtSeed").addEventListener("change", (event) => {
        seed = parseInt(event.target.value)
    })
    document.getElementById("rgeMapSize").addEventListener("change", (event) => {
        mapSize = parseInt(event.target.value)
    })
    document.getElementById("rgeExparsability").addEventListener("change", (event) => {
        cellSize = parseInt(event.target.value)
        console.log(cellSize)
    })
    document.getElementById("btnGenerate").onclick = (e) => mapObjects = generateMap()
    document.getElementById("btnReset").onclick = (e) => resetCameraParameters()
    rgeProbs = document.getElementsByClassName("rgeProbs")
    for (let rge of rgeProbs)
        rge.onchange = (e) => loadLimits()
}

function moveForward() {
    cameraTarget[1] += cameraSpeed
    cameraPosition[1] += cameraSpeed
}

function moveBackward() {
    cameraTarget[1] -= cameraSpeed
    cameraPosition[1] -= cameraSpeed
}

function moveLeft() {
    cameraTarget[0] -= cameraSpeed
    cameraPosition[0] -= cameraSpeed
}

function moveRight() {
    cameraTarget[0] += cameraSpeed
    cameraPosition[0] += cameraSpeed
}

function moveDown() {
    cameraTarget[2] -= cameraSpeed
    cameraPosition[2] -= cameraSpeed
}

function moveUp() {
    cameraTarget[2] += cameraSpeed
    cameraPosition[2] += cameraSpeed
}

function lookUp() {
    cameraTarget[2] += cameraSpeed
}

function lookDown() {
    cameraTarget[2] -= cameraSpeed
}

function lookRight() {
    cameraTarget[1] += cameraSpeed
}

function lookLeft() {
    cameraTarget[1] -= cameraSpeed
}

function resetCameraParameters() {
    zNear = 1
    zFar = 100
    cameraFieldOfView = degToRad(90)
    cameraPosition = [0, 0, 3]
    cameraTarget = [0, 5, 0]
    cameraSpeed = 1
}

function loadMapParameters() {
    seed = parseInt(document.getElementById("txtSeed").value)
    mapSize = parseInt(document.getElementById("rgeMapSize").value)
    cellSize = parseInt(document.getElementById("rgeExparsability").value)
}

function render(timeStamp) {
    if (!start) start = timeStamp;
    var progress = timeStamp - start;

    if (progress > secondsToNextFrame * 100) {
        start = timeStamp;

		const projection = m4.perspective(cameraFieldOfView, aspect, zNear, zFar);
		const camera = m4.lookAt(cameraPosition, cameraTarget, up);
		const view = m4.inverse(camera);
    
        const sharedUniforms = {
            u_lightDirection: m4.normalize([-1, 3, 5]),
            u_view: view,
            u_projection: projection,
            u_viewWorldPosition: cameraPosition,
        };
    
        gl.useProgram(programInfo.program);
    
        twgl.setUniforms(programInfo, sharedUniforms);

        for (const {objectType, objectIdx, position, scale, rotation} of mapObjects) {
			renderObject(objectType, objectIdx, position, scale, rotation);
		}
    }
    
    window.requestAnimationFrame(render);
}

function renderObject(objectType, objectIdx, position, scale, rotation) {
    const { parts } = objects[objectType][objectIdx]

    var u_world = m4.translate(m4.identity(), ...position)
    u_world = m4.scale(u_world, ...scale)
    u_world = m4.xRotate(u_world, rotation[0])
    u_world = m4.yRotate(u_world, rotation[1])
    u_world = m4.zRotate(u_world, rotation[2])

    for (const {bufferInfo, vao, material} of parts) {
        gl.bindVertexArray(vao);
        twgl.setUniforms(programInfo, {
            u_world,
        }, material);

        twgl.drawBufferInfo(gl, bufferInfo);
    }
}

async function main() {
    resetCameraParameters()
    loadMapParameters()
    console.log(cellSize)
    await init();
    setupControls();
    window.requestAnimationFrame(render);
}

document.body.onload = main;
window.onresize = (event) => {
    twgl.resizeCanvasToDisplaySize(gl.canvas)
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
    gl.enable(gl.DEPTH_TEST)
	aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
}