import { Helmet } from "react-helmet-async";
import CustomCursor from "@/components/CustomCursor";
import Nav from "@/components/Nav";
import MatterLetters from "@/components/MatterLetters";

const Lab = () => {
  return (
    <div
      className="bg-background text-foreground min-h-screen"
      style={{ ["--background" as any]: "0 0% 0%", ["--foreground" as any]: "0 0% 100%" }}
    >
      <Helmet>
        <title>Lab — Buen Puerto</title>
        <meta
          name="description"
          content="Lab — experimentos, prototipos y exploraciones de diseño de Buen Puerto."
        />
        <link rel="canonical" href="https://josepelaez.es/lab" />
        <meta property="og:title" content="Lab — Buen Puerto" />
        <meta
          property="og:description"
          content="Lab — experimentos, prototipos y exploraciones de diseño de Buen Puerto."
        />
        <meta property="og:url" content="https://josepelaez.es/lab" />
        <meta property="og:type" content="website" />
      </Helmet>
      <CustomCursor />
      <Nav />

      <section className="relative w-full h-[100dvh] overflow-hidden bg-background flex items-end touch-pan-y">
        <MatterLetters />

        <div className="relative z-20 w-full pointer-events-none px-6 pb-[max(40px,env(safe-area-inset-bottom,40px))] md:px-8 md:pb-[max(80px,env(safe-area-inset-bottom,80px))]">
          <div className="max-w-[1400px] mx-auto">
            <h1
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
            </h1>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Lab;
