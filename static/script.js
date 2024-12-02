// Obtén el canvas y el contexto WebGL
const canvas = document.getElementById('webgl-canvas');
const gl = canvas.getContext('webgl');

if (!gl) {
    console.error('WebGL no está disponible en este navegador.');
    alert('WebGL no está disponible en este navegador.');
}

// Define los shaders
const vsSource = `
    attribute vec2 a_position;
    uniform mat3 u_transform;
    void main() {
        vec3 pos = u_transform * vec3(a_position, 1.0);
        gl_Position = vec4(pos.xy, 0.0, 1.0);
    }
`;

const fsSource = `
    precision mediump float;
    uniform vec4 u_color;
    void main() {
        gl_FragColor = u_color;
    }
`;

// Compila y linkea los shaders
function compileShader(gl, source, type) {
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

const vertexShader = compileShader(gl, vsSource, gl.VERTEX_SHADER);
const fragmentShader = compileShader(gl, fsSource, gl.FRAGMENT_SHADER);

const shaderProgram = gl.createProgram();
gl.attachShader(shaderProgram, vertexShader);
gl.attachShader(shaderProgram, fragmentShader);
gl.linkProgram(shaderProgram);
if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.error('Failed to link program:', gl.getProgramInfoLog(shaderProgram));
}

gl.useProgram(shaderProgram);

// Configura los atributos y uniformes
const positionBuffer = gl.createBuffer();
const positionLocation = gl.getAttribLocation(shaderProgram, 'a_position');
const transformLocation = gl.getUniformLocation(shaderProgram, 'u_transform');
const colorLocation = gl.getUniformLocation(shaderProgram, 'u_color');

function setShape(shape) {
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    let positions;
    switch(shape) {
        case 'triangle':
            positions = new Float32Array([
                0, 0.5, 
                -0.5, -0.5, 
                0.5, -0.5
            ]);
            gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
            break;
        case 'circle': // Círculo
            const segments = 36;
            positions = new Float32Array(segments * 2);
            for (let i = 0; i < segments; i++) {
                const angle = i * 2 * Math.PI / segments;
                positions[i * 2] = 0.5 * Math.cos(angle);
                positions[i * 2 + 1] = 0.5 * Math.sin(angle);
            }
            gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
            break;

        case 'diamond': // Rombo
            positions = new Float32Array([
                0, 0.5, 
                -0.4, 0,
                0, -0.5,
                0.4, 0
            ]);
            gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
            break;
        
        case 'pentagon': // Pentágono
            const pentagonSides = 5;
            positions = new Float32Array((pentagonSides + 2) * 2);
            positions[0] = 0; // Centro del pentágono
            positions[1] = 0;
            for (let i = 0; i <= pentagonSides; i++) {
                const angle = i * 2 * Math.PI / pentagonSides;
                positions[(i + 1) * 2] = 0.5 * Math.cos(angle);
                positions[(i + 1) * 2 + 1] = 0.5 * Math.sin(angle);
            }
            gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
            break;
        
        case 'star': // Estrella
            const starPoints = 10;
            positions = new Float32Array((starPoints + 2) * 2);
            positions[0] = 0; // Centro de la estrella
            positions[1] = 0;
            for (let i = 0; i <= starPoints; i++) {
                const angle = i * Math.PI / 5; // 10 puntos (5 internos, 5 externos)
                const radius = i % 2 === 0 ? 0.5 : 0.2; // Alterna entre radio externo e interno
                positions[(i + 1) * 2] = radius * Math.cos(angle);
                positions[(i + 1) * 2 + 1] = radius * Math.sin(angle);
            }
            gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
            break;

        default: // square
            positions = new Float32Array([
                -0.5, -0.5,
                 0.5, -0.5,
                 0.5,  0.5,
                -0.5,  0.5
            ]);
            gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    }
}

// Configura el canvas
gl.viewport(0, 0, canvas.width, canvas.height);
gl.clearColor(0.0, 0.0, 0.0, 1.0);

function drawScene(translateX, translateY, rotate, scale, color, shape) {
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(shaderProgram);

    setShape(shape);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Calcula la matriz de transformación
    const angle = rotate * Math.PI / 180;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const matrix = [
        scale * cosA, -scale * sinA, 0,
        scale * sinA, scale * cosA, 0,
        translateX, translateY, 1
    ];

    gl.uniformMatrix3fv(transformLocation, false, matrix);
    gl.uniform4fv(colorLocation, color);

    // Determina el número de vértices según la figura seleccionada
    let vertexCount;
    switch (shape) {
        case 'triangle':
            vertexCount = 3;
            break;
        case 'square':
            vertexCount = 4;
            break;
        case 'circle':
            vertexCount = 36 + 2; // Centro y cierre del círculo
            break;
        case 'diamond': // Rombo
            vertexCount = 4;
            break;
        case 'pentagon': // Pentágono
            vertexCount = 5 + 2; // Centro y cierre del pentágono
            break;
        case 'star': // Estrella
            vertexCount = 10 + 2; // Centro y cierre de la estrella
            break;
        default:
            vertexCount = 4; // Cuadrado por defecto
    }

    // Dibuja la figura usando TRIANGLE_FAN
    gl.drawArrays(gl.TRIANGLE_FAN, 0, vertexCount);
}

// Configura los controles
document.getElementById('translateX').addEventListener('input', update);
document.getElementById('translateY').addEventListener('input', update);
document.getElementById('rotate').addEventListener('input', update);
document.getElementById('scale').addEventListener('input', update);
document.getElementById('color').addEventListener('input', update);
document.getElementById('shape').addEventListener('change', update);

function update() {
    const translateX = parseFloat(document.getElementById('translateX').value);
    const translateY = parseFloat(document.getElementById('translateY').value);
    const rotate = parseFloat(document.getElementById('rotate').value);
    const scale = parseFloat(document.getElementById('scale').value);
    const color = hexToRgb(document.getElementById('color').value);
    const shape = document.getElementById('shape').value;
    drawScene(translateX, translateY, rotate, scale, color, shape);
}

function hexToRgb(hex) {
    const bigint = parseInt(hex.slice(1), 16);
    return [
        ((bigint >> 16) & 255) / 255, // Red
        ((bigint >> 8) & 255) / 255,  // Green
        (bigint & 255) / 255,         // Blue
        1.0                           // Alpha (transparencia)
    ];
}

// Dibuja la escena inicial
update();