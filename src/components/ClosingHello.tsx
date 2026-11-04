import { useEffect, useRef, useState } from "react";
import DotsHello, { DOTS, type DotsHelloHandle } from "@/components/lab-essay/pieces/DotsHello";
import { ease, range } from "@/components/lab-essay/lib";

const EMAIL = "josepelaez0218@gmail.com";

/**
 * The close of the home: who I am on the left, me waving in blue dots on the
 * right (in the hero's grey), and the ways to get in touch. The dots gather
 * into the figure as the section comes up, then it keeps waving on its own.
 * Replaces both “Time to say hello” and the footer on the home page.
 * (The Lab is off the site for now, so there is no way into it here.)
 */
const ClosingHello = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const dots = useRef<DotsHelloHandle>(null);

  // Camera: the visitor in dots. Asked for only on click; stopped when the
  // section leaves the screen. Nothing leaves the browser.
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

  // As the section rises (bottom of the screen → top), the dots go from a
  // loose field to the figure; from then on the wave just loops.
  useEffect(() => {
    const section = sectionRef.current!;
    const update = () => {
      const vh = window.innerHeight;
      const p = ease(range(vh - section.getBoundingClientRect().top, 0, vh * 0.9));
      const rel = DOTS.toFigure[0] + (DOTS.wave[0] + 20 - DOTS.toFigure[0]) * p;
      dots.current?.update((rel / 100) * vh, vh);
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
    <section ref={sectionRef} id="contact" className="relative z-10 w-full bg-background text-foreground px-5 md:px-10 py-5 md:py-10 lg:min-h-screen lg:flex lg:items-center">
      <div className="w-full max-w-[1900px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Who I am, and the ways in */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-12 pt-16 pb-4 md:pt-24 lg:py-8">
          <div className="flex flex-col gap-5">
            {/* The hero already says who I am: the close says what to do next */}
            <p className="text-[14px] font-medium tracking-[0.01em] text-foreground/70">Let’s talk</p>
            <p className="text-lead text-foreground max-w-[30ch] text-balance">
              Got a brand or a website in mind? Let’s make it together.
            </p>
            <p className="text-[14px] text-foreground/70 tracking-[0.01em] max-w-[52ch]">
              Day to day I design product at Seedtag. Alongside that, I take on a few independent projects, from the first idea
              to the code that ships it.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
              <a
                href={`mailto:${EMAIL}?subject=New%20project`}
                className="inline-flex items-center gap-3 rounded-full bg-foreground text-background px-6 py-3.5 text-[14px] font-medium tracking-[0.01em] transition-transform duration-300 hover:scale-[1.04]"
              >
                Start a project <span aria-hidden="true">→</span>
              </a>
              <a href={`mailto:${EMAIL}`} className="py-2 text-[14px] text-foreground/70 tracking-[0.01em] transition-colors duration-300 hover:text-foreground">
                {EMAIL}
              </a>
            </div>
          </div>
          <div className="hidden lg:flex items-center justify-between text-[14px] tracking-[0.01em] text-foreground/60">
            <p>© {new Date().getFullYear()} Jose Peláez · Madrid</p>
          </div>
        </div>

        {/* Me, waving, in dots */}
        <div
          className="lg:col-span-7 relative overflow-hidden rounded-[4px] aspect-[4/3] lg:aspect-[16/11]"
          style={{ background: "#f5f5f5", ["--foreground" as string]: "0 0% 8%" }}
          aria-label="Me waving, drawn in blue dots"
          role="img"
        >
          <DotsHello live={camera} ref={dots} startVh={0} ink="#2b4cff" ground="#f5f5f5" invert waveFps={13} />
          <div className="absolute left-1/2 -translate-x-1/2 bottom-4 md:bottom-6 z-10 flex items-center gap-2 whitespace-nowrap">
            <button
              onClick={camera ? stopCamera : startCamera}
              aria-label={camera ? "Stop camera" : "See yourself in dots"}
              className="relative inline-flex items-center gap-2 rounded-full bg-white/55 text-neutral-900 backdrop-blur-xl backdrop-saturate-150 border border-white/60 px-3.5 md:pl-4 md:pr-5 py-3.5 text-[14px] font-medium tracking-[0.01em] transition-colors duration-300 hover:bg-white/70"
            >
              {/* Material Symbols "photo_camera" (Google, Apache 2.0) */}
              <svg aria-hidden="true" viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current">
                <path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4zM9 2 7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" />
              </svg>
              {camera && <span aria-hidden="true" className="absolute left-[30px] top-[13px] w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
              <span className="hidden md:inline">{camera ? "Stop camera" : cameraError ? "Camera not available" : "See yourself in dots"}</span>
            </button>
          </div>
          <video ref={videoRef} muted playsInline className="hidden" />
        </div>

        <p className="lg:hidden pb-4 text-[14px] tracking-[0.01em] text-foreground/60">© {new Date().getFullYear()} Jose Peláez · Madrid</p>
      </div>
    </section>
  );
};

export default ClosingHello;
