import '../static/gl-matrix-min.js';
const { mat2, mat2d, mat4, mat3, quat, quat2, vec2, vec3, vec4 } = glMatrix;



const canvas = document.getElementById('canvas');
const gl = canvas.getContext('webgl2');

// Check if webgl is available
if (!gl) {
    console.log("WebGL2 not supported");
}

var start = null;
var fps = 30;
var secondsToNextFrame = 1 / fps;
var vao = null;
var programInfo = null;

var objectsPath = [
    "./assets/dead_tree.obj",
    "./assets/grass.obj",
    "./assets/large_rock.obj",
    "./assets/little_bush.obj",
    "./assets/pine.obj",
    "./assets/small_rock.obj",
    "./assets/snow_pine.obj",
    "./assets/tree1.obj",
    "./assets/tree2.obj",
    "./assets/tree3.obj"
]
var objects = [];
// Chunk size
const chunkSize = vec3.create([100, 100, 100]);
const { center, radius } = calculateBoundingSphere(objects);
const zNear = radius / 100;
const zFar = radius * 50;
var worldMatrix = [];
var worldLength = 10;
var worldCenter = [worldLength / 2, 0, worldLength / 2];
var cameraAngle = [0, 0]; // Horizontal angle, Vertical angle
var cameraDistance = radius * 2; // Initial distance from the center
var cameraPosition = null;
let cameraTarget = worldCenter;
var cameraSpeed = 0.1;

async function init() {
    var vertex_shader_source = await fetch("./shader.vert").then((response) => response.text()).then((data) => data);
    var fragment_shader_source = await fetch("./shader.frag").then((response) => response.text()).then((data) => data);

    programInfo = twgl.createProgramInfo(gl, [vertex_shader_source, fragment_shader_source]);
    objects = await Promise.all(objectsPath.map(async (path) => await loadObjModel(gl, programInfo, path)));

    [ center, radius ] = calculateBoundingSphere(objects);
    zNear = radius / 100;
    zFar = radius * 50;
    cameraAngle = [0, 0]; // Horizontal angle, Vertical angle
    cameraDistance = radius * 2; // Initial distance from the center
    cameraPosition = [(worldLength / 2), 10, (worldLength / 2) + cameraDistance];
    cameraSpeed = 0.1;

    gl.useProgram(programInfo.program);

    gl.uniform2f(uniform_locations.screen_resolution, gl.canvas.width, gl.canvas.height);
    gl.uniformMatrix4fv(uniform_locations.camera_transforms, false, mat4.create());

    clear_gl_canvas(gl);
}

function animate(timeStamp) {
    if (!start) start = timeStamp;
    var progress = timeStamp - start;

    if (progress > secondsToNextFrame * 100) {
        start = timeStamp;

        twgl.resizeCanvasToDisplaySize(gl.canvas);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.enable(gl.DEPTH_TEST);

        const fieldOfViewRadians = degToRad(60);
        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const projection = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);   
    
        const up = [0, 1, 0];
        const camera = m4.lookAt(cameraPosition, cameraTarget, up);
        const view = m4.inverse(camera);
    
        const sharedUniforms = {
            u_lightDirection: m4.normalize([-1, 3, 5]),
            u_view: view,
            u_projection: projection,
            u_viewWorldPosition: cameraPosition,
        };
    
        gl.useProgram(meshProgramInfo.program);
    
        twgl.setUniforms(meshProgramInfo, sharedUniforms);

        for (const {obj, position} of worldMatrix) {
			drawObject(obj, position);
		}
    }
    
    window.requestAnimationFrame(animate);
}

function drawObject(object, position) {
    const { parts } = obj;

    let u_world = m4.identity();
    u_world = m4.translate(u_world, ...position);

    for (const {bufferInfo, vao, material} of parts) {
        gl.bindVertexArray(vao);
        twgl.setUniforms(meshProgramInfo, {
            u_world,
        }, material);

        twgl.drawBufferInfo(gl, bufferInfo);
    }
}

function generateChunk(position) {

}

function main() {
    resize_canvas_to_display_size(gl.canvas);
    init();
    window.requestAnimationFrame(animate);
}

document.body.onload = main;
window.onresize = (event) => resize_canvas_to_display_size(gl.canvas)