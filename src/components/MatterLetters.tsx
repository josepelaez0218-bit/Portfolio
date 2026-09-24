import { useEffect, useRef } from "react";
import Matter from "matter-js";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".split("");
const FONT_SIZE_DESKTOP = 64;
const FONT_SIZE_MOBILE = 40;
const FONT_FAMILY = "'Inter', sans-serif";
const FONT_WEIGHT = 600;

const LETTER_COUNT = 120;
const ACCENT_RATIO = 0.12;

type LetterBody = Matter.Body & { _char: string; _accent: boolean };

const randChar = () => CHARS[Math.floor(Math.random() * CHARS.length)];

const MatterLetters = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const container = containerRef.current;
    if (!container) return;

    const { Engine, Render, Runner, Bodies, Body, Composite, Mouse, MouseConstraint, Events } = Matter;

    let width = container.clientWidth;
    let height = container.clientHeight;
    const isMobile = width < 768;
    const FONT_SIZE = isMobile ? FONT_SIZE_MOBILE : FONT_SIZE_DESKTOP;
    let safeFloorY = height;
    let slopeStartY = 0;
    let slope: Matter.Body | null = null;
    let safeFloor: Matter.Body | null = null;
    const spawnX = () => width * (isMobile ? -0.02 + Math.random() * 0.34 : 0.1 + Math.random() * 0.8);

    const engine = Engine.create();
    engine.gravity.y = isMobile ? 0.18 : 0.6;
    const world = engine.world;

    const measure = document.createElement("canvas").getContext("2d")!;
    measure.font = `${FONT_WEIGHT} ${FONT_SIZE}px ${FONT_FAMILY}`;
    const charWidth = (c: string) => Math.max(28, measure.measureText(c).width);

    const render = Render.create({
      element: container,
      engine,
      options: {
        width,
        height,
        background: "transparent",
        wireframes: false,
        pixelRatio: window.devicePixelRatio || 1,
      },
    });
    render.canvas.style.position = "absolute";
    render.canvas.style.inset = "0";
    render.canvas.style.background = "transparent";

    const applyWorldGeometry = () => {
      if (slope) Composite.remove(world, slope);
      if (safeFloor) Composite.remove(world, safeFloor);

      const titleSafeBottom = isMobile ? Math.min(Math.max(height * 0.205, 164), 176) : 0;
      safeFloorY = height - titleSafeBottom;

      const slopeStartX = -width * 0.16;
      slopeStartY = isMobile ? height * 0.12 : height * 0.34;
      const slopeEndX = width * 1.18;
      const slopeEndY = isMobile ? safeFloorY - 6 : height * 0.9;
      const slopeDx = slopeEndX - slopeStartX;
      const slopeDy = slopeEndY - slopeStartY;
      const slopeAngle = Math.atan2(slopeDy, slopeDx);
      const slopeLength = Math.hypot(slopeDx, slopeDy);
      const slopeThickness = isMobile ? 72 : 120;
      const slopeCenterX = (slopeStartX + slopeEndX) / 2;
      const slopeCenterY = (slopeStartY + slopeEndY) / 2;

      slope = Bodies.rectangle(slopeCenterX, slopeCenterY, slopeLength, slopeThickness, {
        isStatic: true,
        angle: slopeAngle,
        friction: 0.001,
        frictionStatic: 0,
        restitution: 0,
        render: { visible: false },
      });
      Composite.add(world, slope);

      if (titleSafeBottom > 0) {
        safeFloor = Bodies.rectangle(width / 2, safeFloorY, width * 2, 24, {
          isStatic: true,
          render: { visible: false },
        });
        Composite.add(world, safeFloor);
      } else {
        safeFloor = null;
      }
    };

    applyWorldGeometry();

    // Letter bodies — each one independent
    const letters: LetterBody[] = [];
    const makeLetter = (x: number, y: number): LetterBody => {
      const char = randChar();
      const w = charWidth(char);
      const h = FONT_SIZE * 0.95;
      const b = Bodies.rectangle(x, y, w, h, {
        restitution: 0.05,
        friction: 0.02,
        frictionStatic: 0,
        frictionAir: 0.003,
        density: 0.0012,
        chamfer: { radius: Math.min(12, h * 0.18) },
        render: { visible: false },
      }) as LetterBody;
      b._char = char;
      b._accent = Math.random() < ACCENT_RATIO;
      Body.setAngularVelocity(b, (Math.random() - 0.5) * 0.08);
      return b;
    };

    for (let i = 0; i < LETTER_COUNT; i++) {
      const x = spawnX();
      const y = -Math.random() * height * 2;
      letters.push(makeLetter(x, y));
    }
    Composite.add(world, letters);

    // Animate stairs + loop letters & stairs back to top (mirrors example)
    Events.on(engine, "afterUpdate", (event: Matter.IEvent<Matter.Engine> & { delta?: number }) => {
      const timeScale = ((event as any).delta || 1000 / 60) / 1000;

      // slope is static — nothing to translate

      const resetLine = safeFloorY + 100;
      const MAX_SPEED = 35;
      for (const b of letters) {
        // clamp runaway velocities so a stuck letter can't explode the sim
        const vx = b.velocity.x, vy = b.velocity.y;
        const speed = Math.hypot(vx, vy);
        if (speed > MAX_SPEED) {
          Body.setVelocity(b, { x: (vx / speed) * MAX_SPEED, y: (vy / speed) * MAX_SPEED });
        }
        if (Math.abs(b.angularVelocity) > 0.25) {
          Body.setAngularVelocity(b, Math.sign(b.angularVelocity) * 0.25);
        }
        const isOnSlopeBand =
          b.position.x > -80 &&
          b.position.x < width + 120 &&
          b.position.y > slopeStartY - 80 &&
          b.position.y < safeFloorY + 48;
        if (isOnSlopeBand && speed < 0.5) {
          Body.setVelocity(b, {
            x: Math.max(b.velocity.x, isMobile ? 0.9 : 1.4),
            y: Math.max(b.velocity.y, isMobile ? 0.35 : 0.5),
          });
        }
        const outOfBounds =
          b.position.y > resetLine ||
          b.position.y < -2000 ||
          b.position.x < -200 ||
          b.position.x > width + 200;
        if (outOfBounds) {
          Body.setPosition(b, {
            x: spawnX(),
            y: -100 - Math.random() * 300,
          });
          Body.setVelocity(b, { x: isMobile ? 0.8 + Math.random() * 0.6 : Math.random() * 0.6, y: 0 });
          Body.setAngularVelocity(b, (Math.random() - 0.5) * 0.08);
          Body.setAngle(b, (Math.random() - 0.5) * 0.25);
        }
      }
    });

    // Draw letters
    Events.on(render, "afterRender", () => {
      const ctx = render.context;
      ctx.save();
      ctx.font = `${FONT_WEIGHT} ${FONT_SIZE}px ${FONT_FAMILY}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const fg = getComputedStyle(container).getPropertyValue("--foreground").trim() || "0 0% 100%";
      for (const b of letters) {
        ctx.save();
        ctx.translate(b.position.x, b.position.y);
        ctx.rotate(b.angle);
        ctx.fillStyle = `hsl(${fg} / ${b._accent ? 1 : 0.15})`;
        ctx.fillText(b._char, 0, 0);
        ctx.restore();
      }
      ctx.restore();
    });

    // Mouse drag
    const mouse = Mouse.create(render.canvas);
    // Matter's Mouse module calls preventDefault() on wheel events by
    // default, to stop the page scrolling/zooming while dragging a body —
    // which also blocks normal page scroll the whole time the cursor is
    // over the canvas. Drop just the wheel listeners; drag interaction
    // (mousedown/mousemove/mouseup) is untouched.
    const mousewheelHandler = (mouse as unknown as { mousewheel: EventListener }).mousewheel;
    mouse.element.removeEventListener("wheel", mousewheelHandler);
    mouse.element.removeEventListener("mousewheel", mousewheelHandler);
    mouse.element.removeEventListener("DOMMouseScroll", mousewheelHandler);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse,
      constraint: { stiffness: 0.6, render: { visible: false } },
    });
    Composite.add(world, mouseConstraint);
    render.mouse = mouse;

    Render.run(render);
    const runner = Runner.create();
    Runner.run(runner, engine);

    const onResize = () => {
      width = container.clientWidth;
      height = container.clientHeight;
      safeFloorY = height;
      const dpr = window.devicePixelRatio || 1;
      render.canvas.width = width * dpr;
      render.canvas.height = height * dpr;
      render.canvas.style.width = width + "px";
      render.canvas.style.height = height + "px";
      render.options.width = width;
      render.options.height = height;
      applyWorldGeometry();
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      Render.stop(render);
      Runner.stop(runner);
      Composite.clear(world, false);
      Engine.clear(engine);
      render.canvas.remove();
      render.textures = {};
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0 z-10" aria-hidden="true" />;
};

export default MatterLetters;
