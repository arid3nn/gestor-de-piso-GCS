const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const { XMLBuilder } = require('fast-xml-parser');

const passwordHash = bcrypt.hashSync('password123', 10);

const mockData = {
  users: [
    {
      id: 'u1',
      createdAt: '2026-06-11T00:00:00.000Z',
      updatedAt: '2026-06-11T00:00:00.000Z',
      email: 'carlos@example.com',
      passwordHash: passwordHash,
      firstName: 'Carlos',
      lastName: 'García'
    },
    {
      id: 'u2',
      createdAt: '2026-06-11T00:00:00.000Z',
      updatedAt: '2026-06-11T00:00:00.000Z',
      email: 'sofia@example.com',
      passwordHash: passwordHash,
      firstName: 'Sofía',
      lastName: 'Martín'
    },
    {
      id: 'u3',
      createdAt: '2026-06-11T00:00:00.000Z',
      updatedAt: '2026-06-11T00:00:00.000Z',
      email: 'alejandro@example.com',
      passwordHash: passwordHash,
      firstName: 'Alejandro',
      lastName: 'Ruiz'
    }
  ],
  flats: [
    {
      id: 'f1',
      createdAt: '2026-06-11T00:00:00.000Z',
      updatedAt: '2026-06-11T00:00:00.000Z',
      name: 'Piso de Estudiantes Sol',
      joinCode: 'SOL123'
    }
  ],
  rooms: [],
  flatMember: [
    {
      id: 'fm1',
      createdAt: '2026-06-11T00:00:00.000Z',
      updatedAt: '2026-06-11T00:00:00.000Z',
      userId: 'u1',
      flatId: 'f1',
      role: 'ADMIN',
      joinedAt: '2026-06-11T00:00:00.000Z'
    },
    {
      id: 'fm2',
      createdAt: '2026-06-11T00:00:00.000Z',
      updatedAt: '2026-06-11T00:00:00.000Z',
      userId: 'u2',
      flatId: 'f1',
      role: 'MEMBER',
      joinedAt: '2026-06-11T00:00:00.000Z'
    },
    {
      id: 'fm3',
      createdAt: '2026-06-11T00:00:00.000Z',
      updatedAt: '2026-06-11T00:00:00.000Z',
      userId: 'u3',
      flatId: 'f1',
      role: 'MEMBER',
      joinedAt: '2026-06-11T00:00:00.000Z'
    }
  ],
  task: [
    {
      id: 't1',
      createdAt: '2026-06-11T00:00:00.000Z',
      updatedAt: '2026-06-11T00:00:00.000Z',
      flatId: 'f1',
      title: 'Sacar la basura',
      description: 'Depositar en los contenedores de reciclaje orgánico antes de las 22:00.',
      frequency: 'DAILY',
      dueDate: '2026-06-11T00:00:00.000Z',
      createdById: 'u1',
      assignedToId: 'u1'
    },
    {
      id: 't2',
      createdAt: '2026-06-11T00:00:00.000Z',
      updatedAt: '2026-06-11T00:00:00.000Z',
      flatId: 'f1',
      title: 'Limpieza profunda de la cocina',
      description: 'Barrer, fregar el suelo y limpiar la placa vitrocerámica.',
      frequency: 'WEEKLY',
      dueDate: '2026-06-13T00:00:00.000Z',
      createdById: 'u1',
      assignedToId: 'u2'
    },
    {
      id: 't3',
      createdAt: '2026-06-11T00:00:00.000Z',
      updatedAt: '2026-06-11T00:00:00.000Z',
      flatId: 'f1',
      title: 'Limpiar el cuarto de baño',
      description: 'Limpiar ducha, lavabo, espejo y desinfectar el inodoro.',
      frequency: 'WEEKLY',
      dueDate: '2026-06-15T00:00:00.000Z',
      createdById: 'u1',
      assignedToId: 'u3'
    }
  ],
  expense: [
    {
      id: 'e1',
      createdAt: '2026-06-11T00:00:00.000Z',
      updatedAt: '2026-06-11T00:00:00.000Z',
      flatId: 'f1',
      title: 'Productos de limpieza y papel higiénico',
      amount: 24.60,
      category: 'CLEANING',
      paidById: 'u1'
    },
    {
      id: 'e2',
      createdAt: '2026-06-11T00:00:00.000Z',
      updatedAt: '2026-06-11T00:00:00.000Z',
      flatId: 'f1',
      title: 'Factura de Internet (Mayo)',
      amount: 45.00,
      category: 'UTILITIES',
      paidById: 'u2'
    }
  ],
  expenseSplit: [
    {
      id: 'es1',
      createdAt: '2026-06-11T00:00:00.000Z',
      updatedAt: '2026-06-11T00:00:00.000Z',
      expenseId: 'e1',
      userId: 'u1',
      amount: 8.20,
      status: 'PAID',
      paidAt: '2026-06-11T00:00:00.000Z'
    },
    {
      id: 'es2',
      createdAt: '2026-06-11T00:00:00.000Z',
      updatedAt: '2026-06-11T00:00:00.000Z',
      expenseId: 'e1',
      userId: 'u2',
      amount: 8.20,
      status: 'PENDING'
    },
    {
      id: 'es3',
      createdAt: '2026-06-11T00:00:00.000Z',
      updatedAt: '2026-06-11T00:00:00.000Z',
      expenseId: 'e1',
      userId: 'u3',
      amount: 8.20,
      status: 'PENDING'
    },
    {
      id: 'es4',
      createdAt: '2026-06-11T00:00:00.000Z',
      updatedAt: '2026-06-11T00:00:00.000Z',
      expenseId: 'e2',
      userId: 'u1',
      amount: 15.00,
      status: 'PENDING'
    },
    {
      id: 'es5',
      createdAt: '2026-06-11T00:00:00.000Z',
      updatedAt: '2026-06-11T00:00:00.000Z',
      expenseId: 'e2',
      userId: 'u2',
      amount: 15.00,
      status: 'PAID',
      paidAt: '2026-06-11T00:00:00.000Z'
    },
    {
      id: 'es6',
      createdAt: '2026-06-11T00:00:00.000Z',
      updatedAt: '2026-06-11T00:00:00.000Z',
      expenseId: 'e2',
      userId: 'u3',
      amount: 15.00,
      status: 'PENDING'
    }
  ],
  poll: [
    {
      id: 'p1',
      createdAt: '2026-06-11T00:00:00.000Z',
      updatedAt: '2026-06-11T00:00:00.000Z',
      flatId: 'f1',
      question: '¿Qué día de la semana compramos la comida grupal?',
      expiresAt: '2026-06-18T23:59:59.000Z',
      createdById: 'u1',
      isClosed: false
    },
    {
      id: 'p2',
      createdAt: '2026-06-11T00:00:00.000Z',
      updatedAt: '2026-06-11T00:00:00.000Z',
      flatId: 'f1',
      question: '¿Compramos una freidora de aire para la cocina?',
      expiresAt: '2026-06-25T12:00:00.000Z',
      createdById: 'u1',
      isClosed: false
    },
    {
      id: 'p3',
      createdAt: '2026-06-11T00:00:00.000Z',
      updatedAt: '2026-06-11T00:00:00.000Z',
      flatId: 'f1',
      question: '¿Qué cafetera compramos para el piso?',
      expiresAt: '2026-06-05T12:00:00.000Z',
      createdById: 'u1',
      isClosed: false
    }
  ],
  pollOption: [
    { id: 'o1', pollId: 'p1', text: 'Jueves por la tarde' },
    { id: 'o2', pollId: 'p1', text: 'Sábado por la mañana' },
    { id: 'o3', pollId: 'p2', text: 'Sí, todos la usaremos' },
    { id: 'o4', pollId: 'p2', text: 'No, no hay espacio' },
    { id: 'o5', pollId: 'p2', text: 'Me da igual' },
    { id: 'o6', pollId: 'p3', text: 'Cafetera de cápsulas' },
    { id: 'o7', pollId: 'p3', text: 'Cafetera italiana de rosca' }
  ],
  vote: [
    { id: 'v1', userId: 'u1', pollOptionId: 'o1' },
    { id: 'v2', userId: 'u2', pollOptionId: 'o2' },
    { id: 'v3', userId: 'u1', pollOptionId: 'o3' },
    { id: 'v4', userId: 'u1', pollOptionId: 'o6' },
    { id: 'v5', userId: 'u2', pollOptionId: 'o6' },
    { id: 'v6', userId: 'u3', pollOptionId: 'o7' }
  ],
  chatMessage: [
    {
      id: 'm1',
      createdAt: '2026-06-11T18:00:00.000Z',
      updatedAt: '2026-06-11T18:00:00.000Z',
      flatId: 'f1',
      userId: 'u1',
      content: '¡Hola a todos! Bienvenidos al chat del piso. ¿Qué tal va la limpieza?'
    },
    {
      id: 'm2',
      createdAt: '2026-06-11T18:05:00.000Z',
      updatedAt: '2026-06-11T18:05:00.000Z',
      flatId: 'f1',
      userId: 'u2',
      content: '¡Hola Carlos! Muy bien, yo ya limpié la cocina. ¿Alejandro, te toca el baño?'
    },
    {
      id: 'm3',
      createdAt: '2026-06-11T18:10:00.000Z',
      updatedAt: '2026-06-11T18:10:00.000Z',
      flatId: 'f1',
      userId: 'u3',
      content: '¡Sí, esta tarde me pongo con ello sin falta!'
    }
  ]
};

function serializeRecord(record) {
  const serialized = {};
  for (const [key, value] of Object.entries(record)) {
    if (value === null || value === undefined) {
      serialized[key] = '';
    } else {
      serialized[key] = value;
    }
  }
  return serialized;
}

const wrap = (key, list) => {
  const singular = key === 'flatMember' ? 'flatMember' : key.slice(0, key.length - (key.endsWith('s') ? 1 : 0));
  return { [singular]: list.map(item => serializeRecord(item)) };
};

const xmlObj = {
  database: {
    users: wrap('users', mockData.users),
    flats: wrap('flats', mockData.flats),
    rooms: wrap('rooms', mockData.rooms),
    flatMember: wrap('flatMember', mockData.flatMember),
    task: wrap('task', mockData.task),
    expense: wrap('expense', mockData.expense),
    expenseSplit: wrap('expenseSplit', mockData.expenseSplit),
    poll: wrap('poll', mockData.poll),
    pollOption: wrap('pollOption', mockData.pollOption),
    vote: wrap('vote', mockData.vote),
    chatMessage: wrap('chatMessage', mockData.chatMessage),
  }
};

const builder = new XMLBuilder({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  format: true,
  suppressEmptyNode: false,
});

const xmlStr = builder.build(xmlObj);
fs.writeFileSync(path.resolve(__dirname, 'data.xml'), xmlStr, 'utf8');
console.log('Seeded database successfully!');
