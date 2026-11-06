import { Link } from "react-router-dom";
import { useT } from "@/lib/i18n";

/**
 * The navbar of a case page: a small white card top left, the folded hero
 * card's sibling (4px corners, no shadow). Jose's name (home), the project
 * it's on, and a thin arrow back to the projects.
 */
const CaseNav = ({ title }: { title: string }) => {
  const t = useT();
  return (
    <nav
      aria-label="Project"
      className="fixed left-3 top-3 z-[200] flex items-center gap-8 rounded-[4px] bg-white pl-4 pr-3 py-3 text-[14px] tracking-[0.01em] animate-fade-up"
      style={{ animationDelay: "0.2s", animationFillMode: "backwards" }}
    >
      <Link to="/" className="font-medium text-foreground/70 transition-colors duration-300 hover:text-foreground">
        Jose Peláez
      </Link>
      <span className="max-w-[40vw] truncate text-foreground">{title}</span>
      <Link to="/#work" aria-label={t("back")} className="group grid place-items-center size-5 text-foreground">
        <svg
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-5 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-x-1"
          aria-hidden="true"
        >
          <path d="M17 10H3M9 4 3 10l6 6" />
        </svg>
      </Link>
    </nav>
  );
};

export default CaseNav;
