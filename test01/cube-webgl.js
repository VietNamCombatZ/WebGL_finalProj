// cube-webgl.js

let canvas, gl;
let shaderProgram;
let vertexBuffer, indexBuffer;
let matrixUniform;

let modelMatrix = mat4.create();
mat4.identity(modelMatrix);

function loadGL() {
  canvas = document.getElementById('glcanvas');
  gl = canvas.getContext('webgl');

  if (!gl) {
    alert('WebGL not supported!');
    return;
  }

  initShaders();
  initBuffers();
  drawScene();
}

function initShaders() {
  const vsSource = `
    attribute vec3 coordinates;
    uniform mat4 uMatrix;
    void main(void) {
      gl_Position = uMatrix * vec4(coordinates, 1.0);
    }
  `;

  const fsSource = `
    void main(void) {
      gl_FragColor = vec4(0.5, 0.8, 1.0, 1.0);
    }
  `;

  const vertShader = compileShader(gl.VERTEX_SHADER, vsSource);
  const fragShader = compileShader(gl.FRAGMENT_SHADER, fsSource);

  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertShader);
  gl.attachShader(shaderProgram, fragShader);
  gl.linkProgram(shaderProgram);
  gl.useProgram(shaderProgram);

  shaderProgram.coord = gl.getAttribLocation(shaderProgram, "coordinates");
  gl.enableVertexAttribArray(shaderProgram.coord);

  matrixUniform = gl.getUniformLocation(shaderProgram, "uMatrix");
}

function compileShader(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
}

function initBuffers() {
  const vertices = [
    -0.5, -0.5, -0.5,  // 0
     0.5, -0.5, -0.5,  // 1
     0.5,  0.5, -0.5,  // 2
    -0.5,  0.5, -0.5,  // 3
    -0.5, -0.5,  0.5,  // 4
     0.5, -0.5,  0.5,  // 5
     0.5,  0.5,  0.5,  // 6
    -0.5,  0.5,  0.5   // 7
  ];

  const indices = [
    0, 1, 2, 0, 2, 3,  // back
    4, 5, 6, 4, 6, 7,  // front
    0, 1, 5, 0, 5, 4,  // bottom
    3, 2, 6, 3, 6, 7,  // top
    0, 3, 7, 0, 7, 4,  // left
    1, 2, 6, 1, 6, 5   // right
  ];

  vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
}

// Transformation functions (based on your C algorithms)

function translate(tx, ty, tz) {
  const m = mat4.create();
  mat4.identity(m);
  m[12] = tx;
  m[13] = ty;
  m[14] = tz;
  mat4.multiply(modelMatrix, m, modelMatrix);
}

function scale(sx, sy, sz) {
  const m = mat4.create();
  mat4.identity(m);
  m[0] = sx;
  m[5] = sy;
  m[10] = sz;
  mat4.multiply(modelMatrix, m, modelMatrix);
}

function rotateX(angleDeg) {
  const angleRad = angleDeg * Math.PI / 180;
  const m = mat4.create();
  mat4.identity(m);
  m[5] = Math.cos(angleRad);
  m[6] = Math.sin(angleRad);
  m[9] = -Math.sin(angleRad);
  m[10] = Math.cos(angleRad);
  mat4.multiply(modelMatrix, m, modelMatrix);
}

function rotateY(angleDeg) {
  const angleRad = angleDeg * Math.PI / 180;
  const m = mat4.create();
  mat4.identity(m);
  m[0] = Math.cos(angleRad);
  m[2] = -Math.sin(angleRad);
  m[8] = Math.sin(angleRad);
  m[10] = Math.cos(angleRad);
  mat4.multiply(modelMatrix, m, modelMatrix);
}

function rotateZ(angleDeg) {
  const angleRad = angleDeg * Math.PI / 180;
  const m = mat4.create();
  mat4.identity(m);
  m[0] = Math.cos(angleRad);
  m[1] = Math.sin(angleRad);
  m[4] = -Math.sin(angleRad);
  m[5] = Math.cos(angleRad);
  mat4.multiply(modelMatrix, m, modelMatrix);
}

function reflect(axis) {
  const m = mat4.create();
  mat4.identity(m);
  if (axis === 'x') m[10] = -1;     // Reflect across Oxy
  else if (axis === 'y') m[0] = -1; // Reflect across Oyz
  else if (axis === 'z') m[5] = -1; // Reflect across Oxz
  mat4.multiply(modelMatrix, m, modelMatrix);
}

// Quay quanh đường thẳng qua 2 điểm A, B
function rotateAroundLine(xA, yA, zA, xB, yB, zB, angleDeg) {
  const dir = vec3.fromValues(xB - xA, yB - yA, zB - zA);
  vec3.normalize(dir, dir);
  const angleRad = angleDeg * Math.PI / 180;

  const m = mat4.create();
  mat4.identity(m);

  const t = mat4.create();
  mat4.translate(t, t, [-xA, -yA, -zA]);

  const r = mat4.create();
  mat4.rotate(r, r, angleRad, dir);

  const tBack = mat4.create();
  mat4.translate(tBack, tBack, [xA, yA, zA]);

  mat4.multiply(m, r, t);
  mat4.multiply(m, tBack, m);
  mat4.multiply(modelMatrix, m, modelMatrix);
}

function drawScene() {
  gl.clearColor(0, 0, 0, 1);
  gl.enable(gl.DEPTH_TEST);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.vertexAttribPointer(shaderProgram.coord, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

  gl.uniformMatrix4fv(matrixUniform, false, modelMatrix);
  gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
}

// Public API to test:
function resetMatrix() {
  mat4.identity(modelMatrix);
}

window.onload = () => {
  loadGL();

  // Ví dụ các phép biến đổi
  translate(0.3, 0.0, 0.0);     // tịnh tiến
  scale(1.2, 1.2, 1.2);         // tỉ lệ
  reflect('z');                // đối xứng qua mặt phẳng Oxy
  rotateY(45);                 // quay quanh trục OY
  rotateAroundLine(0, 0, 0, 1, 1, 1, 30); // quay quanh đường thẳng AB

  drawScene();
};
