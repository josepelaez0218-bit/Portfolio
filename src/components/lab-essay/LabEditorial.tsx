import { useCallback, useRef, useState } from "react";
import QuestionScene from "@/components/lab-story/QuestionScene";
import type { EffectDef } from "@/components/lab-story/effects";
import { makeRewrite } from "@/components/lab-story/wordEffects";
import CoversTrack, { type CoversTrackHandle } from "./CoversTrack";

// One pinned scene, choreographed in scrolled viewport-heights (vh):
const TYPE_VH: [number, number] = [5, 100]; //   the question types itself out
const REWRITE_VH = { startVh: 115, stepVh: 32 }; // then rewrites itself, one question per step
const OUTRO_VH = 255; //                         eyebrow → new line, question fades up
const RISE_VH: [number, number] = [270, 330]; //  covers rise in from the bottom
const TRAVEL_VH = 335; //                        then travel sideways, 1px per px scrolled
const TAIL_VH = 10; //                           a beat at the end before unpinning

// The question rewrites itself with the scroll (no hover/tap to get wrong).
const REWRITE: EffectDef = {
  id: 0,
  name: "Rewrite on scroll",
  hint: "",
  create: makeRewrite({ trigger: "scroll", scroll: REWRITE_VH }),
};

/**
 * Candidate replacement for LabSection (local /preview only): same dark
 * scope and #lab anchor. A single pinned scene: the question types itself
 * out and then rewrites itself as you keep scrolling; then the line above it turns
 * into "Some answers, so far.", the question clears and the Lab covers rise
 * from below — the answers — and scroll sideways.
 */
const LabEditorial = () => {
  const track = useRef<CoversTrackHandle>(null);
  const [travel, setTravel] = useState(0);
  const onTravel = useCallback((px: number) => setTravel(Math.round(px)), []);

  return (
    <div
      id="lab"
      className="bg-background text-foreground"
      style={{ ["--background" as any]: "0 0% 0%", ["--foreground" as any]: "0 0% 100%" }}
    >
      <QuestionScene
        effect={REWRITE}
        eyebrow={
          <>
            For me it always starts
            <br />
            with a simple question, for example
          </>
        }
        question={"What if the\nwords react\nto the mouse?"}
        eyebrowClassName="font-serif text-foreground text-[19px] leading-[1.25] md:text-[30px] md:leading-[1.3] mb-10 md:mb-16"
        headingClassName="font-sans font-black uppercase text-foreground text-[12.4vw] leading-[0.96] md:text-[100px] md:leading-[0.95]"
        // Phones: two words per line (WHAT IF / THE WORDS / REACT TO / THE MOUSE?)
        mobileBreaks={[1, 3, 5]}
        headingStyle={{ letterSpacing: "-0.01em" }}
        height={`calc(${100 + TRAVEL_VH + TAIL_VH}vh + ${travel}px)`}
        typeVh={TYPE_VH}
        outro={{ eyebrow: "Some answers, so far.", startVh: OUTRO_VH }}
        onScrollPx={(scrolled, vh) => track.current?.update(scrolled, vh)}
      >
        <CoversTrack ref={track} riseVh={RISE_VH} travelStartVh={TRAVEL_VH} onTravel={onTravel} />
      </QuestionScene>
    </div>
  );
};

export default LabEditorial;
