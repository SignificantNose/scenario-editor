import { CreateScenarioDataSchema } from '@models/scenario/create-scenario-data.model';
import { validateBody } from 'api/middleware/validation';
import { Router } from 'express';

const api = Router();

api.post('/', validateBody(CreateScenarioDataSchema), async (req, res) => {
  const scenario = req.body;
  console.log('Received scenario:', scenario);
  res.status(201).json({ message: 'Scenario saved', scenario });
});

export default api;
