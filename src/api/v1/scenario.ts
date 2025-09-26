import { CreateScenarioDataSchema } from '@models/scenario/create-scenario-data.model';
import { ListScenarioDataResponse } from '@models/scenario/list-scenario-data.model';
import { UpdateScenarioDataSchema } from '@models/scenario/update-scenario-data.model';
import { validateBody } from 'api/middleware/validation';
import { Router } from 'express';

const api = Router();
let scenarios: ListScenarioDataResponse = [
  {
    id: 1,
    name: 'abc',
    createdAt: '2011-12-03T10:15:30',
    updatedAt: '2011-12-03T10:15:30',
    emitters: [{ id: 1, position: { x: 1, y: 1, z: 2 } }],
    listeners: [{ id: 1, position: { x: 1, y: 1, z: 1 } }],
  },
  {
    id: 2,
    name: 'abcd',
    createdAt: '2011-12-03T10:15:30',
    updatedAt: '2011-12-03T10:15:30',
    emitters: [{ id: 1, position: { x: 1, y: 1, z: 2 } }],
    listeners: [{ id: 1, position: { x: 1, y: 1, z: 1 } }],
  },
];

api.post('/', validateBody(CreateScenarioDataSchema), async (req, res) => {
  const scenario = req.body;
  console.log('Received scenario:', scenario);
  scenarios.push(scenario);
  res.status(201).json({ message: 'Scenario saved', scenario });
});

api.get('/', async (req, res) => {
  res.json(scenarios);
});

api.get('/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid scenario id' });
  }

  const scenario = scenarios.find((s) => s.id === id);

  if (!scenario) {
    return res.status(404).json({ error: 'Scenario not found' });
  }

  return res.json(scenario);
});

api.put('/:id', validateBody(UpdateScenarioDataSchema), async (req, res) => {
  const id = Number(req.params['id']);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid scenario id' });
  }

  const updated = req.body;

  const index = scenarios.findIndex((s) => s.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Scenario not found' });
  }

  scenarios[index] = {
    ...scenarios[index],
    name: updated.name,
    emitters: updated.emitters,
    listeners: updated.listeners,
    updatedAt: new Date().toISOString(),
  };

  return res.status(200).json(scenarios[index]);
});

api.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid scenario id' });
  }

  const index = scenarios.findIndex((s) => s.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Scenario not found' });
  }

  const deletedScenario = scenarios.splice(index, 1)[0];

  return res.json({ success: true, deleted: deletedScenario });
});

export default api;
