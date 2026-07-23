import { useEffect, useState } from "react";
import api from "../config/axios";

import {
  Hero,
  TestimonialsSection,
  LatestStories
} from "../components/home";


export function HomePage() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/stories", { params: { limit: 8 } })
      .then((res) => {
        if (!cancelled) {
          const data = res.data.data;
          setStories(data.stories || []);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("Failed to fetch stories:", err);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-16 md:space-y-24">
      <Hero />
      <LatestStories />
      <TestimonialsSection />
    </div>
  );
}

export default HomePage;
