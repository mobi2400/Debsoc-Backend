import { Router } from 'express';
import { registerApplicant } from '../controllers/applicant.controller.js';

const router = Router();

router.post('/', registerApplicant);

export default router;
