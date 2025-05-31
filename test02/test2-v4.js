
    const canvas = document.getElementById("glcanvas");
    const gl = canvas.getContext("webgl");
    if (!gl) alert("WebGL không được hỗ trợ!");

    const vsSource = `
      attribute vec3 aPosition;
      uniform mat4 uMatrix;
      void main() {
        gl_Position = uMatrix * vec4(aPosition, 1.0);
      }
    `;
    const fsSource = `
      precision mediump float;
      uniform vec3 uColor;
      void main() {
        gl_FragColor = vec4(uColor, 1.0);
      }
    `;

    function createShader(gl, type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
      }
      return shader;
    }

    const vShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    const program = gl.createProgram();
    gl.attachShader(program, vShader);
    gl.attachShader(program, fShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    const aPosition = gl.getAttribLocation(program, "aPosition");
    const uColor = gl.getUniformLocation(program, "uColor");
    const uMatrix = gl.getUniformLocation(program, "uMatrix");

    const axisVertices = new Float32Array([
      0,0,0, 1,0,0,
      0,0,0, 0,1,0,
      0,0,0, 0,0,1,
    ]);
    const axisBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, axisBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, axisVertices, gl.STATIC_DRAW);

    const cubeIndices = new Uint16Array([
      0,1,2, 0,2,3, 4,5,6, 4,6,7,
      8,9,10, 8,10,11, 12,13,14, 12,14,15,
      16,17,18, 16,18,19, 20,21,22, 20,22,23
    ]);
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, cubeIndices, gl.STATIC_DRAW);

    const faceColors = [
      [0.7, 0.4, 0.7], [0.8, 0.6, 0.5], [0.2, 0.4, 0.7],
      [0.5, 0.4, 0.3], [0.5, 0.6, 0.2], [0.7, 0.3, 0.4],
    ];

    const projection = mat4.create();
    const view = mat4.create();
    const baseMatrix = mat4.create();
    mat4.perspective(projection, Math.PI / 4, canvas.width / canvas.height, 0.1, 100);
    mat4.lookAt(view, [10, 10, 10], [0, 0, 0], [0, 1, 0]);
    mat4.multiply(baseMatrix, projection, view);

    // Ma trận model lưu trạng thái biến đổi hiện tại (khởi đầu là ma trận đơn vị)
    let modelMatrix = mat4.create();

    function createCubeVertices(a) {
      
    //v3
    const x = 0, y = 0, z = 0; // tọa độ gốc
  const x1 = x,     x2 = x + a;
  const y1 = y,     y2 = y + a;
  const z1 = z,     z2 = z + a;

  return new Float32Array([
    // Front face (z = z2)
    x2, y2, z2,
    x1, y2, z2,
    x1, y1, z2,
    x2, y1, z2,

    // Back face (z = z1)
    x2, y2, z1,
    x2, y1, z1,
    x1, y1, z1,
    x1, y2, z1,

    // Top face (y = y2)
    x2, y2, z1,
    x1, y2, z1,
    x1, y2, z2,
    x2, y2, z2,

    // Bottom face (y = y1)
    x2, y1, z2,
    x1, y1, z2,
    x1, y1, z1,
    x2, y1, z1,

    // Right face (x = x2)
    x2, y2, z1,
    x2, y2, z2,
    x2, y1, z2,
    x2, y1, z1,

    // Left face (x = x1)
    x1, y2, z1,
    x1, y1, z1,
    x1, y1, z2,
    x1, y2, z2,
  ]);
    }

    function drawScene() {
      let a = parseFloat(document.getElementById("edgeLength").value);

      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);

      // Vẽ trục tọa độ
      gl.bindBuffer(gl.ARRAY_BUFFER, axisBuffer);
      gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(aPosition);
      gl.uniformMatrix4fv(uMatrix, false, baseMatrix);
      gl.uniform3f(uColor, 1, 0, 0); gl.drawArrays(gl.LINES, 0, 2);
      gl.uniform3f(uColor, 0, 1, 0); gl.drawArrays(gl.LINES, 2, 2);
      gl.uniform3f(uColor, 0, 0, 1); gl.drawArrays(gl.LINES, 4, 2);

      // Tính toán ma trận cuối cùng = baseMatrix * modelMatrix (modelMatrix có biến đổi tích lũy)
      const finalMatrix = mat4.create();
      mat4.multiply(finalMatrix, baseMatrix, modelMatrix);
      gl.uniformMatrix4fv(uMatrix, false, finalMatrix);

      // Tạo khối lập phương và vẽ
      const cubeVertices = createCubeVertices(a);
      const cubeBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, cubeVertices, gl.STATIC_DRAW);
      gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(aPosition);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

      for (let i = 0; i < 6; i++) {
        gl.uniform3fv(uColor, faceColors[i]);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, i * 6 * 2);
      }
    }

    // Áp dụng tịnh tiến, cộng vào ma trận model hiện tại
    function applyTranslation() {
      let tx = parseFloat(document.getElementById("tx").value);
      let ty = parseFloat(document.getElementById("ty").value);
      let tz = parseFloat(document.getElementById("tz").value);
      mat4.translate(modelMatrix, modelMatrix, [tx, ty, tz]);
      drawScene();
    }

    // Áp dụng tỉ lệ, nhân vào ma trận model hiện tại
    function applyScale() {
      let s = parseFloat(document.getElementById("scale").value);
      mat4.scale(modelMatrix, modelMatrix, [s, s, s]);
      drawScene();
    }

    // Áp dụng đối xứng theo mặt phẳng được chọn
    function applyMirror() {
  const plane = document.querySelector('input[name="mirrorPlane"]:checked').value;
  let mirrorMatrix = mat4.create();

  if (plane === "Oxy") {
    mat4.scale(mirrorMatrix, mirrorMatrix, [1, 1, -1]);
  } else if (plane === "Oxz") {
    mat4.scale(mirrorMatrix, mirrorMatrix, [1, -1, 1]);
  } else if (plane === "Oyz") {
    mat4.scale(mirrorMatrix, mirrorMatrix, [-1, 1, 1]);
  }

  mat4.multiply(modelMatrix,  mirrorMatrix, modelMatrix);
   
  drawScene();
}


    // Reset ma trận biến đổi về ma trận đơn vị
    function resetTransform() {
      modelMatrix = mat4.create();
      drawScene();
    }
    function rotateAroundAB() {
  const xa = parseFloat(document.getElementById('xa').value);
  const ya = parseFloat(document.getElementById('ya').value);
  const xb = parseFloat(document.getElementById('xb').value);
  const yb = parseFloat(document.getElementById('yb').value);
  const angleDeg = parseFloat(document.getElementById('angleAB').value);
  const angleRad = angleDeg * Math.PI / 180;

  // Tạo vector trục AB trong không gian 3D (giả sử z=0)
  const axis = vec3.fromValues(xb - xa, yb - ya, 0);
  vec3.normalize(axis, axis);

  // Tạo ma trận quay quanh vector AB
  const rotation = mat4.create();
  mat4.translate(rotation, rotation, [xa, ya, 0]);            // đưa về A
  mat4.rotate(rotation, rotation, angleRad, axis);           // quay quanh AB
  mat4.translate(rotation, rotation, [-xa, -ya, 0]);          // trả lại vị trí gốc

  // Áp dụng lên transformedVertices
  transformedVertices = transformedVertices.map(v => {
    const out = vec4.transformMat4([], [v.x, v.y, v.z, 1], rotation);
    return { x: out[0], y: out[1], z: out[2] };
  });

  // Vẽ lại cube và đường thẳng AB
  drawScence();
  drawLineAB([xa, ya, 0], [xb, yb, 0]);
}

// Vẽ lại trục AB bằng màu trắng
function drawLineAB(a, b) {
  const abVertices = new Float32Array([...a, ...b]);
  const abBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, abBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, abVertices, gl.STATIC_DRAW);
  gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(aPosition);

  gl.uniform3f(uColor, 1, 1, 1); // Màu trắng
  gl.drawArrays(gl.LINES, 0, 2);
}

    drawScene(); // Vẽ lần đầu
