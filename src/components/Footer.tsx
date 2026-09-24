import { Link } from "react-router-dom";

/**
 * Temporary footer — real contact info, minimal layout. Placeholder until
 * a proper design pass.
 */
const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="relative z-10 w-full bg-background text-foreground px-6 md:px-8 pt-16 pb-10 md:pt-20 md:pb-12 border-t border-border/60">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-10 md:gap-6">
          <div>
            <p className="text-[13.5px] font-medium tracking-[0.01em]">Jose Peláez</p>
            <p className="text-[12px] font-light text-foreground/50 tracking-[0.01em] mt-1">Buen Puerto Studio</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <a
              href="mailto:josepelaez0218@gmail.com"
              className="text-[14px] font-light text-foreground/70 tracking-[0.01em] transition-colors duration-300 hover:text-foreground"
            >
              josepelaez0218@gmail.com
            </a>
            <a
              href="tel:+34659274031"
              className="text-[14px] font-light text-foreground/70 tracking-[0.01em] transition-colors duration-300 hover:text-foreground"
            >
              +34 659 274 031
            </a>
          </div>

          <nav className="flex items-center gap-6">
            <Link
              to="/#work"
              className="text-[13px] font-light text-foreground/70 tracking-[0.01em] transition-colors duration-300 hover:text-foreground"
            >
              Work
            </Link>
            <Link
              to="/lab"
              className="text-[13px] font-light text-foreground/70 tracking-[0.01em] transition-colors duration-300 hover:text-foreground"
            >
              Lab
            </Link>
          </nav>
        </div>

        <p className="text-[12px] font-light text-foreground/40 tracking-[0.01em] mt-12 md:mt-16">
          © {year} Jose Peláez.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
