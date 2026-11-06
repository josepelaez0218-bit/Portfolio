import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useT } from "@/lib/i18n";
import { contactEmail } from "@/lib/siteTexts";


const madridTime = () =>
  new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Madrid", hour: "2-digit", minute: "2-digit" }).format(new Date());

/**
 * The end of every page, in black: who, how to write, where to go,
 * Madrid's time, and the small print.
 */
const Footer = () => {
  const t = useT();
  const year = new Date().getFullYear();
  const [time, setTime] = useState(madridTime);
  useEffect(() => {
    const id = setInterval(() => setTime(madridTime()), 15000);
    return () => clearInterval(id);
  }, []);

  const LINK = "text-[14px] text-white/70 tracking-[0.01em] transition-colors duration-300 hover:text-white";
  const HEAD = "text-[14px] font-medium text-white/50 tracking-[0.01em]";

  return (
    <footer className="relative z-10 w-full bg-[#0b0b0b] text-white">
      <div className="px-3 pt-16 pb-8 md:pt-24 md:pb-10 flex flex-col gap-16 md:gap-24">
        <div className="grid grid-cols-2 md:grid-cols-12 gap-x-6 gap-y-10">
          <div className="col-span-2 md:col-span-6 flex flex-col gap-2">
            <p className="text-[14px] font-medium tracking-[0.01em]">Jose Peláez</p>
            <p className="text-[14px] text-white/70 tracking-[0.01em] max-w-[40ch]">
              {t("footerBlurb")}
            </p>
          </div>
          <div className="md:col-span-2 flex flex-col gap-3">
            <p className={HEAD}>{t("contact")}</p>
            <a href={`mailto:${contactEmail()}`} className={`${LINK} break-all`}>
              {contactEmail()}
            </a>
            <Link to="/#start" onClick={() => window.dispatchEvent(new Event("open-brief"))} className={LINK}>
              {t("startProject")}
            </Link>
          </div>
          <div className="md:col-span-2 flex flex-col gap-3">
            <p className={HEAD}>{t("navigate")}</p>
            <Link to="/#work" className={LINK}>
              {t("projects")}
            </Link>
            <Link to="/#contact" className={LINK}>
              {t("contact")}
            </Link>
          </div>
          <div className="md:col-span-2 flex flex-col gap-3">
            <p className={HEAD}>Madrid</p>
            <p className="text-[14px] text-white/70 tracking-[0.01em] tabular-nums">{time}</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-6 text-[14px] tracking-[0.01em] text-white/50">
          <p>© {year} Jose Peláez</p>
          <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="py-2 transition-colors duration-300 hover:text-white">
            {t("backToTop")} ↑
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
