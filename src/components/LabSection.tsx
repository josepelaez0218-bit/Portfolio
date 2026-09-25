import LabCarousel from "@/components/LabCarousel";
import MatterLetters from "@/components/MatterLetters";

/**
 * The Lab visual block — dark-themed (scoped CSS var override) full-height
 * section with the physics letters. Shared between the standalone /lab
 * page and, as a test, an inline placement on the home page.
 */
const LabSection = ({ as: Heading = "h2" }: { as?: "h1" | "h2" }) => {
  return (
    <div
      id="lab"
      className="bg-background text-foreground"
      style={{ ["--background" as any]: "0 0% 0%", ["--foreground" as any]: "0 0% 100%" }}
    >
      <section className="relative w-full h-[68dvh] md:h-[72dvh] overflow-hidden bg-background flex items-end touch-pan-y">
        <MatterLetters />

        <div className="relative z-20 w-full pointer-events-none px-6 pb-[max(20px,env(safe-area-inset-bottom,20px))] md:pb-[max(32px,env(safe-area-inset-bottom,32px))]">
          <div className="max-w-[1400px] mx-auto">
            <Heading
              className="font-sans font-extrabold text-foreground animate-fade-up text-[36px] leading-[38px] md:text-[56px] md:leading-[60px]"
              style={{
                letterSpacing: "-0.02em",
                animationDelay: "0.35s",
                animationDuration: "1.1s",
              }}
            >
              I love designing
              <br />
              through different
              <br />
              languages.
            </Heading>
          </div>
        </div>
      </section>

      <LabCarousel />
    </div>
  );
};

export default LabSection;
