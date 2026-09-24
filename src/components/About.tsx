import { useEffect, useState } from "react";
import { fetchAbout } from "@/lib/sanity/queries";
import { urlForImage } from "@/lib/sanity/image";
import type { SanityAbout } from "@/lib/sanity/types";

const About = () => {
  const [about, setAbout] = useState<SanityAbout | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAbout()
      .then((data) => {
        if (!cancelled) setAbout(data);
      })
      .catch((err) => console.error("Failed to load about from Sanity:", err));
    return () => {
      cancelled = true;
    };
  }, []);

  if (!about) return null;

  return (
    <section id="about" className="relative z-10 w-full bg-background px-6 md:px-8 pt-16 pb-16 md:pt-8 md:pb-24">
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8 md:gap-16">
          {about.photo && (
            <div className="w-full max-w-[220px] md:max-w-none overflow-hidden rounded-[4px] aspect-[4/5]">
              <img
                src={urlForImage(about.photo).width(560).quality(85).url()}
                alt="Jose Peláez"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="max-w-[640px]">
            {about.location && (
              <p className="text-[12px] font-light text-foreground/50 tracking-[0.01em] mb-4">
                {about.location}
              </p>
            )}
            <div className="flex flex-col gap-4">
              {about.bio.split(/\n{2,}/).map((paragraph, i) => (
                <p key={i} className="text-[16px] md:text-[18px] font-normal text-foreground/80 leading-[1.6]">
                  {paragraph}
                </p>
              ))}
            </div>
            {about.services && about.services.length > 0 && (
              <ul className="mt-8 flex flex-wrap gap-x-2 gap-y-2">
                {about.services.map((service, i) => (
                  <li
                    key={i}
                    className="text-[13px] font-light text-foreground/70 tracking-[0.01em] border border-border/60 rounded-full px-3 py-1"
                  >
                    {service}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
