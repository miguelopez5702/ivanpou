// ===== CONFIGURACIÓN PERSONALIZABLE =====
// Aquí se cambia la configuración de Iván sin tocar la lógica.

export const CONFIG = {
  nombre: 'Iván',

  // Imágenes por estado de ánimo (usa siempre la foto real de Iván)
  imagenes: {
    normal:  'assets/ivan.png',
    feliz:   'assets/ivan.png',
    triste:  'assets/ivan.png',
    dormido: 'assets/ivan_dormido.png',
  },

  // ÚNICA comida oficial del juego (con imágenes reales)
  comidas: [
    { id: 'nestea',      nombre: 'Nestea',       img: 'assets/food/nestea.png',      valor: 25, precio: 4, diversion: 10 },
    { id: 'cigarro',     nombre: 'Cigarro',      img: 'assets/food/cigarro.png',     valor: 15, precio: 3, diversion: 20 },
    { id: 'gallina',     nombre: 'Gallina',      img: 'assets/food/gallina.png',     valor: 45, precio: 8, diversion: 15 },
    { id: 'patatasvila', nombre: 'Patatas Vila', img: 'assets/food/patatasvila.png', valor: 35, precio: 6, diversion: 12 },
    { id: 'nutella',     nombre: 'Nutella',      img: 'assets/food/nutella.png',     valor: 40, precio: 7, diversion: 18 },
  ],

  // Opción especial para recuperar energía instantánea
  farlopa: {
    id: 'farlopa',
    nombre: 'Farlopa',
    img: 'assets/farlopa.png',
    precio: 25,
    desc: 'Recupera el 100% de energía al instante sin dormir',
  },

  // Frases que dice Iván según la situación
  frases: {
    // #1 Al tocar / hacer cosquillas
    tocar: [
      'Qué carallo fas',
      'Quita de ahí ho',
      'Quen moro burela?',
      'Vou votar un rainbow',
      'Vou comprar outra casa',
    ],
    // #2 Al comer
    comer: [
      'Esto é mellor que a farlopa',
      'BOOOOOOOOF',
      'JODER QUÉ BON ESTÁ',
      'CAGUNDIOSS',
      'Estou cachondo',
    ],
    // #3 Cuando está lleno
    lleno: [
      'Vou votar unha rabada criminal',
      'Tou cheo',
    ],
    // #4 Cuando no hay dinero
    pobre: [
      'Terei que facer horas extra',
    ],
    // #5 Ducha y lavado
    ducha: [
      'Colloada limpa',
      'Xa non cheiro a castrón',
    ],
    // #6 Al tomar Farlopa
    farlopa: [
      'AUUUUUUUUUUU',
      'VAMOS AO GIN',
      'Un pouco fentanilo tes?',
      'Listo pa foder',
    ],
    // #7 Dormir
    dormir: [
      '*Ronquido profundo*',
    ],
    // #8 Quejas según necesidad (0: comida, 1: diversion, 2: energia, 3: higiene)
    quejas: [
      'Mandábame un moro',
      'Molaba xogar un rainbow',
      'Tou reventao',
      'Cheiro a merda',
    ],
    // #9 Al soldar en Reymogasa / Alcoa
    soldar: [
      'Mira ahí ho',
      'Así dá gusto',
    ],
    // #10 Al subir de nivel
    levelup: [
      'Temos que falar de carto amigo',
      'Traballo feito',
      'Vou fumar',
    ],
    // #11 Sin energía para jugar
    sinEnergia: [
      'Quero sobar',
    ],
  },
};
