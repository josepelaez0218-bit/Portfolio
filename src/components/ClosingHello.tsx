import { useEffect, useRef, useState } from "react";
import DotsHello, { DOTS, type DotsHelloHandle } from "@/components/lab-essay/pieces/DotsHello";
import { ease, range } from "@/components/lab-essay/lib";
import ContactForm from "@/components/ContactForm";
import { useT } from "@/lib/i18n";
import { contactEmail } from "@/lib/siteTexts";
import { useMadridTime } from "@/lib/madridTime";

const INK = "#2b4cff"; // the blue of the dots

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
  const t = useT();
  const time = useMadridTime();

  // The brief is always open here; any "Start a project" elsewhere on the
  // site (they link to /#start) brings you to it with the name ready to type.
  useEffect(() => {
    const open = () => {
      document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => document.getElementById("contact-name")?.focus({ preventScroll: true }), 600);
    };
    window.addEventListener("open-brief", open);
    if (window.location.hash === "#start") open();
    return () => window.removeEventListener("open-brief", open);
  }, []);

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
    // Starts at the same height as the projects index (pt-16 / md:pt-24), so
    // each sheet reads like a slide.
    <section ref={sectionRef} id="contact" className="relative z-10 w-full bg-background text-foreground px-3 pt-16 md:pt-24 pb-5 md:pb-10 lg:min-h-screen">
      {/* A line on top, edge to edge, the same grey as the index rows */}
      <div aria-hidden="true" className="absolute top-0 inset-x-0 h-px bg-foreground/15" />
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-x-10 gap-y-12">
        {/* What to do next: the brief, right here. On wide screens the column is
            as tall as the dots box: the pitch on top, the form, then the email. */}
        <div className="lg:col-span-5 flex flex-col gap-10 lg:justify-between">
          <div className="flex flex-col gap-5">
            {/* A pill like the site's buttons, tinted with the dots' blue */}
            <p
              className="self-start inline-flex items-center gap-2 rounded-full pl-3 pr-4 py-2 text-[14px] font-medium text-foreground tracking-[0.01em]"
              style={{ background: `${INK}14` }}
            >
              {/* Material Symbols "event_available" (Google, Apache 2.0) */}
              <svg aria-hidden="true" viewBox="0 -960 960 960" className="w-[18px] h-[18px]" style={{ fill: INK }}>
                <path d="M438-226 296-368l58-58 84 84 168-168 58 58-226 226ZM200-80q-33 0-56.5-23.5T120-160v-560q0-33 23.5-56.5T200-800h40v-80h80v80h320v-80h80v80h40q33 0 56.5 23.5T840-720v560q0 33-23.5 56.5T760-80H200Zm0-80h560v-400H200v400Zm0-480h560v-80H200v80Zm0 0v-80 80Z" />
              </svg>
              {t("available")}
            </p>
            <p className="text-lead text-foreground max-w-[26ch] text-balance">
              {t("closeLead")}
            </p>
            <p className="text-[14px] text-foreground/70 tracking-[0.01em] max-w-[46ch]">
              {t("replyNote")}
            </p>
          </div>

          <ContactForm />

          {/* For whoever would rather write from their own email */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[14px] tracking-[0.01em]">
            <a href={`mailto:${contactEmail()}`} className="text-foreground underline decoration-foreground/30 underline-offset-4 transition-colors duration-300 hover:decoration-foreground break-all">
              {contactEmail()}
            </a>
            <span className="text-foreground/70 tabular-nums">Madrid · {time}</span>
          </div>
        </div>

        {/* Me, waving, in dots */}
        <div
          className="lg:col-span-7 lg:col-start-6 relative overflow-hidden rounded-[4px] aspect-[4/3] lg:aspect-auto lg:h-[calc(100vh-180px)]"
          style={{ background: "#f5f5f5", ["--foreground" as string]: "0 0% 8%" }}
          aria-label="Me waving, drawn in blue dots"
          role="img"
        >
          <DotsHello live={camera} ref={dots} startVh={0} ink={INK} ground="#f5f5f5" invert waveFps={13} />
          <div className="absolute left-1/2 -translate-x-1/2 bottom-4 md:bottom-6 z-10 flex items-center gap-2 whitespace-nowrap">
            <button
              onClick={camera ? stopCamera : startCamera}
              aria-label={camera ? t("stopCamera") : t("seeYourself")}
              className="relative inline-flex items-center gap-2 rounded-full bg-white/55 text-neutral-900 backdrop-blur-xl backdrop-saturate-150 border border-white/60 px-3.5 md:pl-4 md:pr-5 py-3.5 text-[14px] font-medium tracking-[0.01em] transition-colors duration-300 hover:bg-white/70"
            >
              {/* Material Symbols "photo_camera" (Google, Apache 2.0) */}
              <svg aria-hidden="true" viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current">
                <path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4zM9 2 7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" />
              </svg>
              {camera && <span aria-hidden="true" className="absolute left-[30px] top-[13px] w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
              <span className="hidden md:inline">{camera ? t("stopCamera") : cameraError ? t("noCamera") : t("seeYourself")}</span>
            </button>
          </div>
          <video ref={videoRef} muted playsInline className="hidden" />
        </div>
      </div>
    </section>
  );
};

export default ClosingHello;
