import './gl-matrix-min.js';
const { mat2, mat2d, mat4, mat3, quat, quat2, vec2, vec3, vec4 } = glMatrix;

class DrawableObject {
    constructor(vertex_data) {
        this.centroid = vec2.create();
        this.data = {
            vertex: vertex_data,
        };
        this.transforms = mat4.create();
    }

    set_buffers(gl) {
        throw new Error('You have to implement the method set_buffers!');
    }

    draw(gl) {
        throw new Error('You have to implement the method draw!');
    }

    calculate_centroid() {
        let centroid = vec2.create();
        for (let i = 0; i < this.data.vertex.length; i++) {
            vec2.add(centroid, centroid, this.data.vertex[i]);
        }
        vec2.scale(centroid, centroid, 1 / this.data.vertex.length);
        this.centroid = centroid;
    }

    apply_transforms() {
        mat4.multiply(this.transforms.resultant, this.transforms.translation, this.transforms.rotation);
        mat4.multiply(this.transforms.resultant, this.transforms.resultant, this.transforms.scale);
    }
}

class SimpleDrawableObject extends DrawableObject {
    constructor(vertex_data, color_data) {
        super(vertex_data);
        this.data.color = color_data;
    }

    set_buffers(gl, buffers) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertex);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.data.vertex), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.data.color), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.object_transforms[0]);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.transforms.slice(0, 4)), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.object_transforms[1]);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.transforms.slice(4, 7)), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.object_transforms[2]);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.transforms.slice(7, 11)), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.object_transforms[3]);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.transforms.slice(11, 16)), gl.STATIC_DRAW);
    }

    draw(gl, buffers) {
        //this.apply_transforms();

        this.set_buffers(gl, buffers);

        var primitive_type = gl.TRIANGLES;
        var offset = 0;
        var count = this.data.vertex.length / 3;
        gl.drawArrays(primitive_type, offset, count);
    }
}

class SimpleDrawableObjectFactory {
    constructor(gl) {
        this.gl = gl;
    }

    create_triangle(position, size, color) {
        let vertex_data = [
            position[0], position[1], 0,
            position[0] + size, position[1], 0,
            position[0] + size / 2, position[1] + size, 0
        ];

        let color_data = [];
        for (let i = 0; i < 3; i++) {
            color_data.push(color[0]);
            color_data.push(color[1]);
            color_data.push(color[2]);
        }

        return new SimpleDrawableObject(vertex_data, color_data);
    }

    create_rectangle(position, width, height, color) {
        let vertex_data = [
            position[0], position[1], 0,
            position[0] + width, position[1], 0,
            position[0], position[1] + height, 0,
            position[0] + width, position[1], 0,
            position[0] + width, position[1] + height, 0,
            position[0], position[1] + height, 0
        ];

        let color_data = [];
        for (let i = 0; i < 6; i++) {
            color_data.push(color[0], color[1], color[2]);
        }

        return new SimpleDrawableObject(vertex_data, color_data);
    }
}

class CompleteDrawableObject extends SimpleDrawableObject {
    constructor(vertex_data, color_data, normals_data, texture_data, texture) {
        super(vertex_data, color_data);

        this.data.normal = normals_data;
        this.data.texture = texture_data;

        this.buffers.normal = null;
        this.buffers.texture = null;
        
        this.texture = texture;
    }

    init_buffers(gl) {
        this.buffers.vertex = gl.createBuffer();
        this.buffers.color = gl.createBuffer();
        this.buffers.normal = gl.createBuffer();
        this.buffers.texture = gl.createBuffer();
        this.buffers.transforms = gl.createBuffer();
    }

    set_buffers(gl) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.vertex);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.data.vertex), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.color);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.data.color), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.normal);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.data.normal), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.texture);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.data.texture), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.transforms);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.data.transforms), gl.STATIC_DRAW);
    }

    draw(gl) {
        this.apply_transforms();

        this.set_buffers(gl);

        var primitive_type = gl.TRIANGLES;
        var offset = 0;
        var count = this.data.vertex.length / 3;
        gl.drawArrays(primitive_type, offset, count);
    }
}

export { DrawableObject, SimpleDrawableObject, SimpleDrawableObjectFactory, CompleteDrawableObject };