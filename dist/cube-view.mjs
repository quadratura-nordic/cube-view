import Hammer from 'hammerjs';
import { openBlock, createElementBlock, createElementVNode, createCommentVNode } from 'vue';

function normalize(v) {
    let length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    // make sure we don't divide by 0.
    if (length > 0.00001) {
        return [v[0] / length, v[1] / length, v[2] / length];
    } else {
        return [0, 0, 0];
    }
}

function subtractVectors(a, b) {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function cross(a, b) {
    return [a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0]];
}

class Matrix {

    translation(tx, ty, tz) {
        return [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            tx, ty, tz, 1,
        ];
    }

    xRotation(angleInRadians) {
        let c = Math.cos(angleInRadians);
        let s = Math.sin(angleInRadians);

        return [
            1, 0, 0, 0,
            0, c, s, 0,
            0, -s, c, 0,
            0, 0, 0, 1,
        ];
    }

    yRotation(angleInRadians) {
        let c = Math.cos(angleInRadians);
        let s = Math.sin(angleInRadians);

        return [
            c, 0, -s, 0,
            0, 1, 0, 0,
            s, 0, c, 0,
            0, 0, 0, 1,
        ];
    }

    zRotation(angleInRadians) {
        let c = Math.cos(angleInRadians);
        let s = Math.sin(angleInRadians);

        return [
            c, s, 0, 0,
            -s, c, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        ];
    }

    scaling(sx, sy, sz) {
        return [
            sx, 0, 0, 0,
            0, sy, 0, 0,
            0, 0, sz, 0,
            0, 0, 0, 1,
        ];
    }

    translate(m, tx, ty, tz) {
        return this.multiply(m, this.translation(tx, ty, tz));
    }

    xRotate(m, angleInRadians) {
        return this.multiply(m, this.xRotation(angleInRadians));
    }

    yRotate(m, angleInRadians) {
        return this.multiply(m, this.yRotation(angleInRadians));
    }

    zRotate(m, angleInRadians) {
        return this.multiply(m, this.zRotation(angleInRadians));
    }

    scale(m, sx, sy, sz) {
        return this.multiply(m, this.scaling(sx, sy, sz));
    }

    lookAt(cameraPosition, target, up) {
        let zAxis = normalize(
            subtractVectors(cameraPosition, target));
        let xAxis = cross(up, zAxis);
        let yAxis = cross(zAxis, xAxis);

        return [
            xAxis[0], xAxis[1], xAxis[2], 0,
            yAxis[0], yAxis[1], yAxis[2], 0,
            zAxis[0], zAxis[1], zAxis[2], 0,
            cameraPosition[0],
            cameraPosition[1],
            cameraPosition[2],
            1,
        ];
    }

    perspective(fieldOfViewInRadians, aspect, near, far) {
        let f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewInRadians);
        let rangeInv = 1.0 / (near - far);

        return [
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (near + far) * rangeInv, -1,
            0, 0, near * far * rangeInv * 2, 0
        ];
    }

    vectorMultiply(v, m) {
        let dst = [];
        for (let i = 0; i < 4; ++i) {
            dst[i] = 0.0;
            for (let j = 0; j < 4; ++j)
                dst[i] += v[j] * m[j * 4 + i];
        }
        return dst;
    }

    inverse(m) {
        let m00 = m[0 * 4 + 0];
        let m01 = m[0 * 4 + 1];
        let m02 = m[0 * 4 + 2];
        let m03 = m[0 * 4 + 3];
        let m10 = m[1 * 4 + 0];
        let m11 = m[1 * 4 + 1];
        let m12 = m[1 * 4 + 2];
        let m13 = m[1 * 4 + 3];
        let m20 = m[2 * 4 + 0];
        let m21 = m[2 * 4 + 1];
        let m22 = m[2 * 4 + 2];
        let m23 = m[2 * 4 + 3];
        let m30 = m[3 * 4 + 0];
        let m31 = m[3 * 4 + 1];
        let m32 = m[3 * 4 + 2];
        let m33 = m[3 * 4 + 3];
        let tmp_0 = m22 * m33;
        let tmp_1 = m32 * m23;
        let tmp_2 = m12 * m33;
        let tmp_3 = m32 * m13;
        let tmp_4 = m12 * m23;
        let tmp_5 = m22 * m13;
        let tmp_6 = m02 * m33;
        let tmp_7 = m32 * m03;
        let tmp_8 = m02 * m23;
        let tmp_9 = m22 * m03;
        let tmp_10 = m02 * m13;
        let tmp_11 = m12 * m03;
        let tmp_12 = m20 * m31;
        let tmp_13 = m30 * m21;
        let tmp_14 = m10 * m31;
        let tmp_15 = m30 * m11;
        let tmp_16 = m10 * m21;
        let tmp_17 = m20 * m11;
        let tmp_18 = m00 * m31;
        let tmp_19 = m30 * m01;
        let tmp_20 = m00 * m21;
        let tmp_21 = m20 * m01;
        let tmp_22 = m00 * m11;
        let tmp_23 = m10 * m01;

        let t0 = (tmp_0 * m11 + tmp_3 * m21 + tmp_4 * m31) -
            (tmp_1 * m11 + tmp_2 * m21 + tmp_5 * m31);
        let t1 = (tmp_1 * m01 + tmp_6 * m21 + tmp_9 * m31) -
            (tmp_0 * m01 + tmp_7 * m21 + tmp_8 * m31);
        let t2 = (tmp_2 * m01 + tmp_7 * m11 + tmp_10 * m31) -
            (tmp_3 * m01 + tmp_6 * m11 + tmp_11 * m31);
        let t3 = (tmp_5 * m01 + tmp_8 * m11 + tmp_11 * m21) -
            (tmp_4 * m01 + tmp_9 * m11 + tmp_10 * m21);

        let d = 1.0 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3);

        return [
            d * t0,
            d * t1,
            d * t2,
            d * t3,
            d * ((tmp_1 * m10 + tmp_2 * m20 + tmp_5 * m30) -
                (tmp_0 * m10 + tmp_3 * m20 + tmp_4 * m30)),
            d * ((tmp_0 * m00 + tmp_7 * m20 + tmp_8 * m30) -
                (tmp_1 * m00 + tmp_6 * m20 + tmp_9 * m30)),
            d * ((tmp_3 * m00 + tmp_6 * m10 + tmp_11 * m30) -
                (tmp_2 * m00 + tmp_7 * m10 + tmp_10 * m30)),
            d * ((tmp_4 * m00 + tmp_9 * m10 + tmp_10 * m20) -
                (tmp_5 * m00 + tmp_8 * m10 + tmp_11 * m20)),
            d * ((tmp_12 * m13 + tmp_15 * m23 + tmp_16 * m33) -
                (tmp_13 * m13 + tmp_14 * m23 + tmp_17 * m33)),
            d * ((tmp_13 * m03 + tmp_18 * m23 + tmp_21 * m33) -
                (tmp_12 * m03 + tmp_19 * m23 + tmp_20 * m33)),
            d * ((tmp_14 * m03 + tmp_19 * m13 + tmp_22 * m33) -
                (tmp_15 * m03 + tmp_18 * m13 + tmp_23 * m33)),
            d * ((tmp_17 * m03 + tmp_20 * m13 + tmp_23 * m23) -
                (tmp_16 * m03 + tmp_21 * m13 + tmp_22 * m23)),
            d * ((tmp_14 * m22 + tmp_17 * m32 + tmp_13 * m12) -
                (tmp_16 * m32 + tmp_12 * m12 + tmp_15 * m22)),
            d * ((tmp_20 * m32 + tmp_12 * m02 + tmp_19 * m22) -
                (tmp_18 * m22 + tmp_21 * m32 + tmp_13 * m02)),
            d * ((tmp_18 * m12 + tmp_23 * m32 + tmp_15 * m02) -
                (tmp_22 * m32 + tmp_14 * m02 + tmp_19 * m12)),
            d * ((tmp_22 * m22 + tmp_16 * m02 + tmp_21 * m12) -
                (tmp_20 * m12 + tmp_23 * m22 + tmp_17 * m02))
        ];
    }


    multiply(a, b) {
        let a00 = a[0 * 4 + 0];
        let a01 = a[0 * 4 + 1];
        let a02 = a[0 * 4 + 2];
        let a03 = a[0 * 4 + 3];
        let a10 = a[1 * 4 + 0];
        let a11 = a[1 * 4 + 1];
        let a12 = a[1 * 4 + 2];
        let a13 = a[1 * 4 + 3];
        let a20 = a[2 * 4 + 0];
        let a21 = a[2 * 4 + 1];
        let a22 = a[2 * 4 + 2];
        let a23 = a[2 * 4 + 3];
        let a30 = a[3 * 4 + 0];
        let a31 = a[3 * 4 + 1];
        let a32 = a[3 * 4 + 2];
        let a33 = a[3 * 4 + 3];
        let b00 = b[0 * 4 + 0];
        let b01 = b[0 * 4 + 1];
        let b02 = b[0 * 4 + 2];
        let b03 = b[0 * 4 + 3];
        let b10 = b[1 * 4 + 0];
        let b11 = b[1 * 4 + 1];
        let b12 = b[1 * 4 + 2];
        let b13 = b[1 * 4 + 3];
        let b20 = b[2 * 4 + 0];
        let b21 = b[2 * 4 + 1];
        let b22 = b[2 * 4 + 2];
        let b23 = b[2 * 4 + 3];
        let b30 = b[3 * 4 + 0];
        let b31 = b[3 * 4 + 1];
        let b32 = b[3 * 4 + 2];
        let b33 = b[3 * 4 + 3];
        return [
            b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30,
            b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31,
            b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32,
            b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33,
            b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30,
            b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31,
            b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32,
            b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33,
            b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30,
            b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31,
            b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32,
            b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33,
            b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30,
            b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31,
            b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32,
            b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33,
        ];
    }
}

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

class CubeMap {

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

var script = {
        props: ['images'],
        data() {
            return {
                imageCount: 6,
                imagesLoaded: false,
                cube: null,
                rotate: {
                    X: -15.4,
                    Y: 1.125,
                    start: {
                        X: null,
                        Y: null
                    },
                    compass: {
                        X: 0,
                        Y: 0
                    },
                    compassStart: {
                        X: null,
                        Y: null
                    }
                },
                orientation: null
            }
        },
        mounted() {
            this.cube = new CubeMap();
            this.reset();
            this.setupPan();
            this.setupCompass();
        },
        watch: {
            images() {
                this.reset();
            }
        },
        methods: {
            setupPan() {
                let stage = this.$refs.stage;
                let mc = new Hammer.Manager(stage);
                let pan = new Hammer.Pan();
                mc.add(pan);
                mc.on('panstart', () => {
                    this.rotate.start.Y = this.rotate.Y;
                    this.rotate.start.X = this.rotate.X;
                });
                mc.on('pan', (e) => {
                    var multi = 100 / e.target.clientWidth;
                    this.rotate.Y = this.rotate.start.Y + e.deltaX * multi;
                    this.rotate.X = this.rotate.start.X + e.deltaY * multi;
                    this.cube.render(this.rotate.compass.Y - this.rotate.compassStart.Y + this.rotate.Y, this.rotate.compass.X - this.rotate.compassStart.X + this.rotate.X);
                });
                mc.on('panend', () => {
                    this.rotate.start.Y = this.rotate.Y;
                    this.rotate.start.X = this.rotate.X;
                });
            },
            setupCompass() {
                if (screen && screen.orientation) {
                    this.orientation = screen.orientation.angle;
                } else {
                    this.orientation = window.orientation;
                }
                window.addEventListener("orientationchange", () => {
                    // Announce the new orientation number
                    if (screen && screen.orientation) {
                        this.orientation = screen.orientation.angle;
                    } else {
                        this.orientation = window.orientation;
                    }
                }, false);
                window.addEventListener('deviceorientation', (e) => {
                    let Y = e.alpha;
                    let X = e.beta;
                    let Z = e.gamma;
                    if (Z < 0 && this.orientation !== 0) {
                        this.rotate.compass.Y = Y;
                    } else {
                        this.rotate.compass.Y = 180 + Y;
                    }
                    if (this.orientation === 0) {
                        this.rotate.compass.X = 2 * (X - 45);
                    } else if (this.orientation === 270 || this.orientation === -90) {
                        this.rotate.compass.X = 2 * (Z - 90);
                    } else if (this.orientation === 90) {
                        this.rotate.compass.X = 2 * (-Z - 90);
                    }
                    if (this.rotate.compassStart.X == null || this.rotate.compassStart.Y == null) {
                        this.rotate.compassStart.X = this.rotate.compass.X;
                        this.rotate.compassStart.Y = this.rotate.compass.Y;
                    }
                    if (this.imagesLoaded) {
                        this.cube.render(this.rotate.compass.Y - this.rotate.compassStart.Y + this.rotate.Y, this.rotate.compass.X - this.rotate.compassStart.X + this.rotate.X);
                    }
                });
            },
            reset() {
                if (this.$refs.canvas) {
                    this.cube.init(this.$refs.canvas);
                    this.cube.render();
                    let count = 0;
                    let images = [];
                    let loadImage = (src, index) => {
                        let img = new Image();
                        img.onload = () => {
                            count++;
                            images[index] = img;
                            if (count === 6) {
                                this.imagesLoaded = true;
                                this.cube.init(this.$refs.canvas, images);
                                this.cube.render(this.rotate.compass.Y - this.rotate.compassStart.Y + this.rotate.Y, this.rotate.compass.X - this.rotate.compassStart.X + this.rotate.X);
                            }
                        };
                        img.crossOrigin = "";
                        img.src = src;
                    };
                    if (this.images) {
                        for (let key in this.images) {
                            loadImage(this.images[key], key);
                        }
                    }
                }
            }
        }
    };

const _hoisted_1 = {
  class: "load stage",
  ref: "stage"
};
const _hoisted_2 = {
  class: "canvas",
  width: "1260",
  height: "654",
  style: {"width":"100%","margin":"0","display":"block"},
  ref: "canvas"
};
const _hoisted_3 = { key: 0 };
const _hoisted_4 = /*#__PURE__*/createElementVNode("div", { class: "loader" }, null, -1 /* HOISTED */);
const _hoisted_5 = [
  _hoisted_4
];

function render(_ctx, _cache, $props, $setup, $data, $options) {
  return (openBlock(), createElementBlock("div", _hoisted_1, [
    createElementVNode("canvas", _hoisted_2, null, 512 /* NEED_PATCH */),
    (!$data.imagesLoaded)
      ? (openBlock(), createElementBlock("div", _hoisted_3, _hoisted_5))
      : createCommentVNode("v-if", true)
  ], 512 /* NEED_PATCH */))
}

script.render = render;
script.__file = "src/components/CubeView.vue";

export { script as default };
