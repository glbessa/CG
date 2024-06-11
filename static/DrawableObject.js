class DrawableObject {
    constructor(gl, mat4, index_data, vertex_data, color_data, normal_data, texture_coords_data, texture, uniform_locations) {
        this.gl = gl;
        this.mat4 = mat4;
        this.data = {
            index: index_data,
            vertex: vertex_data,
            color: color_data,
            normal: normal_data
        };
        this.texture_coords_data = texture_coords_data;
        this.buffers = {
            vertex: this.gl.createBuffer(),
            color: this.gl.createBuffer()
        };
        this.transforms = {
            translation: this.mat4.create(),
            rotation: this.mat4.create(),
            scale: this.mat4.create(),
            resultant: this.mat4.create()
        };
        this.texture = texture;
        this.uniform_locations = uniform_locations;
    }

    apply_transforms() {
        this.mat4.multiply(this.transforms.resultant, this.transforms.translation, this.transforms.rotation);
        this.mat4.multiply(this.transforms.resultant, this.transforms.resultant, this.transforms.scale);
    }

    draw() {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.vertex);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.data.vertex), this.gl.STATIC_DRAW);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.color);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.data.color), this.gl.STATIC_DRAW);

        this.apply_transforms();
        this.gl.uniformMatrix4fv(this.uniform_locations.transforms_matrix, false, this.transforms.resultant);

        this.gl.drawArrays(this.gl.TRIANGLES, 0, this.data.vertex.length / 3);
        console.log(this.data.vertex);
    }
}