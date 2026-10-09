import KofiButton from "@/components/modules/KofiButton";
import AutoOpen from "./AutoOpen";

export default function KofiTestPage() {
  return (
    <main>
      <div className="container" style={{ paddingBlock: "2rem" }}>
        <h1>Ko-fi pop-up</h1>
        <p>The Support page&apos;s Ko-fi button. Add ?open to open the pop-up on load.</p>
        <div id="kofi-test" style={{ maxWidth: 320 }}>
          <KofiButton username="imperialarchive" />
        </div>
        <AutoOpen targetId="kofi-test" />
      </div>
    </main>
  );
}
