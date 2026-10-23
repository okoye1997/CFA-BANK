import { CafHeader } from "@/components/landing/caf-header";
import { CafFooter } from "@/components/landing/caf-footer";
import { CafLandingSections } from "@/components/landing/caf-sections";
import "./landing.css";

export default function Home() {
  return <div className="caf-page"><CafHeader /><main><CafLandingSections /></main><CafFooter /></div>;
}
