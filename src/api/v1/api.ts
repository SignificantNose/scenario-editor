import { Router } from "express";
import scenario from "./scenario";

const api = Router();

api.use('/scenario', scenario);
export default api;
