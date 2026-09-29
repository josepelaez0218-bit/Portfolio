import { useCallback, useRef, useState } from "react";
import QuestionScene from "@/components/lab-story/QuestionScene";
import { WORD_EFFECTS } from "@/components/lab-story/wordEffects";
import CoversTrack, { type CoversTrackHandle } from "./CoversTrack";

// Chosen reaction: hovering (or tapping) a word rewrites the whole question.
const REWRITE = WORD_EFFECTS.find((e) => e.id === 1)!;

// One pinned scene, choreographed in scrolled viewport-heights (vh):
const TYPE_VH: [number, number] = [5, 110]; //   the question types itself out
const OUTRO_VH = 150; //                        eyebrow → new line, question fades up
const RISE_VH: [number, number] = [165, 225]; // covers rise in from the bottom
const TRAVEL_VH = 230; //                       then travel sideways, 1px per px scrolled
const TAIL_VH = 10; //                          a beat at the end before unpinning

/**
 * Candidate replacement for LabSection (local /preview only): same dark
 * scope and #lab anchor. A single pinned scene: the question types itself
 * out and rewrites itself under the pointer; then the line above it turns
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
        headingClassName="font-sans font-black uppercase text-foreground text-[40px] leading-[0.98] md:text-[100px] md:leading-[0.95]"
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
