import { Helmet } from "react-helmet-async";
import Footer from "@/components/Footer";
import LabEditorial from "@/components/lab-essay/LabEditorial";
import Nav from "@/components/Nav";

const Lab = () => {
  return (
    <>
      <Helmet>
        <title>Lab — Jose Peláez</title>
        <meta
          name="description"
          content="Lab — experiments, prototypes and design explorations by Jose Peláez."
        />
        <link rel="canonical" href="https://www.josepelaez.es/lab" />
        <meta property="og:title" content="Lab — Jose Peláez" />
        <meta
          property="og:description"
          content="Lab — experiments, prototypes and design explorations by Jose Peláez."
        />
        <meta property="og:url" content="https://www.josepelaez.es/lab" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://www.josepelaez.es/og-image.png" />
      </Helmet>
      <Nav />
      <LabEditorial mode="page" />
      <Footer />
    </>
  );
};

export default Lab;
