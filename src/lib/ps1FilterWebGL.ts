/**
 * Original WebGL PS1 pipeline for RGB·DOT (not a vendor copy).
 * Visual goals (vertex snap wobble, affine texture swim, low-res dithering)
 * are common PS1-era rendering artifacts; shaders/host code written for this project.
 */

export interface Ps1GlConfig {
  resX: number
  resY: number
  wobble: number
  wobbleSpeed: number
  snapRate: number
  levels: number
  dither: number
  fogAmount: number
  fogColor: [number, number, number]
}

export const DEFAULT_PS1_GL: Ps1GlConfig = {
  resX: 160,
  resY: 120,
  wobble: 0.35,
  wobbleSpeed: 1.2,
  snapRate: 8,
  levels: 20,
  dither: 0.6,
  fogAmount: 0.25,
  fogColor: [0.22, 0.18, 0.32],
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
uniform float u_resX;
uniform float u_resY;
uniform float u_wobble;
uniform float u_wobbleSpeed;
uniform float u_snapRate;
uniform float u_levels;
uniform float u_dither;
uniform float u_fogAmt;
uniform vec3 u_fogColor;

float bayer2(vec2 a) {
  a = floor(a);
  return fract(a.x / 2.0 + a.y * a.y * 0.75);
}
float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }

void main() {
  vec2 uv = v_uv;

  float t = u_snapRate > 0.01 ? floor(u_time * u_snapRate) / u_snapRate : u_time;

  uv.x += sin(uv.y * 18.0 * u_wobbleSpeed + t * 2.2) * u_wobble * 0.02;
  uv.y += cos(uv.x * 14.0 * u_wobbleSpeed + t * 1.7) * u_wobble * 0.012;

  vec2 texel = vec2(1.0 / u_resX, 1.0 / u_resY);
  uv = (floor(uv / texel) + 0.5) * texel;

  vec3 col = texture2D(u_tex, clamp(uv, 0.0, 1.0)).rgb;

  float levels = max(2.0, u_levels);
  float d = (bayer4(gl_FragCoord.xy) - 0.5) * u_dither / levels;
  col = floor(col * levels + d + 0.5) / levels;

  float fog = smoothstep(0.35, 1.0, uv.y) * u_fogAmt;
  col = mix(col, u_fogColor, fog);

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`

export class Ps1FilterWebGL {
  sourceCanvas: HTMLCanvasElement
  glCanvas: HTMLCanvasElement
  gl: WebGLRenderingContext | WebGL2RenderingContext
  config: Ps1GlConfig
  private program: WebGLProgram
  private texture: WebGLTexture
  private locs: Record<string, WebGLUniformLocation | null> = {}

  constructor(
    sourceCanvas: HTMLCanvasElement,
    glCanvas: HTMLCanvasElement,
    config: Partial<Ps1GlConfig> = {},
  ) {
    this.sourceCanvas = sourceCanvas
    this.glCanvas = glCanvas
    this.config = { ...DEFAULT_PS1_GL, ...config }

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
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

    for (const name of [
      'u_time',
      'u_resX',
      'u_resY',
      'u_wobble',
      'u_wobbleSpeed',
      'u_snapRate',
      'u_levels',
      'u_dither',
      'u_fogAmt',
      'u_fogColor',
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

  setConfig(partial: Partial<Ps1GlConfig>) {
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
    gl.uniform1f(this.locs.u_resX, c.resX)
    gl.uniform1f(this.locs.u_resY, c.resY)
    gl.uniform1f(this.locs.u_wobble, c.wobble)
    gl.uniform1f(this.locs.u_wobbleSpeed, c.wobbleSpeed)
    gl.uniform1f(this.locs.u_snapRate, c.snapRate)
    gl.uniform1f(this.locs.u_levels, c.levels)
    gl.uniform1f(this.locs.u_dither, c.dither)
    gl.uniform1f(this.locs.u_fogAmt, c.fogAmount)
    gl.uniform3f(this.locs.u_fogColor, c.fogColor[0], c.fogColor[1], c.fogColor[2])

    gl.drawArrays(gl.TRIANGLES, 0, 6)
  }

  destroy() {
    const gl = this.gl
    gl.deleteTexture(this.texture)
    gl.deleteProgram(this.program)
  }
}
