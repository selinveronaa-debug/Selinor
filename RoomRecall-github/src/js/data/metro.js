/**
 * RoomRecall · data/metro.js
 * Oslo T-bane lines and stops used by metro mode, plus the ready cell-biology demo ride.
 */

const metroLines = {
  '1': {
    color: '#17a7db',
    title: 'Frognerseteren → Bergkrystallen',
    stops: ['Frognerseteren','Voksenkollen','Lillevann','Skogen','Voksenlia','Holmenkollen','Besserud','Midtstuen','Skådalen','Vettakollen','Gulleråsen','Gråkammen','Slemdal','Ris','Gaustad','Vinderen','Steinerud','Frøen','Majorstuen','Nationaltheatret','Stortinget','Jernbanetorget','Grønland','Tøyen','Ensjø','Helsfyr','Brynseng','Høyenhall','Manglerud','Ryen','Brattlikollen','Karlsrud','Lambertseter','Munkelia','Bergkrystallen']
  },
  '2': {
    color: '#ef5b12',
    title: 'Østerås → Ellingsrudåsen',
    stops: ['Østerås','Lijordet','Eiksmarka','Ekraveien','Røa','Hovseter','Holmen','Makrellbekken','Smestad','Borgen','Majorstuen','Nationaltheatret','Stortinget','Jernbanetorget','Grønland','Tøyen','Ensjø','Helsfyr','Brynseng','Hellerud','Tveita','Haugerud','Trosterud','Lindeberg','Furuset','Ellingsrudåsen']
  },
  '3': {
    color: '#a65dad',
    title: 'Kolsås → Mortensrud',
    stops: ['Kolsås','Hauger','Gjettum','Avløs','Haslum','Gjønnes','Bekkestua','Ringstabekk','Jar','Bjørnsletta','Åsjordet','Ullernåsen','Montebello','Smestad','Borgen','Majorstuen','Nationaltheatret','Stortinget','Jernbanetorget','Grønland','Tøyen','Ensjø','Helsfyr','Brynseng','Hellerud','Godlia','Skøyenåsen','Oppsal','Ulsrud','Bøler','Bogerud','Skullerud','Mortensrud']
  },
  '4': {
    color: '#0755a5',
    title: 'Vestli → Bergkrystallen',
    stops: ['Vestli','Stovner','Rommen','Romsås','Grorud','Ammerud','Kalbakken','Rødtvet','Veitvet','Linderud','Vollebekk','Risløkka','Økern','Løren','Sinsen','Storo','Nydalen','Ullevål stadion','Forskningsparken','Blindern','Majorstuen','Nationaltheatret','Stortinget','Jernbanetorget','Grønland','Tøyen','Ensjø','Helsfyr','Brynseng','Høyenhall','Manglerud','Ryen','Brattlikollen','Karlsrud','Lambertseter','Munkelia','Bergkrystallen']
  },
  '5': {
    color: '#36a94b',
    title: 'Sognsvann → Vestli',
    variants: {
      ring: {
        label: 'Via Ring',
        stops: ['Sognsvann','Kringsjå','Holstein','Østhorn','Tåsen','Berg','Ullevål stadion','Nydalen','Storo','Sinsen','Løren','Økern','Risløkka','Vollebekk','Linderud','Veitvet','Rødtvet','Kalbakken','Ammerud','Grorud','Romsås','Rommen','Stovner','Vestli']
      },
      city: {
        label: 'Via city centre',
        stops: ['Sognsvann','Kringsjå','Holstein','Østhorn','Tåsen','Berg','Ullevål stadion','Forskningsparken','Blindern','Majorstuen','Nationaltheatret','Stortinget','Jernbanetorget','Grønland','Tøyen','Carl Berners plass','Hasle','Økern','Risløkka','Vollebekk','Linderud','Veitvet','Rødtvet','Kalbakken','Ammerud','Grorud','Romsås','Rommen','Stovner','Vestli']
      }
    }
  }
};

const commuteDemoNotes = `T cells help the immune system identify threats. The stroma is the fluid-filled space inside a chloroplast. Neurons communicate across a synapse using chemical signals. A neuron carries electrical impulses through the nervous system. Osmosis moves water across a cell membrane.`;

const commuteDemoConcepts = [
  { concept: 'T cell', emoji: '🛡️', preferredStop: 'Tåsen' },
  { concept: 'Stroma', emoji: '🌿', preferredStop: 'Storo' },
  { concept: 'Synapse', emoji: '⚡', preferredStop: 'Sinsen' },
  { concept: 'Neuron', emoji: '🧠', preferredStop: 'Løren' },
  { concept: 'Osmosis', emoji: '💧', preferredStop: 'Romsås' }
];

const commuteDemoQuestionBank = [
  { prompt: 'What is the main job of T cells?', answer: 'Helping the immune system identify and respond to threats.', distractors: ['Carrying oxygen around the body.', 'Storing glucose in the liver.', 'Sending electrical impulses between neurons.'], type: 'concept', emoji: '🛡️', anchor: 0, explanation: 'T cells are white blood cells that recognise infected or foreign cells.' },
  { prompt: 'Where is the stroma found?', answer: 'Inside the chloroplast, around the thylakoids.', distractors: ['Inside the nucleus of a neuron.', 'In the gap between two neurons.', 'On the outside of the cell membrane.'], type: 'concept', emoji: '🌿', anchor: 1, explanation: 'The stroma is the fluid-filled space inside a chloroplast.' },
  { prompt: 'How do neurons pass a signal across a synapse?', answer: 'They release chemical signals called neurotransmitters.', distractors: ['They swap their nuclei.', 'Water moves across by osmosis.', 'The two neurons physically fuse.'], type: 'concept', emoji: '⚡', anchor: 2, explanation: 'The electrical impulse triggers a chemical release into the synaptic gap.' },
  { prompt: 'What does a neuron carry through the nervous system?', answer: 'Electrical impulses.', distractors: ['Oxygen molecules.', 'Antibodies.', 'Glucose for storage.'], type: 'concept', emoji: '🧠', anchor: 3, explanation: 'Neurons conduct electrical impulses along their axons.' },
  { prompt: 'What is osmosis?', answer: 'Water moving across a partially permeable membrane.', distractors: ['Sugar being broken down for energy.', 'A signal jumping between neurons.', 'Light energy being captured by chlorophyll.'], type: 'concept', emoji: '💧', anchor: 4, explanation: 'Water moves from higher to lower water concentration across the membrane.' },
  { prompt: 'Which cell type would you expect at the centre of an immune response?', answer: 'T cells.', distractors: ['Neurons.', 'Root hair cells.', 'Red blood cells.'], type: 'concept', emoji: '🦠', anchor: 0, explanation: 'T cells coordinate and carry out parts of the immune response.' },
  { prompt: 'The stroma belongs to which organelle?', answer: 'The chloroplast.', distractors: ['The mitochondrion.', 'The ribosome.', 'The cell wall.'], type: 'concept', emoji: '🍃', anchor: 1, explanation: 'It is the inner fluid of the chloroplast.' },
  { prompt: 'What is a synapse?', answer: 'The junction where one neuron passes a signal to the next.', distractors: ['A type of white blood cell.', 'The fluid inside a chloroplast.', 'A pore that lets water through.'], type: 'concept', emoji: '🔗', anchor: 2, explanation: 'Signals cross the synapse chemically.' },
  { prompt: 'Which system are neurons part of?', answer: 'The nervous system.', distractors: ['The immune system.', 'The digestive system.', 'The skeletal system.'], type: 'concept', emoji: '🧬', anchor: 3, explanation: 'Neurons are the signalling cells of the nervous system.' },
  { prompt: 'What does water cross during osmosis?', answer: 'A cell membrane.', distractors: ['A synapse.', 'The stroma.', 'A T-cell receptor.'], type: 'concept', emoji: '🫧', anchor: 4, explanation: 'Osmosis happens across a partially permeable membrane.' }
];

