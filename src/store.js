// Tienda por encargo: productos congelados sacados de la carta (tucartadigital).
// price en euros por unidad; null = «Precio a confirmar» (la carta sólo tiene precios de plato en el local).
// Los campos *_en son los textos en inglés de la web. El mensaje del pedido va siempre en español (lo lee el local).
// Para cambiar productos o precios se edita esta lista: la página y el mensaje de WhatsApp salen de aquí.

export const STORE = [
  {
    id: 'empanadas',
    title: 'Empanadas congeladas',
    title_en: 'Frozen empanadas',
    prefix: 'Empanada ',
    note: 'Por unidad. Listas para hornear en casa.',
    note_en: 'Sold individually. Ready to bake at home.',
    img: '/img/tienda/empanadas.jpg',
    items: [
      { id: 'emp-ternera', name: 'Ternera en cerveza roja', desc: 'Ternera desmechada en cerveza roja.',
        name_en: 'Beef in red ale', desc_en: 'Pulled beef slow-cooked in red ale.', price: null },
      { id: 'emp-cerdo', name: 'Cerdo y BBQ', desc: 'Bondiola de cerdo desmechada con salsa BBQ.',
        name_en: 'Pork & BBQ', desc_en: 'Pulled pork shoulder with BBQ sauce.', price: null },
      { id: 'emp-caprese', name: 'Caprese', desc: 'Queso mozzarella, tomate y albahaca.',
        name_en: 'Caprese', desc_en: 'Mozzarella, tomato and basil.', price: null },
      { id: 'emp-pollo', name: 'Pollo y puerro', desc: 'Pollo a las brasas con puerro, cebolla y pimiento rojo.',
        name_en: 'Chicken & leek', desc_en: 'Flame-grilled chicken with leek, onion and red pepper.', price: null },
      { id: 'emp-roquefort', name: 'Cebolla y roquefort', desc: 'Cebolla dulce y queso azul.',
        name_en: 'Onion & blue cheese', desc_en: 'Sweet onion and blue cheese.', price: null },
      { id: 'emp-verduras', name: 'Verduras asadas y queso', desc: 'Verduras a las brasas y queso mozzarella.',
        name_en: 'Grilled vegetables & cheese', desc_en: 'Flame-grilled vegetables and mozzarella.', price: null },
    ],
  },
  {
    id: 'milanesas',
    title: 'Milanesas congeladas',
    title_en: 'Frozen milanesas',
    prefix: '',
    note: 'Por unidad. Empanadas y listas para freír u hornear.',
    note_en: 'Sold individually. Breaded and ready to fry or bake.',
    img: '/img/tienda/milanesas.jpg',
    items: [
      { id: 'mila-ternera', name: 'Milanesa de ternera', desc: 'Filete de ternera empanado, como la clásica del club.',
        name_en: 'Beef milanesa', desc_en: 'Breaded beef fillet, just like the club classic.', price: null },
      { id: 'mila-pollo', name: 'Milanesa de pollo', desc: 'Filete de pollo empanado, como la clásica del club.',
        name_en: 'Chicken milanesa', desc_en: 'Breaded chicken fillet, just like the club classic.', price: null },
    ],
  },
];

// En el mensaje: «Empanada ternera en cerveza roja», «Milanesa de pollo».
export const STORE_ITEMS = STORE.flatMap((c) =>
  c.items.map((i) => ({ ...i, label: c.prefix ? c.prefix + i.name[0].toLowerCase() + i.name.slice(1) : i.name })),
);

const eur = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
export const fmtPrice = (p, lang = 'es') =>
  p == null ? (lang === 'en' ? 'Price to be confirmed' : 'Precio a confirmar') : `${eur.format(p)} / ${lang === 'en' ? 'each' : 'ud.'}`;

// Mensaje de WhatsApp a partir de las cantidades del formulario (campos q_<id>).
export function orderMessage(query) {
  const lines = STORE_ITEMS.map((i) => [i, Math.min(99, Math.max(0, parseInt(query[`q_${i.id}`], 10) || 0))])
    .filter(([, q]) => q > 0)
    .map(([i, q]) => `• ${q} × ${i.label}`);
  if (!lines.length) return null;
  return `Hola! Quiero hacer un pedido por encargo 🔥\n${lines.join('\n')}\n¿Cuándo puedo pasar a recogerlo?`;
}
