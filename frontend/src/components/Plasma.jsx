// filepath: /Users/akbroc/Desktop/ML/frontend/src/components/Plasma.jsx
import { useEffect, useRef } from 'react';
import { Renderer, Program, Mesh, Triangle } from 'ogl';
import './Plasma.css';

const hexToRgb = hex => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [1, 0.5, 0.2];
  return [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255];
};

const vertex = `#version 300 es\nprecision highp float;\nin vec2 position;\nin vec2 uv;\nout vec2 vUv;\nvoid main() {\n  vUv = uv;\n  gl_Position = vec4(position, 0.0, 1.0);\n}\n`;

const fragment = `#version 300 es\nprecision highp float;\nuniform vec2 iResolution;\nuniform float iTime;\nuniform vec3 uCustomColor;\nuniform float uUseCustomColor;\nuniform float uSpeed;\nuniform float uDirection;\nuniform float uScale;\nuniform float uOpacity;\nuniform vec2 uMouse;\nuniform float uMouseInteractive;\nout vec4 fragColor;\n\nvoid mainImage(out vec4 o, vec2 C) {\n  vec2 center = iResolution.xy * 0.5;\n  C = (C - center) / uScale + center;\n  \n  vec2 mouseOffset = (uMouse - center) * 0.0002;\n  C += mouseOffset * length(C - center) * step(0.5, uMouseInteractive);\n  \n  float i, d, z, T = iTime * uSpeed * uDirection;\n  vec3 O, p, S;\n\n  for (vec2 r = iResolution.xy, Q; ++i < 60.; O += o.w/d*o.xyz) {\n    p = z*normalize(vec3(C-.5*r,r.y)); \n    p.z -= 4.; \n    S = p;\n    d = p.y-T;\n    \n    p.x += .4*(1.+p.y)*sin(d + p.x*0.1)*cos(.34*d + p.x*0.05); \n    Q = p.xz *= mat2(cos(p.y+vec4(0,11,33,0)-T)); \n    z+= d = abs(sqrt(length(Q*Q)) - .25*(5.+S.y))/3.+8e-4; \n    o = 1.+sin(S.y+p.z*.5+S.z-length(S-p)+vec4(2,1,0,8));\n  }\n  \n  o.xyz = tanh(O/1e4);\n}\n\nbool finite1(float x){ return !(isnan(x) || isinf(x)); }\nvec3 sanitize(vec3 c){\n  return vec3(\n    finite1(c.r) ? c.r : 0.0,\n    finite1(c.g) ? c.g : 0.0,\n    finite1(c.b) ? c.b : 0.0\n  );\n}\n\nvoid main() {\n  vec4 o = vec4(0.0);\n  mainImage(o, gl_FragCoord.xy);\n  vec3 rgb = sanitize(o.rgb);\n  \n  float intensity = (rgb.r + rgb.g + rgb.b) / 3.0;\n  vec3 customColor = intensity * uCustomColor;\n  vec3 finalColor = mix(rgb, customColor, step(0.5, uUseCustomColor));\n  \n  float alpha = length(rgb) * uOpacity;\n  fragColor = vec4(finalColor, alpha);\n}`;

export const Plasma = ({
  color = '#ffffff',
  speed = 20,
  direction = 'forward',
  scale = 1,
  opacity = 1,
  mouseInteractive = true
}) => {
  const containerRef = useRef(null);
  const mousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const useCustomColor = color ? 1.0 : 0.0;
    const customColorRgb = color ? hexToRgb(color) : [1, 1, 1];

    const directionMultiplier = direction === 'reverse' ? -1.0 : 1.0;

    const renderer = new Renderer({
      webgl: 2,
      alpha: true,
      antialias: false,
      dpr: Math.min(window.devicePixelRatio || 1, 2)
    });
    const gl = renderer.gl;
    const canvas = gl.canvas;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    containerRef.current.appendChild(canvas);

    const geometry = new Triangle(gl);

    const program = new Program(gl, {
      vertex: vertex,
      fragment: fragment,
      uniforms: {
        iTime: { value: 0 },
        iResolution: { value: new Float32Array([1, 1]) },
        uCustomColor: { value: new Float32Array(customColorRgb) },
        uUseCustomColor: { value: useCustomColor },
        uSpeed: { value: speed * 0.4 },
        uDirection: { value: directionMultiplier },
        uScale: { value: scale },
        uOpacity: { value: opacity },
        uMouse: { value: new Float32Array([0, 0]) },
        uMouseInteractive: { value: mouseInteractive ? 1.0 : 0.0 }
      }
    });

    const mesh = new Mesh(gl, { geometry, program });

    const handleMouseMove = e => {
      if (!mouseInteractive) return;
      const rect = containerRef.current.getBoundingClientRect();
      mousePos.current.x = e.clientX - rect.left;
      mousePos.current.y = e.clientY - rect.top;
      const mouseUniform = program.uniforms.uMouse.value;
      mouseUniform[0] = mousePos.current.x;
      mouseUniform[1] = mousePos.current.y;
    };

    if (mouseInteractive) {
      containerRef.current.addEventListener('mousemove', handleMouseMove);
    }

    const setSize = () => {
      const rect = containerRef.current.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      renderer.setSize(width, height);
      const res = program.uniforms.iResolution.value;
      res[0] = gl.drawingBufferWidth;
      res[1] = gl.drawingBufferHeight;
    };

    const ro = new ResizeObserver(setSize);
    ro.observe(containerRef.current);
    setSize();

    let raf = 0;
    const t0 = performance.now();
    const loop = t => {
      let timeValue = (t - t0) * 0.001;

      if (direction === 'pingpong') {
        const cycle = Math.sin(timeValue * 0.5) * directionMultiplier;
        program.uniforms.uDirection.value = cycle;
      }

      program.uniforms.iTime.value = timeValue;
      renderer.render({ scene: mesh });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      if (mouseInteractive && containerRef.current) {
        containerRef.current.removeEventListener('mousemove', handleMouseMove);
      }
      try {
        containerRef.current?.removeChild(canvas);
      } catch {
        // already removed
      }
    };
  }, [color, speed, direction, scale, opacity, mouseInteractive]);

  return <div ref={containerRef} className="plasma-container" />;
};

export default Plasma;