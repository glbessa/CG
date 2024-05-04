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

function create_shader(gl, type, source) {
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

function create_program(gl, vertex_shader, fragment_shader) {
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

function set_triangule(gl, vertex_data) {
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertex_data), gl.STATIC_DRAW);
}

function set_rectangle(gl, x, y, width, height) {
    var x1 = x;
    var x2 = x + width;
    var y1 = y;
    var y2 = y + height;
    
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        x1, y1,
        x2, y1,
        x1, y2,
        x1, y2,
        x2, y1,
        x2, y2,
    ]), gl.STATIC_DRAW);
}

function random_int(start, stop) {
    return Math.floor(Math.random() * stop) + start;
}

class DrawableObject {
    constructor(gl, program, vertex_data) {
        this.gl = gl;
        this.program = program;
        this.vertex_data = vertex_data;
        this.buffer = gl.createBuffer();
    }

    

    draw() {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
        set_triangule(this.gl, this.vertex_data);
        this.gl.drawArrays(this.gl.TRIANGLES, 0, this.vertex_data.length / 2);
    }
}