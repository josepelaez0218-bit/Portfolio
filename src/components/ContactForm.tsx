import { useState, type FormEvent } from "react";
import { useT } from "@/lib/i18n";

const EMAIL = "josepelaez0218@gmail.com";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Brief = { name: string; email: string; message: string };

/** For now “Send” opens the visitor's email with the brief written in (nothing is stored or sent from here). */
const sendBrief = ({ name, email, message }: Brief, subject = "New project") => {
  const body = `${message.trim()}\n\n${name.trim()} · ${email.trim()}`;
  window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(`${subject} — ${name.trim()}`)}&body=${encodeURIComponent(body)}`;
};
const problem = (b: Brief) =>
  !b.name.trim() || !EMAIL_RE.test(b.email.trim()) || !b.message.trim() ? "formError" : null;

/** Honeypot: off screen and out of the tab order, so only bots fill it in. */
const Trap = ({ onChange }: { onChange: (v: string) => void }) => (
  <input
    type="text"
    name="website"
    tabIndex={-1}
    autoComplete="off"
    aria-hidden="true"
    onChange={(e) => onChange(e.target.value)}
    className="absolute -left-[9999px] w-px h-px opacity-0"
  />
);

const PILL =
  "inline-flex items-center gap-3 rounded-full bg-foreground text-background px-6 py-3.5 text-[14px] font-medium tracking-[0.01em] transition-transform duration-300 hover:scale-[1.04]";
const ERROR = "text-[14px] text-[#c0392b]";

const QUESTIONS = [
  { key: "name", q: "qName", placeholder: "pName", type: "text", auto: "name" },
  { key: "email", q: "qEmail", placeholder: "pEmail", type: "email", auto: "email" },
  { key: "message", q: "qMessage", placeholder: "pMessage", type: "text", auto: "off" },
] as const;

/** The brief as an index, like the projects list: numbered rows, no boxes. */
const IndexForm = () => {
  const t = useT();
  const [b, setB] = useState<Brief>({ name: "", email: "", message: "" });
  const [trap, setTrap] = useState("");
  const [error, setError] = useState<string | null>(null);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (trap) return;
    const p = problem(b);
    setError(p);
    if (!p) sendBrief(b, t("mailSubject"));
  };
  return (
    <form onSubmit={submit} noValidate className="flex flex-col">
      <ol className="border-t border-foreground/15">
        {QUESTIONS.map((f, i) => (
          <li key={f.key} className="border-b border-foreground/15">
            <label className="grid grid-cols-[2.5rem_1fr] items-baseline gap-x-4 py-4">
              <span className="text-[14px] text-foreground/60 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
              <span className="flex flex-col gap-1">
                <span className="text-[14px] text-foreground/70 tracking-[0.01em]">{t(f.q)}</span>
                {f.key === "message" ? (
                  <textarea
                    id={`contact-${f.key}`}
                    rows={2}
                    value={b.message}
                    onChange={(e) => setB({ ...b, message: e.target.value })}
                    placeholder={t(f.placeholder)}
                    className="w-full resize-none bg-transparent text-[16px] leading-[1.5] text-foreground placeholder:text-foreground/30 outline-none"
                  />
                ) : (
                  <input
                    id={`contact-${f.key}`}
                    type={f.type}
                    autoComplete={f.auto}
                    value={b[f.key]}
                    onChange={(e) => setB({ ...b, [f.key]: e.target.value })}
                    placeholder={t(f.placeholder)}
                    className="w-full bg-transparent text-[16px] leading-[1.5] text-foreground placeholder:text-foreground/30 outline-none"
                  />
                )}
              </span>
            </label>
          </li>
        ))}
      </ol>
      <Trap onChange={setTrap} />
      <div className="mt-6 flex flex-col items-start gap-3">
        <button type="submit" className={PILL}>
          {t("send")} <span aria-hidden="true">→</span>
        </button>
        {error && <p role="alert" className={ERROR}>{t(error as "formError")}</p>}
      </div>
    </form>
  );
};

const ContactForm = IndexForm;

export default ContactForm;
