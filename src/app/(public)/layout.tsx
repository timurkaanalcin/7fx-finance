import "../base.css";
import DeferredSheets from "@/components/styles/DeferredSheets";

const heroCritical = `
.fx-landing{background:#07090d;color:#f4f7fb}
.fx-landing .fx-h1{margin:1.25rem 0 0;font-size:clamp(32px,10vw,44px);font-weight:500;line-height:1.08;letter-spacing:-0.02em;color:#f4f7fb}
@media (min-width:768px){.fx-landing .fx-h1{font-size:clamp(32px,6.4vw,56px)}}
`;

export default function PublicGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: heroCritical }} />
      <DeferredSheets landing />
      {children}
    </>
  );
}
