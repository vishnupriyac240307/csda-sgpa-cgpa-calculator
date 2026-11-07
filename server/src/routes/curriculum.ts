import { Router } from "express";
import { CURRICULUM, CURRICULUM_VERSION } from "../data/curriculum.js";
const router = Router();
router.get("/", (_req, res) => res.json({ version: CURRICULUM_VERSION, configured: CURRICULUM.length > 0, subjects: CURRICULUM }));
export default router;
