import { useEffect, useState } from "react";

const madridTime = () =>
  new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Madrid", hour: "2-digit", minute: "2-digit" }).format(new Date());

/** The time in Madrid, kept current while the component is on screen. */
export const useMadridTime = () => {
  const [time, setTime] = useState(madridTime);
  useEffect(() => {
    const id = setInterval(() => setTime(madridTime()), 15000);
    return () => clearInterval(id);
  }, []);
  return time;
};
