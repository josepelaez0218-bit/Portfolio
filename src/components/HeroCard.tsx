/**
 * Who I am, right in the hero: a white card at the bottom left, so the first
 * screen already says it.
 */
const HeroCard = () => (
  <div
    className="absolute z-20 left-5 right-5 bottom-5 md:left-10 md:right-10 md:bottom-10 lg:right-auto lg:w-[min(36vw,600px)] rounded-[4px] bg-white text-foreground p-5 md:p-8 flex flex-col gap-3 md:gap-5 animate-fade-up"
    style={{ animationDelay: "0.6s", animationFillMode: "backwards" }}
  >
    <p className="text-[14px] font-medium tracking-[0.01em] text-foreground/70">Jose Peláez</p>
    <p className="text-lead text-foreground text-balance">
      I’m Jose, a product and brand designer based in Madrid.
    </p>
    <p className="text-[14px] text-foreground/70 tracking-[0.01em] max-w-[52ch]">
      I design and build brands and websites for growing businesses.
    </p>
  </div>
);

export default HeroCard;
