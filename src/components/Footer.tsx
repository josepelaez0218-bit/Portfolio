import { Link } from "react-router-dom";

const EMAIL = "josepelaez0218@gmail.com";

/**
 * Closing block on every page: who I am, in the same serif as the intro,
 * and the way to start a project (same pill as “Start a project” under the
 * hero). Text stays at 400 weight and ≥ 4.5:1 contrast; links get a
 * finger-sized hit area.
 */
const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="relative z-10 w-full bg-background text-foreground px-3 pt-20 pb-8 md:pt-28 md:pb-10 border-t border-border/60">
      <div className="max-w-[1900px] mx-auto flex flex-col gap-16 md:gap-24">
        <div className="grid gap-10 md:grid-cols-12 md:gap-6 md:items-end">
          <div className="md:col-span-7 flex flex-col gap-5">
            <p className="text-[13px] font-medium tracking-[0.01em] text-foreground/70">Jose Peláez</p>
            <p
              className="font-serif text-foreground/85 max-w-[34ch] text-balance"
              style={{ fontSize: "clamp(1.3rem, 1.6vw + 0.9rem, 2rem)", lineHeight: 1.3 }}
            >
              I’m Jose, a product and brand designer based in Madrid. I design brands, websites and digital products, and
              build the front end that ships them — this site included.
            </p>
            <p className="text-[14px] text-foreground/70 tracking-[0.01em] max-w-[52ch]">
              Day to day I design product interfaces at Seedtag. Alongside that, I take on brand and web projects directly.
            </p>
          </div>

          <div className="md:col-span-5 flex flex-col items-start md:items-end gap-4">
            <a
              href={`mailto:${EMAIL}?subject=New%20project`}
              className="inline-flex items-center gap-3 rounded-full bg-foreground text-background px-6 py-3.5 text-[14px] font-medium tracking-[0.01em] transition-transform duration-300 hover:scale-[1.04]"
            >
              Start a project <span aria-hidden="true">→</span>
            </a>
            <a
              href={`mailto:${EMAIL}`}
              className="py-2 text-[14px] text-foreground/70 tracking-[0.01em] transition-colors duration-300 hover:text-foreground"
            >
              {EMAIL}
            </a>
          </div>
        </div>

        <div className="flex items-center justify-between gap-6 text-[13px] tracking-[0.01em]">
          <p className="text-foreground/60">© {year} Jose Peláez · Madrid</p>
          <nav className="flex items-center gap-2">
            <Link
              to="/#work"
              className="px-2 py-3 text-foreground/70 transition-colors duration-300 hover:text-foreground"
            >
              Work
            </Link>
            <Link to="/lab" className="px-2 py-3 text-foreground/70 transition-colors duration-300 hover:text-foreground">
              Lab
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
