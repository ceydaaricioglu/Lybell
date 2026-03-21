export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f5f2] text-[#1f1f1f]">
      <section className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-16 md:px-10">
        <div className="grid w-full gap-12 md:grid-cols-2 md:gap-16">
          <div className="flex flex-col justify-center">
            <div className="mb-6 inline-flex w-fit rounded-full border border-black/10 bg-white/70 px-4 py-2 text-sm tracking-wide text-black/70 backdrop-blur">
              Lybell • launching soon
            </div>

            <h1 className="max-w-xl text-5xl font-semibold leading-tight tracking-tight md:text-7xl">
              Your life,
              <br />
              more gently
              <br />
              organized.
            </h1>

            <p className="mt-6 max-w-lg text-base leading-7 text-black/65 md:text-lg">
              Lybell is a calm and thoughtful productivity app for managing
              tasks, plans, and everyday flow without clutter.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <a
                href="mailto:hello@lybell.app"
                className="inline-flex items-center justify-center rounded-2xl bg-black px-6 py-3 text-sm font-medium text-white transition hover:opacity-90"
              >
                Contact us
              </a>

              <a
                href="#soon"
                className="inline-flex items-center justify-center rounded-2xl border border-black/10 bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-black/5"
              >
                iOS app coming soon
              </a>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="relative w-full max-w-md">
              <div className="absolute -left-6 top-10 h-32 w-32 rounded-full bg-[#d9d1c7] blur-3xl opacity-60" />
              <div className="absolute -right-8 bottom-8 h-40 w-40 rounded-full bg-[#c8d6d0] blur-3xl opacity-50" />

              <div className="relative rounded-[32px] border border-black/8 bg-white/80 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.08)] backdrop-blur">
                <div className="rounded-[28px] border border-black/8 bg-[#fcfbf8] p-4">
                  <div className="mb-4 flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-black/15" />
                    <span className="h-2.5 w-2.5 rounded-full bg-black/10" />
                    <span className="h-2.5 w-2.5 rounded-full bg-black/10" />
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-2xl bg-white p-4 shadow-sm">
                      <p className="text-sm text-black/45">Today</p>
                      <p className="mt-1 text-base font-medium">
                        Finish onboarding flow
                      </p>
                    </div>

                    <div className="rounded-2xl border border-black/6 bg-[#eef2ef] p-4">
                      <p className="text-sm text-black/45">Focus</p>
                      <p className="mt-1 text-base font-medium">
                        Plan with clarity, not pressure
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white p-4 shadow-sm">
                      <p className="text-sm text-black/45">Soon</p>
                      <p className="mt-1 text-base font-medium">
                        A softer way to stay on track
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <p
                id="soon"
                className="mt-6 text-center text-sm tracking-wide text-black/45"
              >
                Available soon on iPhone
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}