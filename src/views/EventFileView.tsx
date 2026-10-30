import { EventFile } from "@/components/events/EventFile";

/** A breaking event read from every platform: the facts with their sources, the claims going around, what comes next. */
export default function EventFileView({ slug }: { slug: string }) {
  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <EventFile slug={slug} />
      </div>
    </div>
  );
}
