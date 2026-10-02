import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import LabGrid from "./LabGrid";
import DotsHello, { DOTS, type DotsHelloHandle } from "./pieces/DotsHello";

// Scene progress is measured from the moment the section's top enters the
// viewport (0vh). "Time to say hello" rises in with the section and pins
// (100vh); then it breaks into dots and the dots regroup into me waving.
// (The question that used to open it, and the gallery explorations: branch
// wip/lab-galerias-2026-10-02.)
const DOTS_VH = 105; //                         the line turns to dots, the dots into me
const END_VH = DOTS_VH + DOTS.length; //         the figure holds, then the scene lets go
const HEIGHT_VH = END_VH + 10; //                pinned stage (100vh) + its hold

// Colour pairs (?pal=0…4 to compare; the switcher shows in local dev only)
const PALETTES = [
  { name: "Negro · blanco", bg: "0 0% 0%", fg: "0 0% 100%", ground: "#000", ink: "#ffffff" },
  { name: "Negro · azul eléctrico", bg: "0 0% 0%", fg: "0 0% 100%", ground: "#000", ink: "#3d5bff" },
  { name: "Azul · blanco", bg: "236 73% 49%", fg: "0 0% 100%", ground: "#222ed6", ink: "#ffffff" },
  { name: "Crema · azul eléctrico", bg: "40 23% 95%", fg: "0 0% 8%", ground: "#f5f3ef", ink: "#2b3ff5", invert: true },
  { name: "Crema · azul noche", bg: "40 23% 95%", fg: "0 0% 8%", ground: "#f5f3ef", ink: "#101a5c", invert: true },
] as const;
const readPal = () => {
  // Chosen: cream with electric-blue dots (3). ?pal= still overrides, for comparing
  const q = new URLSearchParams(window.location.search).get("pal");
  const n = q === null ? 3 : Number(q);
  return Number.isInteger(n) && n >= 0 && n < PALETTES.length ? n : 3;
};

/**
 * The hello: "Time to say hello" breaks into dots, the dots become me waving
 * on a loop, then regroup into "I'm Jose, the UX/UI designer behind these projects". On the home page it closes with
 * a way into the Lab; on /lab the pieces follow in a grid.
 */
const LabEditorial = ({ mode = "home" }: { mode?: "home" | "page" }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const [pal, setPal] = useState(readPal);
  const PAL = PALETTES[pal];
  const pickPal = (n: number) => {
    setPal(n);
    const url = new URL(window.location.href);
    url.searchParams.set("pal", String(n));
    window.history.replaceState(null, "", url);
  };
  const dots = useRef<DotsHelloHandle>(null);

  // Camera: the visitor in dots. Asked for only on click; stopped when the
  // section leaves the screen or the page unmounts. Nothing leaves the browser.
  const videoRef = useRef<HTMLVideoElement>(null);
  const [camera, setCamera] = useState<HTMLVideoElement | null>(null);
  const [cameraError, setCameraError] = useState(false);
  const stopCamera = () => {
    const v = videoRef.current;
    (v?.srcObject as MediaStream | null)?.getTracks().forEach((t) => t.stop());
    if (v) v.srcObject = null;
    setCamera(null);
  };
  const startCamera = async () => {
    const v = videoRef.current;
    if (!v || !navigator.mediaDevices?.getUserMedia) return setCameraError(true);
    try {
      v.srcObject = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 } }, audio: false });
      await v.play();
      setCameraError(false);
      setCamera(v);
    } catch {
      setCameraError(true);
    }
  };
  useEffect(() => {
    const section = sectionRef.current;
    if (!camera || !section) return;
    const io = new IntersectionObserver(([e]) => !e.isIntersecting && stopCamera());
    io.observe(section);
    return () => io.disconnect();
  }, [camera]);
  useEffect(() => () => stopCamera(), []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const update = () => {
      const vh = window.innerHeight;
      // px since the section's top entered at the bottom of the viewport
      const scrolled = Math.min(Math.max(vh - section.getBoundingClientRect().top, 0), section.offsetHeight);
      dots.current?.update(scrolled, vh);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div id="lab" className="bg-background text-foreground" style={{ ["--background" as any]: PAL.bg, ["--foreground" as any]: PAL.fg }}>
      <section ref={sectionRef} className="relative" style={{ height: `${HEIGHT_VH}vh` }} aria-label="Time to say hello — I’m Jose, the UX/UI designer behind these projects">
        <div className="sticky top-0 h-screen overflow-hidden flex items-center justify-center px-5">
          {/* First child on purpose: DotsHello dots this heading, and fades it
              along with whatever sits just before it (nothing). */}
          <h1 className="relative text-center font-sans font-black uppercase text-foreground text-[15vw] leading-[0.92] md:text-[min(10vw,150px)] md:leading-[0.92] tracking-[-0.01em] select-none">
            {["Time", "to say", "hello"].map((line) => (
              <span key={line} className="block">
                {line.split(" ").map((word, i) => (
                  <span key={word}>
                    {i > 0 ? " " : ""}
                    <span>{word}</span>
                  </span>
                ))}
              </span>
            ))}
          </h1>
          {/* The closing line the figure dissolves into: laid out for its shape only, never shown */}
          <p
            data-dots-outro
            aria-hidden="true"
            className="absolute inset-x-5 top-1/2 -translate-y-1/2 text-center font-sans font-black uppercase text-[12.5vw] leading-[0.95] md:text-[min(8.8vw,150px)] md:leading-[0.92] tracking-[-0.01em] opacity-0 pointer-events-none select-none"
          >
            {["I’m Jose, the", "UX/UI designer", "behind these", "projects"].map((line) => (
              <span key={line} className="block">
                {line.split(" ").map((word, i) => (
                  <span key={word}>
                    {i > 0 ? " " : ""}
                    <span>{word}</span>
                  </span>
                ))}
              </span>
            ))}
          </p>
          <DotsHello live={camera} ref={dots} startVh={DOTS_VH} startDotted invert={"invert" in PAL && PAL.invert} ink={PAL.ink} ground={PAL.ground} />
          {/* Always on screen while the section is */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-[8vh] z-10 flex items-center gap-2 whitespace-nowrap">
            {/* Frosted glass, so it reads over dots, dark grounds and light ones alike */}
            <button
              onClick={camera ? stopCamera : startCamera}
              className="relative inline-flex items-center gap-2 rounded-full bg-white/55 text-neutral-900 backdrop-blur-xl backdrop-saturate-150 border border-white/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] pl-4 pr-5 py-3.5 text-[14px] font-medium tracking-[0.01em] transition-colors duration-300 hover:bg-white/70"
            >
              {/* Material Symbols "photo_camera" (Google, Apache 2.0) */}
              <svg aria-hidden="true" viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current">
                <path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4zM9 2 7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" />
              </svg>
              {camera && <span aria-hidden="true" className="absolute left-[30px] top-[13px] w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
              {camera ? "Stop camera" : cameraError ? "Camera not available" : "See yourself in dots"}
            </button>
            {mode === "home" && (
              <Link
                to="/lab"
                className="inline-flex items-center gap-3 rounded-full bg-foreground text-background px-6 py-3.5 text-[14px] font-medium tracking-[0.01em] transition-transform duration-300 hover:scale-[1.04]"
              >
                Explore the Lab <span aria-hidden="true">→</span>
              </Link>
            )}
          </div>
          {/* The camera feed is only read, never shown */}
          <video ref={videoRef} muted playsInline className="hidden" />
        </div>
      </section>
      {mode === "page" && <LabGrid />}
      {/* Local-only colour switcher */}
      {import.meta.env.DEV && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[300] flex gap-1 max-w-[calc(100vw-24px)] overflow-x-auto whitespace-nowrap rounded-full bg-neutral-800/80 backdrop-blur-xl p-1 text-[12px] text-white">
          {PALETTES.map((p, i) => (
            <button
              key={p.name}
              onClick={() => pickPal(i)}
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 transition-colors ${i === pal ? "bg-white text-black" : "hover:bg-white/15"}`}
            >
              <span className="inline-flex">
                <span className="w-3 h-3 rounded-full border border-white/30" style={{ background: `hsl(${p.bg})` }} />
                <span className="-ml-1 w-3 h-3 rounded-full border border-white/30" style={{ background: p.ink }} />
              </span>
              {p.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LabEditorial;
