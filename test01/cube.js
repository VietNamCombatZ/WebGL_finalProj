const canvas = document.getElementById('glcanvas');
const gl = canvas.getContext('webgl');

if (!gl) {
    alert('WebGL not supported');
}

// --- Shader sources ---
const vertexShaderSource = `
attribute vec4 a_position;
uniform mat4 u_matrix;
void main() {
    gl_Position = u_matrix * a_position;
}
`;

const fragmentShaderSource = `
precision mediump float;
void main() {
    gl_FragColor = vec4(0.2, 0.6, 0.8, 1);
}
`;

// --- Compile shader ---
function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

// --- Create program ---
function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
    }
    return program;
}

// --- Create shaders ---
const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

// --- Create program ---
const program = createProgram(gl, vertexShader, fragmentShader);

// --- Look up attributes and uniforms ---
const positionLocation = gl.getAttribLocation(program, "a_position");
const matrixLocation = gl.getUniformLocation(program, "u_matrix");

// --- Define cube data ---
function createCubeVertices(a) {
    const s = a / 2;
    return new Float32Array([
        // Front
        -s, -s,  s,
         s, -s,  s,
         s,  s,  s,
        -s,  s,  s,
        // Back
        -s, -s, -s,
        -s,  s, -s,
         s,  s, -s,
         s, -s, -s,
        // Top
        -s,  s, -s,
        -s,  s,  s,
         s,  s,  s,
         s,  s, -s,
        // Bottom
        -s, -s, -s,
         s, -s, -s,
         s, -s,  s,
        -s, -s,  s,
        // Right
         s, -s, -s,
         s,  s, -s,
         s,  s,  s,
         s, -s,  s,
        // Left
        -s, -s, -s,
        -s, -s,  s,
        -s,  s,  s,
        -s,  s, -s,
    ]);
}

const indices = new Uint16Array([
    0, 1, 2,  0, 2, 3,    // front
    4, 5, 6,  4, 6, 7,    // back
    8, 9,10,  8,10,11,    // top
   12,13,14, 12,14,15,    // bottom
   16,17,18, 16,18,19,    // right
   20,21,22, 20,22,23,    // left
]);

// --- Create buffers ---
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

// nhập a
let a = parseFloat(prompt("Nhập cạnh a của lập phương:", "1"));
if (isNaN(a)) a = 1;
const cubeVertices = createCubeVertices(a);

gl.bufferData(gl.ARRAY_BUFFER, cubeVertices, gl.STATIC_DRAW);

const indexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

// --- Set up attributes ---
gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

// --- Ma trận cơ bản ---
function identityMatrix() {
    return [
        1,0,0,0,
        0,1,0,0,
        0,0,1,0,
        0,0,0,1
    ];
}

function myTranslate(tx, ty, tz) {
    const m = identityMatrix();
    m[12] = tx;
    m[13] = ty;
    m[14] = tz;
    console.log("Translate matrix:", m);
    return m;
}

function myScale(sx, sy, sz) {
    const m = identityMatrix();
    m[0] = sx;
    m[5] = sy;
    m[10] = sz;
    console.log("Scale matrix:", m);
    return m;
}

function myReflect() {
    const m = identityMatrix();
    m[0] = -1;
    m[5] = -1;
    m[10] = -1;
    console.log("Reflect matrix:", m);
    return m;
}

function multiplyMatrix(a, b) {
    const result = [];
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
            result[row*4 + col] = 0;
            for (let k = 0; k < 4; k++) {
                result[row*4 + col] += a[row*4 + k] * b[k*4 + col];
            }
        }
    }
    return result;
}

function myRotate(angleDegrees, xa, ya, xb, yb) {
    const angle = angleDegrees * Math.PI / 180;

    const dx = xb - xa;
    const dy = yb - ya;
    const len = Math.hypot(dx, dy);
    const ux = dx / len;
    const uy = dy / len;

    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const m = [
        cos + ux*ux*(1-cos),    ux*uy*(1-cos),        0, 0,
        ux*uy*(1-cos),          cos + uy*uy*(1-cos),  0, 0,
        0,                     0,                   1, 0,
        0,                     0,                   0, 1
    ];

    const toOrigin = myTranslate(-xa, -ya, 0);
    const back = myTranslate(xa, ya, 0);

    const combined = multiplyMatrix(back, multiplyMatrix(m, toOrigin));
    console.log("Rotate matrix:", combined);
    return combined;
}

// --- Combine transformations ---
let matrix = identityMatrix();
matrix = multiplyMatrix(matrix, myTranslate(0, 0, -5)); // Di chuyển ra xa

function drawScene() {
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    gl.useProgram(program);
    gl.uniformMatrix4fv(matrixLocation, false, new Float32Array(matrix));

    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
}

// --- Các nút ---
function applyTranslate() {
    const m = myTranslate(0.5, 0.5, 0);
    matrix = multiplyMatrix(m, matrix);
    drawScene();
}

function applyScale() {
    const m = myScale(1.2, 1.2, 1.2);
    matrix = multiplyMatrix(m, matrix);
    drawScene();
}

function applyReflect() {
    const m = myReflect();
    matrix = multiplyMatrix(m, matrix);
    drawScene();
}

function applyRotate() {
    const m = myRotate(30, 0, 0, 1, 1); // quay 30 độ quanh đường (0,0)-(1,1)
    matrix = multiplyMatrix(m, matrix);
    drawScene();
}

// --- Vẽ lần đầu ---
drawScene();
