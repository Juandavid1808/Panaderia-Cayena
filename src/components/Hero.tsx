const Hero = () => {
  return (
    <div className="relative w-full h-[450px] bg-gray-200 overflow-hidden">
      <img
        src="/banner.png"
        className="w-full h-full object-cover brightness-75"
        alt="Banner Cayena"
      />
      <div className="absolute inset-0 flex items-center px-20">
        <h2 className="text-white text-5xl font-serif italic max-w-lg leading-tight">
          Al lado de un gran momento, siempre hay un gran acompañamiento!
        </h2>
      </div>
    </div>
  );
};

export default Hero;