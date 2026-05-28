
const Footer = () => {
  return (
    <footer className="bg-white border-t-2 border-[#b49770] mt-20 pt-16 pb-10 px-10">
      <div className="max-w-7xl mx-auto border-2 border-[#b49770] p-12 relative">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          
          {/* Lado Izquierdo: Logo, Redes y Horarios */}
          <div className="space-y-8">
            <div className="flex items-center space-x-6">
              <div className="border-r-2 border-gray-300 pr-6">
                <h2 className="text-4xl font-serif font-bold text-[#5d4037] leading-none">CAYENA</h2>
                <p className="text-[10px] tracking-[0.2em] font-light uppercase">panadería . café</p>
              </div>
              <div className="flex space-x-4">
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-2xl font-serif italic text-gray-700">Horario de atencion</h3>
              <div className="space-y-2 text-gray-600">
                <p className="font-bold">Lunes a Sabado</p>
                <p className="text-sm">7:00 am - 11:30am</p>
                <p className="text-sm">3:00 pm - 7:00 pm</p>
                <p className="font-bold pt-2">Domingos</p>
                <p className="text-sm">7:00 am - 11:30 am</p>
              </div>
            </div>
          </div>

          {/* Lado Derecho: Historia (Ocupa 2 columnas en MD) */}
          <div className="md:col-span-2 flex flex-col justify-between text-center space-y-6">
            <div className="space-y-4 italic text-gray-700 text-lg leading-relaxed">
              <p>
                Desde 2016 Cayena Panaderia Cafe abre sus puertas para los opitas que nos sentimos orgullosos de lo nuestro. 
                Trabajamos con pasion elaborando a diario productos tradicionales y especiales con las mejores materias primas. 
                Somos amantes de la buena panaderia, nos encanta la pasteleria y morimos por un buen cafe.
              </p>
              <p>
                Somos famosos en el Huila por nuestros desayunos, nuestro croissant de almendras, almojabanas, pan ciabatta, 
                pan masa madre y nuestros increibles brownies de chocolate.
              </p>
            </div>

            <div className="space-y-4">
              <p className="italic font-medium text-gray-800">
                Disfrutalos en CAYENA, nos encargaremos de hacerlos inolvidables
              </p>
              <p className="text-2xl font-serif font-bold text-gray-700 mt-6">
                Familia Cayena
              </p>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;