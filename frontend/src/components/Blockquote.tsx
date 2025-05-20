
const Blockquote = () => (
  <blockquote className="hidden md:block relative max-w-sm">
    {/* svg icon omitted for brevity */}
    <div className="relative z-10">
      <p className="text-xl italic text-gray-800 dark:text-white">
        Amazing people to work with. Very fast and professional partner.
      </p>
    </div>
    <footer className="mt-3">
      <div className="flex items-center gap-x-4">
        <img className="size-8 rounded-full" src="https://..." alt="Avatar" />
        <div>
          <div className="font-semibold text-gray-800 dark:text-neutral-200">Josh Grazioso</div>
          <div className="text-xs text-gray-500 dark:text-neutral-500">Director Payments & Risk | Airbnb</div>
        </div>
      </div>
    </footer>
  </blockquote>
);

export default Blockquote;