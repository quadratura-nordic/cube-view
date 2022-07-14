import Matrix from './matrix';

function degToRad(deg) {
    return Math.PI * deg / 180;
}

function createShader(gl, type, source) {
    let shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    let success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
        return shader;
    }
    gl.deleteShader(shader);
}

function createProgram(gl, vertexShader, fragmentShader) {
    let program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    let success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
        return program;
    }
    gl.deleteProgram(program);
}

export default class CubeMap {

    constructor() {
        this.gl = null;
        this.positionAttributeLocation = null;
        this.texAttributeLocation = null;
        this.positionBuffer = null;
        this.textures = null;
        this.imgAddr = null;
        this.texPosBuffer = null;
        this.m4 = new Matrix();
        this.matrixLocation = null;
    }


    init(canvas, images) {
        if(!canvas){
            return;
        }
        let gl = canvas.getContext("webgl");
        if (!gl) {
            gl = canvas.getContext("experimental-webgl");
        }
        if (!gl) {
            return;
        }
        this.gl = gl;
        let vertexShaderText = `
        attribute vec4 a_position;
        attribute vec2 a_tex;
        varying vec2 v_tex;
        uniform mat4 u_matrix;
        uniform mat4 u_pmatrix;
  void main() {
    gl_Position = u_pmatrix * u_matrix * a_position;
    v_tex = a_tex;
  }`;

        let fragmentShaderText = `
        precision highp float;
        varying vec2 v_tex;
        uniform sampler2D u_image;
  void main() {
    gl_FragColor = texture2D(u_image, v_tex);
  }`;


        let vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderText);
        let fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderText);

        let program = createProgram(gl, vertexShader, fragmentShader);


        this.positionAttributeLocation = gl.getAttribLocation(program, "a_position");
        this.texAttributeLocation = gl.getAttribLocation(program, "a_tex");
        this.matrixLocation = gl.getUniformLocation(program, "u_matrix");

        this.imgAddr = gl.getUniformLocation(program, "u_image");

        let size = 0.5;
        let positions = [
            /*front*/
            -size, size, -size,
            size, size, -size,
            -size, -size, -size,
            size, -size, -size,
            /*back*/
            size, size, size,
            -size, size, size,
            size, -size, size,
            -size, -size, size,
            /*left*/
            -size, size, size,
            -size, size, -size,
            -size, -size, size,
            -size, -size, -size,
            /*right*/
            size, size, -size,
            size, size, size,
            size, -size, -size,
            size, -size, size,
            /*top*/
            -size, size, size,
            size, size, size,
            -size, size, -size,
            size, size, -size,
            /*bottom*/
            -size, -size, -size,
            size, -size, -size,
            -size, -size, size,
            size, -size, size,
        ];

        let texAr = [0, 0, 1, 0, 0, 1, 1, 1];
        let textPos = [...texAr, ...texAr, ...texAr, ...texAr, ...texAr, ...texAr];

        gl.depthFunc(gl.LEQUAL);
        this.positionBuffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

        this.texPosBuffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, this.texPosBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textPos), gl.STATIC_DRAW);

        this.textures = [];
        if (images) {
            for (let i = 0; i < images.length; i++) {
                let img = images[i];
                let texture = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_2D, texture);

                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
                this.textures.push(texture);
            }
        }

        gl.useProgram(program);

        let projectionMatrixLocation = gl.getUniformLocation(program, "u_pmatrix");

        let aspect = gl.canvas.width / gl.canvas.height;
        let zNear = 0.01;
        let zFar = 1;
        let projectionMatrix = this.m4.perspective(Math.PI / 3, aspect, zNear, zFar);

        //let angleInRadians = 1;
        //let c = Math.cos(angleInRadians);
        //let s = Math.sin(angleInRadians);


        let lookAtPos = [0, 0, -size / 2];
        let cameraPos = [0, 0, 0];
        let up = [0, 1, 0];

        let cameraMatrix = this.m4.inverse(this.m4.lookAt(cameraPos, lookAtPos, up));

        gl.uniformMatrix4fv(projectionMatrixLocation, false, this.m4.multiply(projectionMatrix, cameraMatrix));
        gl.clearColor(0, 0, 0, 0);
    }


    render(rotY, rotX) {
        let gl = this.gl;
        if (!gl) {
            return;
        }
        let transformMatrix = this.m4.xRotation(degToRad(-rotX));
        transformMatrix = this.m4.yRotate(transformMatrix, degToRad(-rotY));

        gl.uniformMatrix4fv(this.matrixLocation, false, transformMatrix);

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.enableVertexAttribArray(this.positionAttributeLocation);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);

        {
            let size = 3;          // 2 components per iteration
            let type = gl.FLOAT;   // the data is 32bit floats
            let normalize = false; // don't normalize the data
            let stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
            let offset = 0;        // start at the beginning of the buffer
            gl.vertexAttribPointer(this.positionAttributeLocation, size, type, normalize, stride, offset);
        }


        gl.enableVertexAttribArray(this.texAttributeLocation);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.texPosBuffer);

        {
            let size = 2;          // 2 components per iteration
            let type = gl.FLOAT;   // the data is 32bit floats
            let normalize = false; // don't normalize the data
            let stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
            let offset = 0;        // start at the beginning of the buffer
            gl.vertexAttribPointer(this.texAttributeLocation, size, type, normalize, stride, offset);
        }


        for (let i = 0; i < this.textures.length; i++) {
            let unit = 5 + i;  // Pick some texture unit
            gl.activeTexture(gl.TEXTURE0 + unit);
            gl.uniform1i(this.imgAddr, unit);
            gl.bindTexture(gl.TEXTURE_2D, this.textures[i]);
            let primitiveType = gl.TRIANGLE_STRIP;
            let offset = i * 4;
            let count = 4;
            gl.drawArrays(primitiveType, offset, count);
        }

    }
}