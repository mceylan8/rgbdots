/**
 * Original WebGL CRT pipeline for RGB·DOT (not a vendor copy).
 * Visual goals (tube curve, scanlines, phosphor, bloom) are common CRT tropes;
 * shaders, uniforms, and host code are written for this project.
 */

export interface CrtGlConfig {
  barrel: number
  chroma: number
  noise: number
  tear: number
  glow: number
  jitter: number
  scanlines: boolean
  scanStrength: number
  phosphor: boolean
  brightness: number
  contrast: number
  fade: number
  flicker: number
  syncLoss: number
}

export const DEFAULT_CRT_GL: CrtGlConfig = {
  barrel: 0.18,
  chroma: 0.004,
  noise: 0.045,
  tear: 0.0009,
  glow: 0.2,
  jitter: 0.0015,
  scanlines: true,
  scanStrength: 0.75,
  phosphor: true,
  brightness: 1.05,
  contrast: 1.15,
  fade: 0.08,
  flicker: 0.025,
  syncLoss: 0.05,
}

const VERT = /* glsl */ `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = vec2(a_pos.x * 0.5 + 0.5, 1.0 - (a_pos.y * 0.5 + 0.5));
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`

const FRAG = /* glsl */ `
precision mediump float;
varying vec2 v_uv;
uniform sampler2D u_tex;
uniform float u_time;
uniform float u_barrel;
uniform float u_chroma;
uniform float u_noise;
uniform float u_tear;
uniform float u_glow;
uniform float u_jitter;
uniform float u_scanOn;
uniform float u_scan;
uniform float u_phos;
uniform float u_bright;
uniform float u_contrast;
uniform float u_fade;
uniform float u_flicker;
uniform float u_sync;

vec2 bend(vec2 uv, float k) {
  vec2 p = uv - 0.5;
  float r2 = dot(p, p);
  return uv + p * r2 * k;
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  vec2 uv = v_uv;
  uv = bend(uv, u_barrel);

  vec2 mid = uv - 0.5;
  float tube = length(mid);
  if (tube > 0.72) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }

  uv.y += sin(u_time * 4.7) * u_jitter;
  uv.x += sin(uv.y * 12.0 + u_time * 1.8) * u_tear;

  float ca = u_chroma * (1.0 + tube * 1.5);
  vec3 col;
  col.r = texture2D(u_tex, uv + vec2(ca, 0.0)).r;
  col.g = texture2D(u_tex, uv).g;
  col.b = texture2D(u_tex, uv - vec2(ca, 0.0)).b;

  float n = hash(uv * vec2(800.0, 600.0) + u_time);
  col += (n - 0.5) * u_noise;

  float hi = max(col.r, max(col.g, col.b));
  col += u_glow * smoothstep(0.4, 1.0, hi) * col;

  if (u_scanOn > 0.5) {
    float hard = mod(floor(uv.y * 280.0), 2.0);
    col *= mix(1.0, 0.55, hard * u_scan);
    float soft = 0.85 + 0.15 * sin(uv.y * 880.0 + u_time * 6.0);
    col *= mix(1.0, soft, u_scan);
  }

  if (u_phos > 0.5) {
    float cell = mod(floor(uv.x * 380.0), 3.0);
    vec3 grille = cell < 1.0 ? vec3(1.15, 0.25, 0.25)
                : cell < 2.0 ? vec3(0.25, 1.1, 0.25)
                             : vec3(0.25, 0.3, 1.2);
    col *= mix(vec3(1.0), grille, 0.5);
  }

  float luma = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(luma), col, 1.0 - u_fade);
  col = (col - 0.5) * u_contrast + 0.5;
  col *= u_bright;
  col *= 1.0 + u_flicker * sin(u_time * 52.0);
  col *= 1.0 - u_sync * abs(sin(uv.y * 40.0 + u_time * 9.0));

  float edge = smoothstep(0.72, 0.42, tube);
  col *= edge;

  gl_FragColor = vec4(clamp(col, 0.0, 1.4), 1.0);
}
`

export class CrtFilterWebGL {
  sourceCanvas: HTMLCanvasElement
  glCanvas: HTMLCanvasElement
  gl: WebGLRenderingContext | WebGL2RenderingContext
  config: CrtGlConfig
  private program: WebGLProgram
  private texture: WebGLTexture
  private locs: Record<string, WebGLUniformLocation | null> = {}

  constructor(
    sourceCanvas: HTMLCanvasElement,
    glCanvas: HTMLCanvasElement,
    config: Partial<CrtGlConfig> = {},
  ) {
    this.sourceCanvas = sourceCanvas
    this.glCanvas = glCanvas
    this.config = { ...DEFAULT_CRT_GL, ...config }

    const gl =
      glCanvas.getContext('webgl2', { alpha: false, antialias: false }) ||
      glCanvas.getContext('webgl', { alpha: false, antialias: false })
    if (!gl) throw new Error('WebGL not supported')
    this.gl = gl

    const vs = this.compile(gl.VERTEX_SHADER, VERT)
    const fs = this.compile(gl.FRAGMENT_SHADER, FRAG)
    const prog = gl.createProgram()!
    gl.attachShader(prog, vs)
    gl.attachShader(prog, fs)
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(prog) || 'program link failed')
    }
    this.program = prog
    gl.useProgram(prog)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    )
    const loc = gl.getAttribLocation(prog, 'a_pos')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

    this.texture = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, this.texture)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

    for (const name of [
      'u_time',
      'u_barrel',
      'u_chroma',
      'u_noise',
      'u_tear',
      'u_glow',
      'u_jitter',
      'u_scanOn',
      'u_scan',
      'u_phos',
      'u_bright',
      'u_contrast',
      'u_fade',
      'u_flicker',
      'u_sync',
    ]) {
      this.locs[name] = gl.getUniformLocation(prog, name)
    }
  }

  private compile(type: number, src: string) {
    const gl = this.gl
    const sh = gl.createShader(type)!
    gl.shaderSource(sh, src)
    gl.compileShader(sh)
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(sh)
      gl.deleteShader(sh)
      throw new Error(log || 'shader compile failed')
    }
    return sh
  }

  setConfig(partial: Partial<CrtGlConfig>) {
    Object.assign(this.config, partial)
  }

  render() {
    const gl = this.gl
    const c = this.config
    const src = this.sourceCanvas
    if (src.width < 1 || src.height < 1) return

    if (this.glCanvas.width !== src.width || this.glCanvas.height !== src.height) {
      this.glCanvas.width = src.width
      this.glCanvas.height = src.height
    }
    gl.viewport(0, 0, this.glCanvas.width, this.glCanvas.height)
    gl.useProgram(this.program)
    gl.bindTexture(gl.TEXTURE_2D, this.texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src)

    gl.uniform1f(this.locs.u_time, performance.now() / 1000)
    gl.uniform1f(this.locs.u_barrel, c.barrel)
    gl.uniform1f(this.locs.u_chroma, c.chroma)
    gl.uniform1f(this.locs.u_noise, c.noise)
    gl.uniform1f(this.locs.u_tear, c.tear)
    gl.uniform1f(this.locs.u_glow, c.glow)
    gl.uniform1f(this.locs.u_jitter, c.jitter)
    gl.uniform1f(this.locs.u_scanOn, c.scanlines ? 1 : 0)
    gl.uniform1f(this.locs.u_scan, c.scanStrength)
    gl.uniform1f(this.locs.u_phos, c.phosphor ? 1 : 0)
    gl.uniform1f(this.locs.u_bright, c.brightness)
    gl.uniform1f(this.locs.u_contrast, c.contrast)
    gl.uniform1f(this.locs.u_fade, c.fade)
    gl.uniform1f(this.locs.u_flicker, c.flicker)
    gl.uniform1f(this.locs.u_sync, c.syncLoss)

    gl.drawArrays(gl.TRIANGLES, 0, 6)
  }

  destroy() {
    const gl = this.gl
    gl.deleteTexture(this.texture)
    gl.deleteProgram(this.program)
  }
}
