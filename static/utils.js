function resize_canvas_to_display_size(canvas) {
    // Lookup the size the browser is displaying the canvas in CSS pixels.
    const displayWidth  = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;
    
    // Check if the canvas is not the same size.
    const needResize = canvas.width  !== displayWidth || canvas.height !== displayHeight;
    
    if (needResize) {
        // Make the canvas the same size
        canvas.width  = displayWidth;
        canvas.height = displayHeight;
    }
    
    return needResize;
}

function clear_gl_canvas(gl) {
    resize_canvas_to_display_size(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.clearColor(1, 1, 1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
}

function createShader(gl, type, source) {
    var shader = gl.createShader(type);
    
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
        return shader;
    }

    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
}

function createProgram(gl, vertex_shader, fragment_shader) {
    var program = gl.createProgram();
    
    gl.attachShader(program, vertex_shader);
    gl.attachShader(program, fragment_shader);
    gl.linkProgram(program);

    var success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
        return program;
    }

    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
}

function randomInt(start, stop) {
    return Math.floor(Math.random() * stop) + start;
}

function degToRad(deg) {
    return deg * Math.PI / 180;
}

function calculateBoundingSphere(objs) {
	let min = [Infinity, Infinity, Infinity];
	let max = [-Infinity, -Infinity, -Infinity];
  
	objs.forEach(obj => {
	  min = min.map((value, index) => Math.min(value, obj.extents.min[index]));
	  max = max.map((value, index) => Math.max(value, obj.extents.max[index]));
	});
  
	const center = min.map((min, index) => (min + max[index]) / 2);
	const radius = Math.sqrt(max.reduce((acc, max, index) => {
	  const distance = max - center[index];
	  return acc + distance * distance;
	}, 0));
  
	return { center, radius };
}