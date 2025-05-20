
const HeroSection = () => (
  <section className="relative bg-gradient-to-bl from-blue-100 via-transparent dark:from-blue-950 p-8 lg:p-16">
    <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
      {/* Intro & Testimonial */}
      <div>
        <p className="text-sm font-medium bg-clip-text text-transparent from-blue-600 to-violet-500 dark:from-blue-400 dark:to-violet-400 inline-block">
          Preline: A vision for 2024
        </p>
        <h1 className="mt-4 text-4xl font-semibold text-gray-800 dark:text-neutral-200">
          Fully customizable rules to match your unique needs
        </h1>
        <p className="mt-2 text-gray-600 dark:text-neutral-400">
          We provide a test account set up in seconds—fast, professional responses guaranteed.
        </p>
        <blockquote className="mt-6 italic text-gray-800 dark:text-neutral-200">
          “Amazing people to work with. Very fast and professional partner.”
          <footer className="mt-2 font-medium">Josh Grazioso, Director Payments & Risk | Airbnb</footer>
        </blockquote>
      </div>
      {/* Signup Form */}
      <form className="bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Start your free trial</h2>
        <input type="email" placeholder="Email" className="w-full mb-4 p-3 border rounded-lg dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-200" />
        <input type="password" placeholder="Password" className="w-full mb-4 p-3 border rounded-lg dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-200" />
        <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-lg">Get started</button>
      </form>
    </div>
  </section>
);

export default HeroSection;
